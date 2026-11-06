import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="mb-3 font-display text-4xl tracking-tight">No encontramos esta página</h1>
      <p className="mb-8 text-[var(--ink-muted)]">Puede que el producto ya no esté publicado o que el link tenga un error.</p>
      <Link
        href="/catalogo"
        className="tap-interactive inline-flex min-h-12 items-center rounded-full bg-[var(--ink-primary)] px-8 font-semibold text-white hover:bg-[var(--ink-secondary)]"
      >
        Ver el catálogo
      </Link>
    </div>
  );
}
