'use client';

import { useEffect, useRef, useState } from 'react';
import { STORE, waText, whatsappUrl } from '@/lib/storeConfig';
import { looksAutomated } from '@/lib/formGuard';
import { submitWithdrawal } from './actions';

type Request = { code: string; order: string; fullName: string; email: string; at: string };

const field =
  'w-full rounded-lg border border-[var(--amancay-border)] bg-[var(--bg-page)] px-3 py-2.5 focus:border-[var(--brand-leather)]';

export function ArrepentimientoForm() {
  const [data, setData] = useState({ order: '', fullName: '', email: '', website: '' });
  const [errors, setErrors] = useState<Partial<Record<'order' | 'fullName' | 'email', string>>>({});
  const [done, setDone] = useState<Request | null>(null);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const startedAt = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSubmitError(null);
    const found: typeof errors = {};
    if (data.order.trim().length < 4) found.order = 'Escribí el número de pedido, ej.: AMC-7K3QX9.';
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

    setSending(true);
    let result: Awaited<ReturnType<typeof submitWithdrawal>>;
    try {
      result = await submitWithdrawal({ ...data, elapsedMs: Date.now() - startedAt.current });
    } catch {
      result = { ok: false, error: 'No pudimos conectarnos. Probá de nuevo o escribinos por WhatsApp.' };
    }
    setSending(false);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    setDone({
      code: result.code,
      order: data.order.trim().toUpperCase(),
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      at: result.at,
    });
  };

  if (done) {
    const text = `Hola Amancay, pido la revocación del pedido ${waText(done.order)} (botón de arrepentimiento). Código ${done.code}. ${waText(done.fullName)}, ${waText(done.email)}.`;
    return (
      <div role="status" className="mt-8 space-y-3 rounded-lg border border-[var(--brand-olive)] bg-[var(--brand-olive-wash)] p-6">
        <p className="font-display text-2xl">Recibimos tu pedido de revocación</p>
        <p className="leading-relaxed">
          Tu código de trámite es <strong className="tabular font-semibold">{done.code}</strong>. Guardalo: con ese código seguís la
          devolución. Te escribimos a {done.email} para coordinarla.
        </p>
        <p className="text-sm text-[var(--ink-muted)]">
          El pedido ya quedó registrado en el local. Si querés, mandá también el código por WhatsApp para agilizarlo.
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
      {submitError && (
        <p role="alert" className="rounded-btn border border-[var(--amancay-wine)] bg-white p-3 text-sm font-semibold text-[var(--amancay-wine)]">
          {submitError}
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        aria-busy={sending}
        className="tap-interactive min-h-12 w-full rounded-btn bg-[var(--brand-leather)] font-semibold text-white hover:bg-[var(--brand-leather-hover)] disabled:opacity-70"
      >
        {sending ? 'Enviando…' : 'Pedir la revocación'}
      </button>
      <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
        Usamos estos datos solo para identificar la compra y responderte. Responsable: {STORE.legal.holder}.
      </p>
    </form>
  );
}
