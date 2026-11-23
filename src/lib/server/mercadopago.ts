import 'server-only';
import { randomUUID } from 'node:crypto';
import { MercadoPagoConfig, Order as MpOrder, WebhookSignatureValidator } from 'mercadopago';
import { SHIPPING_LABELS } from '@/lib/storeConfig';
import type { DbOrder, DbOrderItem } from './database.types';

/*
 * Mercado Pago — Checkout Pro con la API de Orders.
 *
 * Flujo:
 * 1. El servidor crea el pedido en la base (create_order: precios de la base + reserva de stock).
 * 2. Acá se crea la Order de Mercado Pago con ESE total y se devuelve checkout_url.
 * 3. El cliente paga en Mercado Pago y vuelve a /checkout/resultado.
 * 4. Mercado Pago avisa por webhook (/api/mercadopago/webhook): se valida la firma, se CONSULTA
 *    la Order a Mercado Pago (nunca se confía en el cuerpo del aviso) y se actualiza el pedido.
 */

export function mpConfigured(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

let orderClient: MpOrder | null = null;
function client(): MpOrder {
  if (!process.env.MP_ACCESS_TOKEN) throw new Error('Falta MP_ACCESS_TOKEN (mirá .env.example).');
  orderClient ??= new MpOrder(new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN, options: { timeout: 8000 } }));
  return orderClient;
}

const money = (value: number) => Number(value).toFixed(2);

/** Duración ISO 8601 para Mercado Pago. Vence un poco ANTES que la reserva de stock en la base. */
export const MP_EXPIRATION = 'PT1H45M';

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export async function createCheckout(order: DbOrder, items: DbOrderItem[]): Promise<{ id: string; checkoutUrl: string }> {
  const [firstName, ...rest] = order.customer_name.trim().split(/\s+/);
  const back = `${siteUrl()}/checkout/resultado?pedido=${encodeURIComponent(order.order_number)}`;

  const mpItems = items.map((item) => ({
    external_code: (item.variant_id ?? item.product_id ?? 'ITEM').slice(0, 30),
    title: (item.variant_name ? `${item.product_name} (${item.variant_name})` : item.product_name).slice(0, 256),
    quantity: item.quantity,
    unit_price: money(item.unit_price),
    // Mercado Pago necesita una URL pública absoluta; las fotos del sitio son rutas /productos/...
    ...(item.product_image?.startsWith('/') && siteUrl().startsWith('https://')
      ? { picture_url: `${siteUrl()}${item.product_image}` }
      : {}),
  }));
  // total_amount tiene que ser igual a la suma de los ítems: el envío va como un ítem más.
  if (Number(order.shipping_cost) > 0) {
    mpItems.push({
      external_code: 'ENVIO',
      title: `Envío: ${SHIPPING_LABELS[order.shipping_method as keyof typeof SHIPPING_LABELS] ?? order.shipping_method}`,
      quantity: 1,
      unit_price: money(order.shipping_cost),
    });
  }

  const response = await client().create({
    body: {
      type: 'online',
      processing_mode: 'manual',
      total_amount: money(order.total),
      external_reference: order.order_number,
      description: `Pedido ${order.order_number} · Amancay`,
      expiration_time: MP_EXPIRATION,
      payer: {
        email: order.customer_email,
        first_name: firstName,
        ...(rest.length ? { last_name: rest.join(' ') } : {}),
      },
      config: {
        statement_descriptor: 'AMANCAY',
        online: { success_url: back, pending_url: back, failure_url: back, auto_return: 'all' },
        // Sin Rapipago/Pago Fácil ni cajeros: dejan el stock reservado días.
        payment_method: { not_allowed_types: ['ticket', 'atm'], max_installments: 12 },
      },
      items: mpItems,
    } as Parameters<MpOrder['create']>[0]['body'],
    requestOptions: { idempotencyKey: randomUUID() },
  });

  const checkoutUrl = (response as { checkout_url?: string }).checkout_url;
  if (!response.id || !checkoutUrl) throw new Error('Mercado Pago no devolvió checkout_url');
  return { id: response.id, checkoutUrl };
}

export type MpOrderState = {
  id: string;
  status: string;
  statusDetail: string;
  externalReference: string | null;
  totalPaid: number;
  paymentId: string | null;
};

export async function getMpOrder(id: string): Promise<MpOrderState> {
  const o = await client().get({ id });
  const payment = o.transactions?.payments?.[0];
  return {
    id: o.id ?? id,
    status: o.status ?? '',
    statusDetail: o.status_detail ?? '',
    externalReference: o.external_reference ?? null,
    totalPaid: Number((o as { total_paid_amount?: string }).total_paid_amount ?? 0),
    paymentId: payment?.id ?? null,
  };
}

export async function cancelMpOrder(id: string): Promise<void> {
  await client().cancel({ id, requestOptions: { idempotencyKey: randomUUID() } });
}

/** Reembolso total (botón de arrepentimiento o pedido sin stock). */
export async function refundMpOrder(id: string): Promise<MpOrderState> {
  await client().refund({ id, requestOptions: { idempotencyKey: randomUUID() } });
  return getMpOrder(id);
}

/** Valida la firma del webhook. Devuelve false si falta el secreto o no coincide. */
export function validWebhookSignature(opts: { xSignature: string | null; xRequestId: string | null; dataId: string | null }): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;
  try {
    WebhookSignatureValidator.validate({ ...opts, secret, toleranceSeconds: 600 });
    return true;
  } catch {
    return false;
  }
}
