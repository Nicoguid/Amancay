import 'server-only';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, isValidSessionToken } from '@/lib/adminSession';
import { dbConfigured } from './supabase';

/** Resultado de las acciones del panel: nunca tira, siempre devuelve ok o un mensaje claro. */
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export const ok = <T,>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (error: string): ActionResult<never> => ({ ok: false, error });

/** Una Server Action se puede llamar sin pasar por la página: cada una vuelve a verificar la sesión. */
export async function requireAdmin(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!isValidSessionToken(token)) throw new Error('Sesión vencida. Volvé a ingresar al panel.');
  if (!dbConfigured()) throw new Error('La base de datos no está configurada.');
}

export async function guard<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    await requireAdmin();
    return await fn();
  } catch (e) {
    console.error('[panel]', e);
    return fail(e instanceof Error && e.message.startsWith('Sesión') ? e.message : 'No se pudo guardar. Probá de nuevo.');
  }
}
