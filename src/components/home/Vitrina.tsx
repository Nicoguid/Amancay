'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { Plus, ArrowDown, ArrowRight } from 'lucide-react';
import type { Product, ProductCategory } from '@/lib/types';
import { useStore, priceRange } from '@/context/StoreContext';
import { ProductImage } from '@/components/ProductImage';
import { STORE, formatPrice, productPath } from '@/lib/storeConfig';

/*
 * La vidriera del inicio (hero del Figma "Inicio & Vidriera Interactiva").
 * El Figma usa fotos de un local que no es el real; acá cada estante muestra productos
 * del catálogo con su precio, y los puntos "+" abren el dato de cada uno.
 */

type Side = 'mates' | 'perfumeria';
type Selection = 'ambas' | Side;

const SIDES: Record<
  Side,
  { eyebrow: string; title: string; body: string; cta: string; href: string; categories: ProductCategory[]; noun: [string, string] }
> = {
  mates: {
    eyebrow: 'Mates y bombillas',
    title: 'Calabaza, madera y alpaca',
    body: 'Imperiales, camioneros, torpedos y poritos; mates de caldén y algarrobo; bombillas pico de loro, chatas y de cuchara.',
    cta: 'Ver mates y bombillas',
    href: '/catalogo?rubro=mates',
    categories: ['mates', 'bombillas'],
    noun: ['modelo en stock', 'modelos en stock'],
  },
  perfumeria: {
    eyebrow: 'Perfumería',
    title: 'Fragancias y regalos resueltos',
    body: 'Kevin, Bross London, CaroCuore, Valeria Mazza, Colbert, Ciel y Cannon. Perfumes, desodorantes y combos en caja.',
    cta: 'Ver perfumería',
    href: '/catalogo?rubro=perfumes',
    categories: ['perfumes', 'desodorantes', 'combos'],
    noun: ['producto en stock', 'productos en stock'],
  },
};

/** `short` es lo que se lee en celular, para que los tres botones entren en una fila. */
const SELECTOR: { id: Selection; label: string; short: string }[] = [
  { id: 'ambas', label: 'Ambas vidrieras', short: 'Ambas' },
  { id: 'mates', label: 'Mates y bombillas', short: 'Mates' },
  { id: 'perfumeria', label: 'Perfumería', short: 'Perfumería' },
];

/** Elige qué va en el estante: primero lo destacado, y que se vean rubros distintos. */
function pickShelf(products: Product[], categories: ProductCategory[], count: number): Product[] {
  const pool = products
    .filter((p) => p.active && p.stock > 0 && categories.includes(p.category) && p.images[0])
    .sort((a, b) => Number(!!b.isBestSeller) - Number(!!a.isBestSeller));
  const byCategory = categories.map((c) => pool.filter((p) => p.category === c));
  const picked: Product[] = [];
  // Ronda por rubro: mate, bombilla, mate… / perfume, desodorante, combo…
  for (let round = 0; picked.length < count && round < pool.length; round++) {
    for (const list of byCategory) {
      if (list[round] && picked.length < count) picked.push(list[round]);
    }
  }
  return picked;
}

