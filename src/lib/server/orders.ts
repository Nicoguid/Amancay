import 'server-only';
import type { Order, OrderStatus, PaymentMethod, PaymentStatus, ShippingMethod } from '@/lib/types';
import type { ConsentRecord } from '@/lib/consent';
import type { DbConsent, DbOrder, DbOrderItem } from './database.types';
import { db } from './supabase';
import type { MpOrderState } from './mercadopago';

/** Cuánto se reserva el stock esperando el pago (formato interval de Postgres). */
export const PAYMENT_HOLD: Record<PaymentMethod, string> = {
  mercadopago: '2 hours',
  transferencia: '48 hours', // el local controla la transferencia y la marca como pagada en el panel
  mostrador: '0 seconds', // se paga al retirar: create_order no le pone vencimiento
};

export type OrderWithItems = DbOrder & { order_items: DbOrderItem[]; consents?: DbConsent[] };

/** Fila de la base -> el `Order` que ya usan el checkout, el panel y "Mis pedidos". */
export function toOrder(row: OrderWithItems): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    createdAt: row.created_at,
    customer: {
      fullName: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      dni: row.customer_dni ?? undefined,
      address: row.address ?? undefined,
      city: row.city ?? undefined,
      postalCode: row.postal_code ?? undefined,
      notes: row.notes ?? undefined,
    },
    items: [...(row.order_items ?? [])]
      .sort((a, b) => a.id - b.id)
      .map((i) => ({
        productId: i.product_id ?? '',
        productName: i.product_name,
        productImage: i.product_image ?? '',
        variantId: i.variant_id ?? undefined,
        variantName: i.variant_name ?? undefined,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price),
        totalPrice: Number(i.total_price),
        category: i.category,
      })),
    subtotal: Number(row.subtotal),
    shippingMethod: row.shipping_method as ShippingMethod,
    shippingCost: Number(row.shipping_cost),
    paymentMethod: row.payment_method as PaymentMethod,
    total: Number(row.total),
    status: row.status as OrderStatus,
    paymentStatus: row.payment_status as PaymentStatus,
    expiresAt: row.expires_at ?? undefined,
    mpOrderId: row.mp_order_id ?? undefined,
    isSample: row.is_sample,
    consent: row.consents?.map(
      (c): ConsentRecord => ({
        doc: c.doc as ConsentRecord['doc'],
        version: c.version,
        decision: c.decision as ConsentRecord['decision'],
        at: c.created_at,
        method: c.method,
        page: c.page,
        reference: c.reference ?? undefined,
      })
    ),
  };
}

/** Lo que puede ver el cliente de SU pedido: sin teléfono, DNI ni dirección completa. */
export function toPublicOrder(order: Order): Order {
  return {
    ...order,
    id: order.orderNumber,
    mpOrderId: undefined,
    consent: undefined,
    customer: {
      fullName: order.customer.fullName.split(' ')[0] ?? '',
      email: order.customer.email,
      phone: '',
    },
  };
}

export async function orderEvent(orderId: string, type: string, source: 'sistema' | 'panel' | 'mercadopago' | 'cliente', from?: string, to?: string, detail: Record<string, unknown> = {}) {
  await db().from('order_events').insert({ order_id: orderId, type, from_value: from ?? null, to_value: to ?? null, source, detail: detail as never });
}

/**
 * Aplica a nuestro pedido lo que dice Mercado Pago. Se llama desde el webhook y al volver del pago.
 * Es idempotente: si llega dos veces el mismo estado, no cambia nada.
 */
export async function applyMpState(mp: MpOrderState): Promise<{ orderId: string | null; changed: boolean; note?: string }> {
  // Dos consultas simples (y no un filtro armado con texto): los ids vienen de afuera.
  let { data: order } = await db().from('orders').select('*').eq('mp_order_id', mp.id).maybeSingle();
  if (!order && mp.externalReference) {
    ({ data: order } = await db().from('orders').select('*').eq('order_number', mp.externalReference).maybeSingle());
  }
  if (!order) return { orderId: null, changed: false, note: 'pedido no encontrado' };
  const unpaid = order.payment_status === 'pendiente' || order.payment_status === 'rechazado';

  // Pago aprobado
  if (mp.status === 'processed') {
    if (order.payment_status === 'aprobado') return { orderId: order.id, changed: false };
    // El monto cobrado tiene que coincidir con el total del pedido: si no, no se marca como pagado.
    if (Math.abs(mp.totalPaid - Number(order.total)) > 0.01) {
      await orderEvent(order.id, 'pago_monto_distinto', 'mercadopago', String(order.total), String(mp.totalPaid), { mp_order: mp.id });
      return { orderId: order.id, changed: false, note: 'monto distinto' };
    }
    if (order.status === 'cancelado') {
      // Pagó después de que venció la reserva: queda registrado para que el local decida (reponer o reembolsar).
      await orderEvent(order.id, 'pago_despues_de_vencer', 'mercadopago', order.status, 'pagado', { mp_order: mp.id });
    }
    await db()
      .from('orders')
      .update({
        payment_status: 'aprobado',
        status: order.status === 'pendiente' ? 'pagado' : order.status,
        paid_at: new Date().toISOString(),
        mp_order_id: mp.id,
        mp_payment_id: mp.paymentId,
        expires_at: null,
      })
      .eq('id', order.id);
    await orderEvent(order.id, 'pago', 'mercadopago', order.payment_status, 'aprobado', { mp_order: mp.id, payment: mp.paymentId });
    return { orderId: order.id, changed: true };
  }

  // Reembolso (lo pidió el local desde el panel o se hizo desde Mercado Pago)
  if (mp.status === 'refunded' || mp.statusDetail === 'partially_refunded') {
    const next = mp.status === 'refunded' ? 'reembolsado' : 'reembolso_parcial';
    if (order.payment_status === next) return { orderId: order.id, changed: false };
    await db().from('orders').update({ payment_status: next }).eq('id', order.id);
    await orderEvent(order.id, 'reembolso', 'mercadopago', order.payment_status, next, { mp_order: mp.id });
    return { orderId: order.id, changed: true };
  }

  // Cancelada o vencida en Mercado Pago: se cancela el pedido y vuelve el stock.
  if ((mp.status === 'canceled' || mp.status === 'expired') && unpaid) {
    await db().rpc('cancel_order', {
      p_order_id: order.id,
      p_source: 'mercadopago',
      p_reason: `Mercado Pago: ${mp.status}`,
      p_payment_status: mp.status === 'expired' ? 'vencido' : 'cancelado',
    });
    return { orderId: order.id, changed: true };
  }

  // Rechazado: se avisa, pero la reserva sigue hasta que venza (puede reintentar con otra tarjeta).
  if (mp.status === 'failed' && order.payment_status === 'pendiente') {
    await db().from('orders').update({ payment_status: 'rechazado' }).eq('id', order.id);
    await orderEvent(order.id, 'pago', 'mercadopago', 'pendiente', 'rechazado', { mp_order: mp.id, detail: mp.statusDetail });
    return { orderId: order.id, changed: true };
  }

  return { orderId: order.id, changed: false };
}
