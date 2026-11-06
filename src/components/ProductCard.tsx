'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Check } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useStore, priceRange } from '@/context/StoreContext';
import { formatPrice } from '@/lib/storeConfig';
import { ProductImage } from './ProductImage';

const CATEGORY_LABEL: Record<Product['category'], string> = {
  mates: 'Mates',
  bombillas: 'Bombillas',
  perfumes: 'Perfumes',
};

/** Una sola etiqueta por tarjeta, por prioridad. */
function badgeFor(product: Product): { label: string; className: string } | null {
  if (product.stock <= 0) return { label: 'Sin stock', className: 'bg-[var(--ink-secondary)] text-white' };
  if (product.originalPrice && product.originalPrice > product.price) {
    const pct = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    return { label: `${pct} % off`, className: 'bg-[var(--amancay-wine)] text-white' };
  }
  if (product.isBestSeller) return { label: 'Más vendido', className: 'bg-[var(--amancay-emerald)] text-white' };
  if (product.isNew) return { label: 'Nuevo', className: 'bg-white text-[var(--ink-primary)]' };
  return null;
}

export function ProductCard({ product, headingLevel = 3 }: { product: Product; headingLevel?: 2 | 3 }) {
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
  const badge = badgeFor(product);
  const href = `/producto/${product.id}`;
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  const handleAdd = () => {
    const added = addToCart(product, 1, product.variants?.[0]);
    setStatus(added > 0 ? 'added' : 'no-stock');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus('idle'), 2500);
  };

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-[var(--amancay-border)] bg-white transition-[border-color,box-shadow] duration-300 hover:border-[var(--amancay-gold)] hover:shadow-lg">
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-page)]">
        <ProductImage
          src={product.images[0]}
          alt=""
          width={400}
          height={500}
          className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {product.images[1] && (
          <ProductImage
            src={product.images[1]}
            alt=""
            width={400}
            height={500}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
          />
        )}
        {badge && (
          <span className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-xs ${badge.className}`}>
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="flex items-center justify-between gap-2 text-sm text-[var(--ink-muted)]">
          <span className="truncate font-semibold text-[var(--ink-accent)]">{product.brand}</span>
          <span className="shrink-0">{CATEGORY_LABEL[product.category]}</span>
        </p>

        <Heading className="font-display text-lg leading-snug text-[var(--ink-primary)]">
          {/* El link cubre toda la tarjeta (una sola parada de Tab). */}
          <Link href={href} className="line-clamp-2 after:absolute after:inset-0 after:content-[''] group-hover:text-[var(--ink-accent)]">
            {product.name}
          </Link>
        </Heading>

        {product.shortDescription && (
          <p className="line-clamp-2 text-sm leading-relaxed text-[var(--ink-muted)]">{product.shortDescription}</p>
        )}

        <div className="mt-auto border-t border-[var(--bg-subtle)] pt-3">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-2xl tabular-nums text-[var(--ink-primary)]">
              {min !== max && <span className="font-sans text-sm text-[var(--ink-muted)]">Desde </span>}
              {formatPrice(min)}
            </span>
            {hasDiscount && (
              <span className="text-sm tabular-nums text-[var(--ink-muted)] line-through">
                <span className="sr-only">Antes </span>
                {formatPrice(product.originalPrice!)}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="relative z-10 px-4 pb-4">
        {outOfStock ? (
          <p className="flex min-h-11 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-sm font-semibold text-[var(--ink-muted)]">
            Sin stock por ahora
          </p>
        ) : needsChoice ? (
          <Link
            href={href}
            tabIndex={-1}
            aria-hidden="true"
            className="tap-interactive flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--ink-primary)] px-3 text-sm font-semibold text-[var(--ink-primary)] hover:bg-[var(--ink-primary)] hover:text-white"
          >
            Elegir opción
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            className={`tap-interactive flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold text-white shadow-xs ${
              status === 'added' ? 'bg-[var(--amancay-emerald)]' : 'bg-[var(--ink-primary)] hover:bg-[var(--ink-secondary)]'
            }`}
          >
            {status === 'added' ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ShoppingBag className="h-4 w-4 text-[var(--amancay-gold-light)]" aria-hidden="true" />
            )}
            <span>
              {status === 'added' ? 'Agregado al carrito' : 'Agregar al carrito'}
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
