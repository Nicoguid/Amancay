'use client';

import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { formatPrice } from '@/lib/storeConfig';
import { CATEGORIES, CATEGORY_SENTENCE } from '@/lib/categories';
import { ProductImage } from './ProductImage';

export function CategoryStorySlider() {
  const { products } = useStore();

  return (
    <section aria-labelledby="rubros-title" className="bg-[var(--bg-page)] py-16 sm:py-20">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        <div className="mb-10 max-w-2xl">
          <h2 id="rubros-title" className="font-display text-[32px] leading-tight text-[var(--ink-primary)] sm:text-4xl">
            Todo lo que hay en el local
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-[var(--ink-muted)]">
            {CATEGORY_SENTENCE} en un mismo mostrador.
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-6">
          {CATEGORIES.map((cat, index) => {
            const items = products.filter((p) => p.active && p.category === cat.id);
            const from = items.length ? Math.min(...items.map((p) => p.price)) : null;
            // Fila de arriba: 3 tarjetas verticales. Fila de abajo: 2 tarjetas anchas, foto a la izquierda.
            const wide = index >= 3;
            return (
              <li key={cat.id} className={wide ? 'md:col-span-3' : 'md:col-span-2'}>
                <article
                  className={`card-rest card-lift group relative flex h-full flex-row overflow-hidden rounded-lg border border-[var(--amancay-border)] bg-white ${
                    wide ? '' : 'md:flex-col'
                  }`}
                >
                  <div
                    className={`relative aspect-square w-32 shrink-0 self-stretch overflow-hidden bg-[var(--bg-subtle)] sm:w-44 ${
                      wide ? 'md:aspect-auto md:min-h-[240px] md:w-[42%]' : 'md:aspect-[4/3] md:w-auto'
                    }`}
                  >
                    <ProductImage
                      src={cat.image}
                      alt=""
                      width={600}
                      height={450}
                      className="photo-on-linen absolute inset-0 h-full w-full object-contain p-4 motion-photo md:p-8"
                    />
                    <span className="absolute left-4 top-4 hidden rounded-full border md:inline-block border-[var(--brand-brass)] bg-[var(--bg-page)] px-3 py-1 text-xs font-semibold text-[var(--ink-primary)]">
                      {items.length} {items.length === 1 ? 'modelo' : 'modelos'}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-6 md:gap-2">
                    <h3 className="font-display text-2xl text-[var(--ink-primary)]">
                      <Link href={`/catalogo?rubro=${cat.id}`} className="after:absolute after:inset-0 after:content-['']">
                        {cat.label}
                      </Link>
                    </h3>
                    <p className="text-[15px] leading-relaxed text-[var(--ink-muted)] md:text-base">{cat.blurb}</p>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-1 pt-2 md:pt-4">
                      {from !== null && (
                        <p className="text-sm text-[var(--ink-muted)]">
                          Desde <span className="font-display text-xl tabular-nums text-[var(--ink-primary)]">{formatPrice(from)}</span>
                        </p>
                      )}
                      <span className="link-brass text-sm">Ver {cat.label.toLowerCase()}</span>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
