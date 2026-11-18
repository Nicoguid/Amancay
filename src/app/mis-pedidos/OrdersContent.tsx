'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { Check, Copy, Info, Map as MapIcon, MapPin, MessageCircle, Package, Search, Store, Truck } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/types';
import { useStore } from '@/context/StoreContext';
import { ProductImage } from '@/components/ProductImage';
import { PAYMENT_LABELS, SHIPPING_LABELS, STORE, formatPrice, whatsappUrl, waText } from '@/lib/storeConfig';

/*
 * Mis pedidos (Figma: "Mis Pedidos"). Sin cuenta ni servidor: se listan los pedidos hechos desde
 * este navegador y se puede buscar uno por su código. La pantalla lo dice sin vueltas.
 */

const dateFormat = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Argentina/Buenos_Aires',
});

/** En qué paso está el pedido (0 a 3). */
const STEP_INDEX: Record<OrderStatus, number> = {
  pendiente: 0,
  pagado: 0,
  en_preparacion: 1,
  listo_para_retirar: 2,
  despachado: 2,
  entregado: 3,
};

function stepsFor(order: Order): { title: string; body: string }[] {
  const pickup = order.shippingMethod === 'pickup';
  return [
    {
      title: 'Pedido recibido',
      body: order.status === 'pendiente' ? 'Falta confirmar el pago.' : 'Pago confirmado.',
    },
    { title: 'En preparación', body: 'Lo estamos separando y embalando.' },
    pickup
      ? { title: 'Listo para retirar', body: `Te espera en ${STORE.address}.` }
      : { title: 'Despachado', body: order.shippingMethod === 'moto_caba' ? 'Salió con la moto.' : 'Lo tiene Correo Argentino.' },
    { title: pickup ? 'Retirado' : 'Entregado', body: 'Pedido completo.' },
  ];
}

function statusLabel(order: Order): string {
  switch (order.status) {
    case 'pendiente':
      return 'Esperando el pago';
    case 'pagado':
      return 'Pago confirmado';
    case 'en_preparacion':
      return 'En preparación';
    case 'listo_para_retirar':
      return 'Listo para retirar';
    case 'despachado':
      return 'Despachado';
    default:
      return order.shippingMethod === 'pickup' ? 'Retirado' : 'Entregado';
  }
}

const normalizeCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');

