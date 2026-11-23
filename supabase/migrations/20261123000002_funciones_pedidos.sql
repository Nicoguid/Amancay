-- =============================================================================
-- Amancay: funciones de pedidos
-- -----------------------------------------------------------------------------
-- Toda la lógica que mueve stock vive acá, dentro de una transacción.
-- Si dos personas compran la última unidad al mismo tiempo, "for update" hace que
-- la segunda espere a la primera y después vea stock 0: nunca se vende de más.
-- Solo las puede ejecutar el servidor (service_role).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- create_order: arma el pedido con los precios DE LA BASE y reserva el stock.
-- ---------------------------------------------------------------------------
-- p_customer:  {"name","email","phone","dni","address","city","postal_code","notes"}
-- p_items:     [{"product_id":"perf-01","variant_id":"perf-01-100","quantity":2}, ...]
-- p_consents:  [{"doc","version","decision","method","page"}, ...]
-- p_shipping_cost lo calcula el servidor de Next con las tarifas de storeConfig.
-- Errores que devuelve (para mostrar un mensaje claro en el checkout):
--   carrito_vacio | producto_no_disponible:<id> | falta_variante:<id>
--   variante_invalida:<id> | sin_stock:<id> | cantidad_invalida
create or replace function public.create_order(
  p_customer         jsonb,
  p_items            jsonb,
  p_shipping_method  text,
  p_shipping_cost    numeric,
  p_payment_method   text,
  p_consents         jsonb default '[]'::jsonb,
  p_expires_in       interval default interval '24 hours'
)
returns public.orders
language plpgsql
set search_path = ''
as $$
declare
  v_order     public.orders;
  v_item      record;
  v_product   public.products;
  v_variant   public.product_variants;
  v_price     numeric(12, 2);
  v_subtotal  numeric(12, 2) := 0;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'carrito_vacio';
  end if;

  -- 1) Pedido vacío (los importes se completan abajo).
  insert into public.orders (
    customer_name, customer_email, customer_phone, customer_dni,
    address, city, postal_code, notes,
    shipping_method, shipping_cost, payment_method,
    subtotal, total, expires_at
  ) values (
    trim(p_customer->>'name'),
    lower(trim(p_customer->>'email')),
    trim(p_customer->>'phone'),
    nullif(regexp_replace(coalesce(p_customer->>'dni', ''), '\D', '', 'g'), ''),
    nullif(trim(p_customer->>'address'), ''),
    nullif(trim(p_customer->>'city'), ''),
    nullif(trim(p_customer->>'postal_code'), ''),
    nullif(trim(p_customer->>'notes'), ''),
    p_shipping_method, p_shipping_cost, p_payment_method,
    0, p_shipping_cost,
    case when p_payment_method = 'mostrador' then null else now() + p_expires_in end
  )
  returning * into v_order;

  -- 2) Renglones. Si el mismo producto viene dos veces, se suman las cantidades.
  for v_item in
    select x.product_id, nullif(x.variant_id, '') as variant_id, sum(x.quantity)::int as quantity
    from jsonb_to_recordset(p_items) as x(product_id text, variant_id text, quantity int)
    group by x.product_id, nullif(x.variant_id, '')
    order by x.product_id, nullif(x.variant_id, '')   -- orden fijo: evita bloqueos cruzados
  loop
    if v_item.quantity is null or v_item.quantity < 1 or v_item.quantity > 50 then
      raise exception 'cantidad_invalida';
    end if;

    select * into v_product
    from public.products
    where id = v_item.product_id and active
    for update;

    if not found then
      raise exception 'producto_no_disponible:%', v_item.product_id;
    end if;

    if v_item.variant_id is null then
      if exists (select 1 from public.product_variants where product_id = v_product.id) then
        raise exception 'falta_variante:%', v_product.id;
      end if;

      if v_product.stock < v_item.quantity then
        raise exception 'sin_stock:%', v_product.id;
      end if;

      update public.products set stock = stock - v_item.quantity where id = v_product.id;
      v_price := v_product.price;
      v_variant := null;
    else
      select * into v_variant
      from public.product_variants
      where id = v_item.variant_id and product_id = v_product.id
      for update;

      if not found then
        raise exception 'variante_invalida:%', v_item.variant_id;
      end if;

      if v_variant.stock < v_item.quantity then
        raise exception 'sin_stock:%', v_variant.id;
      end if;

      update public.product_variants set stock = stock - v_item.quantity where id = v_variant.id;
      v_price := v_variant.price;
    end if;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, variant_name, product_image,
      category, quantity, unit_price, total_price
    ) values (
      v_order.id, v_product.id, v_variant.id, v_product.name, v_variant.name, v_product.images[1],
      v_product.category, v_item.quantity, v_price, v_price * v_item.quantity
    );

    v_subtotal := v_subtotal + v_price * v_item.quantity;
  end loop;

  -- 3) Importes finales.
  update public.orders
  set subtotal = v_subtotal, total = v_subtotal + p_shipping_cost
  where id = v_order.id
  returning * into v_order;

  -- 4) Consentimientos del checkout.
  insert into public.consents (order_id, doc, version, decision, method, page)
  select v_order.id, c.doc, c.version, c.decision, c.method, c.page
  from jsonb_to_recordset(coalesce(p_consents, '[]'::jsonb))
       as c(doc text, version text, decision text, method text, page text);

  insert into public.order_events (order_id, type, to_value, source)
  values (v_order.id, 'creado', v_order.status, 'cliente');

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- cancel_order: cancela y devuelve el stock (una sola vez).
-- ---------------------------------------------------------------------------
create or replace function public.cancel_order(
  p_order_id  uuid,
  p_source    text default 'panel',
  p_reason    text default null,
  p_payment_status text default 'cancelado'
)
returns public.orders
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'pedido_inexistente';
  end if;

  if v_order.status = 'cancelado' then
    return v_order;                                    -- ya estaba: no se devuelve stock dos veces
  end if;

  if v_order.status in ('despachado', 'entregado') then
    raise exception 'pedido_ya_enviado';
  end if;

  update public.product_variants pv
  set stock = pv.stock + oi.quantity
  from public.order_items oi
  where oi.order_id = p_order_id and oi.variant_id = pv.id;

  update public.products p
  set stock = p.stock + oi.quantity
  from public.order_items oi
  where oi.order_id = p_order_id and oi.variant_id is null and oi.product_id = p.id;

  update public.orders
  set status = 'cancelado',
      payment_status = case when payment_status = 'pendiente' then p_payment_status else payment_status end
  where id = p_order_id
  returning * into v_order;

  insert into public.order_events (order_id, type, to_value, source, detail)
  values (p_order_id, 'cancelado', 'cancelado', p_source,
          jsonb_build_object('motivo', p_reason));

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- expire_pending_orders: cancela los pedidos que no se pagaron a tiempo.
-- Lo llama un cron (Vercel Cron o pg_cron) cada 15 minutos.
-- ---------------------------------------------------------------------------
create or replace function public.expire_pending_orders()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_id    uuid;
  v_count integer := 0;
