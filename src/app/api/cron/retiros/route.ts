import { revalidateTag } from 'next/cache';
import { type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { db, dbConfigured } from '@/lib/server/supabase';
import { sendPickupReminder } from '@/lib/server/email';
import { PICKUP_REMINDER_MS } from '@/lib/server/orders';
import { CATALOG_TAG } from '@/lib/server/catalog';
import type { PaymentMethod } from '@/lib/types';

/*
 * Tarea programada (Vercel Cron; ver vercel.json). En el plan Hobby solo puede correr una vez por día
 * (13:00 UTC = 10:00 en Argentina); con Pro conviene pasarla a cada hora ("0 * * * *"). Vercel la llama con
 * "Authorization: Bearer <CRON_SECRET>"; sin ese secreto responde 401.
 *
 * 1. Retiros en el local que nadie buscó a las 48 h: manda un mail de aviso (una sola vez).
 * 2. Vence lo vencido (impagos y "efectivo o tarjeta al retirar" a las 72 h) y devuelve el stock.
 *    pg_cron ya lo hace cada 15 minutos; acá se repite por las dudas.
 */

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get('authorization') ?? '';
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const got = Buffer.from(header);
  return got.length === expected.length && timingSafeEqual(got, expected);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return new Response('no autorizado', { status: 401 });
  if (!dbConfigured()) return Response.json({ ok: false, error: 'sin base' }, { status: 503 });

  const cutoff = new Date(Date.now() - PICKUP_REMINDER_MS).toISOString();
  const { data: due, error } = await db()
    .from('orders')
    .select('id, order_number, payment_method, customer_name, customer_email, expires_at')
    .eq('shipping_method', 'pickup')
    .in('status', ['pendiente', 'pagado', 'en_preparacion', 'listo_para_retirar'])
    .is('pickup_reminder_sent_at', null)
    .lt('created_at', cutoff)
    .limit(100);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  let reminded = 0;
  for (const o of due ?? []) {
    // Los "efectivo al retirar" todavía sin pagar se avisan; también los ya pagados que nadie buscó.
    await sendPickupReminder(
      {
        orderNumber: o.order_number,
        paymentMethod: o.payment_method as PaymentMethod,
        customer: { fullName: o.customer_name, email: o.customer_email, phone: '' },
      },
      o.expires_at ?? undefined
    );
    await db().from('orders').update({ pickup_reminder_sent_at: new Date().toISOString() }).eq('id', o.id);
    await db().from('order_events').insert({ order_id: o.id, type: 'aviso_retiro', source: 'sistema' });
    reminded++;
  }

  const { data: expired } = await db().rpc('expire_pending_orders');
  if (expired) revalidateTag(CATALOG_TAG, 'max');

  return Response.json({ ok: true, reminded, expired: expired ?? 0 });
}
