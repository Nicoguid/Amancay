import { revalidateTag } from 'next/cache';
import { type NextRequest } from 'next/server';
import { db, dbConfigured } from '@/lib/server/supabase';
import { getMpOrder, validWebhookSignature } from '@/lib/server/mercadopago';
import { applyMpState } from '@/lib/server/orders';
import { CATALOG_TAG } from '@/lib/server/catalog';

/*
 * Avisos de Mercado Pago (Webhooks, evento "Order").
 * URL a cargar en Tus integraciones > Webhooks: https://<dominio>/api/mercadopago/webhook
 *
 * 1. Se valida la firma (x-signature) con la clave secreta del webhook. Sin firma válida: 401.
 * 2. Se registra el aviso en payment_events. Si ese x-request-id ya llegó, se responde 200 y listo.
 * 3. Se CONSULTA la Order a Mercado Pago (el cuerpo del aviso no se usa para decidir nada).
 * 4. Se actualiza el pedido. Si algo falla se responde 500 y Mercado Pago reintenta.
 */

const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;

export async function POST(request: NextRequest) {
  const url = request.nextUrl;
  const dataId = url.searchParams.get('data.id') ?? url.searchParams.get('id');
  const topic = url.searchParams.get('type') ?? url.searchParams.get('topic') ?? 'desconocido';
  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');

  if (!validWebhookSignature({ xSignature, xRequestId, dataId })) {
    return new Response('firma inválida', { status: 401 });
  }
  if (!dataId || !ID_RE.test(dataId) || !xRequestId) return new Response('aviso incompleto', { status: 400 });
  if (!dbConfigured()) return new Response('sin base', { status: 503 });

  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    // Algunos avisos llegan sin cuerpo: alcanza con data.id.
  }

  const { data: event, error: insertError } = await db()
    .from('payment_events')
    .insert({ request_id: xRequestId.slice(0, 120), topic: topic.slice(0, 40), resource_id: dataId, payload: (payload ?? {}) as never })
    .select('id')
    .single();

  if (insertError) {
    // 23505 = clave duplicada: este aviso ya se procesó.
    if (insertError.code === '23505') return new Response('ok', { status: 200 });
    console.error('[webhook mp] no se pudo registrar el aviso', insertError.message);
    return new Response('error', { status: 500 });
  }

  // Solo interesan los avisos de Orders. El resto queda registrado y se responde 200.
  if (topic !== 'order') return new Response('ok', { status: 200 });

  try {
    const mp = await getMpOrder(dataId);
    const result = await applyMpState(mp);
    await db()
      .from('payment_events')
      .update({ processed_at: new Date().toISOString(), order_id: result.orderId, error: result.note ?? null })
      .eq('id', event.id);
    // Si se canceló un pedido, volvió stock: el catálogo en caché se refresca en segundo plano.
    if (result.changed) revalidateTag(CATALOG_TAG, 'max');
    return new Response('ok', { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[webhook mp] error procesando', dataId, message);
    await db().from('payment_events').update({ error: message.slice(0, 500) }).eq('id', event.id);
    // Se borra el registro para que el reintento de Mercado Pago se procese de nuevo.
    await db().from('payment_events').delete().eq('id', event.id);
    return new Response('error', { status: 500 });
  }
}
