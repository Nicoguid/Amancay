-- Un pago rechazado deja el pedido esperando otro intento, pero si nunca se paga
-- también tiene que vencer y devolver el stock.

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
    return v_order;
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
      expires_at = null,
      payment_status = case when payment_status in ('pendiente', 'rechazado') then p_payment_status else payment_status end
  where id = p_order_id
  returning * into v_order;

  insert into public.order_events (order_id, type, to_value, source, detail)
  values (p_order_id, 'cancelado', 'cancelado', p_source, jsonb_build_object('motivo', p_reason));

  return v_order;
end;
$$;

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
    where payment_status in ('pendiente', 'rechazado')
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

drop index if exists public.orders_pending_expiry_idx;
create index orders_pending_expiry_idx on public.orders (expires_at) where payment_status in ('pendiente', 'rechazado');

revoke all on function public.cancel_order(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.expire_pending_orders()              from public, anon, authenticated;
grant execute on function public.cancel_order(uuid, text, text, text) to service_role;
grant execute on function public.expire_pending_orders()              to service_role;
