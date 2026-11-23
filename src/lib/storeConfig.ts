import type { PaymentMethod, ShippingMethod } from './types';

/**
 * Datos del comercio en un solo lugar.
 * Todo lo marcado como PLACEHOLDER se tiene que confirmar con la clienta (ver PRODUCT.md).
 */
export const STORE = {
  name: 'Amancay',
  // PLACEHOLDER: datos fiscales a completar por la clienta (Ley 24.240 y Disp. 954/2025 piden identificar al proveedor).
  legal: {
    holder: '[Razón social o nombre del titular]',
    cuit: '[CUIT]',
    taxStatus: '[Condición frente al IVA]',
  },
  shortName: 'Amancay',
  address: 'Av. Corrientes 3666',
  neighborhood: 'Almagro, CABA',
  transit: 'Subte B, estaciones Medrano y Carlos Gardel',
  whatsappNumber: '5492364541928',
  whatsappDisplay: '+54 9 2364 54-1928',
  phoneHref: 'tel:+5492364541928',
  email: 'mostrador@amancay.com.ar',
  // Horario del local. Cada día puede tener uno o dos turnos (turno cortado).
  hours: [
    { days: 'Lunes, martes, jueves y viernes', time: '9:00 a 13:00 y 15:30 a 19:00', dayCodes: ['Monday', 'Tuesday', 'Thursday', 'Friday'], shifts: [['09:00', '13:00'], ['15:30', '19:00']] },
    { days: 'Miércoles', time: '9:00 a 13:00', dayCodes: ['Wednesday'], shifts: [['09:00', '13:00']] },
    { days: 'Sábados', time: '9:00 a 14:00', dayCodes: ['Saturday'], shifts: [['09:00', '14:00']] },
    { days: 'Domingos', time: 'Cerrado', dayCodes: [], shifts: [] },
  ],
  /** Ficha del local en Google Maps (botones "Cómo llegar"). */
  mapsUrl:
    'https://www.google.com/maps/place/Perfumer%C3%ADa+Amancay/@-34.6038041,-58.4189002,17z/data=!3m1!4b1!4m6!3m5!1s0x95bcca8a13255fdf:0xeebfd0dc2090008d!8m2!3d-34.6038041!4d-58.4163253!16s%2Fg%2F11b6mnxfgp?entry=ttu&g_ep=EgoyMDI2MTEwMy4wIKXMDSoASAFQAw%3D%3D',
  // PLACEHOLDER: datos de ejemplo, no son una cuenta real.
  transfer: {
    isPlaceholder: true,
    bank: 'Banco a confirmar',
    holder: 'Titular a confirmar',
    alias: 'ALIAS.A.CONFIRMAR',
    cbu: '0000000000000000000000',
  },
} as const;

/**
 * Dirección pública de la tienda, para canonical, Open Graph, sitemap y datos estructurados.
 * PLACEHOLDER: el dominio definitivo se configura con NEXT_PUBLIC_SITE_URL al publicar.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

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

/**
 * Res. 4/2025 (Secretaría de Industria y Comercio): junto al precio final se informa, en letra
 * más chica, el importe sin IVA ni otros impuestos nacionales indirectos, con la leyenda
 * "PRECIO SIN IMPUESTOS NACIONALES". PLACEHOLDER: la alícuota y si corresponde mostrarlo
 * dependen de la condición fiscal del local (confirmar con el contador).
 */
export const TAX = {
  showNetPrice: true,
  vatRate: 0.21,
} as const;

export function netPrice(finalPrice: number): number {
  return Math.round(finalPrice / (1 + TAX.vatRate));
}

/** Res. 4/2025, inc. d: en precios financiados va el precio contado, las cuotas y el CFTEA. */
export const PROMO_CFTEA = '0,00 %';

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
  const cp = parsePostalCode(postalCode);
  if (cp === null) return null;
  // La moto llega solo a CABA: con un CP de afuera no hay precio (el checkout pide elegir Correo).
  if (method === 'moto_caba') return postalZone(cp) === 'caba' ? SHIPPING_RATES.moto_caba : null;
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
  mostrador: 'Efectivo al retirar',
};

/**
 * Solo acepta fotos https:// o rutas del propio sitio (/productos/...).
 * Descarta javascript:, data:, http:// sin cifrar y cualquier otro esquema.
 */
export function safeImageUrl(raw: string): string | null {
  const value = raw.trim();
  if (value === '') return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || isPrivateHost(url.hostname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Hosts de red local o interna. Hoy las fotos las pide el navegador, pero si mañana un servidor
 * las descarga (miniaturas, backend), una URL así le haría pedir algo de su propia red (SSRF).
 */
function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80')) return true;
  const ip = h.match(/^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (!ip) return false;
  const [a, b] = [Number(ip[1]), Number(ip[2])];
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/**
 * Texto escrito por una persona (nombre, código, nombre de producto cargado en el panel) antes de
 * meterlo en un mensaje de WhatsApp: sin caracteres de control ni símbolos de formato (*negrita*,
 * _cursiva_, ~tachado~, `código`) que cambien cómo se ve el mensaje en el teléfono del local.
 */
export function waText(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[*_~`]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 160);
}

export function whatsappUrl(text: string): string {
  // Se conservan los saltos de línea del mensaje armado; cualquier otro carácter de control se quita.
  const clean = text.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ');
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(clean)}`;
}

const numberFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

/** "$38.900" */
export function formatPrice(value: number): string {
  return `$${numberFormat.format(Math.round(value))}`;
}

/** Quita acentos y pasa a minúsculas para búsquedas ("Perfumería" = "perfumeria"). */
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** URL pública del producto: el slug descriptivo (las URLs viejas /producto/mate-01 redirigen con 301). */
export function productPath(product: { slug?: string; id: string }): string {
  return `/producto/${product.slug || product.id}`;
}

export function slugify(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// ---------- Horario de hoy ----------

const BA_TIME = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Argentina/Buenos_Aires',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export interface TodayHours {
  /** "9:00 a 13:00 y 15:30 a 19:00" o "Cerrado". */
  time: string;
  isOpen: boolean;
}

/**
 * Horario del día de hoy según el reloj de Buenos Aires (no el del dispositivo:
 * alguien puede mirar la tienda desde otro huso horario).
 */
export function todayHours(now: Date = new Date()): TodayHours {
  const parts = BA_TIME.formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const minutes =
    Number(parts.find((p) => p.type === 'hour')?.value ?? 0) * 60 + Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const today = STORE.hours.find((h) => (h.dayCodes as readonly string[]).includes(weekday));
  if (!today || today.shifts.length === 0) return { time: 'Cerrado', isOpen: false };
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const isOpen = today.shifts.some(([opens, closes]) => minutes >= toMinutes(opens) && minutes < toMinutes(closes));
  return { time: today.time, isOpen };
}
