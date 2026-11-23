import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { connection } from 'next/server';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { db, dbConfigured } from '@/lib/server/supabase';
import { getMpOrder, mpConfigured } from '@/lib/server/mercadopago';
import { applyMpState } from '@/lib/server/orders';
import { formatPrice, whatsappUrl } from '@/lib/storeConfig';

export const metadata: Metadata = {
  title: 'Resultado del pago',
  robots: { index: false },
};

/*
 * Mercado Pago devuelve al cliente acá (success/pending/failure_url).
 * No se confía en los parámetros que agrega Mercado Pago a la URL: se consulta la Order
 * directamente y se actualiza el pedido (por si el webhook todavía no llegó).
 * Solo se muestra el estado y el total: nada de datos personales.
 */

const CODE_RE = /^AMC-[A-Z0-9]{4,10}$/;

type Search = Promise<{ pedido?: string | string[] }>;

async function Result({ searchParams }: { searchParams: Search }) {
  await connection();
  const raw = (await searchParams).pedido;
  const code = (Array.isArray(raw) ? raw[0] : raw ?? '').toUpperCase();

  if (!CODE_RE.test(code) || !dbConfigured()) return <Message kind="unknown" code={code} />;

  let { data: order } = await db().from('orders').select('id, order_number, status, payment_status, total, mp_order_id').eq('order_number', code).maybeSingle();
  if (!order) return <Message kind="unknown" code={code} />;

  if (order.mp_order_id && order.payment_status !== 'aprobado' && mpConfigured()) {
    try {
      await applyMpState(await getMpOrder(order.mp_order_id));
      ({ data: order } = await db().from('orders').select('id, order_number, status, payment_status, total, mp_order_id').eq('id', order.id).maybeSingle());
    } catch (e) {
      console.error('[resultado] no se pudo consultar Mercado Pago', e);
    }
  }
  if (!order) return <Message kind="unknown" code={code} />;

  const kind =
    order.payment_status === 'aprobado'
      ? 'approved'
      : order.payment_status === 'rechazado'
        ? 'rejected'
        : order.status === 'cancelado'
          ? 'cancelled'
          : 'pending';
  return <Message kind={kind} code={order.order_number} total={Number(order.total)} />;
}

const COPY = {
  approved: {
    Icon: CheckCircle2,
    title: '¡Pago aprobado!',
    body: 'Ya estamos preparando tu pedido. Te avisamos por WhatsApp cuando esté listo.',
  },
  pending: {
    Icon: Clock,
    title: 'Estamos esperando la confirmación del pago',
    body: 'Si ya pagaste, puede tardar unos minutos. Lo vas a ver actualizado en Mis pedidos.',
  },
  rejected: {
    Icon: XCircle,
    title: 'El pago no se aprobó',
    body: 'No se cobró nada. Te reservamos los productos un rato más: podés volver a intentar con otro medio o escribirnos.',
  },
  cancelled: {
    Icon: XCircle,
    title: 'El pedido se canceló',
    body: 'Venció el tiempo para pagar y los productos volvieron al catálogo. Si querés, armalo de nuevo.',
  },
  unknown: {
    Icon: Clock,
    title: 'No encontramos ese pedido',
    body: 'Revisá el código o buscalo en Mis pedidos con tu email.',
  },
} as const;

function Message({ kind, code, total }: { kind: keyof typeof COPY; code: string; total?: number }) {
  const { Icon, title, body } = COPY[kind];
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <Icon
        className={`mx-auto h-14 w-14 ${kind === 'approved' ? 'text-[var(--brand-olive)]' : kind === 'pending' || kind === 'unknown' ? 'text-[var(--ink-gold)]' : 'text-[var(--amancay-wine)]'}`}
        aria-hidden="true"
      />
      <h1 className="mt-4 font-display text-[32px] leading-tight tracking-[-0.02em]">{title}</h1>
      {kind !== 'unknown' && (
        <p className="mt-2 text-[var(--ink-muted)]">
          Pedido <strong className="tabular-nums text-[var(--ink-primary)]">{code}</strong>
          {total !== undefined && <> · {formatPrice(total)}</>}
        </p>
      )}
      <p className="mt-4 text-[var(--ink-secondary)]">{body}</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/mis-pedidos" className="btn btn-primary">
          Ver Mis pedidos
        </Link>
        {kind === 'cancelled' || kind === 'unknown' ? (
          <Link href="/catalogo" className="btn btn-outline">
            Ir al catálogo
          </Link>
        ) : (
          <a
            href={whatsappUrl(`Hola Amancay, consulto por el pedido ${code}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            Escribir por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

export default function ResultadoPage({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<p className="p-16 text-center text-[var(--ink-muted)]">Consultando el pago…</p>}>
      <Result searchParams={searchParams} />
    </Suspense>
  );
}
