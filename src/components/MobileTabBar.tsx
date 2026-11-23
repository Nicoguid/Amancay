'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Bookmark, Package, UserRound } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

const TABS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/catalogo', label: 'Catálogo', icon: LayoutGrid },
  { href: '/guardados', label: 'Guardados', icon: Bookmark },
  { href: '/mis-pedidos', label: 'Pedidos', icon: Package },
  { href: '/perfil', label: 'Perfil', icon: UserRound },
] as const;

/**
 * Navegación inferior para celular y tablet: las cinco secciones al alcance del pulgar.
 * El carrito queda arriba, en el header. No aparece en el panel del local ni en las pantallas de compra.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { savedIds, isHydrated } = useStore();
  // En las pantallas de compra (ficha, carrito, checkout) la barra cede el lugar al botón de comprar.
  if (['/admin', '/producto/', '/carrito', '/checkout'].some((prefix) => pathname.startsWith(prefix))) return null;
  const savedCount = isHydrated ? savedIds.length : 0;

  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--amancay-border)] bg-[var(--bg-page)]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_-14px_rgba(29,15,9,0.35)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`tap-interactive relative flex h-16 flex-col items-center justify-center gap-1 text-[12px] font-semibold ${
                  active ? 'text-[var(--ink-primary)]' : 'text-[var(--ink-muted)]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-0 h-0.5 w-8 rounded-full bg-[var(--brand-gold)] transition-transform duration-200 ease-[var(--ease-out)] ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
                <span className="relative">
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
                  {href === '/guardados' && savedCount > 0 && (
                    <span
                      key={savedCount}
                      aria-hidden="true"
                      className="count-bump absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ink-gold)] px-1 text-[11px] font-bold leading-none text-white"
                    >
                      {savedCount}
                    </span>
                  )}
                </span>
                <span>
                  {label}
                  {href === '/guardados' && savedCount > 0 && <span className="sr-only">, {savedCount}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
