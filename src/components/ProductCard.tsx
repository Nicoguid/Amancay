'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Check, MessageCircle } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useStore, availableStock, priceRange } from '@/context/StoreContext';
import { TAX, formatPrice, netPrice, productPath, whatsappUrl } from '@/lib/storeConfig';
import { ProductImage } from './ProductImage';
import { SaveButton } from './SaveButton';
import { categoryInfo } from '@/lib/categories';

/** Una sola etiqueta por tarjeta, por prioridad. */
function badgeFor(product: Product, showHighlight: boolean): { label: string; className: string } | null {
  if (product.stock <= 0) return { label: 'Sin stock', className: 'tag-dark' };
  if (product.originalPrice && product.originalPrice > product.price) {
    const pct = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    return { label: `${pct} % off`, className: 'tag-gold' };
  }
  // "Destacado" es una elección del local, no un dato de ventas (PRODUCT.md: nada de cifras inventadas).
  if (product.isBestSeller && showHighlight) return { label: 'Destacado', className: 'tag-gold' };
  if (product.isNew) return { label: 'Nuevo', className: 'tag-quiet' };
  return null;
}

/** Notas de un perfume, tal como están en su ficha (no se inventan). */
export function fragranceNotes(product: Product): { label: string; value: string }[] {
  const specs = product.specifications ?? {};
  return [
    { label: 'Salida', value: specs['Notas de salida'] },
    { label: 'Corazón', value: specs['Notas de corazón'] },
    { label: 'Fondo', value: specs['Notas de fondo'] },
  ].filter((n): n is { label: string; value: string } => !!n.value);
}

