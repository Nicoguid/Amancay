'use server';

import { LEGAL_DOCS } from '@/lib/legal';
import { db, dbConfigured } from '@/lib/server/supabase';

/*
 * Registro en el servidor de la elección del aviso de cookies (aceptar o rechazar la medición).
 * Los consentimientos del checkout se guardan junto con el pedido en create_order.
 * No se guarda nada que identifique a la persona: solo qué eligió, cuándo, dónde y cómo.
 */
export async function logCookieConsent(input: { decision: 'aceptado' | 'rechazado'; method: string; page: string }): Promise<void> {
  if (!dbConfigured()) return;
  const decision = input?.decision === 'aceptado' ? 'aceptado' : 'rechazado';
  const method = String(input?.method ?? '').slice(0, 60) || 'aviso de cookies';
  const page = String(input?.page ?? '/').slice(0, 200);
  if (!page.startsWith('/')) return;
  const { error } = await db()
    .from('consents')
    .insert({ doc: 'cookies', version: LEGAL_DOCS.cookies.version, decision, method, page });
  if (error) console.error('[consentimiento cookies]', error.message);
}