export function OrdersContent() {
  const { myOrders, orders, isHydrated } = useStore();
  const [code, setCode] = useState('');
  const [searched, setSearched] = useState<string | null>(null);
  const [tab, setTab] = useState<'activos' | 'historial'>('activos');

  const active = myOrders.filter((o) => o.status !== 'entregado');
  const history = myOrders.filter((o) => o.status === 'entregado');
  const list = tab === 'activos' ? active : history;

  // La búsqueda mira todos los pedidos guardados en este navegador (menos los de ejemplo del panel).
  const found = searched ? orders.find((o) => !o.isSample && normalizeCode(o.orderNumber) === searched) : undefined;

  return (
    <div className="min-h-[70vh] bg-[var(--bg-page)] pb-16 pt-6 text-[var(--ink-primary)] sm:pt-10">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-8">
        <header className="enter" style={{ '--i': 0 } as CSSProperties}>
          <p className="eyebrow eyebrow-rule">Seguimiento</p>
          <h1 className="mt-2 font-display text-[32px] leading-tight tracking-[-0.02em] sm:text-[40px]">Mis pedidos</h1>
          <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
            Acá ves en qué paso está cada pedido que hiciste desde este navegador, y podés buscar uno por su código.
          </p>
        </header>

        <form
          className="enter card-rest mt-6 rounded-lg bg-white p-5 sm:p-6"
          style={{ '--i': 1 } as CSSProperties}
          onSubmit={(e) => {
            e.preventDefault();
            setSearched(normalizeCode(code) || null);
          }}
        >
          <label htmlFor="pedido-codigo" className="block font-semibold">
            Buscar un pedido por código
          </label>
          <p id="pedido-codigo-hint" className="mt-0.5 text-sm text-[var(--ink-muted)]">
            Es el que te mostramos al confirmar la compra, por ejemplo AMC-123456.
          </p>
          <div className="mt-3 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" aria-hidden="true" />
              <input
                id="pedido-codigo"
                name="codigo"
                type="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                aria-describedby="pedido-codigo-hint"
                placeholder="AMC-123456…"
                className="field pl-9 uppercase tabular-nums placeholder:normal-case"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Buscar
            </button>
          </div>
          <div aria-live="polite">
            {searched && !found && isHydrated && (
              <p className="pop-in mt-3 flex items-start gap-2 rounded-btn bg-[var(--bg-subtle)] p-3 text-sm text-[var(--ink-secondary)]">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-gold)]" aria-hidden="true" />
                <span>
                  No encontramos ese código en este navegador. Si hiciste el pedido desde otro dispositivo,{' '}
                  <a
                    href={whatsappUrl(`Hola Amancay, quiero consultar por el pedido ${waText(code)}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-brass"
                  >
                    consultalo por WhatsApp
                  </a>{' '}
                  con el código.
                </span>
              </p>
            )}
          </div>
        </form>

        {found && (
          <section aria-label="Resultado de la búsqueda" className="mt-6">
            <OrderCard order={found} />
          </section>
        )}

        <section aria-labelledby="pedidos-lista" className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="pedidos-lista" className="font-display text-2xl">
              Hechos desde este navegador
            </h2>
            <div role="group" aria-label="Qué pedidos ver" className="inline-flex gap-1 rounded-btn bg-[var(--chip)] p-1">
              {(
                [
                  ['activos', 'En curso', active.length],
                  ['historial', 'Historial', history.length],
                ] as const
              ).map(([id, label, count]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={tab === id}
                  onClick={() => setTab(id)}
                  className={`tap-interactive min-h-10 rounded-[3px] px-3.5 text-sm font-semibold ${
                    tab === id ? 'bg-[var(--ink-primary)] text-white' : 'text-[var(--ink-secondary)] hover:bg-[var(--chip-strong)]'
                  }`}
                >
                  {label} <span className="tabular-nums opacity-75">({isHydrated ? count : 0})</span>
                </button>
              ))}
            </div>
          </div>

          {!isHydrated ? (
            <p className="mt-8 text-center text-[var(--ink-muted)]" role="status">
              Cargando tus pedidos…
            </p>
          ) : list.length === 0 ? (
            <div key={tab} className="swap-in mt-6 rounded-lg bg-[var(--bg-subtle)] p-8 text-center sm:p-10">
              <span className="icon-tile mx-auto h-14 w-14">
                <Package className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="mt-4 font-display text-xl">{tab === 'activos' ? 'No tenés pedidos en curso' : 'Todavía no hay pedidos entregados'}</p>
              <p className="mx-auto mt-1.5 max-w-md text-[15px] text-[var(--ink-muted)]">
                Los pedidos se guardan en el navegador donde los hacés. Si compraste desde otro dispositivo, buscalo arriba por su código o
                escribinos.
              </p>
              <Link href="/catalogo" className="btn btn-primary mt-5">
                Ir al catálogo
              </Link>
            </div>
          ) : (
            <ul key={tab} className="swap-in mt-5 space-y-5">
              {list.map((order) => (
                <li key={order.id}>
                  <OrderCard order={order} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-10 flex flex-col gap-4 rounded-lg bg-[var(--bg-sand)] p-6 text-[var(--ink-primary)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--ink-gold)]">Atención del local</p>
            <h2 className="mt-1.5 font-display text-xl sm:text-2xl">¿Tenés alguna duda sobre tu entrega o retiro?</h2>
            <p className="mt-1 max-w-xl text-[15px] text-[var(--ink-muted)]">Escribinos con el código del pedido y lo vemos en el momento.</p>
          </div>
          <a
            href={whatsappUrl('Hola Amancay, tengo una consulta sobre mi pedido.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-lg btn-gold shrink-0"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span className="tabular-nums">{STORE.whatsappDisplay}</span>
            <span className="sr-only"> (WhatsApp, se abre en otra pestaña)</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [copied, setCopied] = useState<'ok' | 'error' | null>(null);
  const steps = stepsFor(order);
  const current = STEP_INDEX[order.status];
  const done = order.status === 'entregado';
  const pickup = order.shippingMethod === 'pickup';
  const ready = order.status === 'listo_para_retirar';

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied('ok');
    } catch {
      setCopied('error');
    }
  };

  return (
    <article className="card-rest overflow-hidden rounded-lg bg-white">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-[var(--amancay-border)] bg-[var(--bg-sand)] px-5 py-4 text-[var(--ink-primary)] sm:px-7">
        <div className="flex items-center gap-3">
          <span className="icon-tile">
            {pickup ? <Store className="h-5 w-5" aria-hidden="true" /> : <Truck className="h-5 w-5" aria-hidden="true" />}
          </span>
          <div>
            <h3 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-display text-xl">
              <span className="tabular-nums">Pedido {order.orderNumber}</span>
              <span className={`tag ${ready ? 'tag-gold' : 'bg-white text-[var(--ink-primary)]'}`}>{statusLabel(order)}</span>
            </h3>
            <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
              {dateFormat.format(new Date(order.createdAt))} · {SHIPPING_LABELS[order.shippingMethod]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-right">
            <span className="block text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--ink-muted)]">Total</span>
            <span className="text-lg font-bold tabular-nums">{formatPrice(order.total)}</span>
          </p>
          <button type="button" onClick={copyCode} className="btn bg-white px-3 text-sm text-[var(--ink-primary)] hover:bg-[var(--brand-gold-soft)]">
            {copied === 'ok' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied === 'ok' ? 'Copiado' : 'Copiar código'}
          </button>
          <span className="sr-only" role="status">
            {copied === 'ok' ? 'Código copiado.' : copied === 'error' ? 'No se pudo copiar el código.' : ''}
          </span>
        </div>
      </header>

      <div className="space-y-6 p-5 sm:p-7">
        {/* Seguimiento: cuatro pasos; el actual resaltado y los anteriores con tilde. */}
        <section aria-label="Seguimiento del pedido">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h4 className="font-display text-lg">Seguimiento</h4>
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--ink-gold)]">
              Paso {Math.min(current + 1, 4)} de 4
            </p>
          </div>
          <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
            {steps.map((step, i) => {
              const isDone = i < current || done;
              const isCurrent = i === current && !done;
              return (
                <li
                  key={step.title}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`relative flex gap-3 rounded-btn p-3.5 sm:flex-col sm:gap-2 sm:pb-5 ${
                    isCurrent ? 'bg-[var(--brand-gold-soft)]' : 'bg-[var(--bg-subtle)]'
                  } ${!isDone && !isCurrent ? 'text-[var(--ink-muted)]' : ''}`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold ${
                      isDone
                        ? 'bg-[var(--brand-espresso)] text-white'
                        : isCurrent
                          ? 'bg-[var(--brand-gold)] text-[var(--ink-on-gold)]'
                          : 'bg-[var(--chip-strong)] text-[var(--ink-muted)]'
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug">
                      {step.title}
                      <span className="sr-only">{isDone ? ' (hecho)' : isCurrent ? ' (paso actual)' : ' (pendiente)'}</span>
                    </p>
                    <p className="mt-0.5 text-sm leading-snug text-[var(--ink-muted)]">{step.body}</p>
                  </div>
                  {(isDone || isCurrent) && (
                    <span aria-hidden="true" className="absolute inset-x-3.5 bottom-2 hidden h-1 overflow-hidden rounded-full bg-black/5 sm:block">
                      <span
                        className={`fill-bar block h-full rounded-full ${isDone ? 'w-full bg-[var(--brand-espresso)]' : 'w-1/2 bg-[var(--ink-gold)]'}`}
                        style={{ '--i': i } as CSSProperties}
                      />
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section aria-label={pickup ? 'Dónde retirar' : 'Dónde se entrega'} className="rounded-btn bg-[var(--bg-subtle)] p-5">
            <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--ink-gold)]">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {pickup ? 'Punto de retiro' : 'Entrega'}
            </p>
            {pickup ? (
              <>
                <p className="mt-2 font-display text-xl">Amancay · {STORE.address}</p>
                <p className="mt-1 text-[15px] text-[var(--ink-muted)]">
                  {STORE.neighborhood}. {STORE.transit}.
                </p>
                <ul className="mt-3 space-y-0.5 text-sm">
                  {STORE.hours.map((h) => (
                    <li key={h.days}>
                      <span className="font-semibold">{h.days}:</span> <span className="tabular-nums text-[var(--ink-muted)]">{h.time}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 flex items-start gap-2 rounded-btn bg-[var(--brand-gold-soft)] p-3 text-sm text-[var(--ink-secondary)]">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-gold)]" aria-hidden="true" />
                  <span>
                    Para retirar, decí el código <strong className="tabular-nums">{order.orderNumber}</strong> o el nombre{' '}
                    <strong>{order.customer.fullName}</strong>.
                  </span>
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={whatsappUrl(`Hola Amancay, paso a retirar el pedido ${order.orderNumber} a nombre de ${waText(order.customer.fullName)}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary flex-1"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Avisar que voy
                    <span className="sr-only"> (WhatsApp, se abre en otra pestaña)</span>
                  </a>
                  <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-quiet">
                    <MapIcon className="h-4 w-4" aria-hidden="true" />
                    Ver en Google Maps
                    <span className="sr-only"> (se abre en otra pestaña)</span>
                  </a>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 font-display text-xl">{SHIPPING_LABELS[order.shippingMethod]}</p>
                <p className="mt-1 text-[15px] text-[var(--ink-muted)]">
                  {order.customer.address}, {order.customer.city} (CP {order.customer.postalCode}). A nombre de {order.customer.fullName}.
                </p>
                <a
                  href={whatsappUrl(`Hola Amancay, quiero consultar por el envío del pedido ${order.orderNumber}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary mt-4"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Consultar por el envío
                  <span className="sr-only"> (WhatsApp, se abre en otra pestaña)</span>
                </a>
              </>
            )}
          </section>

          <section aria-label="Productos del pedido" className="rounded-btn bg-[var(--bg-subtle)] p-5">
            <p className="flex items-center justify-between text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
              En este pedido
              <span className="tag tag-gold tabular-nums">
                {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
              </span>
            </p>
            <ul className="mt-3 space-y-2">
              {order.items.map((item) => (
                <li key={`${item.productId}-${item.variantId ?? ''}`} className="flex items-center gap-3 rounded-btn bg-white p-2.5">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-[var(--bg-sunken)]">
                    <ProductImage src={item.productImage} alt="" width={56} height={56} className="photo-on-linen h-full w-full object-contain p-1" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.productName}</p>
                    <p className="text-sm text-[var(--ink-muted)]">
                      {item.variantName ? `${item.variantName} · ` : ''}
                      <span className="tabular-nums">{item.quantity}</span> {item.quantity === 1 ? 'unidad' : 'unidades'}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">{formatPrice(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-[var(--amancay-border)] pt-3 text-[15px]">
              <div className="flex justify-between text-[var(--ink-muted)]">
                <dt>Productos</dt>
                <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-[var(--ink-muted)]">
                <dt>{SHIPPING_LABELS[order.shippingMethod]}</dt>
                <dd className="tabular-nums">{order.shippingCost === 0 ? 'Sin costo' : formatPrice(order.shippingCost)}</dd>
              </div>
              <div className="flex justify-between text-[var(--ink-muted)]">
                <dt>Pago</dt>
                <dd>{PAYMENT_LABELS[order.paymentMethod]}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </article>
  );
}
