import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrepentimientoForm } from './ArrepentimientoForm';
import { legalPath } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Botón de arrepentimiento',
  description:
    'Revocá una compra online en Perfumería Amancay dentro de los 10 días corridos, sin registrarte. Te mandamos el código de trámite en 24 horas.',
  alternates: { canonical: '/arrepentimiento' },
};

export default function ArrepentimientoPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="font-display text-[36px] leading-tight sm:text-[44px]">Botón de arrepentimiento</h1>
      <p className="mt-4 max-w-[60ch] text-lg leading-[1.65] text-[var(--ink-muted)]">
        Si compraste online en Amancay, tenés 10 días corridos desde que recibiste el producto para revocar la compra, sin
        explicar el motivo y sin costo (artículo 34 de la Ley 24.240). No hace falta registrarte: completá estos tres datos y te
        mandamos el código de trámite dentro de las 24 horas.
      </p>
      <ArrepentimientoForm />
      <p className="mt-8 text-sm leading-relaxed text-[var(--ink-muted)]">
        Cómo sigue la devolución y cuándo se acredita el dinero:{' '}
        <Link href={legalPath('cambios-y-devoluciones')} className="link-brass">
          cambios, devoluciones y reembolsos
        </Link>
        .
      </p>
    </div>
  );
}
