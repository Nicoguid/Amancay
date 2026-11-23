'use server';

import { updateTag } from 'next/cache';
import { after } from 'next/server';
import { notifyStoreNewOrder, sendOrderConfirmation } from '@/lib/server/email';
import type { Order, PaymentMethod, ShippingMethod } from '@/lib/types';
import { clampCheckout, validateCheckout, type CheckoutForm } from '@/lib/checkoutValidation';
import { LEGAL_DOCS } from '@/lib/legal';
import { MIN_FILL_MS } from '@/lib/formGuard';
import { quoteShipping } from '@/lib/server/shipping';
import { CATALOG_TAG } from '@/lib/server/catalog';
import { db, dbConfigured, friendlyDbError } from '@/lib/server/supabase';
import { createCheckout, mpConfigured } from '@/lib/server/mercadopago';
import { PAYMENT_HOLD, PICKUP_EXPIRES_MS, toOrder, type OrderWithItems } from '@/lib/server/orders';

export type PlaceOrderInput = {
  form: CheckoutForm;
  items: { productId: string; variantId?: string; quantity: number }[];
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  /** Campo trampa y milisegundos que tardó en completar (antispam). */
  honeypot: string;
  elapsedMs: number;
};

export type PlaceOrderResult =
  | { ok: true; order: Order; checkoutUrl?: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof CheckoutForm, string>> };

const SHIPPING: ShippingMethod[] = ['pickup', 'moto_caba', 'correo_argentino'];
const PAYMENTS: PaymentMethod[] = ['mercadopago', 'transferencia', 'mostrador'];
const GENERIC = 'No pudimos confirmar el pedido. Esperá unos segundos y probá de nuevo, o escribinos por WhatsApp.';

