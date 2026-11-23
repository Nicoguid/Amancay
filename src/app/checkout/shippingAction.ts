'use server';

import type { ShippingMethod } from '@/lib/types';
import { quoteShipping, type CartLine, type ShippingQuote } from '@/lib/server/shipping';

const METHODS: ShippingMethod[] = ['pickup', 'moto_caba', 'correo_argentino'];

/** Cotización para mostrar en la página de producto, el carrito y el checkout. */
export async function getShippingQuote(method: ShippingMethod, postalCode: string, lines: CartLine[]): Promise<ShippingQuote> {
  if (!METHODS.includes(method) || !Array.isArray(lines) || lines.length > 40) return { ok: false, error: 'Datos no válidos.' };
  const clean = lines
    .filter((l) => l && typeof l.productId === 'string' && Number.isFinite(Number(l.quantity)))
    .map((l) => ({ productId: l.productId.slice(0, 60), variantId: l.variantId ? String(l.variantId).slice(0, 60) : null, quantity: Number(l.quantity) }));
  return quoteShipping(method, String(postalCode ?? '').slice(0, 10), clean);
}
