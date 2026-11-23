import 'server-only';

/*
 * API MiCorreo de Correo Argentino (cotización de envíos).
 *
 * Variables (.env.local / Vercel):
 *   MICORREO_ENV=test | prod            (test usa apitest.correoargentino.com.ar)
 *   MICORREO_USER_TOKEN, MICORREO_PASSWORD_TOKEN   credenciales de la API (distintas en test y prod)
 *   MICORREO_CUSTOMER_ID                número de cliente MiCorreo. Si no está, se obtiene con:
 *   MICORREO_EMAIL, MICORREO_PASSWORD   usuario y contraseña de la cuenta MiCorreo
 *   MICORREO_ORIGIN_CP                  código postal desde donde se despacha (el del local)
 *
 * Flujo: POST /token (Basic con user/password token) -> JWT -> POST /rates.
 * Los nombres de campos siguen la documentación de MiCorreo (PDF "API MiCorreo"); si Correo
 * cambia algo, este es el único archivo a tocar.
 */

const BASE = {
  test: 'https://apitest.correoargentino.com.ar/micorreo/v1',
  prod: 'https://api.correoargentino.com.ar/micorreo/v1',
};

export type Parcel = { weight: number; height: number; width: number; length: number; quantity: number };
export type CorreoRate = {
  deliveredType: 'D' | 'S';
  productType: string;
  productName: string;
  price: number;
  deliveryTimeMin: string;
  deliveryTimeMax: string;
};

export function micorreoConfigured(): boolean {
  return Boolean(
    process.env.MICORREO_USER_TOKEN &&
      process.env.MICORREO_PASSWORD_TOKEN &&
      process.env.MICORREO_ORIGIN_CP &&
      (process.env.MICORREO_CUSTOMER_ID || (process.env.MICORREO_EMAIL && process.env.MICORREO_PASSWORD))
  );
}

const base = () => (process.env.MICORREO_ENV === 'prod' ? BASE.prod : BASE.test);

let jwt: { token: string; expiresAt: number } | null = null;
let customerId: string | null = process.env.MICORREO_CUSTOMER_ID ?? null;

async function call<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, { ...init, signal: AbortSignal.timeout(8000), cache: 'no-store' });
  const text = await res.text();
  if (!res.ok) throw new Error(`MiCorreo ${path} ${res.status}: ${text.slice(0, 200)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

async function token(): Promise<string> {
  if (jwt && jwt.expiresAt > Date.now() + 60_000) return jwt.token;
  const basic = Buffer.from(`${process.env.MICORREO_USER_TOKEN}:${process.env.MICORREO_PASSWORD_TOKEN}`).toString('base64');
  const data = await call<{ token: string; expires?: string }>('/token', { method: 'POST', headers: { Authorization: `Basic ${basic}` } });
  const expires = data.expires ? new Date(data.expires).getTime() : NaN;
  jwt = { token: data.token, expiresAt: Number.isFinite(expires) ? expires : Date.now() + 50 * 60_000 };
  return jwt.token;
}

async function customer(): Promise<string> {
  if (customerId) return customerId;
  const data = await call<{ customerId: string }>('/users/validate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.MICORREO_EMAIL, password: process.env.MICORREO_PASSWORD }),
  });
  customerId = data.customerId;
  return customerId;
}

// Cotizaciones recientes: el mismo carrito al mismo CP no vuelve a consultar a Correo por 10 minutos.
const cache = new Map<string, { at: number; rates: CorreoRate[] }>();

export async function correoRates(destinationCp: string, parcels: Parcel[]): Promise<CorreoRate[]> {
  const key = `${destinationCp}|${JSON.stringify(parcels)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60_000) return hit.rates;

  const body = {
    customerId: await customer(),
    postalCodeOrigin: process.env.MICORREO_ORIGIN_CP,
    postalCodeDestination: destinationCp,
    dimensions: parcels.map((p) => ({
      weight: Math.min(25_000, Math.max(1, Math.round(p.weight))),
      height: Math.min(150, Math.max(1, Math.round(p.height))),
      width: Math.min(150, Math.max(1, Math.round(p.width))),
      length: Math.min(150, Math.max(1, Math.round(p.length))),
      quantity: p.quantity,
    })),
  };
  const data = await call<{ rates?: CorreoRate[] }>('/rates', {
    method: 'POST',
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const rates = (data.rates ?? []).filter((r) => typeof r.price === 'number' && r.price > 0);
  if (cache.size > 500) cache.clear();
  cache.set(key, { at: Date.now(), rates });
  return rates;
}
