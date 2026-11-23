-- =============================================================================
-- Peso y medidas para cotizar con MiCorreo + aviso y vencimiento de retiros
-- =============================================================================

-- 1) Paquete de cada producto (ya embalado). Si queda vacío se usa el típico del rubro.
alter table public.products
  add column weight_g  integer check (weight_g  is null or weight_g  between 1 and 25000),
  add column length_cm integer check (length_cm is null or length_cm between 1 and 150),
  add column width_cm  integer check (width_cm  is null or width_cm  between 1 and 150),
  add column height_cm integer check (height_cm is null or height_cm between 1 and 150);

-- 2) Pedidos: qué servicio de Correo se cotizó y cuándo se mandó el aviso de retiro.
alter table public.orders
  add column shipping_service        text,
  add column pickup_reminder_sent_at timestamptz;

-- 3) Vencimiento: además de los impagos que esperan el pago (Mercado Pago / transferencia),
--    vencen los pedidos "efectivo o tarjeta al retirar" que nadie pasó a buscar,
--    aunque el local ya los haya preparado.
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
      and expires_at is not null
      and expires_at < now()
      and (
        status = 'pendiente'
        or (payment_method = 'mostrador' and status in ('en_preparacion', 'listo_para_retirar'))
      )
    for update skip locked
  loop
    perform public.cancel_order(
      v_id, 'sistema',
      'venció sin pagar o sin retirar',
      'vencido'
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.expire_pending_orders() from public, anon, authenticated;
grant execute on function public.expire_pending_orders() to service_role;
