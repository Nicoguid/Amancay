'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ProductImage } from '@/components/ProductImage';
import { ShoppingBag, ArrowLeft, Copy, MessageCircle, Store, Truck, Bike, Info, Package } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import type { Order, PaymentMethod, ShippingMethod } from '@/lib/types';
import { SHIPPING_LABELS, SHIPPING_RATES, STORE, formatPrice, shippingCost, whatsappUrl, waText } from '@/lib/storeConfig';
import { recordConsent, track } from '@/lib/consent';
import { placeOrder } from './actions';
import { looksAutomated } from '@/lib/formGuard';
import { AAIP_ACCESS_NOTICE, AAIP_AUTHORITY_NOTICE, legalPath } from '@/lib/legal';
import { DELIVERY_CHOICE_KEY } from '@/lib/cartMessage';

import { validateCheckout as validate, type CheckoutForm as FormData, type CheckoutField as FieldName } from '@/lib/checkoutValidation';

const EMPTY_FORM: FormData = { fullName: '', dni: '', phone: '', email: '', address: '', city: 'CABA', postalCode: '', notes: '' };

const SHIPPING_IDS: ShippingMethod[] = ['pickup', 'moto_caba', 'correo_argentino'];

/** La entrega elegida en /carrito durante esta visita, si la hay. */
function deliveryChosenInCart(): ShippingMethod | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.sessionStorage.getItem(DELIVERY_CHOICE_KEY) as ShippingMethod | null;
    return value && SHIPPING_IDS.includes(value) ? value : null;
  } catch {
    return null;
  }
}

const cardClass = 'card-rest space-y-4 rounded-lg bg-white p-5 sm:p-7';
const optionClass = (selected: boolean) =>
  `flex items-start gap-3 rounded-btn border p-4 transition-[border-color,background-color,box-shadow] duration-150 ${
    selected
      ? 'border-[var(--ink-gold)] bg-[var(--brand-leather-wash)] shadow-[0_0_0_1px_var(--ink-gold)]'
      : 'border-[var(--amancay-border)] hover:border-[var(--brand-brass)]'
  }`;

function StepLegend({ step, children }: { step?: number; children: React.ReactNode }) {
  return (
    <legend className="float-left mb-3 flex w-full items-center gap-3 font-display text-2xl">
      {step !== undefined && (
        <>
          <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--brand-gold)] font-sans text-sm font-bold text-[var(--ink-on-gold)]">
            {step}
          </span>
          <span className="sr-only">{step}. </span>
        </>
      )}
      {children}
    </legend>
  );
}

