'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, MessageCircle, Menu, X, Bookmark, Package, UserRound } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { CartDrawer } from './CartDrawer';
import { AnnouncementBar } from './MarqueeTicker';
import { ProductImage } from './ProductImage';
import { BrandMark } from './BrandMark';
import { formatPrice, normalizeText, productPath, whatsappUrl } from '@/lib/storeConfig';
import { CATEGORIES } from '@/lib/categories';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  ...CATEGORIES.map((c) => ({ href: `/catalogo?rubro=${c.id}`, label: c.label })),
  { href: '/catalogo', label: 'Todo el catálogo' },
  { href: '/#el-local', label: 'El local' },
];

const ACCOUNT_LINKS = [
  { href: '/mis-pedidos', label: 'Mis pedidos', short: 'Pedidos', icon: Package },
  { href: '/guardados', label: 'Guardados', short: 'Guardados', icon: Bookmark },
  { href: '/perfil', label: 'Mi perfil', short: 'Perfil', icon: UserRound },
] as const;

const SEARCH_PLACEHOLDER = 'Buscar un mate, un perfume, una marca…';

export function Navbar() {
  const router = useRouter();
  const { cartCount, products, isHydrated, savedIds } = useStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [panel, setPanel] = useState<'menu' | 'search' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const panelId = useId();

  const savedCount = isHydrated ? savedIds.length : 0;
  const count = isHydrated ? cartCount : 0;

  // El header gana sombra cuando la página ya se desplazó (un centinela en lugar de escuchar el scroll).
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setIsScrolled(!entry.isIntersecting));
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  // En celular, al abrir la búsqueda el cursor va directo al campo (lo pidió la persona con un toque).
  useEffect(() => {
    if (panel === 'search') mobileInputRef.current?.focus();
  }, [panel]);

  const allMatches = useMemo(() => {
    const q = normalizeText(searchQuery);
    if (q.length < 2) return [];
    return products.filter(
      (p) =>
        p.active &&
        (normalizeText(p.name).includes(q) || normalizeText(p.brand).includes(q) || normalizeText(p.category).includes(q))
    );
  }, [products, searchQuery]);
  const searchResults = allMatches.slice(0, 6);
  const showResults = isSearchOpen && searchQuery.trim().length > 1;

  const goToCatalog = (query: string) => {
    const q = query.trim();
    if (!q) return;
    setIsSearchOpen(false);
    setPanel(null);
    router.push(`/catalogo?q=${encodeURIComponent(q)}`);
  };

  const onSearchKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      inputRef.current?.focus();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const links = Array.from(searchRef.current?.querySelectorAll<HTMLAnchorElement>('[data-search-result]') ?? []);
    if (!links.length) return;
    e.preventDefault();
    const current = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = current === -1 ? (e.key === 'ArrowDown' ? 0 : -1) : current + (e.key === 'ArrowDown' ? 1 : -1);
    links[(next + links.length) % links.length].focus();
  };

  const results = (onPick: () => void) => (
    <>
      {searchResults.length === 0 ? (
        <p className="p-4 text-sm text-[var(--ink-muted)]">No hay productos con “{searchQuery.trim()}”.</p>
      ) : (
        <ul className="max-h-80 divide-y divide-[var(--bg-sunken)] overflow-y-auto overscroll-contain">
          {searchResults.map((product) => (
            <li key={product.id}>
              <Link
                href={productPath(product)}
                data-search-result
                onClick={onPick}
                className="flex items-center gap-3 p-3 text-sm transition-colors hover:bg-[var(--bg-subtle)] focus-visible:bg-[var(--bg-subtle)]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[var(--bg-sunken)]">
                  <ProductImage src={product.images[0]} alt="" width={48} height={48} className="photo-on-linen h-full w-full object-contain p-1" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-[var(--ink-primary)]">{product.name}</span>
                  <span translate="no" className="block text-xs text-[var(--ink-muted)]">
                    {product.brand}
                  </span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-[var(--ink-primary)]">{formatPrice(product.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {allMatches.length > 0 && (
        <div className="border-t border-[var(--amancay-border)] bg-[var(--bg-subtle)] p-2.5 text-center">
          <Link
            href={`/catalogo?q=${encodeURIComponent(searchQuery.trim())}`}
            data-search-result
            onClick={onPick}
            className="inline-flex min-h-9 items-center text-sm font-semibold text-[var(--ink-accent)] hover:text-[var(--ink-accent-hover)]"
          >
            Ver los {allMatches.length} resultados en el catálogo
          </Link>
        </div>
      )}
    </>
  );

  return (
    <>
      <AnnouncementBar />
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      <header
        className={`sticky top-0 z-40 -mt-px w-full border-b bg-[var(--bg-page)]/95 font-sans backdrop-blur-md transition-[box-shadow,border-color] duration-300 ${
          isScrolled ? 'border-transparent shadow-[var(--shadow-header)]' : 'border-[var(--amancay-border)]'
        }`}
      >
        <nav aria-label="Principal" className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
          <div className="flex h-16 items-center justify-between gap-3 sm:h-[72px] sm:gap-6">
            <BrandMark />

            {/* Buscador de escritorio, con resultados navegables con flechas */}
            <div ref={searchRef} className="relative mx-2 hidden max-w-xl flex-1 md:block" onKeyDown={onSearchKeyDown}>
              <form
                role="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  goToCatalog(searchQuery);
                }}
              >
                <label htmlFor="navbar-search" className="sr-only">
                  Buscar productos
                </label>
                <input
                  ref={inputRef}
                  id="navbar-search"
                  name="q"
                  type="search"
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  onBlur={(e) => {
                    if (!searchRef.current?.contains(e.relatedTarget as Node)) setIsSearchOpen(false);
                  }}
                  aria-describedby={showResults ? listId : undefined}
                  placeholder={SEARCH_PLACEHOLDER}
                  className="h-11 w-full rounded-btn border border-transparent bg-white py-2 pl-11 pr-4 text-[15px] text-[var(--ink-primary)] shadow-[var(--shadow-rest)] placeholder-[#7a6d67] transition-[border-color,box-shadow] duration-150 hover:border-[var(--amancay-border)] focus:border-[var(--brand-espresso)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-espresso)]"
                />
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" aria-hidden="true" />
              </form>
              <p className="sr-only" aria-live="polite">
                {showResults ? `${allMatches.length} resultados` : ''}
              </p>
              {showResults && (
                <div
                  id={listId}
                  className="animate-fade-in-up absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-[var(--amancay-border)] bg-white shadow-[var(--shadow-lift)]"
                  onBlur={(e) => {
                    if (!searchRef.current?.contains(e.relatedTarget as Node)) setIsSearchOpen(false);
                  }}
                >
                  {results(() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  })}
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              {/* Accesos de la persona: pedidos, guardados y perfil (escritorio; en celular van en la barra inferior). */}
              <ul className="mr-1 hidden items-center lg:flex">
                {ACCOUNT_LINKS.map(({ href, short, label, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="tap-interactive group relative flex min-h-11 min-w-[4.25rem] flex-col items-center justify-center gap-0.5 rounded-md px-2 text-[12px] font-semibold text-[var(--ink-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink-primary)]"
                    >
                      <span className="relative">
                        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                        {href === '/guardados' && savedCount > 0 && (
                          <span
                            key={savedCount}
                            aria-hidden="true"
                            className="count-bump absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ink-gold)] px-1 text-[10px] font-bold leading-none text-white"
                          >
                            {savedCount}
                          </span>
                        )}
                      </span>
                      <span aria-hidden="true">{short}</span>
                      <span className="sr-only">
                        {label}
                        {href === '/guardados' && savedCount > 0 ? `, ${savedCount}` : ''}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setPanel((p) => (p === 'search' ? null : 'search'))}
                aria-expanded={panel === 'search'}
                aria-controls={panelId}
                className="tap-interactive flex h-11 w-11 items-center justify-center rounded-md text-[var(--ink-primary)] hover:bg-[var(--bg-sunken)] md:hidden"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{panel === 'search' ? 'Cerrar búsqueda' : 'Buscar productos'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                aria-haspopup="dialog"
                className="btn btn-gold shrink-0 px-3 sm:px-4"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                <span aria-hidden="true" className="hidden sm:inline">
                  Carrito
                </span>
                <span className="sr-only">{`Carrito, ${count} ${count === 1 ? 'producto' : 'productos'}`}</span>
                {count > 0 && (
                  <span
                    key={count}
                    aria-hidden="true"
                    className="count-bump min-w-5 rounded-full bg-[var(--ink-primary)] px-1.5 py-0.5 text-center text-xs font-bold tabular-nums text-white"
                  >
                    {count}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPanel((p) => (p === 'menu' ? null : 'menu'))}
                aria-expanded={panel === 'menu'}
                aria-controls={panelId}
                className="tap-interactive flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[var(--ink-primary)] hover:bg-[var(--bg-sunken)] lg:hidden"
              >
                {panel === 'menu' ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
                <span className="sr-only">{panel === 'menu' ? 'Cerrar menú' : 'Abrir menú'}</span>
              </button>
            </div>
          </div>

          <ul className="hidden items-center gap-7 border-t border-[var(--amancay-border)] text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--ink-secondary)] lg:flex xl:gap-9">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="nav-underline flex h-11 items-center transition-colors hover:text-[var(--ink-primary)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {panel && (
          <div
            id={panelId}
            className="animate-fade-in-up max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-[var(--amancay-border)] bg-[var(--bg-page)] px-5 pb-6 pt-4 shadow-lg lg:hidden"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setPanel(null);
            }}
          >
            <form
              role="search"
              className="relative md:hidden"
              onSubmit={(e) => {
                e.preventDefault();
                goToCatalog(searchQuery);
              }}
            >
              <label htmlFor="mobile-search" className="sr-only">
                Buscar productos
              </label>
              <input
                ref={mobileInputRef}
                id="mobile-search"
                name="q"
                type="search"
                autoComplete="off"
                enterKeyHint="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={SEARCH_PLACEHOLDER}
                className="field bg-white pl-10"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--ink-muted)]" aria-hidden="true" />
            </form>
            <p className="sr-only" aria-live="polite">
              {searchQuery.trim().length > 1 ? `${allMatches.length} resultados` : ''}
            </p>
            {searchQuery.trim().length > 1 && (
              <div className="mt-2 overflow-hidden rounded-lg border border-[var(--amancay-border)] bg-white md:hidden">
                {results(() => {
                  setPanel(null);
                  setSearchQuery('');
                })}
              </div>
            )}

            {panel === 'menu' && (
              <>
                <ul className="mt-3 flex flex-col">
                  {NAV_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setPanel(null)}
                        className="flex min-h-12 items-center border-b border-[var(--amancay-border)] px-1 font-display text-xl text-[var(--ink-primary)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <a
                  href={whatsappUrl('Hola Amancay, quiero hacer una consulta.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-lg btn-whatsapp-solid mt-5 w-full"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  <span>Consultar por WhatsApp</span>
                </a>
              </>
            )}
          </div>
        )}
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
