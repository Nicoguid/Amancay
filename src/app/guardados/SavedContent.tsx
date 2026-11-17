'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { Bookmark, MessageCircle, Share2, ShoppingBag, Store, Images } from 'lucide-react';
import { useStore, priceRange } from '@/context/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import { Reveal } from '@/components/Reveal';
import { STORE, formatPrice, whatsappUrl } from '@/lib/storeConfig';
import { CATEGORIES } from '@/lib/categories';

/* Guardados (Figma: "Guardados"). Sin cuenta: la lista vive en este navegador. */
export function SavedContent() {
  const { saved, isHydrated, addToCart, clearSaved } = useStore();
  const [notice, setNotice] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const estimated = saved.reduce((sum, product) => sum + priceRange(product).min, 0);

  const addAll = () => {
    let added = 0;
    let missing = 0;
    for (const product of saved) {
      const variant = product.variants?.find((v) => v.stock > 0) ?? product.variants?.[0];
      if (addToCart(product, 1, variant) > 0) added++;
      else missing++;
    }
    setNotice(
      added === 0
        ? 'No se agregó nada: ya están en el carrito o no tienen stock.'
        : `${added === 1 ? 'Agregamos 1 producto' : `Agregamos ${added} productos`} al carrito${missing ? `. ${missing} no ${missing === 1 ? 'tenía' : 'tenían'} más stock.` : '.'}`
    );
  };

  const shareMessage = [
    'Hola Amancay, guardé estos productos y quería consultar:',
    '',
    ...saved.map((product, i) => `${i + 1}. ${product.name} (${formatPrice(priceRange(product).min)})`),
  ].join('\n');

  return (
    <div className="min-h-[70vh] bg-[var(--bg-page)] pb-16 pt-6 text-[var(--ink-primary)] sm:pt-10">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
        <header className="enter card-rest rounded-lg bg-white p-6 sm:p-8" style={{ '--i': 0 } as CSSProperties}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="tag tag-quiet">
                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                En este navegador, sin cuenta
              </p>
              <h1 className="mt-3 font-display text-[32px] leading-tight tracking-[-0.02em] sm:text-[40px]">
                Tus guardados{' '}
                {isHydrated && saved.length > 0 && (
                  <span className="font-sans text-lg font-semibold text-[var(--ink-gold)]">
                    ({saved.length} {saved.length === 1 ? 'producto' : 'productos'})
                  </span>
                )}
              </h1>
              <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
                Guardá lo que querés mirar con tiempo o comprar para una fecha. Tocá el marcador de cualquier producto para sumarlo.
              </p>
            </div>
            {isHydrated && saved.length > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                <a href={whatsappUrl(shareMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-quiet sm:whitespace-nowrap">
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  Consultar la lista por WhatsApp
                  <span className="sr-only"> (se abre en otra pestaña)</span>
                </a>
                <button type="button" onClick={addAll} className="btn btn-primary sm:whitespace-nowrap">
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  Pasar todo al carrito
                </button>
              </div>
            )}
          </div>

          {isHydrated && saved.length > 0 && (
            <dl className="mt-6 grid grid-cols-1 gap-3 rounded-btn bg-[var(--bg-subtle)] p-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <span className="icon-tile h-10 w-10">
                  <Store className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <dt className="text-[13px] font-semibold text-[var(--ink-muted)]">Retiro sin costo</dt>
                  <dd className="font-semibold">{STORE.address}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="icon-tile h-10 w-10 bg-[var(--chip-strong)] text-[var(--ink-primary)]">
                  <Bookmark className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <dt className="text-[13px] font-semibold text-[var(--ink-muted)]">Guardados</dt>
                  <dd className="font-semibold tabular-nums">
                    {saved.length} {saved.length === 1 ? 'producto' : 'productos'}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="icon-tile h-10 w-10 bg-[var(--chip-strong)] text-[var(--ink-primary)]">
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <dt className="text-[13px] font-semibold text-[var(--ink-muted)]">Total estimado (uno de cada uno)</dt>
                  <dd key={estimated} className="swap-in font-semibold tabular-nums">
                    {formatPrice(estimated)}
                  </dd>
                </div>
              </div>
            </dl>
          )}
          <p role="status" className="mt-4 text-sm font-semibold text-[var(--brand-olive)] empty:hidden">
            {notice}
          </p>
        </header>

        {!isHydrated ? (
          <p className="mt-10 text-center text-[var(--ink-muted)]" role="status">
            Cargando tus guardados…
          </p>
        ) : saved.length === 0 ? (
          <div className="enter mx-auto mt-12 max-w-lg text-center" style={{ '--i': 1 } as CSSProperties}>
            <span className="icon-tile mx-auto h-16 w-16">
              <Bookmark className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-[28px]">Todavía no guardaste nada</h2>
            <p className="mt-2 text-[var(--ink-muted)]">
              En cada producto hay un marcador arriba a la derecha de la foto. Tocalo y aparece acá.
            </p>
            <ul className="mt-6 flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <Link href={`/catalogo?rubro=${c.id}`} className="chip">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {saved.map((product, i) => (
                <li key={product.id} className="enter" style={{ '--i': 1 + (i % 4), '--rise': '16px' } as CSSProperties}>
                  <ProductCard product={product} headingLevel={2} />
                </li>
              ))}
            </ul>
            <p className="mt-5 flex min-h-11 flex-wrap items-center justify-end gap-x-2 text-sm">
              {confirmClear ? (
                <>
                  <span className="text-[var(--ink-muted)]">¿Vaciar la lista de guardados?</span>
                  <button
                    type="button"
                    onClick={() => {
                      clearSaved();
                      setConfirmClear(false);
                      setNotice('Vaciaste tus guardados.');
                    }}
                    className="inline-flex min-h-11 items-center font-semibold text-[var(--amancay-wine)] underline underline-offset-4"
                  >
                    Sí, vaciar
                  </button>
                  <button type="button" onClick={() => setConfirmClear(false)} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="inline-flex min-h-11 items-center font-semibold text-[var(--ink-muted)] underline underline-offset-4 hover:text-[var(--ink-primary)]"
                >
                  Vaciar guardados
                </button>
              )}
            </p>
          </>
        )}

        <Reveal rise={10} className="focus-on-dark mt-10 flex flex-col gap-4 rounded-lg bg-[var(--brand-espresso)] p-6 text-[#fdf9f0] sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <span className="icon-tile h-12 w-12">
              <Images className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-xl sm:text-2xl">¿Querés verlos antes de decidir?</h2>
              <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-[#e6e2d9]">
                Escribinos y te mandamos fotos de los que tenemos en el local, o pasá por {STORE.address}.
              </p>
            </div>
          </div>
          <a
            href={whatsappUrl('Hola Amancay, ¿me mandan fotos de algunos productos que estoy mirando?')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-lg btn-gold shrink-0"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Escribir por WhatsApp
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        </Reveal>
      </div>
    </div>
  );
}
