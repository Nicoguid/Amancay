import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { AdminPanel } from './AdminPanel';
import { AdminDataProvider } from './AdminDataContext';
import { SESSION_COOKIE, isValidSessionToken } from '@/lib/adminSession';
import { getCatalog } from '@/lib/server/catalog';
import { db, dbConfigured } from '@/lib/server/supabase';
import { toOrder, type OrderWithItems } from '@/lib/server/orders';
import { INITIAL_ORDERS } from '@/lib/mockData';
import type { Order } from '@/lib/types';
import type { Withdrawal } from './dataActions';

export const metadata: Metadata = {
  title: 'Panel del local',
  robots: { index: false, follow: false },
};

/** Últimos pedidos con sus renglones y consentimientos (el resumen calcula sobre esto). */
async function loadOrders(): Promise<Order[]> {
  // Sin base (alguien mirando el diseño): pedidos de ejemplo.
  if (!dbConfigured()) return INITIAL_ORDERS;
  const { data, error } = await db()
    .from('orders')
    .select('*, order_items(*), consents(*)')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw new Error(`No se pudieron leer los pedidos: ${error.message}`);
  return (data as OrderWithItems[]).map(toOrder);
}

async function loadWithdrawals(): Promise<Withdrawal[]> {
  if (!dbConfigured()) return [];
  const { data, error } = await db().from('withdrawal_requests').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) throw new Error(`No se pudieron leer los arrepentimientos: ${error.message}`);
  return data.map((w) => ({
    id: w.id,
    code: w.code,
    orderNumber: w.order_number,
    orderId: w.order_id,
    fullName: w.full_name,
    email: w.email,
    status: w.status as Withdrawal['status'],
    emailSentAt: w.email_sent_at,
    createdAt: w.created_at,
  }));
}

/** Segundo control, del lado del servidor, por si el proxy no corriera. */
async function SessionGate() {
  await connection(); // la verificación compara con la hora actual: siempre en el momento del pedido
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!isValidSessionToken(token)) redirect('/admin/ingresar');
  const [products, orders, withdrawals] = await Promise.all([getCatalog(), loadOrders(), loadWithdrawals()]);
  return (
    <AdminDataProvider products={products} orders={orders} withdrawals={withdrawals}>
      <AdminPanel />
    </AdminDataProvider>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="p-16 text-center text-[var(--ink-muted)]">Verificando acceso…</p>}>
      <SessionGate />
    </Suspense>
  );
}
