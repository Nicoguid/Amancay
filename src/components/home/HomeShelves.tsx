'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Product, ProductCategory } from '@/lib/types';
import { useStore } from '@/context/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import { Reveal } from '@/components/Reveal';
import { normalizeText } from '@/lib/storeConfig';

/*
 * Las dos secciones de producto del inicio (Figma: "Mates de selección" y "Perfumería").
 * Cada una tiene filtros rápidos que no cambian de página.
 */

interface ShelfFilter {
  id: string;
  label: string;
  match: (product: Product) => boolean;
}

const nameHas = (product: Product, ...words: string[]) => {
  const name = normalizeText(product.name);
  return words.some((w) => name.includes(w));
};

const MATE_FILTERS: ShelfFilter[] = [
  { id: 'todos', label: 'Todos', match: () => true },
  { id: 'imperiales', label: 'Imperiales', match: (p) => p.category === 'mates' && nameHas(p, 'imperial') },
  { id: 'camioneros', label: 'Camioneros', match: (p) => p.category === 'mates' && nameHas(p, 'camioner') },
  { id: 'madera', label: 'De madera', match: (p) => p.category === 'mates' && nameHas(p, 'calden', 'algarrobo') },
  { id: 'bombillas', label: 'Bombillas', match: (p) => p.category === 'bombillas' },
];

const FRAGRANCE_FILTERS: ShelfFilter[] = [
  { id: 'todos', label: 'Todos', match: () => true },
  { id: 'perfumes', label: 'Perfumes', match: (p) => p.category === 'perfumes' },
  { id: 'desodorantes', label: 'Desodorantes', match: (p) => p.category === 'desodorantes' },
  { id: 'combos', label: 'Combos para regalar', match: (p) => p.category === 'combos' },
];

function Shelf({
  id,
  eyebrow,
  title,
  body,
  categories,
  filters,
  limit,
  columns,
  showNotes = false,
  viewAllHref,
  viewAllLabel,
}: {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  categories: ProductCategory[];
  filters: ShelfFilter[];
  limit: number;
  columns: 3 | 4;
  showNotes?: boolean;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  const { products } = useStore();
  const [filterId, setFilterId] = useState(filters[0].id);

  const pool = products
    .filter((p) => p.active && categories.includes(p.category))
    // Primero lo que hay y lo que el local destaca.
    .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || Number(!!b.isBestSeller) - Number(!!a.isBestSeller));
  const active = filters.find((f) => f.id === filterId) ?? filters[0];
  const matches = pool.filter(active.match);
  const shown = matches.slice(0, limit);

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="bg-[var(--bg-page)] py-12 sm:py-16">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
        <Reveal className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow eyebrow-rule">{eyebrow}</p>
            <h2 id={`${id}-title`} className="mt-2 font-display text-[30px] leading-tight tracking-[-0.02em] sm:text-[36px]">
              {title}
            </h2>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-[var(--ink-muted)]">{body}</p>
          </div>
          <div
            role="group"
            aria-label={`Filtrar ${title.toLowerCase()}`}
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 lg:justify-end"
          >
            {filters.map((filter) => {
              const count = pool.filter(filter.match).length;
              if (count === 0) return null;
              return (
                <button key={filter.id} type="button" className="chip" aria-pressed={filter.id === active.id} onClick={() => setFilterId(filter.id)}>
                  {filter.label}
                  <span className="tabular-nums opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <p className="sr-only" role="status">
          {`${matches.length} ${matches.length === 1 ? 'producto' : 'productos'} en ${active.label}`}
        </p>
        {/* La clave cambia con el filtro: la grilla nueva hace una entrada corta. */}
        <ul
          key={active.id}
          className={`swap-in mt-7 grid grid-cols-2 gap-3 sm:gap-5 ${columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}
        >
          {shown.map((product, i) => (
            <Reveal as="li" key={product.id} index={i % columns} rise={16}>
              <ProductCard product={product} showNotes={showNotes} widePhoto={columns === 3} showHighlight={false} />
            </Reveal>
          ))}
        </ul>

        {matches.length > shown.length && (
          <p className="mt-7 text-center">
            <Link href={viewAllHref} className="btn btn-outline">
              {viewAllLabel}
              <ArrowRight className="arrow-nudge h-4 w-4" aria-hidden="true" />
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

export function MatesShelf() {
  return (
    <Shelf
      id="mostrador"
      eyebrow="Mates y bombillas"
      title="Mates de calabaza y de madera"
      body="Calabaza forrada en cuero con virola de alpaca, acero o aluminio; caldén y algarrobo. Cada ficha explica cómo curarlo."
      categories={['mates', 'bombillas']}
      filters={MATE_FILTERS}
      limit={8}
      columns={4}
      viewAllHref="/catalogo?rubro=mates"
      viewAllLabel="Ver todos los mates"
    />
  );
}

export function FragranceShelf() {
  return (
    <Shelf
      id="perfumeria"
      eyebrow="Perfumería"
      title="Fragancias nacionales de toda la vida"
      body="Perfumes y desodorantes de las marcas que ya conocés, con sus notas de salida, corazón y fondo para elegir sin oler."
      categories={['perfumes', 'desodorantes', 'combos']}
      filters={FRAGRANCE_FILTERS}
      limit={9}
      columns={3}
      showNotes
      viewAllHref="/catalogo?rubro=perfumes"
      viewAllLabel="Ver toda la perfumería"
    />
  );
}
