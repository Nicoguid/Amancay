'use server';

import { MIN_FILL_MS } from '@/lib/formGuard';
import { db, dbConfigured } from '@/lib/server/supabase';
import { orderEvent } from '@/lib/server/orders';

/*
 * Botón de arrepentimiento (Disp. 954/2025): se registra en la base con su código de trámite.
 * Si el número de pedido y el email coinciden con un pedido real, queda vinculado y aparece en el panel.
 * La norma pide enviar el código por email dentro de las 24 h: email_sent_at queda en null hasta que
 * se conecte el envío de mails (ver checklist).
 */

export type WithdrawalResult = { ok: true; code: string; at: string } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitWithdrawal(input: {
  order: string;
  fullName: string;
  email: string;
  website: string;
  elapsedMs: number;
}): Promise<WithdrawalResult> {
  const order = String(input?.order ?? '').trim().toUpperCase().slice(0, 40);
  const fullName = String(input?.fullName ?? '').trim().slice(0, 120);
  const email = String(input?.email ?? '').trim().toLowerCase().slice(0, 120);

  if (order.length < 4 || fullName.length < 3 || !EMAIL_RE.test(email)) return { ok: false, error: 'Revisá los datos del formulario.' };
  // Antispam (no se avisa por qué).
  if (String(input?.website ?? '') !== '' || !(Number(input?.elapsedMs) >= MIN_FILL_MS)) {
    return { ok: false, error: 'No pudimos registrar el pedido. Probá de nuevo en unos segundos.' };
  }
  if (!dbConfigured()) return { ok: false, error: 'No pudimos registrar el pedido en este momento. Escribinos por WhatsApp.' };

  const { data: match } = await db().from('orders').select('id').eq('order_number', order).eq('customer_email', email).maybeSingle();

  const { data, error } = await db()
    .from('withdrawal_requests')
    .insert({ order_number: order, order_id: match?.id ?? null, full_name: fullName, email })
    .select('code, created_at')
    .single();
  if (error || !data) {
    console.error('[arrepentimiento]', error?.message);
    return { ok: false, error: 'No pudimos registrar el pedido. Escribinos por WhatsApp y lo hacemos a mano.' };
  }
  if (match) await orderEvent(match.id, 'arrepentimiento', 'cliente', undefined, data.code);
  return { ok: true, code: data.code, at: data.created_at };
}
