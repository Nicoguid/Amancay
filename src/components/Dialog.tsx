'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Texto chico arriba del título (opcional). */
  eyebrow?: string;
  variant?: 'center' | 'drawer';
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Diálogo modal sobre <dialog> nativo: atrapa el foco, cierra con Escape,
 * deja el resto de la página inerte y devuelve el foco al botón que lo abrió.
 */
export function Dialog({ open, onClose, title, eyebrow, variant = 'center', children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const isDrawer = variant === 'drawer';

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`amancay-dialog font-sans text-[var(--ink-primary)] bg-white p-0 shadow-2xl backdrop:bg-[#1a1612]/60 ${
        isDrawer
          ? 'amancay-drawer m-0 ml-auto h-dvh max-h-dvh w-full max-w-md border-l border-[var(--amancay-border)]'
          : 'm-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-[var(--amancay-border)]'
      }`}
    >
      {open && (
        <div className={isDrawer ? 'flex h-full flex-col' : 'flex max-h-[85dvh] flex-col'}>
          <div className="flex items-start justify-between gap-4 border-b border-[var(--amancay-border)] bg-[var(--bg-page)] px-5 py-4">
            <div>
              {eyebrow && <p className="text-sm font-semibold text-[var(--ink-accent)]">{eyebrow}</p>}
              <h2 id={titleId} className="font-display text-2xl text-[var(--ink-primary)]">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="tap-interactive -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink-primary)]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
          {footer && <div className="border-t border-[var(--amancay-border)] bg-[var(--bg-page)] p-5">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