export function Vitrina() {
  const { products } = useStore();
  const [selection, setSelection] = useState<Selection>('ambas');
  const [openId, setOpenId] = useState<string | null>(null);

  // El dato abierto se cierra con Escape o al tocar fuera de la vidriera.
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    const onPointer = (e: PointerEvent) => {
      if (!(e.target as Element).closest('[data-hotspot]')) setOpenId(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [openId]);

  const visible: Side[] = selection === 'ambas' ? ['mates', 'perfumeria'] : [selection];
  const single = visible.length === 1;

  return (
    <section aria-labelledby="hero-title" className="focus-on-dark bg-[var(--brand-espresso)] text-[#fdf9f0]">
      <div className="mx-auto max-w-[1320px] px-4 pb-8 pt-9 sm:px-8 sm:pb-10 sm:pt-12 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1
            id="hero-title"
            className="enter font-display text-[34px] leading-[1.12] tracking-[-0.02em] sm:text-[44px] lg:text-[52px]"
            style={{ '--i': 0, '--rise': '16px' } as CSSProperties}
          >
            Mates criollos y perfumería de siempre, en un mismo mostrador de Almagro.
          </h1>
          <p
            className="enter mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#e6e2d9] sm:text-[17px]"
            style={{ '--i': 1 } as CSSProperties}
          >
            Precio y stock a la vista. Comprá online y retirá sin costo en {STORE.address}, a metros del subte B.
          </p>

          <div className="enter mt-6 flex justify-center" style={{ '--i': 2, '--rise': '10px' } as CSSProperties}>
            <div role="group" aria-label="Qué vidriera mirar" className="inline-flex justify-center gap-1 rounded-md bg-white/12 p-1 backdrop-blur-md">
              {SELECTOR.map((option) => {
                const active = selection === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setSelection(option.id);
                      setOpenId(null);
                    }}
                    className={`tap-interactive min-h-11 rounded-[3px] px-3.5 text-[13px] font-bold uppercase tracking-[0.05em] sm:px-4 ${
                      active ? 'bg-[var(--brand-gold)] text-[var(--ink-on-gold)] shadow-sm' : 'text-[#e6e2d9] hover:bg-white/10'
                    }`}
                  >
                    <span aria-hidden="true" className="sm:hidden">
                      {option.short}
                    </span>
                    <span className="sr-only sm:not-sr-only">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className={`mt-7 grid grid-cols-1 gap-2 rounded-xl bg-[#170b06] p-2 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)] sm:mt-9 ${
            single ? '' : 'lg:grid-cols-2'
          }`}
        >
          {visible.map((side, sideIndex) => (
            <VitrinaPanel
              // La clave cambia con la selección: el panel que entra hace su animación.
              key={`${side}-${selection}`}
              side={side}
              products={products}
              wide={single}
              order={sideIndex}
              animateIn={selection !== 'ambas'}
              openId={openId}
              setOpenId={setOpenId}
            />
          ))}
        </div>

        <p className="enter mt-6 text-center" style={{ '--i': 7, '--rise': '8px' } as CSSProperties}>
          <a
            href="#mostrador"
            className="inline-flex min-h-11 items-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em] text-[#e6e2d9] hover:text-white"
          >
            Explorar todo el mostrador
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </a>
        </p>
      </div>
    </section>
  );
}

function VitrinaPanel({
  side,
  products,
  wide,
  order,
  animateIn,
  openId,
  setOpenId,
}: {
  side: Side;
  products: Product[];
  wide: boolean;
  order: number;
  animateIn: boolean;
  openId: string | null;
  setOpenId: (id: string | null) => void;
}) {
  const info = SIDES[side];
  const shelf = pickShelf(products, info.categories, wide ? 5 : 3);
  const inStock = products.filter((p) => p.active && p.stock > 0 && info.categories.includes(p.category)).length;

  return (
    <div
      className={`overflow-hidden rounded-lg bg-[var(--brand-espresso)] ${animateIn ? 'swap-in' : 'enter'}`}
      style={{ '--i': 3 + order, '--rise': '18px' } as CSSProperties}
    >
      {/* Interior iluminado de la vidriera, con el estante. */}
      <div className="vitrina-glass relative px-3 pt-8 sm:px-6 sm:pt-10">
        <ul className={`flex items-end justify-around gap-2 ${wide ? 'sm:gap-4' : ''}`}>
          {shelf.map((product, i) => {
            const open = openId === `${side}-${product.id}`;
            const { min, max } = priceRange(product);
            // En celular el estante ancho muestra 3 productos; el resto aparece desde tablet.
            const hiddenOnMobile = wide && i >= 3;
            return (
              <li key={product.id} className={`relative min-w-0 flex-1 ${hiddenOnMobile ? 'hidden md:block' : ''}`}>
                {/* Solo la foto se anima: el punto "+" queda por encima de la capa que tiñe la vidriera. */}
                <div
                  className={`shelf-enter mx-auto aspect-[4/5] w-full ${wide ? 'max-w-[190px]' : 'max-w-[170px]'}`}
                  style={{ '--i': 4 + i + order * 2 } as CSSProperties}
                >
                  <ProductImage
                    src={product.images[0]}
                    alt=""
                    width={220}
                    height={275}
                    priority={i < 3 && order === 0}
                    className="h-full w-full object-contain object-bottom"
                  />
                </div>

                <div data-hotspot className="absolute left-1/2 top-[8%] z-20 -translate-x-1/2">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : `${side}-${product.id}`)}
                    className="tap-interactive relative flex h-11 w-11 items-center justify-center"
                  >
                    <span aria-hidden="true" className="hotspot-ping absolute h-8 w-8 rounded-full bg-[var(--ink-gold-on-dark)]" style={{ '--i': i + order * 3 } as CSSProperties} />
                    <span
                      className={`relative flex h-8 w-8 items-center justify-center rounded-full shadow-[0_6px_14px_-4px_rgba(29,15,9,0.5)] transition-[background-color,transform] duration-200 ease-[var(--ease-out)] ${
                        open ? 'rotate-45 bg-[var(--ink-primary)] text-white' : 'bg-[var(--brand-gold)] text-[var(--ink-on-gold)]'
                      }`}
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                    </span>
                    <span className="sr-only">{open ? `Cerrar el dato de ${product.name}` : `Ver ${product.name}`}</span>
                  </button>

                  {open && (
                    <div
                      className={`pop-in absolute top-full z-20 mt-1 w-56 rounded-lg bg-white p-3.5 text-left text-[var(--ink-primary)] shadow-[var(--shadow-lift)] ${
                        i === 0 ? 'left-0' : i === shelf.length - 1 || (wide && i === 2) ? 'right-0' : 'left-1/2 -translate-x-1/2'
                      }`}
                    >
                      <p translate="no" className="eyebrow">
                        {product.brand}
                      </p>
                      <p className="mt-1 font-display text-[17px] leading-snug">{product.name}</p>
                      <p className="mt-1.5 text-base font-bold tabular-nums">
                        {min !== max && <span className="text-sm font-medium text-[var(--ink-muted)]">Desde </span>}
                        {formatPrice(min)}
                      </p>
                      <Link href={productPath(product)} className="btn btn-primary mt-3 w-full text-sm">
                        Ver producto
                        <ArrowRight className="arrow-nudge h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <div aria-hidden="true" className="vitrina-tint pointer-events-none absolute inset-0 z-10" />
        <div aria-hidden="true" className="vitrina-shelf relative z-[11] -mx-3 h-3.5 sm:-mx-6" />
      </div>

      <div className={`space-y-2 px-5 pb-6 pt-5 sm:px-7 ${wide ? 'lg:flex lg:items-end lg:justify-between lg:gap-10 lg:space-y-0' : ''}`}>
        <div className="space-y-1.5">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--ink-gold-on-dark)]">{info.eyebrow}</p>
          <h2 className="font-display text-[26px] leading-tight text-[#fdf9f0] sm:text-[30px]">{info.title}</h2>
          <p className="max-w-lg text-[15px] leading-relaxed text-[#e6e2d9]">{info.body}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
          <Link href={info.href} className={`btn ${side === 'mates' ? 'btn-gold' : 'btn-on-dark'}`}>
            {info.cta}
            <ArrowRight className="arrow-nudge h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="text-[13px] font-semibold tabular-nums text-[#fdf9f0]/75">
            {inStock} {inStock === 1 ? info.noun[0] : info.noun[1]}
          </p>
        </div>
      </div>
    </div>
  );
}
