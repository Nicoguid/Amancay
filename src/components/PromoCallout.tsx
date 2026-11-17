'use client';

import Link from 'next/link';
import { PROMO, PROMO_CFTEA, PROMO_UNTIL_LABEL } from '@/lib/storeConfig';
import { usePromoActive } from '@/lib/usePromo';

/** Se muestra solo mientras la promo esté vigente (ver storeConfig.ts). */
export function PromoCallout() {
  const active = usePromoActive();
  if (!active) return null;
  return (
    <section aria-labelledby="promo-title" className="focus-on-dark bg-[var(--brand-leather)] text-white">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <div className="flex items-start gap-5">
          <span
            aria-hidden="true"
            className="hidden h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--brand-gold)] font-display leading-none text-[var(--ink-on-gold)] sm:flex"
          >
            <span className="text-2xl">{PROMO.installments}</span>
            <span className="font-sans text-[12px] font-bold">cuotas</span>
          </span>
          <div className="max-w-2xl space-y-2">
            <h2 id="promo-title" className="font-display text-[28px] leading-tight sm:text-[32px]">
              {PROMO.title}
            </h2>
            <p className="text-white/85">
              {PROMO.detail} Vigente hasta el {PROMO_UNTIL_LABEL}. CFTEA {PROMO_CFTEA}.
            </p>
          </div>
        </div>
        <Link
          href="/catalogo"
          className="btn btn-lg btn-gold shrink-0"
        >
          Ver el catálogo
        </Link>
      </div>
    </section>
  );
}
