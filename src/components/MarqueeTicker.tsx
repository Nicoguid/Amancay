'use client';

import Link from 'next/link';
import { PROMO, PROMO_UNTIL_LABEL, STORE } from '@/lib/storeConfig';
import { usePromoActive } from '@/lib/usePromo';

/**
 * Barra superior fija (sin animación): un mensaje útil y el Botón de arrepentimiento,
 * que la Disposición 954/2025 pide "a simple vista, en lugar destacado y en el primer acceso".
 */
export function AnnouncementBar() {
  const promoActive = usePromoActive();
  return (
    <aside aria-label="Aviso" className="bg-[var(--brand-olive)] text-[13px] font-medium tracking-[0.01em] text-white">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-center gap-x-6 gap-y-0.5 px-4 py-1.5 sm:justify-between sm:px-8 lg:px-12">
        <span aria-hidden="true" className="hidden w-48 lg:block" />
        {promoActive ? (
          <p className="text-center">
            <span className="font-semibold">{PROMO.title}</span>
            <span className="hidden sm:inline"> hasta el {PROMO_UNTIL_LABEL}. Retiro sin costo en {STORE.address}.</span>
          </p>
        ) : (
          <p className="text-center">
            Retiro sin costo en {STORE.address}
            <span className="hidden sm:inline"> · Envíos a CABA y a todo el país</span>
          </p>
        )}
        <Link
          href="/arrepentimiento"
          className="focus-on-dark inline-flex min-h-8 items-center font-semibold underline decoration-white/60 underline-offset-4 hover:decoration-white lg:w-48 lg:justify-end"
        >
          Botón de arrepentimiento
        </Link>
      </div>
    </aside>
  );
}

const BRANDS = ['Kevin', 'Bross London', 'CaroCuore', 'Valeria Mazza', 'Colbert', 'Cannon', 'Ciel'];

/** Marcas que se consiguen en el mostrador. Lista quieta: se lee de un vistazo. */
export function BrandsTicker() {
  return (
    <section aria-labelledby="marcas-title" className="border-y border-[var(--amancay-border)] bg-[var(--bg-page)] py-10">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-5 sm:px-8 lg:px-12">
        <h2 id="marcas-title" className="shrink-0 text-[15px] font-semibold text-[var(--ink-muted)]">
          Perfumería nacional que trabajamos
        </h2>
        <ul className="flex flex-wrap items-baseline gap-x-8 gap-y-3 sm:gap-x-10 lg:justify-between lg:gap-x-6">
          {BRANDS.map((brand) => (
            <li key={brand}>
              <a
                translate="no"
                href={`/catalogo?q=${encodeURIComponent(brand)}`}
                className="font-display text-2xl text-[var(--ink-secondary)] transition-colors hover:text-[var(--brand-leather)] sm:text-[28px]"
              >
                {brand}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
