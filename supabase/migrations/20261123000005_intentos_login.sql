-- Contador de intentos fallidos del panel, atómico (sirve con varias instancias de Vercel).
-- Devuelve cuántos intentos le quedan a esa clave y, si se bloqueó, por cuántos segundos.

create or replace function public.login_register_failure(
  p_key        text,
  p_max        integer,
  p_window     interval,
  p_base_lock  interval,
  p_max_lock   interval
)
returns table (remaining integer, locked_seconds integer)
language plpgsql
set search_path = ''
as $$
declare
  r      public.admin_login_attempts;
  v_lock interval;
begin
  insert into public.admin_login_attempts (key) values (p_key) on conflict (key) do nothing;
  select * into r from public.admin_login_attempts where key = p_key for update;

  -- Pasó la ventana sin intentos: el contador arranca de nuevo (los bloqueos previos se recuerdan).
  if r.last_attempt < now() - p_window then
    r.failures := 0;
  end if;
  r.failures := r.failures + 1;

  if r.failures >= p_max then
    v_lock := least(p_base_lock * power(2, r.lockouts)::int, p_max_lock);
    update public.admin_login_attempts
    set failures = 0, lockouts = lockouts + 1, locked_until = now() + v_lock, last_attempt = now()
    where key = p_key;
    return query select 0, ceil(extract(epoch from v_lock))::int;
  else
    update public.admin_login_attempts
    set failures = r.failures, last_attempt = now()
    where key = p_key;
    return query select p_max - r.failures, 0;
  end if;
end;
$$;

revoke all on function public.login_register_failure(text, integer, interval, interval, interval) from public, anon, authenticated;
grant execute on function public.login_register_failure(text, integer, interval, interval, interval) to service_role;