begin
  for v_id in
    select id from public.orders
    where payment_status = 'pendiente'
      and status = 'pendiente'
      and expires_at is not null
      and expires_at < now()
    for update skip locked
  loop
    perform public.cancel_order(v_id, 'sistema', 'no se pagó a tiempo', 'vencido');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- find_order_public: "Mis pedidos". Pide código Y email, así nadie puede
-- recorrer códigos y ver datos de otros. Devuelve solo lo necesario.
-- ---------------------------------------------------------------------------
create or replace function public.find_order_public(p_code text, p_email text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'order_number',    o.order_number,
    'created_at',      o.created_at,
    'status',          o.status,
    'payment_status',  o.payment_status,
    'payment_method',  o.payment_method,
    'shipping_method', o.shipping_method,
    'shipping_cost',   o.shipping_cost,
    'subtotal',        o.subtotal,
    'total',           o.total,
    'customer_name',   split_part(o.customer_name, ' ', 1),   -- solo el nombre de pila
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_name', i.product_name, 'variant_name', i.variant_name,
        'product_image', i.product_image, 'quantity', i.quantity,
        'unit_price', i.unit_price, 'total_price', i.total_price
      ) order by i.id)
      from public.order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  where o.order_number = upper(trim(p_code))
    and o.customer_email = lower(trim(p_email))
    and not o.is_sample;
$$;

-- ---------------------------------------------------------------------------
-- Permisos: solo el servidor.
-- ---------------------------------------------------------------------------
revoke all on function public.create_order(jsonb, jsonb, text, numeric, text, jsonb, interval) from public, anon, authenticated;
revoke all on function public.cancel_order(uuid, text, text, text)                              from public, anon, authenticated;
revoke all on function public.expire_pending_orders()                                           from public, anon, authenticated;
revoke all on function public.find_order_public(text, text)                                     from public, anon, authenticated;
revoke all on function public.random_code(text, int)                                            from public, anon, authenticated;
revoke all on function public.set_updated_at()                                                  from public, anon, authenticated;

grant execute on function public.create_order(jsonb, jsonb, text, numeric, text, jsonb, interval) to service_role;
grant execute on function public.cancel_order(uuid, text, text, text)                              to service_role;
grant execute on function public.expire_pending_orders()                                           to service_role;
grant execute on function public.find_order_public(text, text)                                     to service_role;
-- random_code se usa como valor por defecto de order_number y code: el servidor lo necesita.
grant execute on function public.random_code(text, int)                                            to service_role;