/**
 * Confirma un pedido. Todo lo que llega del navegador se vuelve a validar acá:
 * el precio NO viaja (lo pone create_order desde la base) y el envío lo calcula el servidor.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (!dbConfigured()) return { ok: false, error: 'La tienda todavía no está conectada a la base de datos.' };

  // 1) Forma del pedido
  if (!input || typeof input !== 'object') return { ok: false, error: GENERIC };
  if (!SHIPPING.includes(input.shippingMethod) || !PAYMENTS.includes(input.paymentMethod)) return { ok: false, error: GENERIC };
  if (input.paymentMethod === 'mostrador' && input.shippingMethod !== 'pickup') {
    return { ok: false, error: 'El pago en el local es solo para retiro en el local.' };
  }
  if (input.paymentMethod === 'mercadopago' && !mpConfigured()) {
    return { ok: false, error: 'Mercado Pago no está disponible en este momento. Elegí transferencia o escribinos.' };
  }
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 40) {
    return { ok: false, error: 'Tu carrito está vacío.' };
  }
  const items = input.items.map((i) => ({
    product_id: String(i?.productId ?? '').slice(0, 60),
    variant_id: i?.variantId ? String(i.variantId).slice(0, 60) : null,
    quantity: Math.floor(Number(i?.quantity)),
  }));
  if (items.some((i) => !i.product_id || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 50)) {
    return { ok: false, error: 'Revisá las cantidades del carrito.' };
  }

  // 2) Antispam: lo mismo que en el navegador, pero acá no se puede saltear.
  if (String(input.honeypot ?? '') !== '' || !(Number(input.elapsedMs) >= MIN_FILL_MS)) return { ok: false, error: GENERIC };

  // 3) Datos del cliente y consentimientos
  const form = clampCheckout(input.form ?? {});
  const fieldErrors = validateCheckout(form, input.shippingMethod);
  if (Object.keys(fieldErrors).length) return { ok: false, error: 'Revisá los campos marcados.', fieldErrors };
  if (input.acceptedTerms !== true || input.acceptedPrivacy !== true) {
    return { ok: false, error: 'Para confirmar tenés que aceptar los términos y la política de privacidad.' };
  }

  // 4) Envío cotizado de nuevo en el servidor (MiCorreo para Correo; la moto va en 0 y se paga aparte)
  const quote = await quoteShipping(
    input.shippingMethod,
    form.postalCode,
    items.map((i) => ({ productId: i.product_id, variantId: i.variant_id, quantity: i.quantity }))
  );
  if (!quote.ok) return { ok: false, error: quote.error, fieldErrors: { postalCode: quote.error } };
  const shipping = quote.cost;

  const pickup = input.shippingMethod === 'pickup';
  const consents = (['terminos', 'privacidad'] as const).map((doc) => ({
    doc,
    version: LEGAL_DOCS[doc].version, // la versión la pone el servidor, no el navegador
    decision: 'aceptado',
    method: 'casilla en checkout',
    page: '/checkout',
  }));

  // 5) Pedido + reserva de stock en una sola transacción
  const { data: created, error } = await db().rpc('create_order', {
    p_customer: {
      name: form.fullName,
      email: form.email,
      phone: form.phone,
      dni: input.shippingMethod === 'correo_argentino' ? form.dni : null,
      address: pickup ? null : form.address,
      city: pickup ? null : form.city,
      postal_code: pickup ? null : form.postalCode,
      notes: form.notes || null,
    },
    p_items: items,
    p_shipping_method: input.shippingMethod,
    p_shipping_cost: shipping,
    p_payment_method: input.paymentMethod,
    p_consents: consents,
    p_expires_in: PAYMENT_HOLD[input.paymentMethod],
  });

  if (error || !created) {
    const names = await productNames(items.map((i) => i.variant_id ?? i.product_id));
    return { ok: false, error: friendlyDbError(error?.message, names) };
  }

  // El stock cambió: el catálogo en caché se vuelve a leer en la próxima visita.
  updateTag(CATALOG_TAG);

  // Qué servicio se cotizó, y para "efectivo o tarjeta al retirar": vence a las 72 h si nadie lo busca.
  const extra: { shipping_service?: string; expires_at?: string } = {};
  if (quote.service) extra.shipping_service = quote.service.slice(0, 120);
  if (input.paymentMethod === 'mostrador') extra.expires_at = new Date(Date.now() + PICKUP_EXPIRES_MS).toISOString();
  if (Object.keys(extra).length) await db().from('orders').update(extra).eq('id', created.id);

  const { data: full } = await db().from('orders').select('*, order_items(*)').eq('id', created.id).single();
  const row = (full ?? { ...created, order_items: [] }) as OrderWithItems;

  // Mails al cliente y al local, después de responder (no hacen esperar a quien compra).
  after(async () => {
    const order = toOrder(row);
    await Promise.all([sendOrderConfirmation(order), notifyStoreNewOrder(order)]);
  });

  // 6) Mercado Pago: se crea la Order con el total de la base
  if (input.paymentMethod === 'mercadopago') {
    try {
      const mp = await createCheckout(row, row.order_items);
      await db().from('orders').update({ mp_order_id: mp.id }).eq('id', row.id);
      return { ok: true, order: ownOrder(row), checkoutUrl: mp.checkoutUrl };
    } catch (e) {
      console.error('[checkout] Mercado Pago falló', e);
      // Sin link de pago no tiene sentido reservar el stock.
      await db().rpc('cancel_order', { p_order_id: row.id, p_source: 'sistema', p_reason: 'falló la creación del pago en Mercado Pago' });
      updateTag(CATALOG_TAG);
      return { ok: false, error: 'Mercado Pago no respondió. Probá de nuevo en un momento o elegí transferencia.' };
    }
  }

  return { ok: true, order: ownOrder(row) };
}

async function productNames(ids: string[]): Promise<Record<string, string>> {
  const names: Record<string, string> = {};
  const { data: products } = await db().from('products').select('id, name').in('id', ids);
  const { data: variants } = await db().from('product_variants').select('id, name, products(name)').in('id', ids);
  for (const p of products ?? []) names[p.id] = p.name;
  for (const v of variants ?? []) {
    const parent = (v.products as { name: string } | null)?.name;
    names[v.id] = parent ? `${parent} (${v.name})` : v.name;
  }
  return names;
}

/** El pedido que la persona acaba de hacer (sus propios datos), sin campos internos. */
function ownOrder(row: OrderWithItems): Order {
  const order = toOrder(row);
  return { ...order, mpOrderId: undefined, consent: undefined };
}
