'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Check, Copy, MessageCircle, Store, Truck, Bike, Info } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import type { Order, PaymentMethod, ShippingMethod } from '@/lib/types';
import { SHIPPING_LABELS, SHIPPING_RATES, STORE, formatPrice, shippingCost, whatsappUrl } from '@/lib/storeConfig';

type FieldName = 'fullName' | 'dni' | 'phone' | 'email' | 'address' | 'city' | 'postalCode' | 'notes';
type FormData = Record<FieldName, string>;

const EMPTY_FORM: FormData = { fullName: '', dni: '', phone: '', email: '', address: '', city: 'CABA', postalCode: '', notes: '' };

const inputClass = (invalid: boolean) =>
  `w-full rounded-lg border bg-[var(--bg-page)] px-3 py-2.5 focus:border-[var(--ink-accent)] ${
    invalid ? 'border-[var(--amancay-wine)]' : 'border-[var(--amancay-border)]'
  }`;

function validate(data: FormData, shipping: ShippingMethod): Partial<Record<FieldName, string>> {
  const errors: Partial<Record<FieldName, string>> = {};
  if (data.fullName.trim().length < 3) errors.fullName = 'Escribí tu nombre y apellido.';
  if (!/^\d{7,11}$/.test(data.dni.replace(/[.\-\s]/g, ''))) errors.dni = 'Escribí el DNI o CUIL sin puntos (7 a 11 números).';
  if (data.phone.replace(/\D/g, '').length < 8) errors.phone = 'Escribí un teléfono con código de área, ej.: 11 2345 6789.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Escribí un email válido, ej.: nombre@mail.com.';
  if (shipping !== 'pickup') {
    if (data.address.trim().length < 5) errors.address = 'Escribí calle, número, piso y departamento.';
    if (!/\d{4}/.test(data.postalCode)) errors.postalCode = 'Escribí el código postal (4 números).';
    if (!data.city.trim()) errors.city = 'Escribí la localidad o barrio.';
  }
  return errors;
}

