import type { PaymentMethod, ShippingMethod } from './types';

/**
 * Datos del comercio en un solo lugar.
 * Todo lo marcado como PLACEHOLDER se tiene que confirmar con la clienta (ver PRODUCT.md).
 */
export const STORE = {
  name: 'Perfumería Amancay',
  shortName: 'Amancay',
  address: 'Av. Corrientes 3666',
  neighborhood: 'Almagro, CABA',
  transit: 'Subte B, estaciones Medrano y Carlos Gardel',
  // PLACEHOLDER
  whatsappNumber: '5491136740676',
  whatsappDisplay: '+54 9 11 3674-0676',
  phoneHref: 'tel:+5491136740676',
  email: 'mostrador@amancay.com.ar',
  hours: [
    { days: 'Lunes a viernes', time: '9:30 a 20:00' },
    { days: 'Sábados', time: '10:00 a 14:00' },
  ],
  // PLACEHOLDER: datos de ejemplo, no son una cuenta real.
  transfer: {
    isPlaceholder: true,
    bank: 'Banco a confirmar',
    holder: 'Titular a confirmar',
    alias: 'ALIAS.A.CONFIRMAR',
    cbu: '0000000000000000000000',
  },
  // PLACEHOLDER: PRODUCT.md dice "transferencia (con descuento)". El porcentaje está a confirmar.
  transferDiscountPct: 10,
} as const;

/** Promo bancaria. Se muestra solo si `enabled` y la fecha de hoy está dentro del rango. */
export const PROMO = {
  // PLACEHOLDER: promo a confirmar con la clienta.
  enabled: true,
  title: '3 cuotas sin interés con Banco Galicia',
  detail: 'Con tarjetas de crédito Visa y Mastercard de Banco Galicia.',
  installments: 3,
  from: '2026-11-01',
  until: '2026-11-30',
} as const;

/** "30 de noviembre" */
export const PROMO_UNTIL_LABEL = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' }).format(
  new Date(`${PROMO.until}T12:00:00`)
);

export function isPromoActive(now: Date = new Date()): boolean {
  if (!PROMO.enabled) return false;
  const pad = (n: number) => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return today >= PROMO.from && today <= PROMO.until;
}

/** Tarifas de envío (PLACEHOLDER: proveedor de envíos sin decidir). */
export const SHIPPING_RATES = {
  pickup: 0,
  moto_caba: 3500,
  correo_gba: 5800,
  correo_interior: 7900,
} as const;

export type PostalZone = 'caba' | 'gba' | 'interior';

/** Acepta "1176" o el CPA "C1176ABC". Devuelve null si no hay 4 dígitos. */
export function parsePostalCode(input: string): number | null {
  const match = input.toUpperCase().match(/(\d{4})/);
  return match ? Number(match[1]) : null;
}

export function postalZone(cp: number): PostalZone {
  if (cp >= 1000 && cp <= 1499) return 'caba';
  if (cp >= 1600 && cp <= 1999) return 'gba';
  return 'interior';
}

export function shippingCost(method: ShippingMethod, postalCode: string): number | null {
  if (method === 'pickup') return SHIPPING_RATES.pickup;
  if (method === 'moto_caba') return SHIPPING_RATES.moto_caba;
  const cp = parsePostalCode(postalCode);
  if (cp === null) return null;
  return postalZone(cp) === 'interior' ? SHIPPING_RATES.correo_interior : SHIPPING_RATES.correo_gba;
}

export const SHIPPING_LABELS: Record<ShippingMethod, string> = {
  pickup: 'Retiro en el local',
  moto_caba: 'Moto en CABA',
  correo_argentino: 'Correo Argentino',
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  transferencia: 'Transferencia',
  mercadopago: 'Mercado Pago',
  mostrador: 'Pago en el local',
};

export function whatsappUrl(text: string): string {
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

const numberFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

/** "$38.900" */
export function formatPrice(value: number): string {
  return `$${numberFormat.format(Math.round(value))}`;
}

export function transferPrice(value: number): number {
  return Math.round(value * (1 - STORE.transferDiscountPct / 100));
}

/** Quita acentos y pasa a minúsculas para búsquedas ("Perfumería" = "perfumeria"). */
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function slugify(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
