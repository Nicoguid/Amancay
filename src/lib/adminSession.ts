import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/*
 * Sesión del panel: un token firmado con HMAC-SHA256 que guarda solo cuándo vence.
 * Va en una cookie HttpOnly (JavaScript del navegador no la puede leer), Secure en producción
 * y SameSite=Strict (otro sitio no la puede usar). La usan proxy.ts y el login.
 */

export const SESSION_COOKIE = 'amancay_panel';
export const SESSION_HOURS = 8;

function secret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  // Sin secreto (o uno corto) el panel queda cerrado: falla cerrado, no abierto.
  return s && s.length >= 32 ? s : null;
}

function sign(payload: string, key: string) {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

export function createSessionToken(): string | null {
  const key = secret();
  if (!key) return null;
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_HOURS * 3600_000, n: randomBytes(8).toString('hex') })
  ).toString('base64url');
  return `${payload}.${sign(payload, key)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  const key = secret();
  if (!key || !token) return false;
  const [payload, mac] = token.split('.');
  if (!payload || !mac) return false;
  const expected = Buffer.from(sign(payload, key));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { exp: number };
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/admin',
  maxAge: SESSION_HOURS * 3600,
};
