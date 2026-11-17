import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { AdminPanel } from './AdminPanel';
import { SESSION_COOKIE, isValidSessionToken } from '@/lib/adminSession';

export const metadata: Metadata = {
  title: 'Panel del local',
  robots: { index: false, follow: false },
};

/** Segundo control, del lado del servidor, por si el proxy no corriera. */
async function SessionGate() {
  await connection(); // la verificación compara con la hora actual: siempre en el momento del pedido
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!isValidSessionToken(token)) redirect('/admin/ingresar');
  return <AdminPanel />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="p-16 text-center text-[var(--ink-muted)]">Verificando acceso…</p>}>
      <SessionGate />
    </Suspense>
  );
}
