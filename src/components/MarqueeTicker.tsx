'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { PROMO, PROMO_UNTIL_LABEL, STORE, whatsappUrl } from '@/lib/storeConfig';
import { usePromoActive } from '@/lib/usePromo';
import { useTodayHours } from '@/lib/useStoreHours';

/**
 * Barra superior fija (sin animación): un mensaje útil y el Botón de arrepentimiento,
 * que la Disposición 954/2025 pide "a simple vista, en lugar destacado y en el primer acceso".
 */
export function AnnouncementBar() {
  const promoActive = usePromoActive();
  const today = useTodayHours();
  return (
    <aside aria-label="Aviso" className="focus-on-dark bg-[var(--brand-espresso)] text-[13px] font-medium text-[#f1ebdd]">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-x-6 px-4 pt-2 sm:px-8 sm:pt-0 lg:px-12">
        {promoActive ? (
          <p>
            <span className="font-semibold text-[var(--ink-gold-on-dark)]">{PROMO.title}</span>
            <span className="hidden md:inline"> hasta el {PROMO_UNTIL_LABEL}</span>
          </p>
        ) : (
          <p>
            <span className="font-semibold text-[var(--ink-gold-on-dark)]">Retiro sin costo</span>
            <span className="hidden sm:inline"> en {STORE.address}, Almagro</span>
          </p>
        )}
        <div className="flex items-center gap-x-5">
          {today && (
            <p className="hidden items-center gap-2 lg:flex">
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${today.isOpen ? 'bg-[#7fd28f]' : 'bg-[#c9bfae]'}`}
              />
              <span>
                {today.isOpen ? 'Abierto ahora' : 'Cerrado ahora'}
                <span className="text-[#cfc6b6]"> · Hoy: {today.time}</span>
              </span>
            </p>
          )}
          <a
            href={whatsappUrl('Hola Amancay, quiero hacer una consulta.')}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-11 items-center gap-1.5 hover:text-white xl:inline-flex"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums">{STORE.whatsappDisplay}</span>
          </a>
          <Link
            href="/arrepentimiento"
            className="inline-flex min-h-11 items-center font-semibold underline decoration-white/50 underline-offset-4 hover:decoration-white"
          >
            Botón de arrepentimiento
          </Link>
        </div>
      </div>
    </aside>
  );
}

const BRANDS = ['Kevin', 'Bross London', 'CaroCuore', 'Valeria Mazza', 'Colbert', 'Cannon', 'Ciel'];

/** Marcas que se consiguen en el mostrador. Lista quieta: se lee de un vistazo. */
export function BrandsTicker() {
  return (
    <section aria-labelledby="marcas-title" className="border-y border-[var(--amancay-border)] bg-[var(--bg-subtle)] py-10">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-5 sm:px-8 lg:px-12">
        <h2 id="marcas-title" className="eyebrow eyebrow-rule">
          Perfumería nacional que trabajamos
        </h2>
        <ul className="flex flex-wrap items-baseline gap-x-8 gap-y-3 sm:gap-x-10 lg:justify-between lg:gap-x-6">
          {BRANDS.map((brand) => (
            <li key={brand}>
              <a
                translate="no"
                href={`/catalogo?q=${encodeURIComponent(brand)}`}
                className="nav-underline inline-flex min-h-11 items-center font-display text-2xl text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)] sm:text-[28px]"
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