export function CheckoutContent() {
  const { cart, cartTotal, products, isHydrated, profile, saveProfile, clearCart, rememberOrder } = useStore();
  const [submitting, setSubmitting] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(() => deliveryChosenInCart() ?? 'pickup');
  // Opcional y sin marcar: guardar estos datos en el navegador para la próxima compra.
  const [rememberMe, setRememberMe] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  // Dos casillas separadas y sin marcar: términos por un lado, privacidad por el otro.
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [consentErrors, setConsentErrors] = useState<{ terms?: string; privacy?: string }>({});
  const [honeypot, setHoneypot] = useState('');
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  // Conversión: llegó al checkout con productos (una vez por visita a la página).
  const beganCheckout = useRef(false);
  useEffect(() => {
    if (!isHydrated || beganCheckout.current || cart.length === 0) return;
    beganCheckout.current = true;
    track('begin_checkout', { value: cartTotal, currency: 'ARS', items: cart.length });
  }, [isHydrated, cart.length, cartTotal]);
  const formRef = useRef<HTMLFormElement>(null);

  // Si la persona guardó su perfil, el formulario arranca completo (una sola vez, al leer el navegador).
  const [prefilled, setPrefilled] = useState(false);
  if (isHydrated && !prefilled) {
    setPrefilled(true);
    if (profile) {
      setForm((f) => ({
        ...f,
        fullName: profile.fullName,
        phone: profile.phone,
        email: profile.email,
        address: profile.address,
        city: profile.city || f.city,
        postalCode: profile.postalCode,
      }));
      setRememberMe(true);
      if (!deliveryChosenInCart()) setShippingMethod(profile.shippingMethod);
    }
  }

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
            <span className="icon-tile mx-auto mb-5 h-16 w-16"><ShoppingBag className="h-7 w-7" aria-hidden="true" /></span>
            <h1 className="mb-3 font-display text-4xl tracking-tight">Tu carrito está vacío</h1>
            <p className="mb-8 text-[var(--ink-muted)]">Sumá productos desde el catálogo para finalizar la compra.</p>
            <Link
              href="/catalogo"
              className="btn btn-lg btn-primary"
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
  const finalTotal = cartTotal + (shipping ?? 0);

  const setField = (name: FieldName, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const chooseShipping = (method: ShippingMethod) => {
    setShippingMethod(method);
    // Pagar en el local solo tiene sentido si se retira en el local.
    if (method !== 'pickup' && paymentMethod === 'mostrador') setPaymentMethod('transferencia');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitError(null);
    const found = validate(form, shippingMethod);
    setErrors(found);
    const consentFound = {
      terms: acceptTerms ? undefined : 'Para confirmar tenés que aceptar los términos y condiciones.',
      privacy: acceptPrivacy ? undefined : 'Para confirmar tenés que aceptar la política de privacidad.',
    };
    setConsentErrors(consentFound);
    const firstInvalid = (Object.keys(found) as FieldName[])[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    if (consentFound.terms || consentFound.privacy) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${consentFound.terms ? 'acceptTerms' : 'acceptPrivacy'}"]`)?.focus();
      return;
    }
    if (looksAutomated(honeypot, startedAt.current)) {
      setSubmitError('No pudimos confirmar el pedido. Esperá unos segundos y probá de nuevo, o escribinos por WhatsApp.');
      return;
    }
    // Copia local del consentimiento (el registro que vale lo guarda el servidor junto con el pedido).
    recordConsent({ doc: 'terminos', decision: 'aceptado', method: 'casilla en checkout' });
    recordConsent({ doc: 'privacidad', decision: 'aceptado', method: 'casilla en checkout' });

    setSubmitting(true);
    let result: Awaited<ReturnType<typeof placeOrder>>;
    try {
      // Solo viaja qué producto y cuántos: el precio y el envío los pone el servidor.
      result = await placeOrder({
        form,
        items: cart.map((item) => ({ productId: item.product.id, variantId: item.selectedVariant?.id, quantity: item.quantity })),
        shippingMethod,
        paymentMethod,
        acceptedTerms: acceptTerms,
        acceptedPrivacy: acceptPrivacy,
        honeypot,
        elapsedMs: Date.now() - startedAt.current,
      });
    } catch {
      result = { ok: false, error: 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.' };
    }

    if (!result.ok) {
      setSubmitting(false);
      if (result.fieldErrors) setErrors(result.fieldErrors);
      setSubmitError(result.error);
      return;
    }
    const placed = result.order;
    if (rememberMe) {
      saveProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        shippingMethod,
        // Si esta vez retira en el local, no se pisa la dirección que ya tenía guardada.
        address: shippingMethod === 'pickup' ? (profile?.address ?? '') : form.address.trim(),
        city: shippingMethod === 'pickup' ? (profile?.city ?? '') : form.city.trim(),
        postalCode: shippingMethod === 'pickup' ? (profile?.postalCode ?? '') : form.postalCode.trim(),
      });
    }
    try {
      window.sessionStorage.removeItem(DELIVERY_CHOICE_KEY);
    } catch {
      // Sin sessionStorage no hay nada que limpiar.
    }
    rememberOrder({ code: placed.orderNumber, email: form.email.trim().toLowerCase(), createdAt: placed.createdAt });
    clearCart();
    track('purchase', { transaction_id: placed.orderNumber, value: placed.total, currency: 'ARS', items: placed.items.length });

    if (result.checkoutUrl) {
      // A pagar en Mercado Pago; al terminar vuelve a /checkout/resultado.
      window.location.assign(result.checkoutUrl);
      return;
    }
    setOrder(placed);
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
          className="field"
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
    { id: 'transferencia', title: 'Transferencia', detail: 'Al confirmar te mostramos alias y CBU.' },
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
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 lg:px-12">
        <Link href="/carrito" className="mb-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al carrito
        </Link>
        <p className="eyebrow">Último paso</p>
        <h1 className="mb-2 mt-1.5 font-display text-[32px] leading-tight tracking-[-0.02em] sm:text-[40px]">Finalizar compra</h1>
        <p className="mb-8 flex items-center gap-2 text-sm text-[var(--ink-muted)]">
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          Versión de demostración: no se cobra nada y el pedido queda guardado solo en este navegador.
        </p>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <section aria-labelledby="resumen-title" className="lg:sticky lg:top-40 lg:order-last lg:col-span-5">
            <div className="space-y-4 rounded-lg bg-white p-5 shadow-[var(--shadow-lift)] sm:p-7">
              <h2 id="resumen-title" className="font-display text-2xl">
                Tu pedido
              </h2>
              <ul className="divide-y divide-[var(--bg-subtle)]">
                {cart.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-[var(--bg-sunken)]">
                      <ProductImage src={item.product.images[0]} alt="" width={64} height={64} className="photo-on-linen h-full w-full object-contain p-1.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{item.product.name}</p>
                      {item.selectedVariant && <p className="text-sm font-semibold text-[var(--ink-gold)]">{item.selectedVariant.name}</p>}
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
                <div className="flex justify-between text-[var(--ink-muted)]">
                  <dt>{SHIPPING_LABELS[shippingMethod]}</dt>
                  <dd className="tabular-nums">{shipping === null ? 'Falta el CP' : shipping === 0 ? 'Sin costo' : formatPrice(shipping)}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-[var(--amancay-border)] pt-3 font-semibold">
                  <dt>Total</dt>
                  <dd key={finalTotal} className="swap-in font-display text-[34px] leading-none tabular-nums tracking-[-0.02em]">{formatPrice(finalTotal)}</dd>
                </div>
              </dl>
            </div>
          </section>

          <form ref={formRef} noValidate onSubmit={handleSubmit} className="space-y-6 lg:col-span-7">
            <fieldset className={cardClass}>
              <StepLegend step={1}>Tus datos</StepLegend>
              <div className="clear-both grid grid-cols-1 gap-4 sm:grid-cols-2">
                {field('fullName', 'Nombre y apellido', { type: 'text', autoComplete: 'name', placeholder: 'Ej.: Juana Pérez' })}
                {field('phone', 'Teléfono / WhatsApp', { type: 'tel', autoComplete: 'tel', placeholder: 'Ej.: 11 2345 6789' })}
                {field('email', 'Email', { type: 'email', autoComplete: 'email', spellCheck: false, placeholder: 'nombre@mail.com' })}
              </div>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 pt-1 text-[15px]">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--brand-espresso)]"
                />
                <span>
                  Guardar mis datos en este navegador para la próxima compra.{' '}
                  <span className="text-[var(--ink-muted)]">
                    No se crea una cuenta: los ves y los borrás cuando quieras desde{' '}
                    <Link href="/perfil" className="link-brass">
                      Mi perfil
                    </Link>
                    .
                  </span>
                </span>
              </label>
            </fieldset>

            <fieldset className={cardClass}>
              <StepLegend step={2}>Entrega</StepLegend>
              <div className="clear-both space-y-2.5">
                {shippingOptions.map(({ id, icon: Icon, title, detail, price }) => (
                  <label
                    key={id}
                    className={`cursor-pointer ${optionClass(shippingMethod === id)}`}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={id}
                      checked={shippingMethod === id}
                      onChange={() => chooseShipping(id)}
                      className="mt-1 h-5 w-5 accent-[var(--brand-espresso)]"
                    />
                    <span className="flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-semibold">
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-[var(--ink-gold)]" aria-hidden="true" />
                          {title}
                        </span>
                        <span className={id === 'pickup' ? 'tag tag-gold' : 'tabular-nums'}>{price}</span>
                      </span>
                      <span className="mt-0.5 block text-sm text-[var(--ink-muted)]">{detail}</span>
                    </span>
                  </label>
                ))}
              </div>
              {shippingMethod !== 'pickup' && (
                <div className="space-y-4 border-t border-[var(--amancay-border)] pt-4">
                  {shippingMethod === 'correo_argentino' &&
                    field(
                      'dni',
                      'DNI de quien recibe',
                      { type: 'text', inputMode: 'numeric', autoComplete: 'off', spellCheck: false, placeholder: 'Sin puntos' },
                      'Correo Argentino lo pide para entregar el paquete.'
                    )}
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
                  autoComplete="off"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="Ej.: es para regalo, timbre 3B…"
                  className="field"
                />
              </div>
            </fieldset>

            <fieldset className={cardClass}>
              <StepLegend step={3}>Pago</StepLegend>
              <div className="clear-both space-y-2.5">
                {paymentOptions.map(({ id, title, detail, disabled }) => (
                  <label
                    key={id}
                    className={`${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${optionClass(paymentMethod === id)}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={id}
                      checked={paymentMethod === id}
                      disabled={disabled}
                      onChange={() => setPaymentMethod(id)}
                      className="mt-1 h-5 w-5 accent-[var(--brand-espresso)]"
                    />
                    <span>
                      <span className="block font-semibold">{title}</span>
                      <span className="mt-0.5 block text-sm text-[var(--ink-muted)]">{detail}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className={cardClass}>
              <StepLegend>Antes de confirmar</StepLegend>
              <div className="clear-both space-y-3">
                {(
                  [
                    ['acceptTerms', 'terms', acceptTerms, setAcceptTerms, 'Leí y acepto los', 'términos y condiciones', legalPath('terminos')],
                    ['acceptPrivacy', 'privacy', acceptPrivacy, setAcceptPrivacy, 'Leí y acepto la', 'política de privacidad', legalPath('privacidad')],
                  ] as const
                ).map(([name, key, checked, set, prefix, label, href]) => (
                  <div key={name}>
                    <div className="flex items-start gap-3">
                      <input
                        id={`co-${name}`}
                        name={name}
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          set(e.target.checked);
                          if (e.target.checked) setConsentErrors((c) => ({ ...c, [key]: undefined }));
                        }}
                        aria-invalid={!!consentErrors[key]}
                        aria-describedby={consentErrors[key] ? `co-${name}-error` : undefined}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--brand-espresso)]"
                      />
                      <label htmlFor={`co-${name}`} className="leading-snug">
                        {prefix}{' '}
                        <a href={href} target="_blank" rel="noopener" className="link-brass">
                          {label}
                          <span className="sr-only"> (se abre en otra pestaña)</span>
                        </a>
                      </label>
                    </div>
                    {consentErrors[key] && (
                      <p id={`co-${name}-error`} className="ml-8 mt-1 text-sm text-[var(--amancay-wine)]">
                        {consentErrors[key]}
                      </p>
                    )}
                  </div>
                ))}
                <details className="text-xs leading-relaxed text-[var(--ink-muted)]">
                  <summary className="inline-flex min-h-8 cursor-pointer items-center font-semibold">Tus derechos sobre tus datos (Ley 25.326)</summary>
                  <p className="mt-1">{AAIP_ACCESS_NOTICE}</p>
                  <p className="mt-1">{AAIP_AUTHORITY_NOTICE}</p>
                </details>
              </div>
              {/* Campo trampa para bots: invisible para personas y lectores de pantalla. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor="co-website">No completar</label>
                <input id="co-website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </div>
            </fieldset>

            {Object.values(errors).some(Boolean) && (
              <p role="alert" className="pop-in rounded-btn border border-[var(--amancay-wine)] bg-white p-3 font-semibold text-[var(--amancay-wine)]">
                Revisá los campos marcados.
              </p>
            )}
            {submitError && (
              <p role="alert" className="pop-in rounded-btn border border-[var(--amancay-wine)] bg-white p-3 font-semibold text-[var(--amancay-wine)]">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="btn btn-primary min-h-14 w-full text-[17px] shadow-[var(--shadow-lift)] disabled:opacity-70"
            >
              {submitting
                ? paymentMethod === 'mercadopago'
                  ? 'Te llevamos a Mercado Pago…'
                  : 'Confirmando el pedido…'
                : paymentMethod === 'mercadopago'
                  ? `Pagar con Mercado Pago · ${formatPrice(finalTotal)}`
                  : `Confirmar pedido · ${formatPrice(finalTotal)}`}
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
      <div className="enter mx-auto max-w-2xl space-y-6 rounded-lg bg-white p-6 shadow-[var(--shadow-lift)] sm:p-10">
        <div className="space-y-2 border-b border-[var(--amancay-border)] pb-6 text-center">
          <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-olive-wash)] text-[var(--brand-olive)]">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path className="draw-check" d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <h1 className="font-display text-[32px] tracking-[-0.02em]">Gracias, {order.customer.fullName.split(' ')[0]}</h1>
          <p className="text-[var(--ink-muted)]">
            Registramos tu pedido <strong className="text-[var(--ink-primary)]">#{order.orderNumber}</strong> por{' '}
            <strong className="text-[var(--ink-primary)]">{formatPrice(order.total)}</strong>.
          </p>
        </div>

        <div className="rounded-btn bg-[var(--bg-subtle)] p-4">
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
          <div className="space-y-3 rounded-btn border border-[var(--brand-brass)] bg-[var(--brand-leather-wash)] p-5">
            <p className="font-display text-xl">Datos para transferir</p>
            <p className="text-sm text-[var(--ink-secondary)]">
              Te reservamos los productos 48 horas. Cuando transfieras, mandanos el comprobante por WhatsApp con el código del pedido.
            </p>
            {STORE.transfer.isPlaceholder && (
              <p className="rounded-btn bg-white p-2.5 text-sm font-semibold text-[var(--amancay-wine)]">Datos de ejemplo de la demo. No transfieras a esta cuenta.</p>
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
              <div className="flex justify-between border-t border-[var(--brand-brass)] pt-2 text-base font-semibold">
                <dt>Monto</dt>
                <dd className="font-bold tabular-nums">{formatPrice(order.total)}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={copyAlias}
              className="btn btn-primary w-full"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copiar alias
            </button>
            <p role="status" className="text-center text-sm">
              {copied === 'ok' ? 'Alias copiado.' : copied === 'error' ? 'No se pudo copiar. Seleccioná el alias y copialo a mano.' : ''}
            </p>
          </div>
        )}

        {order.paymentMethod === 'mercadopago' && order.paymentStatus !== 'aprobado' && (
          <p className="rounded-btn bg-[var(--bg-subtle)] p-4 text-[var(--ink-muted)]">
            Todavía no recibimos la confirmación de Mercado Pago. Apenas llegue, el pedido pasa a &ldquo;Pago confirmado&rdquo; en
            Mis pedidos.
          </p>
        )}

        {order.paymentMethod === 'mostrador' && (
          <p className="rounded-btn bg-[var(--bg-subtle)] p-4 text-[var(--ink-muted)]">
            Pagás en efectivo o con tarjeta cuando retirás.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={whatsappUrl(`Hola Amancay, hice el pedido #${order.orderNumber} a nombre de ${waText(order.customer.fullName)} por ${formatPrice(order.total)}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-lg btn-whatsapp-solid flex-1"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Avisar por WhatsApp
          </a>
          <Link href="/mis-pedidos" className="btn btn-lg btn-primary flex-1">
            <Package className="h-4 w-4" aria-hidden="true" />
            Seguir mi pedido
          </Link>
        </div>
        <p className="text-center text-sm text-[var(--ink-muted)]">
          Guardá el código <strong className="text-[var(--ink-primary)]">{order.orderNumber}</strong>: con él encontrás el pedido en “Mis pedidos” desde este
          navegador.{' '}
          <Link href="/" className="link-brass">
            Volver a la tienda
          </Link>
        </p>
      </div>
    </div>
  );
}
