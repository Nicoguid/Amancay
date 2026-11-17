'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Check } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useStore, priceRange } from '@/context/StoreContext';
import { TAX, formatPrice, netPrice, productPath } from '@/lib/storeConfig';
import { ProductImage } from './ProductImage';
import { categoryInfo } from '@/lib/categories';

/** Una sola etiqueta por tarjeta, por prioridad. */
function badgeFor(product: Product, showHighlight: boolean): { label: string; className: string } | null {
  if (product.stock <= 0) return { label: 'Sin stock', className: 'bg-[var(--ink-primary)] text-white' };
  if (product.originalPrice && product.originalPrice > product.price) {
    const pct = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    return { label: `${pct}\u00a0% off`, className: 'bg-[var(--brand-leather)] text-white' };
  }
  // "Destacado" es una elección del local, no un dato de ventas (PRODUCT.md: nada de cifras inventadas).
  if (product.isBestSeller && showHighlight)
    return { label: 'Destacado', className: 'border border-[var(--brand-brass)] bg-[var(--bg-page)] text-[var(--ink-primary)]' };
  if (product.isNew) return { label: 'Nuevo', className: 'bg-[var(--brand-olive)] text-white' };
  return null;
}

export function ProductCard({
  product,
  headingLevel = 3,
  showHighlight = true,
}: {
  product: Product;
  headingLevel?: 2 | 3;
  /** En una sección que ya es de destacados, la etiqueta en cada tarjeta es ruido. */
  showHighlight?: boolean;
}) {
  const { addToCart } = useStore();
  const [status, setStatus] = useState<'idle' | 'added' | 'no-stock'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const { min, max } = priceRange(product);
  const hasDiscount = !!product.originalPrice && product.originalPrice > product.price;
  const needsChoice = (product.variants?.length ?? 0) > 1;
  const outOfStock = product.stock <= 0;
  const badge = badgeFor(product, showHighlight);
  const href = productPath(product);
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  const handleAdd = () => {
    const added = addToCart(product, 1, product.variants?.[0]);
    setStatus(added > 0 ? 'added' : 'no-stock');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus('idle'), 2500);
  };

  const stockNote = outOfStock ? null : product.stock <= 5 ? `Quedan ${product.stock}` : 'Hay stock';

  return (
    <article className="card-rest card-lift group relative flex h-full flex-col overflow-hidden rounded-lg border border-[var(--amancay-border)] bg-white">
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-subtle)]">
        <ProductImage
          src={product.images[0]}
          alt=""
          width={400}
          height={500}
          className="photo-on-linen h-full w-full object-contain p-6 motion-photo sm:p-8"
        />
        {badge && (
          <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 pt-4 sm:px-5">
        <p className="flex flex-col gap-1 text-[13px] sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span translate="no" className="truncate font-semibold text-[var(--brand-leather)]">{product.brand}</span>
          {stockNote && (
            <span className="inline-flex shrink-0 items-center gap-1.5 font-medium text-[var(--brand-olive)]">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--brand-olive)]" />
              {stockNote}
            </span>
          )}
        </p>

        <Heading className="font-display text-[19px] font-medium leading-snug text-[var(--ink-primary)]">
          {/* El link cubre toda la tarjeta (una sola parada de Tab). */}
          <Link href={href} className="line-clamp-2 after:absolute after:inset-0 after:content-[''] group-hover:text-[var(--brand-leather)]">
            {product.name}
          </Link>
        </Heading>

        {product.shortDescription && (
          <p className="line-clamp-2 hidden text-sm leading-relaxed text-[var(--ink-muted)] sm:block">{product.shortDescription}</p>
        )}

        <div className="mt-auto pt-3">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-[26px] tabular-nums leading-none text-[var(--ink-primary)]">
              {min !== max && <span className="font-sans text-sm font-medium text-[var(--ink-muted)]">Desde </span>}
              {formatPrice(min)}
            </span>
            {hasDiscount && (
              <span className="text-sm tabular-nums text-[var(--ink-muted)] line-through">
                <span className="sr-only">Antes </span>
                {formatPrice(product.originalPrice!)}
              </span>
            )}
          </p>
          {TAX.showNetPrice && (
            <p className="mt-1.5 text-[11px] leading-tight text-[var(--ink-muted)]">
              <span className="uppercase tracking-wide">Precio sin impuestos nacionales</span>{' '}
              <span className="tabular-nums">{formatPrice(netPrice(min))}</span>
            </p>
          )}
        </div>
      </div>

      <div className="relative z-10 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
        {outOfStock ? (
          <p className="flex min-h-11 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-sm font-semibold text-[var(--ink-muted)]">
            Sin stock por ahora
          </p>
        ) : needsChoice ? (
          <Link
            href={href}
            tabIndex={-1}
            aria-hidden="true"
            className="tap-interactive flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-[var(--brand-leather)] px-3 text-sm font-semibold text-[var(--brand-leather)] hover:bg-[var(--brand-leather)] hover:text-white"
          >
            Elegir {categoryInfo(product.category).variantNoun}
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            className={`tap-interactive flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold text-white ${
              status === 'added' ? 'bg-[var(--brand-olive)]' : 'bg-[var(--brand-leather)] hover:bg-[var(--brand-leather-hover)]'
            }`}
          >
            {status === 'added' ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            )}
            <span>
              {status === 'added' ? 'Agregado' : 'Agregar'}
              <span className="hidden sm:inline">{status === 'added' ? ' al carrito' : ' al carrito'}</span>
              <span className="sr-only">: {product.name}</span>
            </span>
          </button>
        )}
        <p className="sr-only" role="status">
          {status === 'added' ? `${product.name} agregado al carrito.` : status === 'no-stock' ? 'No hay más unidades disponibles.' : ''}
        </p>
        {status === 'no-stock' && <p className="mt-2 text-center text-sm text-[var(--amancay-wine)]">No hay más unidades disponibles.</p>}
      </div>
    </article>
  );
}
