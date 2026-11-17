'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { COOKIE_EVENT, getCookieChoice, loadAnalytics, setCookieChoice, track } from '@/lib/consent';
import { legalPath } from '@/lib/legal';

/**
 * Aviso de cookies. Aceptar y Rechazar tienen el mismo peso visual y el mismo tamaño:
 * rechazar no puede costar más que aceptar. No bloquea la página ni tapa el contenido.
 * Se vuelve a abrir desde "Preferencias de cookies" en el pie.
 */
const CHOICE_EVENT = 'amancay:cookie-choice';
function subscribe(callback: () => void) {
  window.addEventListener(CHOICE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHOICE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function CookieBanner() {
  // 'server' en el HTML inicial: el aviso aparece recién cuando se sabe que no hay elección guardada.
  const stored = useSyncExternalStore(
    subscribe,
    () => (getCookieChoice() ? 'yes' : 'no'),
    () => 'server'
  );
  const [reopened, setReopened] = useState(false);
  const open = reopened || stored === 'no';

  useEffect(() => {
    if (getCookieChoice()) loadAnalytics();
    const reopen = () => setReopened(true);
    window.addEventListener(COOKIE_EVENT, reopen);

    // Clics a WhatsApp: la conversión principal de un local de barrio.
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.('a[href^="https://wa.me/"]');
      if (link) track('contact_whatsapp', { page: window.location.pathname });
    };
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener(COOKIE_EVENT, reopen);
      document.removeEventListener('click', onClick);
    };
  }, []);

  if (!open) return null;

  const choose = (analytics: boolean) => {
    setCookieChoice(analytics, reopened ? 'preferencias de cookies (pie)' : 'aviso de cookies');
    setReopened(false);
    window.dispatchEvent(new Event(CHOICE_EVENT));
  };

  const button =
    'tap-interactive min-h-11 flex-1 rounded-full border-[1.5px] border-[var(--brand-leather)] px-5 text-sm font-semibold sm:flex-none';

  return (
    <section
      aria-labelledby="cookies-title"
      className="fixed inset-x-3 bottom-3 z-40 rounded-lg border border-[var(--amancay-border)] bg-white p-5 shadow-[var(--shadow-lift)] sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-w-[420px]"
    >
      <h2 id="cookies-title" className="font-display text-lg text-[var(--ink-primary)]">
        Medición de visitas
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-muted)]">
        El carrito se guarda en tu navegador para que funcione. Con tu permiso, también medimos visitas y compras de forma
        anónima. Detalle en la{' '}
        <Link href={legalPath('cookies')} className="link-brass">
          política de cookies
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <button type="button" onClick={() => choose(false)} className={`${button} text-[var(--brand-leather)] hover:bg-[var(--brand-leather-wash)]`}>
          Rechazar
        </button>
        <button type="button" onClick={() => choose(true)} className={`${button} text-[var(--brand-leather)] hover:bg-[var(--brand-leather-wash)]`}>
          Aceptar
        </button>
      </div>
    </section>
  );
}
