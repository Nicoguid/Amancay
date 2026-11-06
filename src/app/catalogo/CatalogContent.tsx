'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useStore, priceRange } from '@/context/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import { STORE, normalizeText } from '@/lib/storeConfig';

const CATEGORIES = [
  { id: 'all', name: 'Todo' },
  { id: 'mates', name: 'Mates' },
  { id: 'bombillas', name: 'Bombillas' },
  { id: 'perfumes', name: 'Perfumes' },
] as const;

const SORTS = [
  { id: 'destacados', name: 'Destacados' },
  { id: 'menor-precio', name: 'Menor precio' },
  { id: 'mayor-precio', name: 'Mayor precio' },
  { id: 'nombre', name: 'Nombre (A–Z)' },
] as const;
type SortId = (typeof SORTS)[number]['id'];

const fieldClass =
  'w-full rounded-md border border-[var(--amancay-border)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--ink-primary)] focus:border-[var(--ink-accent)]';

/**
 * Los filtros viven en la URL (?rubro=&marca=&q=&orden=&stock=1):
 * se pueden compartir, el botón Atrás funciona y los links del menú filtran aunque ya estés acá.
 */
export function CatalogContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { products } = useStore();

  const category = searchParams.get('rubro') ?? searchParams.get('categoria') ?? 'all';
  const brand = searchParams.get('marca') ?? 'all';
  const query = searchParams.get('q') ?? '';
  const sort = (SORTS.some((s) => s.id === searchParams.get('orden')) ? searchParams.get('orden') : 'destacados') as SortId;
  const onlyInStock = searchParams.get('stock') === '1';

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === '' || value === 'all') params.delete(key);
    else params.set(key, value);
    if (key === 'rubro') params.delete('categoria');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Texto del buscador: filtra mientras escribís; la URL se actualiza al dejar de tipear.
  const [draft, setDraft] = useState(query);
  const [isTyping, setIsTyping] = useState(false);
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    // La búsqueda cambió desde afuera (por ejemplo, desde el buscador del menú).
    setPrevQuery(query);
    if (!isTyping) setDraft(query);
  }
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current);
  }, []);
  const writeQuery = (value: string, delay = 400) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setParam('q', value.trim()), delay);
  };
  const clearSearch = () => {
    setDraft('');
    writeQuery('', 0);
  };
  const deferredDraft = useDeferredValue(draft);

  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);
  const brands = useMemo(() => Array.from(new Set(activeProducts.map((p) => p.brand))).filter(Boolean).sort(), [activeProducts]);

  const filteredProducts = useMemo(() => {
    const q = normalizeText(deferredDraft);
    const list = activeProducts.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (brand !== 'all' && p.brand !== brand) return false;
      if (onlyInStock && p.stock <= 0) return false;
      if (q) {
        const haystack = normalizeText(`${p.name} ${p.brand} ${p.description} ${p.category}`);
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === 'menor-precio') return priceRange(a).min - priceRange(b).min;
      if (sort === 'mayor-precio') return priceRange(b).min - priceRange(a).min;
      if (sort === 'nombre') return a.name.localeCompare(b.name, 'es');
      return Number(!!b.isBestSeller) - Number(!!a.isBestSeller);
    });
  }, [activeProducts, category, brand, onlyInStock, deferredDraft, sort]);

  const hasFilters = category !== 'all' || brand !== 'all' || draft !== '' || onlyInStock;
  const title = CATEGORIES.find((c) => c.id === category && c.id !== 'all')?.name ?? 'Catálogo';

  return (
    <div className="min-h-screen bg-[var(--bg-page)] py-8 text-[var(--ink-primary)] sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 space-y-2">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{title}</h1>
          <p className="text-[var(--ink-muted)]">Precio y stock actualizados. Retirá sin costo en {STORE.address} o pedí envío.</p>
        </header>

        <nav aria-label="Rubros" className="no-scrollbar -mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="flex gap-2">
            {CATEGORIES.map((cat) => {
              const count = cat.id === 'all' ? activeProducts.length : activeProducts.filter((p) => p.category === cat.id).length;
              const selected = category === cat.id;
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => setParam('rubro', cat.id)}
                    aria-pressed={selected}
                    className={`tap-interactive flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold ${
                      selected
                        ? 'bg-[var(--ink-primary)] text-white'
                        : 'border border-[var(--amancay-border)] bg-white text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    {cat.name}
                    <span className={`rounded-full px-1.5 text-xs tabular-nums ${selected ? 'bg-white/20' : 'bg-[var(--bg-subtle)]'}`}>
                      {count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
          <aside aria-label="Filtros" className="space-y-5 rounded-xl border border-[var(--amancay-border)] bg-white p-5 lg:col-span-1">
            <div>
              <label htmlFor="catalog-search" className="mb-1.5 block text-sm font-semibold">
                Buscar
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" aria-hidden="true" />
                <input
                  id="catalog-search"
                  type="search"
                  autoComplete="off"
                  value={draft}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    writeQuery(e.target.value);
                  }}
                  placeholder="Ej.: imperial, alpaca, Kevin…"
                  className={`${fieldClass} pl-9 pr-10`}
                />
                {draft && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Borrar búsqueda"
                    className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="catalog-brand" className="mb-1.5 block text-sm font-semibold">
                Marca
              </label>
              <select id="catalog-brand" value={brand} onChange={(e) => setParam('marca', e.target.value)} className={fieldClass}>
                <option value="all">Todas las marcas</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setParam('stock', e.target.checked ? '1' : null)}
                className="h-5 w-5 accent-[var(--ink-primary)]"
              />
              Solo con stock
            </label>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  if (debounce.current) clearTimeout(debounce.current);
                  setDraft('');
                  router.replace(pathname, { scroll: false });
                }}
                className="tap-interactive min-h-11 w-full rounded-full border border-[var(--amancay-border)] text-sm font-semibold text-[var(--amancay-wine)] hover:bg-[var(--bg-subtle)]"
              >
                Limpiar filtros
              </button>
            )}
          </aside>

          <section aria-labelledby="results-count" className="space-y-6 lg:col-span-3">
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--amancay-border)] bg-white p-3.5 sm:flex-row sm:items-center">
              <p id="results-count" aria-live="polite" className="text-sm text-[var(--ink-muted)]">
                <strong className="text-[var(--ink-primary)]">{filteredProducts.length}</strong>{' '}
                {filteredProducts.length === 1 ? 'producto' : 'productos'}
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="catalog-sort" className="text-sm font-semibold text-[var(--ink-muted)]">
                  Ordenar por
                </label>
                <select
                  id="catalog-sort"
                  value={sort}
                  onChange={(e) => setParam('orden', e.target.value === 'destacados' ? null : e.target.value)}
                  className="rounded-md border border-[var(--amancay-border)] bg-[var(--bg-page)] px-3 py-2 text-sm"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="space-y-3 rounded-xl border border-[var(--amancay-border)] bg-white p-12 text-center">
                <p className="font-display text-2xl">No hay productos con esos filtros</p>
                <p className="text-[var(--ink-muted)]">Probá con otra palabra o sacá algún filtro.</p>
                <button
                  type="button"
                  onClick={() => {
                    if (debounce.current) clearTimeout(debounce.current);
                    setDraft('');
                    router.replace(pathname, { scroll: false });
                  }}
                  className="tap-interactive mt-2 min-h-11 rounded-full bg-[var(--ink-primary)] px-6 font-semibold text-white hover:bg-[var(--ink-secondary)]"
                >
                  Ver todo el catálogo
                </button>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} headingLevel={2} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
