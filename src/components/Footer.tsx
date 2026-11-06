'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, MessageCircle, ChevronUp } from 'lucide-react';
import { Dialog } from './Dialog';
import { STORE, whatsappUrl } from '@/lib/storeConfig';

export function Footer() {
  const [isArrepentimientoOpen, setIsArrepentimientoOpen] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [emailRef, setEmailRef] = useState('');
  const [requestCode, setRequestCode] = useState<string | null>(null);

  const closeArrepentimiento = () => {
    setIsArrepentimientoOpen(false);
    setRequestCode(null);
    setOrderRef('');
    setEmailRef('');
  };

  const handleArrepentimientoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: en producción esto se envía al backend y se manda el código por email.
    setRequestCode(`ARR-${String(Date.now()).slice(-6)}`);
  };

  return (
    <footer className="focus-on-dark w-full border-t border-[var(--ink-secondary)] bg-[#14110e] pb-12 pt-16 font-sans text-[var(--bg-page)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-[var(--ink-secondary)] pb-12 text-[var(--bg-page)]/85 md:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <p className="font-display text-3xl text-white">Amancay</p>
            <p className="max-w-sm leading-relaxed">
              Perfumería, mates y bombillas sobre Av. Corrientes, en Almagro. Comprá online y retirá en el local.
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--amancay-gold-light)]" aria-hidden="true" />
              <span>
                {STORE.address}, {STORE.neighborhood}
                <br />
                {STORE.transit}
              </span>
            </p>
          </div>

          <nav aria-labelledby="footer-catalogo" className="space-y-3 lg:col-span-3">
            <h2 id="footer-catalogo" className="font-display text-lg text-[var(--amancay-gold-light)]">
              Catálogo
            </h2>
            <ul className="space-y-1">
              {[
                { href: '/catalogo?rubro=mates', label: 'Mates' },
                { href: '/catalogo?rubro=bombillas', label: 'Bombillas' },
                { href: '/catalogo?rubro=perfumes', label: 'Perfumes' },
                { href: '/catalogo', label: 'Todo el catálogo' },
                { href: '/#como-comprar', label: 'Retiro y envíos' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex min-h-10 items-center hover:text-white hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-3 lg:col-span-3">
            <h2 className="font-display text-lg text-[var(--amancay-gold-light)]">Horarios y contacto</h2>
            <div className="flex items-start gap-2">
              <Clock className="mt-1 h-4 w-4 shrink-0 text-[var(--amancay-gold-light)]" aria-hidden="true" />
              <ul>
                {STORE.hours.map((h) => (
                  <li key={h.days}>
                    {h.days}: {h.time}
                  </li>
                ))}
              </ul>
            </div>
            <a href={STORE.phoneHref} className="flex min-h-10 items-center gap-2 hover:text-white hover:underline">
              <Phone className="h-4 w-4 shrink-0 text-[var(--amancay-gold-light)]" aria-hidden="true" />
              {STORE.whatsappDisplay}
            </a>
            <a href={`mailto:${STORE.email}`} className="flex min-h-10 items-center gap-2 hover:text-white hover:underline">
              <Mail className="h-4 w-4 shrink-0 text-[var(--amancay-gold-light)]" aria-hidden="true" />
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
              className="tap-interactive flex min-h-10 items-center gap-1 text-sm font-semibold text-[var(--amancay-gold-light)] hover:text-white"
            >
              <span>Volver arriba</span>
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-8 text-sm text-[var(--bg-page)]/80 sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <li>
              <a
                href="https://buenosaires.gob.ar/defensadelconsumidor"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center underline decoration-dotted hover:text-white"
              >
                Defensa de las y los Consumidores
              </a>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setIsArrepentimientoOpen(true)}
                aria-haspopup="dialog"
                className="inline-flex min-h-11 items-center font-semibold text-white underline decoration-dotted hover:text-[var(--amancay-gold-light)]"
              >
                Botón de arrepentimiento
              </button>
            </li>
            <li>
              <Link href="/admin" className="inline-flex min-h-11 items-center underline decoration-dotted hover:text-white">
                Panel del local
              </Link>
            </li>
          </ul>
          <p>© 2026 Perfumería Amancay</p>
        </div>
      </div>

      <Dialog open={isArrepentimientoOpen} onClose={closeArrepentimiento} title="Botón de arrepentimiento">
        <p className="mb-4 leading-relaxed text-[var(--ink-muted)]">
          Por el artículo 34 de la Ley 24.240 tenés 10 días corridos desde que recibís el producto para revocar la compra
          online, sin costo.
        </p>
        {requestCode ? (
          <div role="status" className="space-y-2 rounded-md border border-[var(--amancay-border)] bg-[var(--bg-page)] p-4">
            <p className="font-semibold text-[var(--ink-primary)]">Recibimos tu solicitud</p>
            <p className="text-[var(--ink-muted)]">
              Tu código de solicitud es <strong className="text-[var(--ink-primary)]">{requestCode}</strong>. Te escribimos a{' '}
              {emailRef} para coordinar la devolución.
            </p>
            <p className="text-sm text-[var(--ink-muted)]">Demo: la solicitud no se envía a ningún lado.</p>
          </div>
        ) : (
          <form onSubmit={handleArrepentimientoSubmit} className="space-y-4">
            <div>
              <label htmlFor="arr-order" className="mb-1 block font-semibold">
                Número de pedido
              </label>
              <input
                id="arr-order"
                name="order"
                type="text"
                required
                autoComplete="off"
                spellCheck={false}
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
                placeholder="Ej.: AMC-123456"
                className="w-full rounded-md border border-[var(--amancay-border)] px-3 py-2.5 focus:border-[var(--ink-accent)]"
              />
            </div>
            <div>
              <label htmlFor="arr-email" className="mb-1 block font-semibold">
                Email de la compra
              </label>
              <input
                id="arr-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                spellCheck={false}
                value={emailRef}
                onChange={(e) => setEmailRef(e.target.value)}
                placeholder="tu@email.com"
                className="w-full rounded-md border border-[var(--amancay-border)] px-3 py-2.5 focus:border-[var(--ink-accent)]"
              />
            </div>
            <button
              type="submit"
              className="tap-interactive min-h-12 w-full rounded-md bg-[var(--amancay-wine)] font-semibold text-white hover:bg-[#4a1d23]"
            >
              Pedir la revocación
            </button>
          </form>
        )}
      </Dialog>
    </footer>
  );
}
