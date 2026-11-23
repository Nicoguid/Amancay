'use client';

import { useState, type CSSProperties } from 'react';
import { FlipCard } from '@/components/FlipCard';
import Link from 'next/link';
import { ArrowLeft, Bike, Bookmark, Check, ChevronRight, CreditCard, MapPin, MessageCircle, Package, ShieldCheck, Store, Trash2, Truck, UserRound } from 'lucide-react';
import { EMPTY_PROFILE, useStore, type CustomerProfile } from '@/context/StoreContext';
import type { ShippingMethod } from '@/lib/types';
import { PROMO, PROMO_UNTIL_LABEL, CORREO_PRICE_LABEL, MOTO_PRICE_LABEL, STORE, whatsappUrl } from '@/lib/storeConfig';
import { legalPath } from '@/lib/legal';
import { usePromoActive } from '@/lib/usePromo';

/*
 * Mi perfil (Figma: "Perfil de Usuario"), sin cuenta: los datos quedan solo en este navegador
 * y sirven para completar el checkout. Datos mínimos: no se guarda DNI ni medios de pago.
 */

type Errors = Partial<Record<'fullName' | 'phone' | 'email' | 'postalCode', string>>;

/** Todo es opcional, pero lo que se escribe tiene que servir. */
function validate(data: CustomerProfile): Errors {
  const errors: Errors = {};
  if (data.fullName.trim() && data.fullName.trim().length < 3) errors.fullName = 'Escribí tu nombre y apellido.';
  if (data.phone.trim() && data.phone.replace(/\D/g, '').length < 8) errors.phone = 'Escribí un teléfono con código de área, ej.: 11 2345 6789.';
  if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Escribí un email válido, ej.: nombre@mail.com.';
  if (data.postalCode.trim() && !/\d{4}/.test(data.postalCode)) errors.postalCode = 'Escribí el código postal (4 números).';
  return errors;
}

const DELIVERY: { id: ShippingMethod; icon: typeof Store; title: string; detail: string }[] = [
  { id: 'pickup', icon: Store, title: 'Retiro en el local', detail: `${STORE.address}. Sin costo.` },
  { id: 'moto_caba', icon: Bike, title: 'Moto en CABA', detail: `${MOTO_PRICE_LABEL}. Se paga aparte.` },
  { id: 'correo_argentino', icon: Truck, title: 'Correo Argentino', detail: `${CORREO_PRICE_LABEL}, a todo el país.` },
];

