'use client';

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';

/*
 * Entrada al scrollear: el bloque sube unos píxeles y aparece la primera vez que entra en pantalla.
 * Valores de la animación del Figma (ver globals.css, sección "Entradas").
 *
 * El contenido sale visible del servidor. Recién en el navegador, y solo si el bloque está
 * debajo de la pantalla, se oculta ("armed") y se observa. Si falla el JavaScript, se ve todo.
 */

type Listener = () => void;
const listeners = new WeakMap<Element, Listener>();
let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        listeners.get(entry.target)?.();
        listeners.delete(entry.target);
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );
  return observer;
}

interface RevealProps {
  children: ReactNode;
  /** Etiqueta a renderizar (li, section…). */
  as?: ElementType;
  /** Posición en una fila de hermanos: cada uno entra 70 ms después del anterior. */
  index?: number;
  /** Cuántos píxeles sube. Títulos 14, tarjetas 16, bloques grandes 18. */
  rise?: number;
  className?: string;
  id?: string;
  'aria-labelledby'?: string;
}

export function Reveal({ children, as: Tag = 'div', index = 0, rise = 14, className, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    // Lo que ya está a la vista al cargar no se oculta (evita un parpadeo).
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    el.dataset.reveal = 'armed';
    listeners.set(el, () => {
      el.dataset.reveal = 'shown';
    });
    const io = getObserver();
    io.observe(el);
    return () => {
      listeners.delete(el);
      io.unobserve(el);
    };
  }, []);

  const style = { '--rise': `${rise}px`, '--reveal-delay': `${index * 70}ms` } as CSSProperties;

  return (
    <Tag ref={ref} className={className} style={style} {...rest}>
      {children}
    </Tag>
  );
}
