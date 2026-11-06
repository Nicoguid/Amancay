'use client';

import Link from 'next/link';
import type { Product } from '@/lib/types';
import { priceRange } from '@/context/StoreContext';
import { formatPrice } from '@/lib/storeConfig';
import { ProductImage } from './ProductImage';

interface EditorialShowcaseProps {
  products: Product[];
}

/** Bloque de destacados: uno grande y hasta tres chicos. Lleva a la ficha para elegir variante. */
export function EditorialShowcase({ products }: EditorialShowcaseProps) {
  if (products.length === 0) return null;
  const [spotlight, ...rest] = products;
  const sideItems = rest.slice(0, 3);
  const spotlightPrice = priceRange(spotlight);

  return (
    <section aria-labelledby="destacados-title" className="border-b border-[var(--amancay-border)] bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <h2 id="destacados-title" className="font-display text-3xl tracking-tight text-[var(--ink-primary)] sm:text-4xl">
            Lo que más sale del mostrador
          </h2>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12 lg:gap-8">
          <article className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--amancay-border)] bg-[var(--bg-page)] transition-colors hover:border-[var(--amancay-gold)] lg:col-span-7">
            <div className="relative aspect-[16/11] overflow-hidden bg-[var(--bg-subtle)]">
              <ProductImage
                src={spotlight.images[0]}
                alt=""
                width={800}
                height={550}
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="space-y-3 p-6 sm:p-8">
              <p className="text-sm font-semibold text-[var(--ink-accent)]">{spotlight.brand}</p>
              <h3 className="font-display text-2xl leading-tight text-[var(--ink-primary)] sm:text-3xl">
                <Link href={`/producto/${spotlight.id}`} className="after:absolute after:inset-0 after:content-[''] group-hover:text-[var(--ink-accent)]">
                  {spotlight.name}
                </Link>
              </h3>
              {spotlight.shortDescription && <p className="text-[var(--ink-muted)]">{spotlight.shortDescription}</p>}
              <p className="font-display text-3xl tabular-nums text-[var(--ink-primary)]">
                {spotlightPrice.min !== spotlightPrice.max && <span className="font-sans text-sm text-[var(--ink-muted)]">Desde </span>}
                {formatPrice(spotlightPrice.min)}
              </p>
            </div>
          </article>

          <ul className="flex flex-col gap-4 lg:col-span-5">
            {sideItems.map((item) => {
              const range = priceRange(item);
              return (
                <li key={item.id}>
                  <article className="group relative flex items-center gap-4 rounded-xl border border-[var(--amancay-border)] bg-[var(--bg-page)] p-4 transition-colors hover:border-[var(--amancay-gold)]">
                    <ProductImage
                      src={item.images[0]}
                      alt=""
                      width={112}
                      height={112}
                      className="h-24 w-24 shrink-0 rounded-lg border border-[var(--amancay-border)] bg-[var(--bg-subtle)] object-cover sm:h-28 sm:w-28"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-semibold text-[var(--ink-accent)]">{item.brand}</p>
                      <h3 className="font-display text-lg leading-snug text-[var(--ink-primary)]">
                        <Link href={`/producto/${item.id}`} className="line-clamp-2 after:absolute after:inset-0 after:content-[''] group-hover:text-[var(--ink-accent)]">
                          {item.name}
                        </Link>
                      </h3>
                      <p className="font-display text-xl tabular-nums text-[var(--ink-primary)]">
                        {range.min !== range.max && <span className="font-sans text-sm text-[var(--ink-muted)]">Desde </span>}
                        {formatPrice(range.min)}
                      </p>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
