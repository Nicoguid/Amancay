'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Store, MessageCircle, SlidersHorizontal } from 'lucide-react';
import { useStore, priceRange, useCategories } from '@/context/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import { Reveal } from '@/components/Reveal';
import { STORE, normalizeText, whatsappUrl } from '@/lib/storeConfig';


const SORTS = [
  { id: 'destacados', name: 'Destacados' },
  { id: 'menor-precio', name: 'Menor precio' },
  { id: 'mayor-precio', name: 'Mayor precio' },
  { id: 'nombre', name: 'Nombre (A–Z)' },
] as const;
type SortId = (typeof SORTS)[number]['id'];


/**
 * Los filtros viven en la URL (?rubro=&marca=&q=&orden=&stock=1):
 * se pueden compartir, el botón Atrás funciona y los links del menú filtran aunque ya estés acá.
 */
export function CatalogContent() {
  const RUBROS = useCategories();
  const CATEGORIES = [{ id: 'all', name: 'Todo' }, ...RUBROS.map((c) => ({ id: c.id, name: c.label }))];
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
  // En celular, marca y stock quedan plegados para que los productos se vean antes.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const extraFilters = Number(brand !== 'all') + Number(onlyInStock);
  const resetFilters = () => {
    if (debounce.current) clearTimeout(debounce.current);
    setDraft('');
    router.replace(pathname, { scroll: false });
  };
  const title = CATEGORIES.find((c) => c.id === category && c.id !== 'all')?.name ?? 'Catálogo de Amancay';

  return (
    <div className="min-h-screen bg-[var(--bg-page)] pb-16 text-[var(--ink-primary)]">
      <header className="border-b border-[var(--amancay-border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-[1320px] px-4 pb-5 pt-8 sm:px-8 sm:pt-12 lg:px-12">
          <p className="enter eyebrow eyebrow-rule" style={{ '--i': 0, '--rise': '8px' } as CSSProperties}>
            {category === 'all' ? 'Todo el mostrador' : 'Catálogo'}
          </p>
          <h1 className="enter mt-2 font-display text-[36px] leading-[1.1] tracking-[-0.02em] sm:text-[48px]" style={{ '--i': 1 } as CSSProperties}>
            {title}
          </h1>
          <p className="enter mt-3 flex max-w-2xl items-start gap-2 text-base leading-relaxed text-[var(--ink-muted)] sm:text-[17px]" style={{ '--i': 2 } as CSSProperties}>
            <Store className="mt-1 h-4 w-4 shrink-0 text-[var(--ink-gold)]" aria-hidden="true" />
            <span>Precio y stock a la vista. Retiro sin costo en {STORE.address} o envío a todo el país.</span>
          </p>

          <nav aria-label="Rubros" className="enter no-scrollbar -mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0" style={{ '--i': 3, '--rise': '10px' } as CSSProperties}>
            <ul className="flex gap-2">
              {CATEGORIES.map((cat) => {
                const count = cat.id === 'all' ? activeProducts.length : activeProducts.filter((p) => p.category === cat.id).length;
                return (
                  <li key={cat.id}>
                    <button type="button" onClick={() => setParam('rubro', cat.id)} aria-pressed={category === cat.id} className="chip chip-on-tint">
                      {cat.name}
                      <span className="tabular-nums opacity-70">({count})</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-8 sm:pt-8 lg:px-12">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4 lg:gap-8">
          <aside aria-label="Filtros" className="space-y-5 lg:sticky lg:top-36 lg:col-span-1">
            <div className="card-rest space-y-4 rounded-lg bg-white p-4 sm:p-5">
              <h2 className="hidden font-display text-xl lg:block">Filtrar</h2>
              <div className="flex gap-2 lg:block">
                <div className="min-w-0 flex-1">
                  <label htmlFor="catalog-search" className="mb-1.5 hidden text-sm font-semibold lg:block">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" aria-hidden="true" />
                    <input
                      id="catalog-search"
                      name="q"
                      type="search"
                      autoComplete="off"
                      aria-label="Buscar en el catálogo"
                      value={draft}
                      onFocus={() => setIsTyping(true)}
                      onBlur={() => setIsTyping(false)}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        writeQuery(e.target.value);
                      }}
                      placeholder="Ej.: imperial, alpaca, Kevin…"
                      className="field pl-9 pr-10 text-[15px]"
                    />
                    {draft && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        aria-label="Borrar búsqueda"
                        className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFiltersOpen((open) => !open)}
                  aria-expanded={filtersOpen}
                  aria-controls="catalog-more-filters"
                  className="btn btn-quiet shrink-0 px-3.5 lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Filtros
                  {extraFilters > 0 && (
                    <span className="rounded-full bg-[var(--ink-primary)] px-1.5 text-xs font-bold tabular-nums text-white">{extraFilters}</span>
                  )}
                </button>
              </div>

              <div id="catalog-more-filters" className={`space-y-4 ${filtersOpen ? 'animate-fade-in-up block' : 'hidden'} lg:block`}>
                <div>
                  <label htmlFor="catalog-brand" className="mb-1.5 block text-sm font-semibold">
                    Marca
                  </label>
                  <select id="catalog-brand" name="marca" autoComplete="off" value={brand} onChange={(e) => setParam('marca', e.target.value)} className="field text-[15px]">
                    <option value="all">Todas las marcas</option>
                    {brands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-medium">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setParam('stock', e.target.checked ? '1' : null)}
                    className="h-5 w-5 accent-[var(--brand-espresso)]"
                  />
                  Solo con stock
                </label>

                {hasFilters && (
                  <button type="button" onClick={resetFilters} className="btn btn-quiet w-full text-[var(--amancay-wine)]">
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            <div className="hidden rounded-lg bg-[var(--bg-sunken)] p-5 lg:block">
              <p className="font-display text-lg">Te ayudamos a elegir</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-muted)]">
                Te mandamos fotos del modelo que tenemos en el local y te asesoramos por WhatsApp.
              </p>
              <a
                href={whatsappUrl('Hola Amancay, quiero que me asesoren con un producto.')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary mt-4 w-full"
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                Pedir fotos
                <span className="sr-only"> por WhatsApp (se abre en otra pestaña)</span>
              </a>
            </div>
          </aside>

          <section aria-labelledby="results-count" className="space-y-5 lg:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <p id="results-count" aria-live="polite" className="text-[15px] text-[var(--ink-muted)]">
                <strong className="tabular-nums text-[var(--ink-primary)]">{filteredProducts.length}</strong>{' '}
                {filteredProducts.length === 1 ? 'producto' : 'productos'}
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="catalog-sort" className="hidden text-sm font-semibold text-[var(--ink-muted)] sm:block">
                  Ordenar por
                </label>
                <select
                  id="catalog-sort"
                  name="orden"
                  autoComplete="off"
                  aria-label="Ordenar por"
                  value={sort}
                  onChange={(e) => setParam('orden', e.target.value === 'destacados' ? null : e.target.value)}
                  className="field w-auto bg-white py-2 text-[15px] font-semibold"
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
              <div className="swap-in space-y-3 rounded-lg bg-white p-10 text-center shadow-[var(--shadow-rest)] sm:p-12">
                <p className="font-display text-2xl">No hay productos con esos filtros</p>
                <p className="text-[var(--ink-muted)]">Probá con otra palabra o sacá algún filtro.</p>
                <button type="button" onClick={resetFilters} className="btn btn-primary mt-2">
                  Ver todo el catálogo
                </button>
              </div>
            ) : (
              // La clave cambia con rubro, marca y orden: la grilla nueva hace una entrada corta.
              <ul key={`${category}-${brand}-${sort}-${onlyInStock}`} className="swap-in grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {filteredProducts.map((product, i) => (
                  <Reveal as="li" key={product.id} index={i % 3} rise={16}>
                    <ProductCard product={product} headingLevel={2} />
                  </Reveal>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
