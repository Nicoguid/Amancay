'use client';

import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Store, CreditCard, Tag } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { usePromoActive } from '@/lib/usePromo';
import { PROMO, PROMO_UNTIL_LABEL, STORE, formatPrice, productPath } from '@/lib/storeConfig';

/*
 * Héroe del inicio: el mate como protagonista, con paneles de vidrio esmerilado encima.
 * Paleta clara (pedido de la dueña): crema y arena con luces doradas; el vidrio es blanco translúcido.
 * Debajo sigue la vidriera de siempre (componente Vitrina).
 */

/** El mate de la foto. Si cambia el catálogo, la tarjeta de precio se oculta sola. */
const HERO_PRODUCT_ID = 'mate-02';
const HERO_IMAGE = '/hero/mate-imperial-recorte.webp';

export function HeroMate() {
  const { products } = useStore();
  const promo = usePromoActive();
  const mate = products.find((p) => p.id === HERO_PRODUCT_ID && p.active);

  return (
    <section aria-labelledby="hero-title" className="hero-glass relative isolate overflow-hidden text-[var(--ink-primary)]">
      {/* Luces de fondo: le dan algo para desenfocar al vidrio. */}
      <div aria-hidden="true" className="hero-glows pointer-events-none absolute inset-0 -z-10">
        <div className="hero-glow hero-glow--gold" />
        <div className="hero-glow hero-glow--brass" />
        <div className="hero-glow hero-glow--light" />
      </div>

      <div className="mx-auto grid max-w-[1320px] items-center gap-10 px-4 pb-10 pt-10 sm:px-8 lg:min-h-[600px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:px-12 lg:pb-14 lg:pt-14">
        {/* Texto */}
        <div className="relative z-10 text-center lg:text-left">
          <p
            className="enter glass inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-[13px] font-semibold tracking-[0.02em] text-[var(--ink-secondary)]"
            style={{ '--i': 0 } as CSSProperties}
          >
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--brand-brass)] shadow-[0_0_0_3px_rgba(217,173,60,0.25)]" />
            Perfumería · Bazar · Mates
          </p>

          <h1
            id="hero-title"
            className="enter mx-auto mt-6 max-w-[15ch] font-display text-[40px] leading-[1.04] tracking-[-0.03em] sm:text-[52px] lg:mx-0 lg:text-[62px]"
            style={{ '--i': 1, '--rise': '18px' } as CSSProperties}
          >
            Perfumería, bazar y mates <span className="hero-highlight">de siempre</span>, en un mismo mostrador.
          </h1>

          <p
            className="enter mx-auto mt-5 max-w-[34rem] text-base leading-relaxed text-[var(--ink-muted)] sm:text-[17px] lg:mx-0"
            style={{ '--i': 2 } as CSSProperties}
          >
            Precio y stock a la vista. Comprá online y retirá sin costo en {STORE.address}, a metros del subte B.
          </p>

          <div
            className="enter mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
            style={{ '--i': 3, '--rise': '10px' } as CSSProperties}
          >
            <Link
              href="/catalogo?rubro=mates"
              className="tap-interactive inline-flex min-h-14 items-center gap-2.5 rounded-full bg-[var(--brand-espresso)] px-7 text-[15px] font-semibold text-white shadow-[0_14px_30px_-12px_rgba(44,24,16,0.55)] hover:bg-[var(--brand-espresso-deep)]"
            >
              Ver mates y bombillas
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/catalogo?rubro=perfumes"
              className="tap-interactive glass glass-hover inline-flex min-h-14 items-center gap-2 rounded-full px-7 text-[15px] font-semibold text-[var(--ink-primary)]"
            >
              Ver perfumería
            </Link>
          </div>
        </div>

        {/* El mate con los paneles de vidrio */}
        <div className="relative mx-auto h-[400px] w-full max-w-[520px] sm:h-[480px] lg:h-[560px] lg:max-w-none">
          <div aria-hidden="true" className="hero-disc absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 sm:h-[380px] sm:w-[380px] lg:h-[440px] lg:w-[440px]" />
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(217,173,60,0.35)] sm:h-[430px] sm:w-[430px] lg:h-[500px] lg:w-[500px]" />
          <div aria-hidden="true" className="hero-floor absolute bottom-[8%] left-1/2 h-8 w-[52%] -translate-x-1/2" />

          <div className="hero-float absolute inset-0 flex items-center justify-center">
            <Image
              src={HERO_IMAGE}
              alt="Mate Imperial de calabaza forrada en cuero con virola de acero cincelada"
              width={441}
              height={574}
              priority
              sizes="(min-width: 1024px) 280px, (min-width: 640px) 240px, 190px"
              className="hero-mate h-auto w-[190px] sm:w-[240px] lg:w-[280px]"
            />
          </div>

          {mate && (
            <Link
              href={productPath(mate)}
              className="hero-chip glass glass-hover absolute left-0 top-[8%] w-[188px] rounded-2xl p-4 text-left sm:left-[2%] lg:left-[0%]"
              style={{ '--d': '0s' } as CSSProperties}
            >
              <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ink-gold)]">Mate Imperial</span>
              <span className="mt-1 block font-display text-[26px] leading-none">{formatPrice(mate.price)}</span>
              <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--ink-secondary)]">
                Ver el mate
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Link>
          )}

          <div
            className="hero-chip glass absolute right-0 top-[40%] flex items-center gap-3 rounded-2xl px-4 py-3 sm:right-[0%] lg:right-[-3%]"
            style={{ '--d': '1.2s' } as CSSProperties}
          >
            <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand-gold)] text-[var(--ink-on-gold)]">
              <Store className="h-5 w-5" />
            </span>
            <span className="text-left">
              <span className="block text-[14px] font-semibold">Retiro sin costo</span>
              <span className="block text-[13px] text-[var(--ink-muted)]">{STORE.address}</span>
            </span>
          </div>

          <div
            className="hero-chip glass absolute bottom-[5%] left-[2%] hidden items-center gap-3 rounded-2xl px-4 py-3 sm:flex lg:left-[0%]"
            style={{ '--d': '2.4s' } as CSSProperties}
          >
            <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl bg-white/80 text-[var(--ink-gold)]">
              {promo ? <CreditCard className="h-5 w-5" /> : <Tag className="h-5 w-5" />}
            </span>
            <span className="text-left">
              <span className="block text-[14px] font-semibold">{promo ? PROMO.title.replace(' con Banco Galicia', '') : 'Precio y stock a la vista'}</span>
              <span className="block text-[13px] text-[var(--ink-muted)]">
                {promo ? `Banco Galicia, hasta el ${PROMO_UNTIL_LABEL}` : 'Mismo precio con cualquier medio de pago'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
