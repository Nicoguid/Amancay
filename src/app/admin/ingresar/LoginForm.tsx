'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { login, type LoginState } from '../actions';

export function LoginForm({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [show, setShow] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(0);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Bloqueo: el botón queda deshabilitado con cuenta regresiva (el servidor igual lo hace cumplir).
  useEffect(() => {
    if (!state.retryInSeconds) return;
    const until = Date.now() + state.retryInSeconds * 1000;
    const tick = () => setNow(Date.now());
    const first = setTimeout(() => {
      setLockedUntil(until);
      tick();
    }, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [state]);

  useEffect(() => {
    if (state.error) passwordRef.current?.select();
  }, [state]);

  const secondsLeft = lockedUntil > now ? Math.ceil((lockedUntil - now) / 1000) : 0;
  const locked = secondsLeft > 0;
  const countdown = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return (
    <form action={action} className="mt-8 space-y-4 rounded-lg border border-[var(--amancay-border)] bg-white p-6 shadow-[var(--shadow-rest)] sm:p-8">
      <div>
        <label htmlFor="admin-password" className="mb-1 block font-semibold">
          Contraseña
        </label>
        <div className="relative">
          <input
            ref={passwordRef}
            id="admin-password"
            name="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            required
            maxLength={200}
            autoFocus
            aria-invalid={!!state.error}
            aria-describedby={state.error ? 'admin-error' : undefined}
            className="w-full rounded-lg border border-[var(--amancay-border)] bg-[var(--bg-page)] py-2.5 pl-3 pr-12 focus:border-[var(--brand-leather)]"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-pressed={show}
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
          >
            {show ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            <span className="sr-only">{show ? 'Ocultar contraseña' : 'Mostrar contraseña'}</span>
          </button>
        </div>
      </div>

      {/* Campo trampa para bots: invisible para personas y lectores de pantalla. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="admin-website">No completar</label>
        <input id="admin-website" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      {turnstileSiteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-language="es" />
        </>
      )}

      {state.error && (
        <p id="admin-error" role="alert" className="rounded-md border border-[var(--amancay-wine)] bg-[var(--bg-page)] p-3 text-sm text-[var(--amancay-wine)]">
          {state.error}
          {locked && <span className="tabular block font-semibold"> Podés volver a intentar en {countdown}.</span>}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || locked}
        className="tap-interactive flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-leather)] font-semibold text-white hover:bg-[var(--brand-leather-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
        {pending ? 'Verificando…' : locked ? `Bloqueado (${countdown})` : 'Ingresar'}
      </button>
      <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
        Después de 5 intentos fallidos el ingreso se bloquea 15 minutos, y cada bloqueo siguiente dura el doble.
      </p>
    </form>
  );
}
