import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogContent } from './CatalogContent';

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Mates, bombillas y perfumes con precio y stock. Retiro en Av. Corrientes 3666 o envío.',
};

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Catálogo</h1>
          <p className="mt-2 text-[var(--ink-muted)]">Cargando productos…</p>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
