import 'server-only';
import { createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { db, dbConfigured } from '@/lib/server/supabase';

/*
 * Contraseña del panel y límite de intentos.
 *
 * - La contraseña nunca se guarda en texto: en .env.local va un hash scrypt
 *   (ADMIN_PASSWORD_HASH), generado con `node scripts/hash-password.mjs`.
 * - Límite por IP: 5 intentos fallidos y la IP queda bloqueada 15 minutos; cada bloqueo
 *   siguiente dura el doble (hasta 24 h). Además cada intento fallido tarda un poco más.
 * - Límite general: si en 15 minutos hay más de 30 fallos de cualquier IP (un ataque
 *   repartido), todos los intentos esperan más y, si Turnstile está configurado, se exige.
 *
 * El contador vive en la base (ver más abajo), así que funciona con varias instancias.
 */

const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60_000;
const BASE_LOCK_MS = 15 * 60_000;
const MAX_LOCK_MS = 24 * 3600_000;
const GLOBAL_FAILS = 30;
const GLOBAL_KEY = 'global';

/*
 * Dónde vive el contador:
 * - Con Supabase configurado: en la tabla admin_login_attempts (función atómica login_register_failure),
 *   así funciona igual con varias instancias de Vercel.
 * - Sin base (desarrollo local): en memoria, como antes.
 * La IP no se guarda: se guarda un hash con el secreto de sesión.
 */
type Entry = { fails: number; first: number; lockedUntil: number; locks: number };
const byIp = new Map<string, Entry>();
let globalFails: number[] = [];

const storeInDb = () => dbConfigured();
const keyFor = (ip: string) =>
  createHash('sha256').update(`${ip}|${process.env.ADMIN_SESSION_SECRET ?? ''}`).digest('hex');
const interval = (ms: number) => `${Math.round(ms / 1000)} seconds`;

export function passwordConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD_HASH && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32;
}

/** Formato: scrypt:N:r:p:salt(base64):hash(base64) (sin "$", que .env interpreta como variable) */
export function verifyPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored || password.length === 0 || password.length > 200) return false;
  const [algo, n, r, p, saltB64, hashB64] = stored.split(':');
  if (algo !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = scryptSync(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 256 * 1024 * 1024,
  });
  return timingSafeEqual(actual, expected);
}

export type Gate = { allowed: true } | { allowed: false; retryInSeconds: number };

export async function checkAttempt(ip: string, now = Date.now()): Promise<Gate> {
  let lockedUntil = 0;
  if (storeInDb()) {
    const { data } = await db().from('admin_login_attempts').select('locked_until').eq('key', keyFor(ip)).maybeSingle();
    lockedUntil = data?.locked_until ? new Date(data.locked_until).getTime() : 0;
  } else {
    lockedUntil = byIp.get(ip)?.lockedUntil ?? 0;
  }
  return lockedUntil > now ? { allowed: false, retryInSeconds: Math.ceil((lockedUntil - now) / 1000) } : { allowed: true };
}

export async function underGlobalAttack(now = Date.now()): Promise<boolean> {
  if (storeInDb()) {
    const { data } = await db().from('admin_login_attempts').select('failures, last_attempt').eq('key', GLOBAL_KEY).maybeSingle();
    return !!data && now - new Date(data.last_attempt).getTime() < WINDOW_MS && data.failures >= GLOBAL_FAILS;
  }
  globalFails = globalFails.filter((t) => now - t < WINDOW_MS);
  return globalFails.length >= GLOBAL_FAILS;
}

/** Registra un fallo. Devuelve cuántos intentos le quedan a esa IP antes del bloqueo. */
export async function registerFailure(ip: string, now = Date.now()): Promise<{ remaining: number; lockedForSeconds?: number }> {
  if (storeInDb()) {
    // Contador general: nunca bloquea, solo cuenta (p_max enorme).
    await db().rpc('login_register_failure', {
      p_key: GLOBAL_KEY, p_max: 1_000_000_000, p_window: interval(WINDOW_MS), p_base_lock: '0 seconds', p_max_lock: '0 seconds',
    });
    const { data, error } = await db().rpc('login_register_failure', {
      p_key: keyFor(ip), p_max: MAX_FAILS, p_window: interval(WINDOW_MS), p_base_lock: interval(BASE_LOCK_MS), p_max_lock: interval(MAX_LOCK_MS),
    });
    if (error || !data?.[0]) return { remaining: 0, lockedForSeconds: Math.ceil(BASE_LOCK_MS / 1000) }; // ante la duda, se bloquea
    const row = data[0];
    return row.locked_seconds > 0 ? { remaining: 0, lockedForSeconds: row.locked_seconds } : { remaining: row.remaining };
  }

  globalFails.push(now);
  let e = byIp.get(ip);
  if (!e || now - e.first > WINDOW_MS) e = { fails: 0, first: now, lockedUntil: 0, locks: e?.locks ?? 0 };
  e.fails += 1;
  if (e.fails >= MAX_FAILS) {
    const lockMs = Math.min(BASE_LOCK_MS * 2 ** e.locks, MAX_LOCK_MS);
    e.locks += 1;
    e.lockedUntil = now + lockMs;
    e.fails = 0;
    e.first = now;
    byIp.set(ip, e);
    return { remaining: 0, lockedForSeconds: Math.ceil(lockMs / 1000) };
  }
  byIp.set(ip, e);
  // Evita que el mapa crezca sin límite con IPs que no vuelven.
  if (byIp.size > 5000) for (const [k, v] of byIp) if (v.lockedUntil < now && now - v.first > WINDOW_MS) byIp.delete(k);
  return { remaining: MAX_FAILS - e.fails };
}

export async function registerSuccess(ip: string) {
  if (storeInDb()) {
    await db().from('admin_login_attempts').delete().eq('key', keyFor(ip));
    return;
  }
  byIp.delete(ip);
}

/** Demora creciente por intento fallido (y extra si hay un ataque repartido). */
export async function failureDelayMs(ip: string): Promise<number> {
  let fails = 0;
  if (storeInDb()) {
    const { data } = await db().from('admin_login_attempts').select('failures').eq('key', keyFor(ip)).maybeSingle();
    fails = data?.failures ?? 0;
  } else {
    fails = byIp.get(ip)?.fails ?? 0;
  }
  return Math.min(400 + fails * 400, 2500) + ((await underGlobalAttack()) ? 2000 : 0);
}

/** Verificación antibots con Cloudflare Turnstile, si hay claves configuradas. */
export function turnstileConfigured(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!turnstileConfigured()) return true;
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
