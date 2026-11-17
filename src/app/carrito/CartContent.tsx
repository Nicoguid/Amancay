'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Bike, Bookmark, Clock, MapPin, MessageCircle, Minus, Plus, ShoppingBag, Store, Trash2, Truck } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { ProductImage } from '@/components/ProductImage';
import { ProductCard } from '@/components/ProductCard';
import type { ShippingMethod } from '@/lib/types';
import { SHIPPING_LABELS, SHIPPING_RATES, STORE, formatPrice, productPath, shippingCost, whatsappUrl } from '@/lib/storeConfig';
import { CATEGORIES } from '@/lib/categories';
import { DELIVERY_CHOICE_KEY, cartWhatsappMessage } from '@/lib/cartMessage';
import { useTodayHours } from '@/lib/useStoreHours';

/*
 * Carrito completo (Figma: "Mi Carrito & Retiro"): productos, forma de entrega y resumen.
 * Los datos personales, el pago y los consentimientos se piden después, en /checkout.
 */
export function CartContent() {
  const { cart, cartTotal, cartCount, updateCartQuantity, removeFromCart, clearCart, toggleSaved, savedIds, saved, profile, isHydrated } = useStore();
  const today = useTodayHours();
  const [chosen, setChosen] = useState<ShippingMethod | null>(null);
  const [postalCode, setPostalCode] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState('');

  // Entrega: la que se elige acá; si no, la habitual del perfil; si no, retiro en el local.
  const shippingMethod: ShippingMethod = chosen ?? profile?.shippingMethod ?? 'pickup';
  const cp = postalCode || profile?.postalCode || '';
  const shipping = shippingCost(shippingMethod, cp);
  const total = cartTotal + (shipping ?? 0);

  const chooseShipping = (method: ShippingMethod) => {
    setChosen(method);
    try {
      window.sessionStorage.setItem(DELIVERY_CHOICE_KEY, method);
    } catch {
      // Sin sessionStorage el checkout arranca con retiro en el local.
    }
  };

  const saveForLater = (lineId: string, productId: string, name: string) => {
    if (!savedIds.includes(productId)) toggleSaved(productId);
    removeFromCart(lineId);
    setNotice(`${name} pasó a Guardados.`);
  };

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-8 lg:px-12">
        <h1 className="font-display text-4xl tracking-tight">Tu carrito</h1>
        <p className="mt-2 text-[var(--ink-muted)]" role="status">
          Cargando tu carrito…
        </p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[var(--bg-page)] px-4 py-12 text-[var(--ink-primary)] sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-[1320px]">
          <div className="enter mx-auto max-w-lg text-center">
            <span className="icon-tile mx-auto h-16 w-16">
              <ShoppingBag className="h-7 w-7" aria-hidden="true" />
            </span>
            <h1 className="mt-5 font-display text-[34px] tracking-[-0.02em]">Tu carrito está vacío</h1>
            <p className="mt-2 text-[var(--ink-muted)]">Elegí un rubro para empezar. Lo que agregues queda guardado en este navegador.</p>
            <p role="status" className="mt-3 text-sm font-semibold text-[var(--brand-olive)] empty:hidden">
              {notice}
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
          {saved.length > 0 && (
            <section aria-labelledby="guardados-carrito" className="mt-14 border-t border-[var(--amancay-border)] pt-10">
              <div className="mb-6 flex items-end justify-between gap-4">
                <h2 id="guardados-carrito" className="font-display text-2xl sm:text-[28px]">
                  Lo que tenías guardado
                </h2>
                <Link href="/guardados" className="link-brass inline-flex min-h-11 items-center">
                  Ver guardados
                </Link>
              </div>
              <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {saved.slice(0, 4).map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    );
  }

  const shippingOptions: { id: ShippingMethod; icon: typeof Store; title: string; detail: string; price: string }[] = [
    {
      id: 'pickup',
      icon: Store,
      title: 'Retiro en el local',
      detail: `${STORE.address}, Almagro. Te avisamos por WhatsApp cuando el pedido está listo.`,
      price: 'Sin costo',
    },
    { id: 'moto_caba', icon: Bike, title: 'Moto en CABA', detail: 'Coordinamos día y franja horaria por WhatsApp.', price: formatPrice(SHIPPING_RATES.moto_caba) },
    {
      id: 'correo_argentino',
      icon: Truck,
      title: 'Correo Argentino',
      detail: `GBA ${formatPrice(SHIPPING_RATES.correo_gba)} · Resto del país ${formatPrice(SHIPPING_RATES.correo_interior)}. Con número de seguimiento.`,
      price: shippingMethod === 'correo_argentino' && shipping !== null ? formatPrice(shipping) : 'Según código postal',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] pb-28 pt-5 text-[var(--ink-primary)] sm:pt-8 lg:pb-20">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
        <Link href="/catalogo" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Seguir comprando
        </Link>

        <header className="enter mb-7 mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" style={{ '--i': 0 } as CSSProperties}>
          <div>
            <p className="eyebrow">Carrito</p>
            <h1 className="mt-1.5 font-display text-[32px] leading-tight tracking-[-0.02em] sm:text-[40px]">
              Tu carrito <span className="tabular-nums">({cartCount}</span> {cartCount === 1 ? 'producto' : 'productos'})
            </h1>
            <p className="mt-2 max-w-xl text-[var(--ink-muted)]">Revisá las cantidades y elegí cómo lo recibís. Los datos y el pago van en el paso siguiente.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-7">
            <section aria-labelledby="carrito-items" className="enter" style={{ '--i': 1, '--rise': '16px' } as CSSProperties}>
              <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
                <h2 id="carrito-items" className="eyebrow">
                  Productos elegidos
                </h2>
                {confirmClear ? (
                  <p className="pop-in flex items-center gap-2 text-sm">
                    <span className="text-[var(--ink-muted)]">¿Vaciar el carrito?</span>
                    <button
                      type="button"
                      onClick={() => {
                        clearCart();
                        setConfirmClear(false);
                        setNotice('Vaciaste el carrito.');
                      }}
                      className="inline-flex min-h-11 items-center font-semibold text-[var(--amancay-wine)] underline underline-offset-4"
                    >
                      Sí, vaciar
                    </button>
                    <button type="button" onClick={() => setConfirmClear(false)} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
                      Cancelar
                    </button>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--ink-muted)] underline underline-offset-4 hover:text-[var(--ink-primary)]"
                  >
                    Vaciar carrito
                  </button>
                )}
              </div>

              <ul className="space-y-3">
                {cart.map((item) => (
                  <li key={item.id} className="card-rest flex gap-3 rounded-lg bg-white p-4 sm:gap-4 sm:p-5">
                    <Link href={productPath(item.product)} tabIndex={-1} aria-hidden="true" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-[var(--bg-sunken)] sm:h-28 sm:w-28">
                      <ProductImage src={item.product.images[0]} alt="" width={112} height={112} className="photo-on-linen h-full w-full object-contain p-2" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <h3 className="font-display text-[17px] leading-snug sm:text-xl">
                          <Link href={productPath(item.product)} className="hover:underline">
                            {item.product.name}
                          </Link>
                        </h3>
                        <p className="shrink-0 text-lg font-bold tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</p>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--ink-muted)]">
                        {item.selectedVariant && <span className="tag tag-quiet">{item.selectedVariant.name}</span>}
                        {item.quantity > 1 && <span className="tabular-nums">{formatPrice(item.unitPrice)} c/u</span>}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[var(--bg-sunken)] pt-3">
                        <div className="flex items-center rounded-btn bg-[var(--bg-subtle)]" role="group" aria-label={`Cantidad de ${item.product.name}`}>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="tap-interactive flex h-11 w-11 items-center justify-center rounded-btn hover:bg-[var(--bg-sunken)]"
                            aria-label={item.quantity === 1 ? `Quitar ${item.product.name}` : `Restar una unidad de ${item.product.name}`}
                          >
                            <Minus className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <span key={item.quantity} className="swap-in w-8 text-center font-bold tabular-nums" aria-live="polite">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, 1)}
                            disabled={item.quantity >= item.available}
                            className="tap-interactive flex h-11 w-11 items-center justify-center rounded-btn hover:bg-[var(--bg-sunken)] disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Sumar una unidad de ${item.product.name}`}
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-semibold text-[var(--ink-muted)]">
                          <button
                            type="button"
                            onClick={() => saveForLater(item.id, item.product.id, item.product.name)}
                            className="tap-interactive inline-flex min-h-11 items-center gap-1.5 rounded-btn px-2.5 hover:bg-[var(--bg-subtle)] hover:text-[var(--ink-primary)]"
                          >
                            <Bookmark className="h-4 w-4" aria-hidden="true" />
                            Guardar<span className="sr-only"> {item.product.name} para después</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              removeFromCart(item.id);
                              setNotice(`Quitaste ${item.product.name}.`);
                            }}
                            className="tap-interactive inline-flex min-h-11 items-center gap-1.5 rounded-btn px-2.5 hover:bg-[var(--bg-subtle)] hover:text-[var(--amancay-wine)]"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Quitar<span className="sr-only"> {item.product.name}</span>
                          </button>
                        </div>
                      </div>
                      {item.quantity >= item.available && <p className="mt-2 text-sm text-[var(--amancay-wine)]">No hay más unidades disponibles.</p>}
                    </div>
                  </li>
                ))}
              </ul>
              <p role="status" className="mt-3 text-sm font-semibold text-[var(--brand-olive)] empty:hidden">
                {notice}
              </p>
            </section>

            <fieldset className="enter card-rest rounded-lg bg-white p-5 sm:p-7" style={{ '--i': 2, '--rise': '16px' } as CSSProperties}>
              <legend className="float-left mb-4 w-full">
                <span className="eyebrow block">Entrega</span>
                <span className="mt-1 block font-display text-2xl">¿Cómo lo recibís?</span>
              </legend>
              <div className="clear-both space-y-2.5">
                {shippingOptions.map(({ id, icon: Icon, title, detail, price }) => {
                  const selected = shippingMethod === id;
                  return (
                    <label
                      key={id}
                      className={`flex cursor-pointer items-start gap-3 rounded-btn border p-4 transition-[border-color,background-color,box-shadow] duration-150 ${
                        selected
                          ? 'border-[var(--ink-gold)] bg-[var(--brand-leather-wash)] shadow-[0_0_0_1px_var(--ink-gold)]'
                          : 'border-[var(--amancay-border)] hover:border-[var(--brand-brass)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={id}
                        checked={selected}
                        onChange={() => chooseShipping(id)}
                        className="mt-1 h-5 w-5 accent-[var(--brand-espresso)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-semibold">
                          <span className="flex flex-wrap items-center gap-2">
                            <Icon className="h-4 w-4 text-[var(--ink-gold)]" aria-hidden="true" />
                            {title}
                            {id === 'pickup' && <span className="tag tag-gold">Sin costo</span>}
                          </span>
                          {id !== 'pickup' && <span className="tabular-nums">{price}</span>}
                        </span>
                        <span className="mt-1 block text-sm leading-snug text-[var(--ink-muted)]">{detail}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {shippingMethod === 'correo_argentino' && (
                <div className="pop-in mt-4">
                  <label htmlFor="carrito-cp" className="mb-1 block text-sm font-semibold">
                    Código postal, para calcular el envío
                  </label>
                  <input
                    id="carrito-cp"
                    name="postal-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={postalCode || (profile?.postalCode ?? '')}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Ej.: 1900…"
                    className="field max-w-48"
                  />
                </div>
              )}
            </fieldset>
          </div>

          {/* Resumen */}
          <aside aria-labelledby="resumen-title" className="enter space-y-4 lg:sticky lg:top-36 lg:col-span-5" style={{ '--i': 3, '--rise': '16px' } as CSSProperties}>
            <div className="rounded-lg bg-white p-5 shadow-[var(--shadow-lift)] sm:p-7">
              <h2 id="resumen-title" className="font-display text-2xl">
                Resumen del pedido
              </h2>
              <dl className="mt-4 space-y-2.5 text-[15px]">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 text-[var(--ink-muted)]">
                    <dt className="min-w-0 truncate">
                      {item.quantity > 1 && <span className="tabular-nums">{item.quantity} × </span>}
                      {item.product.name}
                    </dt>
                    <dd className="shrink-0 tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 border-t border-[var(--amancay-border)] pt-2.5 font-semibold">
                  <dt>Productos</dt>
                  <dd className="tabular-nums">{formatPrice(cartTotal)}</dd>
                </div>
                <div className="flex justify-between gap-4 font-semibold">
                  <dt>{SHIPPING_LABELS[shippingMethod]}</dt>
                  <dd className={`tabular-nums ${shipping === 0 ? 'text-[var(--brand-olive)]' : ''}`}>
                    {shipping === null ? 'Falta el código postal' : shipping === 0 ? 'Sin costo' : formatPrice(shipping)}
                  </dd>
                </div>
              </dl>
              <div className="mt-5 flex items-end justify-between gap-4 border-t border-[var(--amancay-border)] pt-4">
                <div>
                  <p className="font-display text-xl">Total</p>
                  <p className="text-[13px] text-[var(--ink-muted)]">Mismo precio con cualquier medio de pago</p>
                </div>
                <p key={total} className="swap-in font-display text-[40px] leading-none tabular-nums tracking-[-0.02em]">
                  {formatPrice(total)}
                </p>
              </div>

              <Link href="/checkout" className="btn btn-lg btn-primary mt-6 w-full">
                Continuar con la compra
                <ArrowRight className="arrow-nudge h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href={whatsappUrl(cartWhatsappMessage(cart, cartTotal, SHIPPING_LABELS[shippingMethod]))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-lg btn-whatsapp mt-2.5 w-full"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Pedir por WhatsApp
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
              <p className="mt-3 text-center text-sm text-[var(--ink-muted)]">Por WhatsApp le llega el detalle del carrito al local y coordinan el resto.</p>
            </div>

            <div className="rounded-lg bg-[var(--bg-sunken)] p-5">
              <p className="flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4 text-[var(--ink-gold)]" aria-hidden="true" />
                Dónde se retira
              </p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--ink-muted)]">
                {STORE.address}, {STORE.neighborhood}. {STORE.transit}.
              </p>
              {today && (
                <p className="mt-2 flex items-center gap-2 text-[15px] text-[var(--ink-muted)]">
                  <Clock className="h-4 w-4 text-[var(--ink-gold)]" aria-hidden="true" />
                  <span>
                    <span className={`font-semibold ${today.isOpen ? 'text-[var(--brand-olive)]' : 'text-[var(--ink-primary)]'}`}>
                      {today.isOpen ? 'Abierto ahora' : 'Cerrado ahora'}
                    </span>{' '}
                    · Hoy: {today.time}
                  </span>
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Barra fija en celular: el total y el siguiente paso siempre a mano. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--amancay-border)] bg-white/95 px-4 pb-[calc(0.625rem+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_24px_-14px_rgba(29,15,9,0.4)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-[var(--ink-muted)]">Total</p>
            <p className="text-xl font-bold tabular-nums leading-tight">{formatPrice(total)}</p>
          </div>
          <Link href="/checkout" className="btn btn-lg btn-primary shrink-0">
            Continuar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