export function ProductCard({
  product,
  headingLevel = 3,
  showHighlight = true,
  showNotes = false,
  widePhoto = false,
}: {
  product: Product;
  headingLevel?: 2 | 3;
  /** En una sección que ya es de destacados, la etiqueta en cada tarjeta es ruido. */
  showHighlight?: boolean;
  /** Muestra salida, corazón y fondo (solo perfumes que los tengan cargados). */
  showNotes?: boolean;
  /** En grillas de 3 columnas la foto va apaisada en escritorio (si no, la tarjeta queda muy alta). */
  widePhoto?: boolean;
}) {
  const { addToCart } = useStore();
  const [status, setStatus] = useState<'idle' | 'added' | 'no-stock'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const variants = product.variants ?? [];
  const hasChoice = variants.length > 1;
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState<string | undefined>(firstAvailable?.id);
  const variant = variants.find((v) => v.id === variantId) ?? firstAvailable;

  const { min, max } = priceRange(product);
  const price = variant ? variant.price : product.price;
  const hasDiscount = !!product.originalPrice && product.originalPrice > product.price && !variant?.priceModifier;
  const outOfStock = product.stock <= 0;
  const stock = availableStock(product, variant);
  const badge = badgeFor(product, showHighlight);
  const href = productPath(product);
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const notes = showNotes ? fragranceNotes(product) : [];
  const noun = categoryInfo(product.category).variantNoun;

  const handleAdd = () => {
    const added = addToCart(product, 1, variant);
    setStatus(added > 0 ? 'added' : 'no-stock');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus('idle'), 2500);
  };

  const stockNote = outOfStock ? null : stock <= 0 ? 'Sin stock' : stock <= 5 ? `Quedan ${stock}` : 'Hay stock';

  return (
    <article className="card-rest card-lift group relative flex h-full flex-col overflow-hidden rounded-lg bg-white">
      <div className={`relative aspect-square overflow-hidden bg-[var(--bg-sunken)] ${widePhoto ? 'lg:aspect-[4/3]' : ''}`}>
        <ProductImage
          src={product.images[0]}
          alt=""
          width={400}
          height={400}
          className="photo-on-linen motion-photo h-full w-full object-contain p-5 sm:p-7"
        />
        {badge && <span className={`tag absolute left-2.5 top-2.5 sm:left-3 sm:top-3 ${badge.className}`}>{badge.label}</span>}
        <SaveButton productId={product.id} productName={product.name} className="absolute right-0.5 top-0.5 z-10 sm:right-1.5 sm:top-1.5" />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-3.5 pb-4 pt-3.5 sm:px-4">
        <p className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
          <span translate="no" className="eyebrow truncate">
            {product.brand}
          </span>
          {stockNote && (
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium ${
                stock <= 0 ? 'text-[var(--amancay-wine)]' : 'text-[var(--brand-olive)]'
              }`}
            >
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${stock <= 0 ? 'bg-[var(--amancay-wine)]' : 'bg-[var(--brand-olive)]'}`} />
              {stockNote}
            </span>
          )}
        </p>

        <Heading className="font-display text-[18px] font-semibold leading-snug text-[var(--ink-primary)] sm:text-[20px]">
          {/* El link cubre toda la tarjeta (una sola parada de Tab). */}
          <Link href={href} className="line-clamp-2 after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </Heading>

        {product.shortDescription && (
          <p className="line-clamp-2 hidden text-sm leading-relaxed text-[var(--ink-muted)] sm:block">{product.shortDescription}</p>
        )}

        {notes.length > 0 && (
          <dl className="mt-1.5 hidden space-y-1 rounded bg-[var(--bg-subtle)] px-3 py-2.5 text-[13px] leading-snug sm:block">
            {notes.map((note) => (
              <div key={note.label} className="flex justify-between gap-3">
                <dt className="shrink-0 font-semibold text-[var(--ink-primary)]">{note.label}</dt>
                <dd className="text-right text-[var(--ink-muted)]">{note.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Franja de compra: tamaño, precio y acciones. */}
      <div className="relative z-10 mt-auto space-y-2.5 bg-[var(--bg-subtle)] px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          {hasChoice && (
            <div role="group" aria-label={`Elegí ${noun === 'tamaño' ? 'el tamaño' : 'una opción'} de ${product.name}`} className="flex flex-wrap gap-1.5">
              {variants.slice(0, 3).map((v) => {
                const selected = v.id === variant?.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariantId(v.id)}
                    aria-pressed={selected}
                    disabled={v.stock <= 0}
                    className={`tap-interactive min-h-11 rounded-[3px] px-3 text-[13px] font-semibold disabled:cursor-not-allowed disabled:line-through disabled:opacity-45 ${
                      selected ? 'bg-[var(--ink-primary)] text-white' : 'bg-[var(--chip-strong)] text-[var(--ink-primary)] hover:bg-[#dbd5c8]'
                    }`}
                  >
                    {v.name}
                  </button>
                );
              })}
            </div>
          )}
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span key={price} className={`text-[19px] font-bold tabular-nums leading-none text-[var(--ink-primary)] ${hasChoice ? 'swap-in' : ''}`}>
              {!hasChoice && min !== max && <span className="text-sm font-medium text-[var(--ink-muted)]">Desde </span>}
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span className="text-sm tabular-nums text-[var(--ink-muted)] line-through">
                <span className="sr-only">Antes </span>
                {formatPrice(product.originalPrice!)}
              </span>
            )}
          </p>
        </div>
        {TAX.showNetPrice && (
          <p className="text-[11px] leading-tight text-[var(--ink-muted)]">
            <span className="uppercase tracking-wide">Precio sin impuestos nacionales</span>{' '}
            <span className="tabular-nums">{formatPrice(netPrice(price))}</span>
          </p>
        )}

        <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-2">
          {outOfStock || stock <= 0 ? (
            <p className="flex min-h-11 items-center justify-center rounded-btn bg-[var(--chip)] px-2 text-center text-sm font-semibold text-[var(--ink-muted)]">
              Sin stock por ahora
            </p>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className={`btn px-2 text-sm ${status === 'added' ? 'bg-[var(--brand-olive)] text-white' : 'btn-primary'}`}
            >
              {status === 'added' ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
              <span>
                {status === 'added' ? 'Agregado' : 'Agregar'}
                <span className="sr-only">
                  {' '}
                  al carrito: {product.name}
                  {variant ? `, ${variant.name}` : ''}
                </span>
              </span>
            </button>
          )}
          <a
            href={whatsappUrl(`Hola Amancay, quiero consultar por ${product.name}${variant ? ` (${variant.name})` : ''}, ${formatPrice(price)}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-quiet px-3 text-sm"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Consultar</span>
            <span className="sr-only">
              {' '}
              por WhatsApp: {product.name} (se abre en otra pestaña)
            </span>
          </a>
        </div>
        <p className="sr-only" role="status">
          {status === 'added' ? `${product.name} agregado al carrito.` : status === 'no-stock' ? 'No hay más unidades disponibles.' : ''}
        </p>
        {status === 'no-stock' && <p className="text-center text-sm text-[var(--amancay-wine)]">Ya tenés en el carrito todas las unidades disponibles.</p>}
      </div>
    </article>
  );
}
