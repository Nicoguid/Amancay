'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Product, ProductCategory } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { CATEGORIES } from '@/lib/categories';

interface EditorialShowcaseProps {
  products: Product[];
}

const FILTERS: { id: 'todos' | ProductCategory; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  ...CATEGORIES.map(({ id, label }) => ({ id, label })),
];

/** Los más pedidos en el mostrador, con chips para filtrar por rubro. */
export function EditorialShowcase({ products }: EditorialShowcaseProps) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('todos');
  if (products.length === 0) return null;
  const visible = (filter === 'todos' ? products : products.filter((p) => p.category === filter)).slice(0, 8);

  return (
    <section aria-labelledby="destacados-title" className="border-y border-[var(--amancay-border)] bg-[var(--bg-subtle)] py-16 sm:py-20">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 id="destacados-title" className="font-display text-[32px] leading-tight text-[var(--ink-primary)] sm:text-4xl">
              Destacados del mostrador
            </h2>
            <p className="mt-3 text-[17px] leading-relaxed text-[var(--ink-muted)]">Una selección de cada rubro, con precio y stock al día.</p>
          </div>
          <div role="group" aria-label="Filtrar destacados por rubro" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f.id)}
                  className={`tap-interactive min-h-11 rounded-full border px-5 text-sm font-semibold ${
                    active
                      ? 'border-[var(--brand-olive)] bg-[var(--brand-olive)] text-white'
                      : 'border-[var(--amancay-border)] bg-white text-[var(--ink-primary)] hover:border-[var(--brand-olive)]'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {visible.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} showHighlight={false} />
            </li>
          ))}
        </ul>

        <div className="mt-10 flex justify-center">
          <Link
            href={filter === 'todos' ? '/catalogo' : `/catalogo?rubro=${filter}`}
            className="tap-interactive inline-flex min-h-12 items-center justify-center rounded-full border-[1.5px] border-[var(--brand-leather)] px-7 text-[15px] font-semibold text-[var(--brand-leather)] hover:bg-[var(--brand-leather)] hover:text-white"
          >
            Ver todo el catálogo
          </Link>
        </div>
      </div>
    </section>
  );
}
