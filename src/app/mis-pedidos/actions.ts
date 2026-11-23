'use server';

import type { Order, OrderStatus, PaymentMethod, PaymentStatus, ShippingMethod } from '@/lib/types';
import { db, dbConfigured } from '@/lib/server/supabase';

/*
 * "Mis pedidos" sin cuenta: el servidor exige código + email (find_order_public).
 * Así nadie puede probar códigos al azar y ver pedidos ajenos, y lo que vuelve no tiene
 * teléfono, DNI ni dirección: solo estado, productos e importes.
 */

type PublicOrderJson = {
  order_number: string;
  created_at: string;
  status: string;
  payment_status: string;
  payment_method: string;
  shipping_method: string;
  shipping_cost: number;
  subtotal: number;
  total: number;
  customer_name: string;
  items: { product_name: string; variant_name: string | null; product_image: string | null; quantity: number; unit_price: number; total_price: number }[];
};

const CODE_RE = /^AMC-[A-Z0-9]{4,10}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalize(code: string, email: string): { code: string; email: string } | null {
  const c = String(code ?? '').toUpperCase().replace(/\s+/g, '').slice(0, 20);
  // Acepta "AMC87EVXC" o "amc-87evxc".
  const withDash = /^AMC[A-Z0-9]{4,10}$/.test(c) ? `AMC-${c.slice(3)}` : c;
  const e = String(email ?? '').trim().toLowerCase().slice(0, 120);
  if (!CODE_RE.test(withDash) || !EMAIL_RE.test(e)) return null;
  return { code: withDash, email: e };
}

function toOrder(json: PublicOrderJson): Order {
  return {
    id: json.order_number,
    orderNumber: json.order_number,
    createdAt: json.created_at,
    customer: { fullName: json.customer_name, email: '', phone: '' },
    items: json.items.map((i, index) => ({
      productId: `item-${index}`,
      productName: i.product_name,
      productImage: i.product_image ?? '',
      variantName: i.variant_name ?? undefined,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
      totalPrice: Number(i.total_price),
    })),
    subtotal: Number(json.subtotal),
    shippingMethod: json.shipping_method as ShippingMethod,
    shippingCost: Number(json.shipping_cost),
    paymentMethod: json.payment_method as PaymentMethod,
    total: Number(json.total),
    status: json.status as OrderStatus,
    paymentStatus: json.payment_status as PaymentStatus,
  };
}

async function find(code: string, email: string): Promise<Order | null> {
  const { data, error } = await db().rpc('find_order_public', { p_code: code, p_email: email });
  if (error || !data) return null;
  return toOrder(data as unknown as PublicOrderJson);
}

/** Busca un pedido por código + email (el formulario de "Mis pedidos"). */
export async function findMyOrder(code: string, email: string): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  if (!dbConfigured()) return { ok: false, error: 'No pudimos consultar los pedidos en este momento.' };
  const ref = normalize(code, email);
  if (!ref) return { ok: false, error: 'Revisá el código (por ejemplo AMC-7K3QX9) y el email.' };
  const order = await find(ref.code, ref.email);
  return order ? { ok: true, order } : { ok: false, error: 'No encontramos un pedido con ese código y ese email.' };
}

/** Los pedidos hechos desde este navegador (referencias guardadas al confirmar). */
export async function getMyOrders(refs: { code: string; email: string }[]): Promise<Order[]> {
  if (!dbConfigured() || !Array.isArray(refs)) return [];
  const valid = refs
    .slice(0, 20)
    .map((r) => normalize(r?.code, r?.email))
    .filter((r): r is { code: string; email: string } => r !== null);
  const orders = await Promise.all(valid.map((r) => find(r.code, r.email)));
  return orders.filter((o): o is Order => o !== null).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
