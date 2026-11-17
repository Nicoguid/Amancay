import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogContent } from './CatalogContent';

export const metadata: Metadata = {
  title: 'Catálogo de mates, bombillas y perfumería en Almagro',
  description: 'Mates, bombillas, perfumes, desodorantes y combos con precio y stock. Retiro en Av. Corrientes 3666 o envío.',
};

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="border-b border-[var(--amancay-border)] bg-[var(--bg-subtle)]">
          <div className="mx-auto max-w-[1320px] px-4 pb-5 pt-8 sm:px-8 sm:pt-12 lg:px-12">
            <h1 className="font-display text-[36px] leading-[1.1] tracking-[-0.02em] sm:text-[48px]">Catálogo de Amancay</h1>
            <p className="mt-3 text-lg text-[var(--ink-muted)]" role="status">
              Cargando productos…
            </p>
          </div>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
