'use client';

import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { PROMO, PROMO_UNTIL_LABEL, STORE } from '@/lib/storeConfig';
import { usePromoActive } from '@/lib/usePromo';

/** Barra superior fija (sin animación): un solo mensaje, el más útil. */
export function AnnouncementBar() {
  const promoActive = usePromoActive();
  return (
    <aside aria-label="Aviso" className="bg-[var(--ink-primary)] px-4 py-2 text-center text-sm text-[var(--bg-page)]">
      {promoActive ? (
        <p>
          <span className="font-semibold">{PROMO.title}</span>
          <span className="hidden sm:inline"> hasta el {PROMO_UNTIL_LABEL}</span>
        </p>
      ) : (
        <p>
          Retiro sin costo en {STORE.address}
          <span className="hidden sm:inline"> · Envíos a CABA y a todo el país</span>
        </p>
      )}
    </aside>
  );
}

const BRANDS = ['Amancay Orfebrería', 'Kevin', "Paula Cahen d'Anvers", 'Colbert', 'Amancay Tradición', 'Perfumería Amancay'];

/** Cinta de marcas con botón de pausa (WCAG 2.2.2). Se detiene sola con movimiento reducido. */
export function BrandsTicker() {
  const [paused, setPaused] = useState(false);
  return (
    <section
      aria-label="Marcas que trabajamos"
      className={`relative border-y border-[var(--amancay-border)] bg-[var(--bg-subtle)] py-5 ${paused ? 'marquee-paused' : ''}`}
    >
      <ul className="sr-only">
        {BRANDS.map((brand) => (
          <li key={brand}>{brand}</li>
        ))}
      </ul>
      <div className="overflow-x-clip" aria-hidden="true">
        <div className="animate-marquee-reverse flex items-center gap-12 whitespace-nowrap">
          {BRANDS.concat(BRANDS).map((brand, idx) => (
            <span key={idx} className="flex items-center gap-12 font-display text-xl text-[var(--ink-secondary)] sm:text-2xl">
              <span>{brand}</span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--amancay-wine)]" />
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        className="tap-interactive absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--amancay-border)] bg-white text-[var(--ink-primary)] shadow-sm"
      >
        {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
        <span className="sr-only">{paused ? 'Reanudar cinta de marcas' : 'Pausar cinta de marcas'}</span>
      </button>
    </section>
  );
}
