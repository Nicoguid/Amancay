'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

/**
 * Guardar un producto para después (queda en este navegador, sin cuenta).
 * `variant="icon"`: botón redondo sobre la foto. `variant="text"`: botón con texto.
 */
export function SaveButton({
  productId,
  productName,
  variant = 'icon',
  className = '',
}: {
  productId: string;
  productName: string;
  variant?: 'icon' | 'text';
  className?: string;
}) {
  const { savedIds, toggleSaved, isHydrated } = useStore();
  const saved = isHydrated && savedIds.includes(productId);
  // Cambia en cada toque para volver a disparar la animación del ícono.
  const [pulse, setPulse] = useState(0);
  const [announce, setAnnounce] = useState('');

  const onToggle = () => {
    const nowSaved = toggleSaved(productId);
    setPulse((n) => n + 1);
    setAnnounce(nowSaved ? `${productName} guardado.` : `${productName} quitado de guardados.`);
  };

  const icon = (
    <Bookmark
      key={pulse}
      className={`h-[18px] w-[18px] ${pulse > 0 && saved ? 'save-pop' : ''}`}
      fill={saved ? 'currentColor' : 'none'}
      aria-hidden="true"
    />
  );

  if (variant === 'text') {
    return (
      <button type="button" onClick={onToggle} aria-pressed={saved} className={`btn btn-quiet ${className}`}>
        {icon}
        <span>{saved ? 'Guardado' : 'Guardar'}</span>
        <span className="sr-only">: {productName}</span>
        <span className="sr-only" role="status">
          {announce}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={saved ? `Quitar ${productName} de guardados` : `Guardar ${productName}`}
      className={`tap-interactive flex h-11 w-11 items-center justify-center ${className}`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full shadow-[0_2px_6px_rgba(29,15,9,0.14)] transition-colors duration-150 ${
          saved ? 'bg-[var(--brand-gold)] text-[var(--ink-on-gold)]' : 'bg-white/95 text-[var(--ink-primary)] hover:bg-white'
        }`}
      >
        {icon}
      </span>
      <span className="sr-only" role="status">
        {announce}
      </span>
    </button>
  );
}
