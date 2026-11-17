import Link from 'next/link';
import { BrandSeal } from '@/components/BrandMark';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-5 py-24 text-center">
      <BrandSeal className="mb-6 h-14 w-14" />
      <h1 className="mb-3 font-display text-[40px] leading-tight">No encontramos esta página</h1>
      <p className="mb-8 text-lg leading-relaxed text-[var(--ink-muted)]">
        Puede que el producto ya no esté publicado o que el link tenga un error. En el catálogo está todo lo que hay en el local.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/catalogo"
          className="tap-interactive inline-flex min-h-12 items-center rounded-full bg-[var(--brand-leather)] px-8 font-semibold text-white hover:bg-[var(--brand-leather-hover)]"
        >
          Ver el catálogo
        </Link>
        <Link
          href="/"
          className="tap-interactive inline-flex min-h-12 items-center rounded-full border-[1.5px] border-[var(--brand-leather)] px-7 font-semibold text-[var(--brand-leather)] hover:bg-[var(--brand-leather-wash)]"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
