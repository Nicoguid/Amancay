'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/*
 * Tarjeta reversible (pedido de la dueña, 17/11/2026): dos caras en el mismo lugar para
 * ahorrar alto en Perfil. Gira con el botón de cada cara o deslizando el dedo de costado.
 * La cara de atrás queda `inert` mientras no se ve, así el teclado y el lector de pantalla
 * solo recorren lo visible. Con movimiento reducido cambia sin girar (globals.css).
 */
export function FlipCard({
  flipped,
  onFlip,
  front,
  back,
  className = '',
}: {
  flipped: boolean;
  onFlip: (next: boolean) => void;
  front: ReactNode;
  back: ReactNode;
  className?: string;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  // Al girar, el foco pasa al botón de la cara que queda a la vista (la otra se vuelve inert).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const face = root.current?.querySelectorAll<HTMLElement>('.flip-face')[flipped ? 1 : 0];
    const active = document.activeElement;
    if (face && (!active || active === document.body || !face.contains(active))) {
      face.querySelector<HTMLElement>('[data-flip-focus]')?.focus({ preventScroll: true });
    }
  }, [flipped]);

  return (
    <div
      ref={root}
      className={`flip-card ${className}`}
      data-flipped={flipped}
      onPointerDown={(e) => {
        // Solo el dedo, y no al empezar sobre un campo (ahí se selecciona texto).
        if (e.pointerType !== 'touch' || (e.target as Element).closest('input, select, textarea')) return;
        start.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const s = start.current;
        start.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) > 70 && Math.abs(e.clientY - s.y) < 40) onFlip(!flipped);
      }}
      onPointerCancel={() => (start.current = null)}
    >
      <div className="flip-inner">
        <div className="flip-face" inert={flipped} aria-hidden={flipped || undefined}>
          {front}
        </div>
        <div className="flip-face flip-back" inert={!flipped} aria-hidden={!flipped || undefined}>
          {back}
        </div>
      </div>
    </div>
  );
}