export function ProfileContent() {
  const { profile, saveProfile, clearProfile, isHydrated, myOrders, savedIds } = useStore();
  const [form, setForm] = useState<CustomerProfile>(EMPTY_PROFILE);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'saved' | 'cleared'>('idle');
  const [confirmClear, setConfirmClear] = useState(false);
  // Tarjetas reversibles: Datos personales / Pagos y Entrega / Para envíos.
  const [showPagos, setShowPagos] = useState(false);
  const [showEnvios, setShowEnvios] = useState(false);
  const promoActive = usePromoActive();

  // El formulario se completa una sola vez con lo guardado, cuando ya se leyó el navegador.
  const [loaded, setLoaded] = useState(false);
  if (isHydrated && !loaded) {
    setLoaded(true);
    if (profile) setForm(profile);
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(profile ?? EMPTY_PROFILE);

  const setField = <K extends keyof CustomerProfile>(name: K, value: CustomerProfile[K]) => {
    setForm((f) => ({ ...f, [name]: value }));
    setStatus('idle');
    if (name in errors) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      // Si el error está en una cara que no se ve, se da vuelta la tarjeta antes de llevar el foco.
      if (first === 'postalCode') setShowEnvios(true);
      else setShowPagos(false);
      const formEl = e.currentTarget;
      requestAnimationFrame(() => requestAnimationFrame(() => formEl.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus()));
      return;
    }
    saveProfile(form);
    setStatus('saved');
  };

  const field = (
    name: 'fullName' | 'phone' | 'email' | 'address' | 'city' | 'postalCode',
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>
  ) => {
    const error = errors[name as keyof Errors];
    return (
      <div>
        <label htmlFor={`perfil-${name}`} className="mb-1 block text-sm font-semibold">
          {label}
        </label>
        <input
          id={`perfil-${name}`}
          name={name}
          value={form[name]}
          onChange={(e) => setField(name, e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `perfil-${name}-error` : undefined}
          className="field"
          {...props}
        />
        {error && (
          <p id={`perfil-${name}-error`} className="mt-1 text-sm text-[var(--amancay-wine)]">
            {error}
          </p>
        )}
      </div>
    );
  };

  const flipButton = (label: string, Icon: typeof Store, onClick: () => void) => (
    <button type="button" data-flip-focus onClick={onClick} className="btn btn-quiet shrink-0 px-3 text-sm">
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );

  const firstName = (profile?.fullName ?? '').trim().split(' ')[0];
  const ordersCount = isHydrated ? myOrders.length : 0;
  const savedCount = isHydrated ? savedIds.length : 0;

  return (
    <div className="min-h-[70vh] bg-[var(--bg-page)] pb-16 pt-6 text-[var(--ink-primary)] sm:pt-10">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-8">
        <header className="enter" style={{ '--i': 0 } as CSSProperties}>
          <p className="eyebrow eyebrow-rule">Tus datos, en este navegador</p>
          <h1 className="mt-2 font-display text-[32px] leading-tight tracking-[-0.02em] sm:text-[40px]">
            {firstName ? `Hola, ${firstName}` : 'Mi perfil'}
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
            Guardá tu contacto y tu entrega habitual para no escribirlos en cada compra. No es una cuenta: no hay contraseña y nada de esto
            sale de tu navegador hasta que confirmás un pedido.
          </p>
        </header>

        <div className="mt-7 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <aside className="enter space-y-4 lg:sticky lg:top-36 lg:col-span-4" style={{ '--i': 1, '--rise': '16px' } as CSSProperties}>
            <nav aria-label="Tus secciones" className="card-rest overflow-hidden rounded-lg bg-white">
              <div className="flex items-center gap-3 border-b border-[var(--bg-sunken)] p-5">
                <span className="icon-tile h-12 w-12">
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-xl">{profile?.fullName || 'Sin nombre guardado'}</p>
                  <p className="truncate text-sm text-[var(--ink-muted)]">{profile?.email || 'Completá tus datos acá al lado'}</p>
                </div>
              </div>
              <ul className="p-2">
                {[
                  { href: '/mis-pedidos', label: 'Mis pedidos', icon: Package, count: ordersCount },
                  { href: '/guardados', label: 'Guardados', icon: Bookmark, count: savedCount },
                ].map(({ href, label, icon: Icon, count }) => (
                  <li key={href}>
                    <Link href={href} className="tap-interactive flex min-h-12 items-center gap-3 rounded-btn px-3 font-semibold hover:bg-[var(--bg-subtle)]">
                      <Icon className="h-4 w-4 text-[var(--ink-gold)]" aria-hidden="true" />
                      <span className="flex-1">{label}</span>
                      <span className="tag tag-quiet tabular-nums">{count}</span>
                      <ChevronRight className="arrow-nudge h-4 w-4 text-[var(--ink-muted)]" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="rounded-lg bg-[var(--bg-sunken)] p-5">
              <p className="flex items-center gap-2 font-semibold">
                <MessageCircle className="h-4 w-4 text-[var(--ink-gold)]" aria-hidden="true" />
                Atención del local
              </p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--ink-muted)]">¿Necesitás ayuda con una compra o querés fotos de un producto?</p>
              <a href={whatsappUrl('Hola Amancay, quiero hacer una consulta.')} target="_blank" rel="noopener noreferrer" className="btn btn-gold mt-3 w-full">
                Escribir por WhatsApp
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            </div>
          </aside>

          <form noValidate onSubmit={onSubmit} className="space-y-5 lg:col-span-8">
            <FlipCard
              className="enter"
              flipped={showPagos}
              onFlip={setShowPagos}
              front={
                <fieldset className="card-rest h-full space-y-4 rounded-lg bg-white p-5 sm:p-7">
                  <legend className="float-left mb-1 flex w-full flex-wrap items-start justify-between gap-3">
                    <span>
                      <span className="eyebrow block">Contacto</span>
                      <span className="mt-1 block font-display text-2xl">Datos personales</span>
                    </span>
                    {flipButton('Ver medios de pago', CreditCard, () => setShowPagos(true))}
                  </legend>
                  <div className="clear-both grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {field('fullName', 'Nombre y apellido', { type: 'text', autoComplete: 'name', placeholder: 'Ej.: Juana Pérez…' })}
                    {field('phone', 'Teléfono / WhatsApp', { type: 'tel', autoComplete: 'tel', placeholder: 'Ej.: 11 2345 6789…' })}
                    <div className="sm:col-span-2">
                      {field('email', 'Email', { type: 'email', autoComplete: 'email', spellCheck: false, placeholder: 'nombre@mail.com…' })}
                    </div>
                  </div>
                  <p className="text-sm text-[var(--ink-muted)]">Al teléfono te avisamos por WhatsApp cuando el pedido está listo.</p>
                </fieldset>
              }
              back={
                <section aria-labelledby="pagos-title" className="h-full rounded-lg bg-[var(--bg-sand)] p-5 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow">Pagos</p>
                      <h2 id="pagos-title" className="mt-1 font-display text-2xl">
                        Medios de pago
                      </h2>
                    </div>
                    {flipButton('Volver a tus datos', ArrowLeft, () => setShowPagos(false))}
                  </div>
                  <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <li className="rounded-btn bg-white/80 p-4">
                      <p className="font-semibold">Online</p>
                      <p className="mt-0.5 text-sm text-[var(--ink-muted)]">Mercado Pago o transferencia bancaria.</p>
                    </li>
                    <li className="rounded-btn bg-white/80 p-4">
                      <p className="font-semibold">Al retirar en el local</p>
                      <p className="mt-0.5 text-sm text-[var(--ink-muted)]">También efectivo o tarjeta.</p>
                    </li>
                    <li className="rounded-btn bg-white/80 p-4 sm:col-span-2">
                      <p className="font-semibold">Mismo precio con cualquier medio de pago</p>
                      <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
                        {promoActive ? `${PROMO.title}, hasta el ${PROMO_UNTIL_LABEL}.` : 'Sin recargos ni descuentos por medio de pago.'}
                      </p>
                    </li>
                  </ul>
                  <p className="mt-4 text-sm text-[var(--ink-muted)]">No guardamos datos de tarjetas ni de cuentas.</p>
                </section>
              }
            />

            <FlipCard
              className="enter"
              flipped={showEnvios}
              onFlip={setShowEnvios}
              front={
                <fieldset className="card-rest h-full rounded-lg bg-white p-5 sm:p-7">
                  <legend className="float-left mb-4 flex w-full flex-wrap items-start justify-between gap-3">
                    <span>
                      <span className="eyebrow block">Entrega</span>
                      <span className="mt-1 block font-display text-2xl">¿Cómo recibís tus pedidos casi siempre?</span>
                    </span>
                    {flipButton('Dirección para envíos', MapPin, () => setShowEnvios(true))}
                  </legend>
                  <div className="clear-both grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {DELIVERY.map(({ id, icon: Icon, title, detail }) => {
                      const selected = form.shippingMethod === id;
                      return (
                        <label
                          key={id}
                          className={`relative flex cursor-pointer flex-col gap-1.5 rounded-btn border p-4 transition-[border-color,background-color,box-shadow] duration-150 ${
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
                            onChange={() => setField('shippingMethod', id)}
                            className="absolute right-3 top-3 h-5 w-5 accent-[var(--brand-espresso)]"
                          />
                          <Icon className="h-5 w-5 text-[var(--ink-gold)]" aria-hidden="true" />
                          <span className="pr-6 font-semibold">{title}</span>
                          <span className="text-sm leading-snug text-[var(--ink-muted)]">{detail}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              }
              back={
                <fieldset className="h-full space-y-4 rounded-lg bg-[var(--bg-sand)] p-5 sm:p-7">
                  <legend className="float-left mb-1 flex w-full flex-wrap items-start justify-between gap-3">
                    <span>
                      <span className="eyebrow block">Para envíos</span>
                      <span className="mt-1 block font-display text-2xl">Dirección</span>
                    </span>
                    {flipButton('Volver a la entrega', ArrowLeft, () => setShowEnvios(false))}
                  </legend>
                  <p className="clear-both text-sm text-[var(--ink-muted)]">Opcional. Solo hace falta si pedís envío por moto o correo.</p>
                  {field('address', 'Calle, número, piso y depto.', { type: 'text', autoComplete: 'street-address', placeholder: 'Ej.: Bulnes 742, 3.° B…' })}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {field('city', 'Localidad o barrio', { type: 'text', autoComplete: 'address-level2', placeholder: 'Ej.: Caballito, CABA…' })}
                    {field('postalCode', 'Código postal', { type: 'text', inputMode: 'numeric', autoComplete: 'postal-code', placeholder: 'Ej.: 1176…' })}
                  </div>
                </fieldset>
              }
            />

            <div className="rounded-lg bg-[var(--bg-sunken)] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
              <p className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--ink-secondary)]">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ink-gold)]" aria-hidden="true" />
                <span>
                  Estos datos se guardan solo en este navegador. No pedimos DNI ni datos de pago.{' '}
                  <Link href={legalPath('privacidad')} className="link-brass">
                    Política de privacidad
                  </Link>
                </span>
              </p>
              <div className="mt-4 flex shrink-0 flex-col items-stretch gap-1 sm:mt-0 sm:items-end">
                <button type="submit" className={`btn btn-lg ${status === 'saved' && !dirty ? 'bg-[var(--brand-olive)] text-white' : 'btn-primary'}`}>
                  {status === 'saved' && !dirty && <Check className="h-4 w-4" aria-hidden="true" />}
                  {status === 'saved' && !dirty ? 'Datos guardados' : 'Guardar mis datos'}
                </button>
                <p role="status" className="text-right text-sm text-[var(--ink-muted)]">
                  {status === 'saved' && !dirty
                    ? 'Listo: el checkout ya los va a traer completos.'
                    : status === 'cleared'
                      ? 'Borramos tus datos de este navegador.'
                      : dirty && loaded
                        ? 'Tenés cambios sin guardar.'
                        : ''}
                </p>
              </div>
            </div>

            {profile && (
              <p className="flex min-h-11 flex-wrap items-center gap-x-2 text-sm">
                {confirmClear ? (
                  <>
                    <span className="text-[var(--ink-muted)]">¿Borrar tus datos de este navegador?</span>
                    <button
                      type="button"
                      onClick={() => {
                        clearProfile();
                        setForm(EMPTY_PROFILE);
                        setErrors({});
                        setConfirmClear(false);
                        setStatus('cleared');
                      }}
                      className="inline-flex min-h-11 items-center font-semibold text-[var(--amancay-wine)] underline underline-offset-4"
                    >
                      Sí, borrar
                    </button>
                    <button type="button" onClick={() => setConfirmClear(false)} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-[var(--ink-muted)] underline underline-offset-4 hover:text-[var(--amancay-wine)]"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Borrar mis datos de este navegador
                  </button>
                )}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
