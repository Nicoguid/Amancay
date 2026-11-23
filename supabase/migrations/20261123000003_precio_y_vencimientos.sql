-- =============================================================================
-- Amancay: no vender sin precio + vencimiento automático de pedidos impagos
-- =============================================================================

-- 1) create_order rechaza productos con precio 0 (un producto cargado a medias en el panel).
create or replace function public.assert_sellable_price(p_price numeric, p_id text)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_price is null or p_price <= 0 then
    raise exception 'producto_sin_precio:%', p_id;
  end if;
end;
$$;

revoke all on function public.assert_sellable_price(numeric, text) from public, anon, authenticated;
grant execute on function public.assert_sellable_price(numeric, text) to service_role;

-- Trigger en order_items: si algún renglón llega con precio 0, falla toda la transacción
-- de create_order (y no se descuenta stock).
create or replace function public.order_items_check_price()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform public.assert_sellable_price(new.unit_price, coalesce(new.variant_id, new.product_id));
  return new;
end;
$$;

create trigger order_items_price_guard
before insert on public.order_items
for each row execute function public.order_items_check_price();

revoke all on function public.order_items_check_price() from public, anon, authenticated;

-- 2) Cada 15 minutos se cancelan los pedidos impagos vencidos y vuelve el stock.
create extension if not exists pg_cron;

select cron.schedule(
  'amancay-expirar-pedidos',
  '*/15 * * * *',
  $$select public.expire_pending_orders();$$
);
