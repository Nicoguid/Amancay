import Link from 'next/link';

/**
 * Sello provisorio de la marca (monograma en anillo dorado).
 * Se reemplaza por el logo definitivo cuando la clienta elija una de las opciones de /Logos.
 */
export function BrandSeal({ className = 'h-11 w-11' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill="var(--brand-espresso)" />
      <circle cx="24" cy="24" r="19.5" fill="none" stroke="var(--brand-gold)" strokeWidth="1" />
      <circle cx="24" cy="24" r="17.5" fill="none" stroke="var(--brand-gold)" strokeWidth="0.5" strokeDasharray="1 2" />
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
  const name = tone === 'dark' ? 'text-[var(--ink-primary)]' : 'text-white';
  const sub = tone === 'dark' ? 'text-[var(--ink-gold)]' : 'text-[var(--ink-gold-on-dark)]';
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-2.5 py-1 sm:gap-3">
      <BrandSeal className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
      <span className="flex flex-col">
        <span translate="no" className={`font-display text-2xl leading-none sm:text-[26px] ${name}`}>
          Amancay
        </span>
        <span className={`mt-1 hidden text-[12px] font-bold uppercase leading-none tracking-[0.06em] sm:block ${sub}`}>
          Perfumería · Mates · Almagro
        </span>
      </span>
    </Link>
  );
}
