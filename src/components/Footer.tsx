'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, MessageCircle, ChevronUp } from 'lucide-react';
import { BrandSeal } from './BrandMark';
import { CATEGORIES } from '@/lib/categories';
import { STORE, whatsappUrl } from '@/lib/storeConfig';
import { CABA_CONSUMIDOR_URL, LEGAL_DOCS, LEGAL_ORDER, VUF_URL, legalPath } from '@/lib/legal';
import { openCookiePreferences } from '@/lib/consent';

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--amancay-border)] bg-[var(--bg-sunken)] pb-10 pt-16 font-sans text-[var(--ink-primary)]">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-10 border-b border-[var(--amancay-border)] pb-12 text-[var(--ink-secondary)] md:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <div className="flex items-center gap-3">
              <BrandSeal className="h-12 w-12" />
              <p className="font-display text-3xl text-[var(--brand-leather)]">Amancay</p>
            </div>
            <p className="max-w-sm leading-relaxed">
              Perfumería, mates y bombillas sobre Av. Corrientes, en Almagro. Comprá online y retirá en el local.
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-leather)]" aria-hidden="true" />
              <span>
                {STORE.address}, {STORE.neighborhood}
                <br />
                {STORE.transit}
              </span>
            </p>
            <ul aria-label="Medios de pago" className="flex flex-wrap gap-2 pt-2">
              {['Mercado Pago', 'Transferencia', 'Efectivo en el local'].map((m) => (
                <li key={m} className="rounded-full border border-[var(--amancay-border)] bg-[var(--bg-page)] px-3 py-1 text-xs font-semibold text-[var(--ink-secondary)]">
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <nav aria-labelledby="footer-catalogo" className="space-y-3 lg:col-span-3">
            <h2 id="footer-catalogo" className="font-display text-xl text-[var(--brand-leather)]">
              Catálogo
            </h2>
            <ul className="space-y-1">
              {[
                ...CATEGORIES.map((c) => ({ href: `/catalogo?rubro=${c.id}`, label: c.label })),
                { href: '/catalogo', label: 'Todo el catálogo' },
                { href: '/#como-comprar', label: 'Retiro y envíos' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex min-h-10 items-center hover:text-[var(--brand-leather)] hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-3 lg:col-span-3">
            <h2 className="font-display text-xl text-[var(--brand-leather)]">Horarios y contacto</h2>
            <div className="flex items-start gap-2">
              <Clock className="mt-1 h-4 w-4 shrink-0 text-[var(--brand-leather)]" aria-hidden="true" />
              <ul>
                {STORE.hours.map((h) => (
                  <li key={h.days}>
                    {h.days}: {h.time}
                  </li>
                ))}
              </ul>
            </div>
            <a href={STORE.phoneHref} className="flex min-h-10 items-center gap-2 hover:text-[var(--brand-leather)] hover:underline">
              <Phone className="h-4 w-4 shrink-0 text-[var(--brand-leather)]" aria-hidden="true" />
              {STORE.whatsappDisplay}
            </a>
            <a href={`mailto:${STORE.email}`} className="flex min-h-10 items-center gap-2 hover:text-[var(--brand-leather)] hover:underline">
              <Mail className="h-4 w-4 shrink-0 text-[var(--brand-leather)]" aria-hidden="true" />
              {STORE.email}
            </a>
          </div>

          <div className="flex flex-col items-start gap-4 lg:col-span-2 lg:items-end">
            <a
              href={whatsappUrl('Hola Amancay, quería hacer una consulta.')}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-interactive flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--whatsapp-action)] px-5 font-semibold text-white hover:bg-[var(--whatsapp-action-hover)] lg:w-auto"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="tap-interactive flex min-h-10 items-center gap-1 text-sm font-semibold text-[var(--brand-leather)] hover:text-[var(--brand-leather-hover)]"
            >
              <span>Volver arriba</span>
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-5 pt-8 text-sm text-[var(--ink-muted)]">
          <nav aria-label="Información legal">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <li>
                <Link href="/arrepentimiento" className="inline-flex min-h-11 items-center font-semibold text-[var(--ink-primary)] underline decoration-dotted hover:text-[var(--brand-leather)]">
                  Botón de arrepentimiento
                </Link>
              </li>
              {LEGAL_ORDER.map((slug) => (
                <li key={slug}>
                  <Link href={legalPath(slug)} className="inline-flex min-h-11 items-center underline decoration-dotted hover:text-[var(--brand-leather)]">
                    {LEGAL_DOCS[slug].title}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="inline-flex min-h-11 items-center underline decoration-dotted hover:text-[var(--brand-leather)]"
                >
                  Preferencias de cookies
                </button>
              </li>
            </ul>
          </nav>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <li>
                {/* Texto exacto que pide la Res. 274/2021 (Ventanilla Única Federal). */}
                <a href={VUF_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline decoration-dotted hover:text-[var(--brand-leather)]">
                  Defensa de las y los Consumidores. Para reclamos. Ingrese aquí
                </a>
              </li>
              <li>
                {/* CABA, Ley 2244: enlace a la Dirección General de Defensa y Protección al Consumidor. */}
                <a href={CABA_CONSUMIDOR_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline decoration-dotted hover:text-[var(--brand-leather)]">
                  Defensa al Consumidor CABA
                </a>
              </li>
              <li>
                <Link href="/admin" className="inline-flex min-h-11 items-center underline decoration-dotted hover:text-[var(--brand-leather)]">
                  Panel del local
                </Link>
              </li>
            </ul>
            <p>
              © 2026 {STORE.name} · {STORE.legal.holder} · CUIT {STORE.legal.cuit}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
