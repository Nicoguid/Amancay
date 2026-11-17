/* eslint-disable @next/next/no-img-element --
   Las fotos pueden venir de cualquier URL que cargue la dueña en el panel, así que no usamos
   next/image (exige declarar cada dominio). A cambio: tamaño fijo, carga diferida y fallback. */

import { BrandSeal } from './BrandMark';

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
        className={`@container flex flex-col items-center justify-center gap-2 bg-[var(--bg-subtle)] text-[var(--ink-muted)] ${className}`}
      >
        <BrandSeal className="h-1/4 max-h-16 min-h-6 w-auto opacity-50" />
        <span className="hidden text-center text-xs font-semibold @[140px]:block">Foto en camino</span>
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
