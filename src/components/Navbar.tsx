'use client';

import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, MessageCircle, Menu, X } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { CartDrawer } from './CartDrawer';
import { AnnouncementBar } from './MarqueeTicker';
import { ProductImage } from './ProductImage';
import { formatPrice, normalizeText, whatsappUrl } from '@/lib/storeConfig';

const NAV_LINKS = [
  { href: '/catalogo?rubro=mates', label: 'Mates' },
  { href: '/catalogo?rubro=bombillas', label: 'Bombillas' },
  { href: '/catalogo?rubro=perfumes', label: 'Perfumes' },
  { href: '/catalogo', label: 'Ver todo' },
];

export function Navbar() {
  const router = useRouter();
  const { cartCount, products, isHydrated } = useStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const mobileMenuId = useId();

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
    setIsMobileMenuOpen(false);
    router.push(`/catalogo?q=${encodeURIComponent(q)}`);
  };

  const focusResult = (index: number) => {
    const links = searchRef.current?.querySelectorAll<HTMLAnchorElement>('[data-search-result]');
    if (!links || links.length === 0) return;
    const i = (index + links.length) % links.length;
    links[i].focus();
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
    if (current === -1) focusResult(e.key === 'ArrowDown' ? 0 : -1);
    else focusResult(current + (e.key === 'ArrowDown' ? 1 : -1));
  };

  return (
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-40 w-full border-b border-[var(--amancay-border)] bg-white font-sans shadow-xs">
        <nav aria-label="Principal" className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-2 sm:h-20 sm:gap-4">
            <Link href="/" className="group flex shrink-0 flex-col py-2">
              <span className="font-display text-2xl leading-none tracking-tight text-[var(--ink-primary)] transition-colors group-hover:text-[var(--ink-accent)] sm:text-3xl">
                Amancay
              </span>
              <span className="mt-1 hidden text-xs font-medium text-[var(--ink-muted)] sm:block">
                Perfumería · Almagro
              </span>
            </Link>

            <ul className="hidden items-center gap-5 text-sm font-semibold text-[var(--ink-primary)] lg:flex">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="py-1 underline-offset-4 transition-colors hover:text-[var(--ink-accent)] hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
              {/* Buscador con resultados navegables con flechas */}
              <div ref={searchRef} className="relative hidden w-44 md:block xl:w-64" onKeyDown={onSearchKeyDown}>
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
                    placeholder="Buscar productos…"
                    className="w-full rounded-full border border-[var(--amancay-border)] bg-[var(--bg-page)] py-2 pl-9 pr-3 text-sm text-[var(--ink-primary)] placeholder-[var(--ink-muted)] transition-colors focus:border-[var(--ink-accent)] focus:bg-white"
                  />
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" aria-hidden="true" />
                </form>
                <p className="sr-only" aria-live="polite">
                  {showResults ? `${allMatches.length} resultados` : ''}
                </p>
                {showResults && (
                  <div
                    id={listId}
                    className="animate-fade-in-up absolute left-0 right-0 top-full z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-lg border border-[var(--amancay-border)] bg-white shadow-xl xl:w-full"
                    onBlur={(e) => {
                      if (!searchRef.current?.contains(e.relatedTarget as Node)) setIsSearchOpen(false);
                    }}
                  >
                    {searchResults.length === 0 ? (
                      <p className="p-4 text-sm text-[var(--ink-muted)]">No hay productos con “{searchQuery.trim()}”.</p>
                    ) : (
                      <ul className="max-h-80 divide-y divide-[var(--bg-subtle)] overflow-y-auto">
                        {searchResults.map((product) => (
                          <li key={product.id}>
                            <Link
                              href={`/producto/${product.id}`}
                              data-search-result
                              onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-3 p-3 text-sm hover:bg-[var(--bg-page)] focus-visible:bg-[var(--bg-page)]"
                            >
                              <ProductImage
                                src={product.images[0]}
                                alt=""
                                width={48}
                                height={48}
                                className="h-12 w-12 shrink-0 rounded-md border border-[var(--amancay-border)] bg-[var(--bg-subtle)] object-cover"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-semibold text-[var(--ink-primary)]">{product.name}</span>
                                <span className="block text-xs text-[var(--ink-muted)]">{product.brand}</span>
                              </span>
                              <span className="shrink-0 font-semibold tabular-nums text-[var(--ink-primary)]">
                                {formatPrice(product.price)}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    {allMatches.length > 0 && (
                      <div className="border-t border-[var(--amancay-border)] bg-[var(--bg-page)] p-2.5 text-center">
                        <Link
                          href={`/catalogo?q=${encodeURIComponent(searchQuery.trim())}`}
                          data-search-result
                          onClick={() => setIsSearchOpen(false)}
                          className="text-sm font-semibold text-[var(--ink-accent)] hover:text-[var(--ink-accent-hover)]"
                        >
                          Ver los {allMatches.length} resultados en el catálogo
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <a
                href={whatsappUrl('Hola Amancay, quiero hacer una consulta.')}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-interactive hidden h-11 shrink-0 items-center gap-1.5 rounded-full border border-[var(--amancay-border)] bg-[var(--bg-page)] px-3 text-sm font-semibold text-[var(--whatsapp-action)] transition-colors hover:bg-[var(--bg-subtle)] sm:flex"
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="hidden xl:inline">WhatsApp</span>
                <span className="sr-only xl:hidden">Consultar por WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                aria-haspopup="dialog"
                className="tap-interactive flex h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--ink-primary)] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[var(--ink-secondary)]"
              >
                <ShoppingBag className="h-4 w-4 text-[var(--amancay-gold-light)]" aria-hidden="true" />
                <span aria-hidden="true">Carrito</span>
                <span className="sr-only">
                  {`Carrito, ${isHydrated ? cartCount : 0} ${cartCount === 1 && isHydrated ? 'producto' : 'productos'}`}
                </span>
                {isHydrated && cartCount > 0 && (
                  <span aria-hidden="true" className="rounded-full bg-[var(--amancay-gold-light)] px-2 py-0.5 text-xs font-bold tabular-nums text-[var(--ink-primary)]">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                aria-expanded={isMobileMenuOpen}
                aria-controls={mobileMenuId}
                className="tap-interactive flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[var(--amancay-border)] text-[var(--ink-primary)] hover:bg-[var(--bg-page)] lg:hidden"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
                <span className="sr-only">{isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
              </button>
            </div>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div
            id={mobileMenuId}
            className="animate-fade-in-up max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-[var(--amancay-border)] bg-white px-5 pb-6 pt-4 shadow-lg lg:hidden"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsMobileMenuOpen(false);
            }}
          >
            <form
              role="search"
              className="relative"
              onSubmit={(e) => {
                e.preventDefault();
                goToCatalog(searchQuery);
              }}
            >
              <label htmlFor="mobile-search" className="sr-only">
                Buscar productos
              </label>
              <input
                id="mobile-search"
                type="search"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar mates, bombillas o perfumes…"
                className="w-full rounded-md border border-[var(--amancay-border)] bg-[var(--bg-page)] py-3 pl-10 pr-4 text-base text-[var(--ink-primary)] placeholder-[var(--ink-muted)]"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--ink-muted)]" aria-hidden="true" />
            </form>

            <ul className="mt-4 flex flex-col gap-1 text-base font-semibold text-[var(--ink-primary)]">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex min-h-11 items-center rounded-md px-3 hover:bg-[var(--bg-page)] hover:text-[var(--ink-accent)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-col gap-2 border-t border-[var(--amancay-border)] pt-4">
              <a
                href={whatsappUrl('Hola Amancay, quiero hacer una consulta.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-[var(--whatsapp-action)] text-base font-semibold text-white hover:bg-[var(--whatsapp-action-hover)]"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                <span>Consultar por WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
