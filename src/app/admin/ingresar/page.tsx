import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Ingresar al panel',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <h1 className="font-display text-[36px] leading-tight">Panel del local</h1>
      <p className="mt-2 text-[var(--ink-muted)]">Ingresá con la contraseña del local para ver precios, stock y pedidos.</p>
      <LoginForm turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''} />
    </div>
  );
}