export function CheckoutContent() {
  const { cart, cartTotal, createOrder, products, isHydrated } = useStore();
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl tracking-tight">Finalizar compra</h1>
        <p className="mt-2 text-[var(--ink-muted)]">Cargando tu carrito…</p>
      </div>
    );
  }

  if (order) return <OrderConfirmation order={order} />;

  if (cart.length === 0) {
    const featured = products.filter((p) => p.active && p.stock > 0).slice(0, 4);
    return (
      <div className="min-h-screen bg-[var(--bg-page)] px-4 py-12 text-[var(--ink-primary)] sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <ShoppingBag className="mx-auto mb-4 h-10 w-10 text-[var(--ink-accent)]" aria-hidden="true" />
            <h1 className="mb-3 font-display text-4xl tracking-tight">Tu carrito está vacío</h1>
            <p className="mb-8 text-[var(--ink-muted)]">Sumá productos desde el catálogo para finalizar la compra.</p>
            <Link
              href="/catalogo"
              className="tap-interactive inline-flex min-h-12 items-center rounded-full bg-[var(--ink-primary)] px-8 font-semibold text-white hover:bg-[var(--ink-secondary)]"
            >
              Ir al catálogo
            </Link>
          </div>
          {featured.length > 0 && (
            <section aria-labelledby="sugerencias-title" className="border-t border-[var(--amancay-border)] pt-10">
              <h2 id="sugerencias-title" className="mb-6 font-display text-2xl">
                Para empezar
              </h2>
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {featured.map((item) => (
                  <li key={item.id}>
                    <ProductCard product={item} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    );
  }

  const shipping = shippingCost(shippingMethod, form.postalCode);
  const discount = paymentMethod === 'transferencia' ? Math.round((cartTotal * STORE.transferDiscountPct) / 100) : 0;
  const finalTotal = cartTotal - discount + (shipping ?? 0);

  const setField = (name: FieldName, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const chooseShipping = (method: ShippingMethod) => {
    setShippingMethod(method);
    // Pagar en el local solo tiene sentido si se retira en el local.
    if (method !== 'pickup' && paymentMethod === 'mostrador') setPaymentMethod('transferencia');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const found = validate(form, shippingMethod);
    setErrors(found);
    const firstInvalid = (Object.keys(found) as FieldName[])[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    const result = createOrder({
      customer: {
        ...form,
        address: shippingMethod === 'pickup' ? undefined : form.address,
        city: shippingMethod === 'pickup' ? undefined : form.city,
        postalCode: shippingMethod === 'pickup' ? undefined : form.postalCode,
        notes: form.notes || undefined,
      },
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.images[0] ?? '',
        variantId: item.selectedVariant?.id,
        variantName: item.selectedVariant?.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
      })),
      subtotal: cartTotal,
      discount,
      shippingMethod,
      shippingCost: shipping ?? 0,
      paymentMethod,
      total: finalTotal,
      status: 'pendiente',
    });

    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    setOrder(result.order);
    window.scrollTo({ top: 0 });
  };

  const field = (name: FieldName, label: string, props: React.InputHTMLAttributes<HTMLInputElement>, hint?: string) => {
    const error = errors[name];
    const describedBy = [hint ? `${name}-hint` : null, error ? `${name}-error` : null].filter(Boolean).join(' ') || undefined;
    return (
      <div>
        <label htmlFor={`co-${name}`} className="mb-1 block font-semibold">
          {label}
        </label>
        {hint && (
          <p id={`${name}-hint`} className="mb-1 text-sm text-[var(--ink-muted)]">
            {hint}
          </p>
        )}
        <input
          id={`co-${name}`}
          name={name}
          value={form[name]}
          onChange={(e) => setField(name, e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass(!!error)}
          {...props}
        />
        {error && (
          <p id={`${name}-error`} className="mt-1 text-sm text-[var(--amancay-wine)]">
            {error}
          </p>
        )}
      </div>
    );
  };

  const shippingOptions: { id: ShippingMethod; icon: typeof Store; title: string; detail: string; price: string }[] = [
    { id: 'pickup', icon: Store, title: 'Retiro en el local', detail: `${STORE.address}. Te avisamos por WhatsApp cuando está listo.`, price: 'Sin costo' },
    { id: 'moto_caba', icon: Bike, title: 'Moto en CABA', detail: 'Coordinamos día y franja por WhatsApp.', price: formatPrice(SHIPPING_RATES.moto_caba) },
    {
      id: 'correo_argentino',
      icon: Truck,
      title: 'Correo Argentino',
      detail: `GBA ${formatPrice(SHIPPING_RATES.correo_gba)} · Resto del país ${formatPrice(SHIPPING_RATES.correo_interior)}`,
      price: shippingMethod === 'correo_argentino' && shipping !== null ? formatPrice(shipping) : 'Según CP',
    },
  ];

  const paymentOptions: { id: PaymentMethod; title: string; detail: string; disabled?: boolean }[] = [
    { id: 'transferencia', title: `Transferencia (${STORE.transferDiscountPct} % off)`, detail: 'Al confirmar te mostramos alias y CBU.' },
    { id: 'mercadopago', title: 'Mercado Pago', detail: 'Tarjetas de crédito, débito o dinero en cuenta.' },
    {
      id: 'mostrador',
      title: 'Pagar en el local',
      detail: shippingMethod === 'pickup' ? 'Efectivo o tarjeta al retirar.' : 'Disponible solo con retiro en el local.',
      disabled: shippingMethod !== 'pickup',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] py-8 text-[var(--ink-primary)] sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/catalogo" className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--ink-accent)] hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Seguir comprando
        </Link>
        <h1 className="mb-2 font-display text-4xl tracking-tight">Finalizar compra</h1>
        <p className="mb-8 flex items-center gap-2 text-sm text-[var(--ink-muted)]">
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          Versión de demostración: no se cobra nada y el pedido queda guardado solo en este navegador.
        </p>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <section aria-labelledby="resumen-title" className="lg:sticky lg:top-24 lg:order-last lg:col-span-5">
            <div className="space-y-4 rounded-2xl border border-[var(--amancay-border)] bg-white p-6">
              <h2 id="resumen-title" className="font-display text-2xl">
                Tu pedido
              </h2>
              <ul className="divide-y divide-[var(--bg-subtle)]">
                {cart.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.product.name}</p>
                      {item.selectedVariant && <p className="text-sm text-[var(--ink-accent)]">{item.selectedVariant.name}</p>}
                      <p className="text-sm text-[var(--ink-muted)]">Cantidad: {item.quantity}</p>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <dl className="space-y-2 border-t border-[var(--amancay-border)] pt-3">
                <div className="flex justify-between text-[var(--ink-muted)]">
                  <dt>Productos</dt>
                  <dd className="tabular-nums">{formatPrice(cartTotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[var(--amancay-emerald)]">
                    <dt>Descuento transferencia</dt>
                    <dd className="tabular-nums">−{formatPrice(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-[var(--ink-muted)]">
                  <dt>{SHIPPING_LABELS[shippingMethod]}</dt>
                  <dd className="tabular-nums">{shipping === null ? 'Falta el CP' : shipping === 0 ? 'Sin costo' : formatPrice(shipping)}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-[var(--amancay-border)] pt-3 font-semibold">
                  <dt>Total</dt>
                  <dd className="font-display text-3xl tabular-nums">{formatPrice(finalTotal)}</dd>
                </div>
              </dl>
            </div>
          </section>

          <form ref={formRef} noValidate onSubmit={handleSubmit} className="space-y-6 lg:col-span-7">
            <fieldset className="space-y-4 rounded-2xl border border-[var(--amancay-border)] bg-white p-6">
              <legend className="float-left mb-2 w-full font-display text-2xl">1. Tus datos</legend>
              <div className="clear-both grid grid-cols-1 gap-4 sm:grid-cols-2">
                {field('fullName', 'Nombre y apellido', { type: 'text', autoComplete: 'name', placeholder: 'Ej.: Juana Pérez' })}
                {field('dni', 'DNI o CUIL', { type: 'text', inputMode: 'numeric', autoComplete: 'off', spellCheck: false, placeholder: 'Sin puntos' })}
                {field('phone', 'Teléfono / WhatsApp', { type: 'tel', autoComplete: 'tel', placeholder: 'Ej.: 11 2345 6789' })}
                {field('email', 'Email', { type: 'email', autoComplete: 'email', spellCheck: false, placeholder: 'nombre@mail.com' })}
              </div>
            </fieldset>

            <fieldset className="space-y-3 rounded-2xl border border-[var(--amancay-border)] bg-white p-6">
              <legend className="float-left mb-2 w-full font-display text-2xl">2. Entrega</legend>
              <div className="clear-both space-y-2.5">
                {shippingOptions.map(({ id, icon: Icon, title, detail, price }) => (
                  <label
                    key={id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                      shippingMethod === id ? 'border-[var(--ink-primary)] bg-[var(--bg-page)]' : 'border-[var(--amancay-border)] hover:bg-[var(--bg-page)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={id}
                      checked={shippingMethod === id}
                      onChange={() => chooseShipping(id)}
                      className="mt-1 h-5 w-5 accent-[var(--ink-primary)]"
                    />
                    <span className="flex-1">
                      <span className="flex items-baseline justify-between gap-3 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Icon className="h-4 w-4 text-[var(--ink-accent)]" aria-hidden="true" />
                          {title}
                        </span>
                        <span className="tabular-nums text-[var(--amancay-emerald)]">{price}</span>
                      </span>
                      <span className="mt-0.5 block text-sm text-[var(--ink-muted)]">{detail}</span>
                    </span>
                  </label>
                ))}
              </div>
              {shippingMethod !== 'pickup' && (
                <div className="space-y-4 border-t border-[var(--amancay-border)] pt-4">
                  {field('address', 'Calle, número, piso y depto.', { type: 'text', autoComplete: 'street-address', placeholder: 'Ej.: Bulnes 742, 3.° B' })}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {field('city', 'Localidad o barrio', { type: 'text', autoComplete: 'address-level2' })}
                    {field('postalCode', 'Código postal', { type: 'text', inputMode: 'numeric', autoComplete: 'postal-code', placeholder: 'Ej.: 1176' })}
                  </div>
                </div>
              )}
              <div className="pt-2">
                <label htmlFor="co-notes" className="mb-1 block font-semibold">
                  Aclaraciones <span className="font-normal text-[var(--ink-muted)]">(opcional)</span>
                </label>
                <textarea
                  id="co-notes"
                  name="notes"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="Ej.: es para regalo, timbre 3B…"
                  className={inputClass(false)}
                />
              </div>
            </fieldset>

            <fieldset className="space-y-3 rounded-2xl border border-[var(--amancay-border)] bg-white p-6">
              <legend className="float-left mb-2 w-full font-display text-2xl">3. Pago</legend>
              <div className="clear-both space-y-2.5">
                {paymentOptions.map(({ id, title, detail, disabled }) => (
                  <label
                    key={id}
                    className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-[var(--bg-page)]'
                    } ${paymentMethod === id ? 'border-[var(--ink-primary)] bg-[var(--bg-page)]' : 'border-[var(--amancay-border)]'}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={id}
                      checked={paymentMethod === id}
                      disabled={disabled}
                      onChange={() => setPaymentMethod(id)}
                      className="mt-1 h-5 w-5 accent-[var(--ink-primary)]"
                    />
                    <span>
                      <span className="block font-semibold">{title}</span>
                      <span className="mt-0.5 block text-sm text-[var(--ink-muted)]">{detail}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {Object.values(errors).some(Boolean) && (
              <p role="alert" className="rounded-lg border border-[var(--amancay-wine)] bg-white p-3 text-[var(--amancay-wine)]">
                Revisá los campos marcados.
              </p>
            )}
            {submitError && (
              <p role="alert" className="rounded-lg border border-[var(--amancay-wine)] bg-white p-3 text-[var(--amancay-wine)]">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              className="tap-interactive min-h-14 w-full rounded-full bg-[var(--ink-primary)] font-semibold text-white shadow-lg hover:bg-[var(--ink-secondary)]"
            >
              Confirmar pedido · {formatPrice(finalTotal)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function OrderConfirmation({ order }: { order: Order }) {
  const [copied, setCopied] = useState<'ok' | 'error' | null>(null);

  const copyAlias = async () => {
    try {
      await navigator.clipboard.writeText(STORE.transfer.alias);
      setCopied('ok');
    } catch {
      setCopied('error');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] px-4 py-12 text-[var(--ink-primary)] sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-[var(--amancay-border)] bg-white p-6 shadow-lg sm:p-10">
        <div className="space-y-2 border-b border-[var(--amancay-border)] pb-6 text-center">
          <Check className="mx-auto h-10 w-10 text-[var(--amancay-emerald)]" aria-hidden="true" />
          <h1 className="font-display text-3xl">Gracias, {order.customer.fullName.split(' ')[0]}</h1>
          <p className="text-[var(--ink-muted)]">
            Registramos tu pedido <strong className="text-[var(--ink-primary)]">#{order.orderNumber}</strong> por{' '}
            <strong className="text-[var(--ink-primary)]">{formatPrice(order.total)}</strong>.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--amancay-border)] bg-[var(--bg-page)] p-4">
          {order.shippingMethod === 'pickup' ? (
            <>
              <p className="font-semibold">Retiro en {STORE.address}</p>
              <p className="text-[var(--ink-muted)]">
                Te avisamos por WhatsApp cuando esté listo. Horario: {STORE.hours.map((h) => `${h.days} ${h.time}`).join(' · ')}.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">{SHIPPING_LABELS[order.shippingMethod]}</p>
              <p className="text-[var(--ink-muted)]">
                {order.customer.address}, {order.customer.city} (CP {order.customer.postalCode}). Te escribimos al {order.customer.phone}{' '}
                para coordinar.
              </p>
            </>
          )}
        </div>

        {order.paymentMethod === 'transferencia' && (
          <div className="focus-on-dark space-y-3 rounded-xl bg-[#14110e] p-5 text-white">
            <p className="font-semibold text-[var(--amancay-gold-light)]">Datos para transferir</p>
            {STORE.transfer.isPlaceholder && (
              <p className="rounded-md bg-white/10 p-2 text-sm">Datos de ejemplo de la demo. No transfieras a esta cuenta.</p>
            )}
            <dl className="space-y-1.5 text-sm">
              {[
                ['Banco', STORE.transfer.bank],
                ['Titular', STORE.transfer.holder],
                ['Alias', STORE.transfer.alias],
                ['CBU', STORE.transfer.cbu],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="font-semibold">{k}</dt>
                  <dd className="break-all text-right font-mono">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-white/20 pt-2 text-base font-semibold">
                <dt>Monto</dt>
                <dd className="tabular-nums text-[var(--amancay-gold-light)]">{formatPrice(order.total)}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={copyAlias}
              className="tap-interactive flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-white/25 bg-white/10 font-semibold hover:bg-white/20"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copiar alias
            </button>
            <p role="status" className="text-center text-sm">
              {copied === 'ok' ? 'Alias copiado.' : copied === 'error' ? 'No se pudo copiar. Seleccioná el alias y copialo a mano.' : ''}
            </p>
          </div>
        )}

        {order.paymentMethod === 'mercadopago' && (
          <p className="rounded-xl border border-[var(--amancay-border)] bg-[var(--bg-page)] p-4 text-[var(--ink-muted)]">
            En la tienda final, acá se abre el pago de Mercado Pago. En esta demo no se cobra nada.
          </p>
        )}

        {order.paymentMethod === 'mostrador' && (
          <p className="rounded-xl border border-[var(--amancay-border)] bg-[var(--bg-page)] p-4 text-[var(--ink-muted)]">
            Pagás en efectivo o con tarjeta cuando retirás.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={whatsappUrl(`Hola Amancay, hice el pedido #${order.orderNumber} a nombre de ${order.customer.fullName} por ${formatPrice(order.total)}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-interactive flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--whatsapp-action)] px-4 font-semibold text-white hover:bg-[var(--whatsapp-action-hover)]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Avisar por WhatsApp
          </a>
          <Link
            href="/"
            className="tap-interactive flex min-h-12 items-center justify-center rounded-full bg-[var(--ink-primary)] px-6 font-semibold text-white hover:bg-[var(--ink-secondary)]"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
