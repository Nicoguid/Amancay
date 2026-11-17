'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  checkAttempt,
  failureDelayMs,
  passwordConfigured,
  registerFailure,
  registerSuccess,
  turnstileConfigured,
  underGlobalAttack,
  verifyPassword,
  verifyTurnstile,
} from '@/lib/adminAuth';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/adminSession';

export type LoginState = { error?: string; retryInSeconds?: number };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local';
}

function minutes(seconds: number) {
  const m = Math.ceil(seconds / 60);
  return m === 1 ? '1 minuto' : `${m} minutos`;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!passwordConfigured()) {
    return { error: 'El panel todavía no tiene contraseña configurada. Mirá las instrucciones en .env.example.' };
  }
  const ip = await clientIp();

  const gate = checkAttempt(ip);
  if (!gate.allowed) {
    return { error: `Demasiados intentos. Probá de nuevo en ${minutes(gate.retryInSeconds)}.`, retryInSeconds: gate.retryInSeconds };
  }

  // Campo trampa: una persona no lo ve; un bot que completa todo, sí. Cuenta como intento fallido.
  const honeypot = String(formData.get('website') ?? '');
  const password = String(formData.get('password') ?? '');
  const turnstileToken = String(formData.get('cf-turnstile-response') ?? '');

  const humanOk = honeypot === '' && (await verifyTurnstile(turnstileToken, ip));
  const passwordOk = humanOk && verifyPassword(password);

  if (!passwordOk) {
    await wait(failureDelayMs(ip));
    const { remaining, lockedForSeconds } = registerFailure(ip);
    if (lockedForSeconds) {
      return { error: `Demasiados intentos. El ingreso queda bloqueado ${minutes(lockedForSeconds)}.`, retryInSeconds: lockedForSeconds };
    }
    if (!humanOk && turnstileConfigured()) return { error: 'No pudimos verificar que no seas un robot. Probá de nuevo.' };
    return {
      error: `Contraseña incorrecta. ${remaining === 1 ? 'Te queda 1 intento' : `Te quedan ${remaining} intentos`} antes de que se bloquee el ingreso.${
        underGlobalAttack() ? ' Hay muchos intentos fallidos en este momento: el ingreso está más lento.' : ''
      }`,
    };
  }

  registerSuccess(ip);
  const token = createSessionToken();
  if (!token) return { error: 'Falta ADMIN_SESSION_SECRET en la configuración del servidor.' };
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
  redirect('/admin');
}

export async function logout() {
  (await cookies()).set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 });
  redirect('/admin/ingresar');
}
