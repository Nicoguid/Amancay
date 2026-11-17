import Link from 'next/link';

/**
 * Sello provisorio de la marca (monograma en anillo de bronce).
 * Se reemplaza por el logo definitivo cuando esté aprobado.
 */
export function BrandSeal({ className = 'h-11 w-11' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill="var(--brand-leather)" />
      <circle cx="24" cy="24" r="19.5" fill="none" stroke="var(--brand-brass)" strokeWidth="1" />
      <circle cx="24" cy="24" r="17.5" fill="none" stroke="var(--brand-brass)" strokeWidth="0.5" strokeDasharray="1 2" />
      <text
        x="24"
        y="31.5"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="22"
        fontWeight="600"
        fill="var(--bg-page)"
      >
        A
      </text>
    </svg>
  );
}

export function BrandMark({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const name = tone === 'dark' ? 'text-[var(--brand-leather)]' : 'text-white';
  const sub = tone === 'dark' ? 'text-[var(--ink-muted)]' : 'text-white/75';
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-3 py-1">
      <BrandSeal className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
      <span className="flex flex-col">
        <span translate="no" className={`font-display text-2xl leading-none ${name}`}>Amancay</span>
        <span className={`mt-1 hidden text-[13px] font-medium sm:block ${sub}`}>Almagro</span>
      </span>
    </Link>
  );
}
