/* eslint-disable @next/next/no-img-element --
   Las fotos pueden venir de cualquier URL que cargue la dueña en el panel, así que no usamos
   next/image (exige declarar cada dominio). A cambio: tamaño fijo, carga diferida y fallback. */

import { ImageOff } from 'lucide-react';

interface ProductImageProps {
  src?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}

export function ProductImage({ src, alt, width, height, className = '', priority = false }: ProductImageProps) {
  if (!src) {
    return (
      <div
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`flex items-center justify-center bg-[var(--bg-subtle)] text-[var(--ink-muted)] ${className}`}
      >
        <ImageOff className="h-6 w-6" aria-hidden="true" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={className}
    />
  );
}
