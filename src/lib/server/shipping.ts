import 'server-only';
import type { ShippingMethod } from '@/lib/types';
import { MOTO_PRICE_LABEL, PACKAGE_DEFAULTS, fallbackCorreoCost, parsePostalCode, postalZone } from '@/lib/storeConfig';
import { db, dbConfigured } from './supabase';
import { correoRates, micorreoConfigured, type Parcel } from './micorreo';

export type CartLine = { productId: string; variantId?: string | null; quantity: number };

export type ShippingQuote =
  | {
      ok: true;
      /** Lo que se cobra en la web (la moto va en 0: se paga aparte). */
      cost: number;
      /** Texto del precio para mostrar ("$ 7.400", "A confirmar con el vendedor"). */
      priceLabel?: string;
      /** Servicio y plazo ("Paq.ar Clásico a domicilio · 3 a 6 días hábiles"). */
      service?: string;
      /** true = tarifa de respaldo (MiCorreo no configurado o sin respuesta). */
      estimated?: boolean;
    }
  | { ok: false; error: string };

/** Paquetes del carrito con el peso y medidas de cada producto (o los típicos del rubro). */
async function parcelsFor(lines: CartLine[]): Promise<Parcel[]> {
  const ids = [...new Set(lines.map((l) => l.productId))];
  const products = dbConfigured()
    ? (await db().from('products').select('id, category, weight_g, length_cm, width_cm, height_cm').in('id', ids)).data ?? []
    : [];
  return lines.map((l) => {
    const p = products.find((x) => x.id === l.productId);
    const d = PACKAGE_DEFAULTS[p?.category ?? ''] ?? PACKAGE_DEFAULTS.default;
    return {
      weight: p?.weight_g ?? d.weightG,
      length: p?.length_cm ?? d.lengthCm,
      width: p?.width_cm ?? d.widthCm,
      height: p?.height_cm ?? d.heightCm,
      quantity: Math.max(1, Math.min(50, Math.floor(l.quantity))),
    };
  });
}

/**
 * Cuánto sale el envío. Lo usa el navegador para mostrarlo y el servidor al confirmar el pedido
 * (que vuelve a cotizar: el precio del envío nunca viene del navegador).
 */
export async function quoteShipping(method: ShippingMethod, postalCode: string, lines: CartLine[]): Promise<ShippingQuote> {
  if (method === 'pickup') return { ok: true, cost: 0, priceLabel: 'Sin costo' };

  const cp = parsePostalCode(postalCode);
  if (cp === null) return { ok: false, error: 'Escribí el código postal (4 números).' };

  if (method === 'moto_caba') {
    if (postalZone(cp) !== 'caba') return { ok: false, error: 'La moto llega solo a CABA (CP 1000 a 1499). Para otra zona elegí Correo Argentino.' };
    return { ok: true, cost: 0, priceLabel: MOTO_PRICE_LABEL, service: 'Moto por app: el costo se paga aparte al recibir' };
  }

  if (!lines.length) return { ok: false, error: 'El carrito está vacío.' };

  if (micorreoConfigured()) {
    try {
      const rates = await correoRates(String(cp).padStart(4, '0'), await parcelsFor(lines));
      // Por ahora solo envío a domicilio (D). Se elige el más barato que ofrezca Correo.
      const best = rates.filter((r) => r.deliveredType === 'D').sort((a, b) => a.price - b.price)[0];
      if (best) {
        const days = best.deliveryTimeMin && best.deliveryTimeMax ? ` · ${best.deliveryTimeMin} a ${best.deliveryTimeMax} días hábiles` : '';
        return { ok: true, cost: Math.round(best.price), service: `${best.productName} a domicilio${days}` };
      }
      return { ok: false, error: 'Correo Argentino no tiene envío a domicilio para ese código postal. Escribinos por WhatsApp.' };
    } catch (e) {
      console.error('[envío] MiCorreo no respondió', e);
      return { ok: false, error: 'No pudimos cotizar con Correo Argentino en este momento. Probá de nuevo en unos minutos o elegí retiro en el local.' };
    }
  }

  const cost = fallbackCorreoCost(String(cp));
  return cost === null ? { ok: false, error: 'Código postal no válido.' } : { ok: true, cost, estimated: true, service: 'Correo Argentino a domicilio (tarifa estimada)' };
}
