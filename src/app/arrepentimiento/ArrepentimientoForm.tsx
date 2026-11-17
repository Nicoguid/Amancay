'use client';

import { useEffect, useRef, useState } from 'react';
import { STORE, whatsappUrl } from '@/lib/storeConfig';
import { looksAutomated, randomCode } from '@/lib/formGuard';

type Request = { code: string; order: string; fullName: string; email: string; at: string };
const KEY = 'amancay_arrepentimientos_v1';

const field =
  'w-full rounded-lg border border-[var(--amancay-border)] bg-[var(--bg-page)] px-3 py-2.5 focus:border-[var(--brand-leather)]';

export function ArrepentimientoForm() {
  const [data, setData] = useState({ order: '', fullName: '', email: '', website: '' });
  const [errors, setErrors] = useState<Partial<Record<'order' | 'fullName' | 'email', string>>>({});
  const [done, setDone] = useState<Request | null>(null);
  const startedAt = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (data.order.trim().length < 4) found.order = 'Escribí el número de pedido, ej.: AMC-123456.';
    if (data.fullName.trim().length < 3) found.fullName = 'Escribí tu nombre y apellido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) found.email = 'Escribí un email válido: ahí te llega el código.';
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }
    // Antispam: campo trampa lleno o envío en menos de 2 segundos. No se avisa por qué.
    if (looksAutomated(data.website, startedAt.current)) return;

    const request: Request = {
      code: randomCode('ARR'),
      order: data.order.trim().toUpperCase(),
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      at: new Date().toISOString(),
    };
    try {
      const list = JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as Request[];
      window.localStorage.setItem(KEY, JSON.stringify([...list, request].slice(-100)));
    } catch {
      // sin almacenamiento: el código igual se muestra y se puede mandar por WhatsApp
    }
    setDone(request);
  };

  if (done) {
    const text = `Hola Amancay, pido la revocación del pedido ${done.order} (botón de arrepentimiento). Código ${done.code}. ${done.fullName}, ${done.email}.`;
    return (
      <div role="status" className="mt-8 space-y-3 rounded-lg border border-[var(--brand-olive)] bg-[var(--brand-olive-wash)] p-6">
        <p className="font-display text-2xl">Recibimos tu pedido de revocación</p>
        <p className="leading-relaxed">
          Tu código de trámite es <strong className="tabular font-semibold">{done.code}</strong>. Guardalo: con ese código seguís la
          devolución. Te escribimos a {done.email} para coordinarla.
        </p>
        <p className="text-sm text-[var(--ink-muted)]">
          Versión de prueba: la tienda todavía no tiene servidor, así que el pedido queda en este navegador. Mandalo también por
          WhatsApp para que llegue al local.
        </p>
        <a
          href={whatsappUrl(text)}
          target="_blank"
          rel="noopener noreferrer"
          className="tap-interactive inline-flex min-h-12 items-center rounded-btn bg-[var(--whatsapp-action)] px-6 font-semibold text-white hover:bg-[var(--whatsapp-action-hover)]"
        >
          Enviar el código por WhatsApp
        </a>
      </div>
    );
  }

  const input = (name: 'order' | 'fullName' | 'email', label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={`arr-${name}`} className="mb-1 block font-semibold">
        {label}
      </label>
      <input
        id={`arr-${name}`}
        name={name}
        value={data[name]}
        onChange={(e) => setData((d) => ({ ...d, [name]: e.target.value }))}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `arr-${name}-error` : undefined}
        maxLength={120}
        className={`${field} ${errors[name] ? 'border-[var(--amancay-wine)]' : ''}`}
        {...props}
      />
      {errors[name] && (
        <p id={`arr-${name}-error`} className="mt-1 text-sm text-[var(--amancay-wine)]">
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="mt-8 space-y-4 rounded-lg border border-[var(--amancay-border)] bg-white p-6 sm:p-8">
      {input('order', 'Número de pedido', { autoComplete: 'off', spellCheck: false, placeholder: 'Ej.: AMC-123456' })}
      {input('fullName', 'Nombre y apellido', { autoComplete: 'name' })}
      {input('email', 'Email de la compra', { type: 'email', autoComplete: 'email', spellCheck: false })}
      {/* Campo trampa para bots: invisible para personas y lectores de pantalla. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="arr-website">No completar</label>
        <input id="arr-website" name="website" tabIndex={-1} autoComplete="off" value={data.website} onChange={(e) => setData((d) => ({ ...d, website: e.target.value }))} />
      </div>
      <button
        type="submit"
        className="tap-interactive min-h-12 w-full rounded-btn bg-[var(--brand-leather)] font-semibold text-white hover:bg-[var(--brand-leather-hover)]"
      >
        Pedir la revocación
      </button>
      <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
        Usamos estos datos solo para identificar la compra y responderte. Responsable: {STORE.legal.holder}.
      </p>
    </form>
  );
}
