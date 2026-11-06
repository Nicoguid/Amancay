'use client';

import Link from 'next/link';
import { PROMO, PROMO_UNTIL_LABEL } from '@/lib/storeConfig';
import { usePromoActive } from '@/lib/usePromo';

/** Se muestra solo mientras la promo esté vigente (ver storeConfig.ts). */
export function PromoCallout() {
  const active = usePromoActive();
  if (!active) return null;
  return (
    <section aria-labelledby="promo-title" className="focus-on-dark border-y border-[var(--ink-secondary)] bg-[#14110e] py-14 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="max-w-2xl space-y-3">
          <h2 id="promo-title" className="font-display text-3xl tracking-tight sm:text-4xl">
            {PROMO.title}
          </h2>
          <p className="text-white/85">
            {PROMO.detail} Vigente hasta el {PROMO_UNTIL_LABEL}.
          </p>
        </div>
        <Link
          href="/catalogo"
          className="tap-interactive inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--amancay-gold-light)] px-8 font-semibold text-[var(--ink-primary)] hover:bg-white"
        >
          Ver el catálogo
        </Link>
      </div>
    </section>
  );
}
