import 'server-only';
import type { Order } from '@/lib/types';
import { PAYMENT_LABELS, SHIPPING_LABELS, STORE, formatPrice } from '@/lib/storeConfig';

/*
 * Emails con Resend (https://resend.com), por su API REST: sin dependencias extra.
 *
 * Variables:
 *   RESEND_API_KEY      clave de la API (re_...)
 *   EMAIL_FROM          remitente de un dominio verificado en Resend, ej. "Amancay <pedidos@amancay.com.ar>"
 *   STORE_NOTIFY_EMAIL  a dónde le avisamos al local de cada pedido nuevo
 *   EMAIL_REPLY_TO      (opcional) a dónde llegan las respuestas del cliente
 *
 * Sin RESEND_API_KEY no se manda nada (se deja registro en la consola) y la tienda sigue andando.
 * Nunca se tira error hacia afuera: un mail que falla no puede romper una compra.
 */

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

const esc = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

async function send(to: string, subject: string, html: string): Promise<boolean> {
  if (!emailConfigured()) {
    console.info(`[email] sin RESEND_API_KEY: no se mandó "${subject}"`);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [to],
        subject,
        html: layout(subject, html),
        ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error('[email] Resend respondió', res.status, (await res.text()).slice(0, 200));
    return res.ok;
  } catch (e) {
    console.error('[email] no se pudo mandar', e);
    return false;
  }
}

function layout(title: string, body: string): string {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#fdf9f0;font-family:Arial,Helvetica,sans-serif;color:#2b211b">
<div style="max-width:560px;margin:0 auto;padding:24px">
  <p style="font-size:22px;font-weight:bold;margin:0 0 16px">Amancay</p>
  <div style="background:#ffffff;border-radius:8px;padding:24px">
    <h1 style="font-size:20px;margin:0 0 12px">${esc(title)}</h1>
    ${body}
  </div>
  <p style="font-size:12px;color:#7a6a5d;margin:16px 0 0">${esc(STORE.address)}, ${esc(STORE.neighborhood)} · WhatsApp ${esc(STORE.whatsappDisplay)}</p>
</div></body></html>`;
}

function itemsTable(order: Order): string {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 0">${esc(i.productName)}${i.variantName ? ` (${esc(i.variantName)})` : ''} × ${i.quantity}</td><td style="padding:4px 0;text-align:right">${formatPrice(i.totalPrice)}</td></tr>`
    )
    .join('');
  const shipping =
    order.shippingMethod === 'moto_caba'
      ? 'A confirmar con el vendedor'
      : order.shippingCost === 0
        ? 'Sin costo'
        : formatPrice(order.shippingCost);
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
<tr><td style="padding:4px 0;border-top:1px solid #eee">${esc(order.shippingService ?? SHIPPING_LABELS[order.shippingMethod])}</td><td style="padding:4px 0;border-top:1px solid #eee;text-align:right">${shipping}</td></tr>
<tr><td style="padding:6px 0;font-weight:bold">Total</td><td style="padding:6px 0;text-align:right;font-weight:bold">${formatPrice(order.total)}</td></tr></table>`;
}

const p = (text: string) => `<p style="font-size:15px;line-height:1.5;margin:0 0 12px">${text}</p>`;
const ordersLink = () => (site() ? p(`Seguilo en <a href="${site()}/mis-pedidos">Mis pedidos</a> con el código y tu email.`) : '');

/** Al confirmar el pedido (al cliente). */
export async function sendOrderConfirmation(order: Order) {
  const first = esc(order.customer.fullName.split(' ')[0] ?? '');
  const how =
    order.paymentMethod === 'transferencia'
      ? p('Te reservamos los productos 48 horas. Cuando transfieras, mandanos el comprobante por WhatsApp con el código del pedido.')
      : order.paymentMethod === 'mostrador'
        ? p('Pagás en efectivo o con tarjeta cuando lo retirás. Te lo guardamos 72 horas.')
        : p('Apenas Mercado Pago confirme el pago te avisamos por acá.');
  const where =
    order.shippingMethod === 'pickup'
      ? p(`Lo retirás en ${esc(STORE.address)}. Te avisamos cuando esté listo.`)
      : order.shippingMethod === 'moto_caba'
        ? p('Lo mandamos en moto por app: el costo te lo confirmamos por WhatsApp cuando la pedimos y se paga aparte.')
        : p('Lo mandamos por Correo Argentino y te pasamos el número de seguimiento.');
  await send(
    order.customer.email,
    `Recibimos tu pedido ${order.orderNumber}`,
    p(`Hola ${first}, ¡gracias por tu compra!`) + p(`Código del pedido: <strong>${esc(order.orderNumber)}</strong>`) + itemsTable(order) + how + where + ordersLink()
  );
}

/** Aviso al local de un pedido nuevo. */
export async function notifyStoreNewOrder(order: Order) {
  const to = process.env.STORE_NOTIFY_EMAIL;
  if (!to) return;
  await send(
    to,
    `Pedido nuevo ${order.orderNumber} · ${formatPrice(order.total)}`,
    p(`<strong>${esc(order.customer.fullName)}</strong> · ${esc(order.customer.phone)} · ${esc(order.customer.email)}`) +
      p(`${esc(SHIPPING_LABELS[order.shippingMethod])} · ${esc(PAYMENT_LABELS[order.paymentMethod])}`) +
      (order.customer.address ? p(`${esc(order.customer.address)}, ${esc(order.customer.city ?? '')} (CP ${esc(order.customer.postalCode ?? '')})`) : '') +
      itemsTable(order) +
      (site() ? p(`<a href="${site()}/admin">Abrir el panel</a>`) : '')
  );
}

/** Mercado Pago confirmó el cobro. */
export async function sendPaymentApproved(order: Pick<Order, 'orderNumber' | 'total' | 'customer'>) {
  await send(
    order.customer.email,
    `Pago confirmado · pedido ${order.orderNumber}`,
    p(`Recibimos el pago de ${formatPrice(order.total)} del pedido <strong>${esc(order.orderNumber)}</strong>. Ya lo estamos preparando.`) + ordersLink()
  );
}

/** Retiro sin buscar a las 48 h. */
export async function sendPickupReminder(order: Pick<Order, 'orderNumber' | 'paymentMethod' | 'customer'>, expiresAt?: string) {
  const deadline = expiresAt
    ? new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(expiresAt))
    : null;
  await send(
    order.customer.email,
    `Tu pedido ${order.orderNumber} te espera en el local`,
    p(`Tu pedido <strong>${esc(order.orderNumber)}</strong> está esperando en ${esc(STORE.address)}.`) +
      (order.paymentMethod === 'mostrador' && deadline
        ? p(`Te lo guardamos hasta el <strong>${esc(deadline)}</strong>. Después se cancela y los productos vuelven a la venta.`)
        : p('Pasá cuando puedas en el horario del local.')) +
      p(`¿No podés venir? Escribinos por WhatsApp al ${esc(STORE.whatsappDisplay)}.`)
  );
}

/** Botón de arrepentimiento: el código del trámite (la norma pide mandarlo dentro de las 24 h). */
export async function sendWithdrawalCode(input: { email: string; fullName: string; code: string; orderNumber: string }): Promise<boolean> {
  return send(
    input.email,
    `Tu pedido de arrepentimiento ${input.code}`,
    p(`Hola ${esc(input.fullName.split(' ')[0] ?? '')}, recibimos tu pedido para revocar la compra <strong>${esc(input.orderNumber)}</strong>.`) +
      p(`Tu código de trámite es <strong>${esc(input.code)}</strong>. Te escribimos para coordinar la devolución.`)
  );
}
