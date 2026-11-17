'use client';

import Link from 'next/link';
import { Store, Truck, CreditCard, MapPin } from 'lucide-react';
import { useStore, priceRange } from '@/context/StoreContext';
import { STORE, formatPrice, productPath } from '@/lib/storeConfig';
import type { Product } from '@/lib/types';
import { ProductImage } from './ProductImage';

/**
 * Portada: el mostrador del local. Tres productos reales sobre el estante,
 * cada uno con su etiqueta de precio y stock (lo primero que busca el vecino).
 */
const SHELF = [
  { id: 'perf-01', short: 'Kevin Absolute', size: 'h-[110px] sm:h-[190px]', tilt: '-rotate-3' },
  { id: 'mate-01', short: 'Mate Imperial cincelado', size: 'h-[150px] sm:h-[270px]', tilt: 'rotate-1' },
  { id: 'bomb-01', short: 'Bombilla de alpaca', size: 'h-[120px] sm:h-[220px]', tilt: 'rotate-3' },
];

const PROMISES = [
  { icon: Store, title: 'Retiro sin costo', body: 'En el local, sin hacer fila' },
  { icon: Truck, title: 'Envíos', body: 'Moto en CABA y Correo al país' },
  { icon: CreditCard, title: 'Pagos', body: 'Mercado Pago, transferencia o en el local' },
];

function stockLabel(p: Product) {
  if (p.stock <= 0) return 'Sin stock';
  if (p.stock <= 5) return `Quedan ${p.stock}`;
  return 'Hay stock';
}

function PriceTag({ product, label, tilt }: { product: Product; label: string; tilt: string }) {
  const { min, max } = priceRange(product);
  return (
    <span
      className={`relative mt-3 flex w-[104px] flex-col items-center rounded-md border border-[var(--brand-brass)] bg-white px-2 pb-2 pt-3 text-center shadow-[var(--shadow-rest)] sm:w-[150px] sm:px-3 ${tilt}`}
    >
      {/* el ojalillo de la etiqueta */}
      <span aria-hidden="true" className="absolute -top-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-[var(--brand-brass)] bg-[var(--bg-subtle)]" />
      <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-[var(--ink-muted)] sm:text-[13px]">{label}</span>
      {min !== max && <span className="mt-1 text-[11px] font-medium leading-none text-[var(--ink-muted)]">desde</span>}
      <span className="mt-1 font-display text-lg tabular-nums leading-none text-[var(--ink-primary)] sm:text-2xl">{formatPrice(min)}</span>
      <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--brand-olive)] sm:text-xs">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--brand-olive)]" />
        {stockLabel(product)}
      </span>
    </span>
  );
}

export function HeroBannerCarousel() {
  const { products } = useStore();
  const shelf = SHELF.map((s) => ({ ...s, product: products.find((p) => p.id === s.id && p.active) })).filter(
    (s): s is typeof s & { product: Product } => !!s.product
  );

  return (
    <section aria-labelledby="portada-title" className="relative overflow-hidden border-b border-[var(--amancay-border)] bg-[var(--bg-page)]">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-10 px-5 pb-12 pt-10 sm:px-8 sm:pt-14 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:pb-16 lg:pt-16">
        <div className="lg:col-span-5">
          <h1
            id="portada-title"
            className="font-display text-[40px] leading-[1.08] text-[var(--ink-primary)] sm:text-[52px] lg:text-[50px] xl:text-[54px]"
          >
            Mates y perfumería de Avenida Corrientes, ahora también online.
          </h1>
          <p className="mt-5 max-w-[34rem] text-lg leading-[1.65] text-[var(--ink-muted)]">
            Amancay: mates, bombillas, perfumes y desodorantes con precio y stock a la vista. Elegís desde el celular
            y lo retirás en {STORE.address}, a metros del subte B, o te lo mandamos.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
            <Link
              href="/catalogo"
              className="tap-interactive inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--brand-leather)] px-7 text-[15px] font-semibold text-white shadow-sm hover:bg-[var(--brand-leather-hover)]"
            >
              Ver el catálogo
            </Link>
            {/* Una sola llamada a la acción con peso de botón; la otra queda como link. */}
            <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className="link-brass inline-flex min-h-12 items-center gap-1.5 text-[15px]">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Cómo llegar al local
              <span className="sr-only">(abre Google Maps en otra pestaña)</span>
            </a>
          </div>

          <ul className="mt-10 grid grid-cols-3 gap-3 border-t border-[var(--amancay-border)] pt-6 sm:gap-6">
            {PROMISES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
                <Icon className="h-5 w-5 shrink-0 text-[var(--brand-leather)]" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-[var(--ink-primary)]">{title}</span>
                  <span className="block text-[13px] leading-snug text-[var(--ink-muted)]">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* El estante */}
        <div className="lg:col-span-7">
          <div className="relative overflow-hidden rounded-lg border border-[var(--amancay-border)] bg-[var(--bg-subtle)]">
            <div className="flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-6">
              <h2 className="font-display text-lg text-[var(--ink-primary)] sm:text-xl">Hoy en el mostrador</h2>
              <Link href="/catalogo" className="link-brass inline-flex min-h-11 items-center text-sm">
                Ver todo
              </Link>
            </div>
            <ul className="grid grid-cols-[1fr_1.35fr_1fr] items-end gap-3 px-3 pt-4 sm:gap-8 sm:px-10 sm:pt-6">
              {shelf.map(({ id, size, product }, i) => (
                <li key={id} className="shelf-enter flex flex-col items-center" style={{ '--i': i } as React.CSSProperties}>
                  <Link href={productPath(product)} className={`group flex w-full items-end justify-center rounded-md ${size}`}>
                    <ProductImage
                      src={product.images[0]}
                      alt={product.name}
                      width={320}
                      height={400}
                      priority
                      className="photo-on-linen motion-photo max-h-full max-w-full object-contain"
                    />
                    <span className="sr-only">
                      {product.name}, {formatPrice(priceRange(product).min)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {/* madera del estante */}
            <div aria-hidden="true" className="counter-shelf h-6 shadow-[0_6px_14px_rgba(82,37,13,0.25)] sm:h-7" />
            <ul aria-hidden="true" className="grid grid-cols-[1fr_1.35fr_1fr] gap-3 px-3 pb-7 sm:gap-8 sm:px-10 sm:pb-9">
              {shelf.map(({ id, short, tilt, product }, i) => (
                <li key={id} className="shelf-enter flex justify-center" style={{ '--i': i + 2 } as React.CSSProperties}>
                  <PriceTag product={product} label={short} tilt={tilt} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
