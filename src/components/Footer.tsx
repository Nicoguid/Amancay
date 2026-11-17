'use client';

import Link from 'next/link';
import { MapPin, Clock, MessageCircle, Mail, TrainFront, Map as MapIcon } from 'lucide-react';
import { BrandSeal } from './BrandMark';
import { CATEGORIES } from '@/lib/categories';
import { STORE, whatsappUrl } from '@/lib/storeConfig';
import { CABA_CONSUMIDOR_URL, LEGAL_DOCS, LEGAL_ORDER, VUF_URL, legalPath } from '@/lib/legal';
import { openCookiePreferences } from '@/lib/consent';

const footerLink =
  'inline-flex min-h-10 items-center underline decoration-transparent underline-offset-4 transition-[text-decoration-color,color] duration-150 hover:text-[var(--ink-primary)] hover:decoration-[var(--brand-brass)]';

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--amancay-border)] bg-[var(--bg-sunken)] pb-10 pt-14 font-sans text-[var(--ink-primary)]">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-10 border-b border-[var(--amancay-border)] pb-12 text-[15px] text-[var(--ink-muted)] sm:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-3">
            <div className="flex items-center gap-3">
              <BrandSeal className="h-11 w-11" />
              <p translate="no" className="font-display text-[26px] text-[var(--ink-primary)]">
                Amancay
              </p>
            </div>
            <p className="max-w-sm leading-relaxed">
              Perfumería, mates y bombillas sobre Av. Corrientes, en Almagro. Comprá online y retirá en el local.
            </p>
            <ul aria-label="Rubros" className="flex flex-wrap gap-x-4 gap-y-0">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <Link href={`/catalogo?rubro=${c.id}`} className={footerLink}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 lg:col-span-3">
            <h2 className="font-display text-xl text-[var(--ink-primary)]">El local y cómo llegar</h2>
            <p className="flex items-start gap-2.5">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-[var(--ink-gold)]" aria-hidden="true" />
              <span>
                {STORE.address}, {STORE.neighborhood}
              </span>
            </p>
            <p className="flex items-start gap-2.5">
              <TrainFront className="mt-1 h-4 w-4 shrink-0 text-[var(--ink-gold)]" aria-hidden="true" />
              <span>{STORE.transit}</span>
            </p>
            <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className={`${footerLink} gap-2 font-semibold text-[var(--ink-primary)]`}>
              <MapIcon className="h-4 w-4" aria-hidden="true" />
              Ver en Google Maps
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          </div>

          <div className="space-y-3 lg:col-span-3">
            <h2 className="font-display text-xl text-[var(--ink-primary)]">Horarios y pagos</h2>
            <div className="flex items-start gap-2.5">
              <Clock className="mt-1 h-4 w-4 shrink-0 text-[var(--ink-gold)]" aria-hidden="true" />
              <ul className="space-y-0.5">
                {STORE.hours.map((h) => (
                  <li key={h.days}>
                    <span className="text-[var(--ink-secondary)]">{h.days}:</span> <span className="tabular-nums">{h.time}</span>
                  </li>
                ))}
              </ul>
            </div>
            <ul aria-label="Medios de pago" className="flex flex-wrap gap-2 pt-1">
              {['Mercado Pago', 'Transferencia', 'Efectivo o tarjeta en el local'].map((m) => (
                <li key={m} className="tag tag-quiet">
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 lg:col-span-3">
            <h2 className="font-display text-xl text-[var(--ink-primary)]">Atención por WhatsApp</h2>
            <p className="leading-relaxed">Consultas de stock, fotos del producto que tenemos en el local y pedidos.</p>
            <div className="rounded-lg bg-[var(--chip)] p-4">
              <p className="eyebrow">WhatsApp y teléfono</p>
              <a href={STORE.phoneHref} className="flex min-h-11 items-center text-lg font-bold tabular-nums text-[var(--ink-primary)] hover:underline">
                {STORE.whatsappDisplay}
              </a>
              <a
                href={whatsappUrl('Hola Amancay, quería hacer una consulta.')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary mt-1 w-full"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Escribir al local
              </a>
            </div>
            <a href={`mailto:${STORE.email}`} className={`${footerLink} gap-2`}>
              <Mail className="h-4 w-4 shrink-0 text-[var(--ink-gold)]" aria-hidden="true" />
              {STORE.email}
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-5 pt-8 text-sm text-[var(--ink-muted)]">
          <nav aria-label="Información legal">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <li>
                <Link href="/arrepentimiento" className="inline-flex min-h-11 items-center font-semibold text-[var(--ink-primary)] underline decoration-dotted hover:text-[var(--ink-primary)]">
                  Botón de arrepentimiento
                </Link>
              </li>
              {LEGAL_ORDER.map((slug) => (
                <li key={slug}>
                  <Link href={legalPath(slug)} className="inline-flex min-h-11 items-center underline decoration-dotted hover:text-[var(--ink-primary)]">
                    {LEGAL_DOCS[slug].title}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="inline-flex min-h-11 items-center underline decoration-dotted hover:text-[var(--ink-primary)]"
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
                <a href={VUF_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline decoration-dotted hover:text-[var(--ink-primary)]">
                  Defensa de las y los Consumidores. Para reclamos. Ingrese aquí
                </a>
              </li>
              <li>
                {/* CABA, Ley 2244: enlace a la Dirección General de Defensa y Protección al Consumidor. */}
                <a href={CABA_CONSUMIDOR_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline decoration-dotted hover:text-[var(--ink-primary)]">
                  Defensa al Consumidor CABA
                </a>
              </li>
              <li>
                <Link href="/admin" className="inline-flex min-h-11 items-center underline decoration-dotted hover:text-[var(--ink-primary)]">
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
