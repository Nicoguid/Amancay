'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { useStore } from '@/context/StoreContext';
import { ShoppingBag, Check, CreditCard } from 'lucide-react';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore();
  const [isAdded, setIsAdded] = useState(false);

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : null;

  const cuota3Galicia = Math.round(product.price / 3);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : undefined;
    addToCart(product, 1, defaultVariant);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <article className="group relative bg-[#ffffff] rounded-lg border border-[#e6dac6] transition-all duration-300 hover:border-[#a67c3f] hover:shadow-lg flex flex-col justify-between overflow-hidden font-sans">
      <div>
        {/* Image Box with Dual-Photo Hover Swap */}
        <Link href={`/producto/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-[#faf7f0]">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          {product.images[1] && (
            <img
              src={product.images[1]}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"
            />
          )}

          {/* Badges on Top */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            {product.isBestSeller && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#0b3821] text-white shadow-xs">
                Más Vendido
              </span>
            )}
            {discountPercent && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#672d35] text-white shadow-xs">
                {discountPercent}% OFF
              </span>
            )}
            {product.isNew && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#a67c3f] text-white shadow-xs">
                Nuevo Ingreso
              </span>
            )}
          </div>
        </Link>

        {/* Content Box */}
        <div className="p-4 space-y-1.5">
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-xs text-[#5a524a]">
            <span className="font-semibold uppercase tracking-wider text-[#a67c3f]">{product.brand}</span>
            <span className="capitalize font-medium text-[#5a524a]">{product.category}</span>
          </div>

          {/* Product Name */}
          <Link href={`/producto/${product.id}`} className="block">
            <h3 className="font-display text-base sm:text-lg font-semibold text-[#1a1612] group-hover:text-[#a67c3f] transition-colors leading-snug line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-xs text-[#5a524a] line-clamp-2 leading-relaxed pt-0.5">
              {product.shortDescription}
            </p>
          )}

          {/* Variant Indicators */}
          {product.variants && product.variants.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {product.variants.slice(0, 2).map((v) => (
                <span key={v.id} className="text-[10px] px-2 py-0.5 rounded-full bg-[#faf7f0] border border-[#e6dac6] font-medium text-[#1a1612]">
                  {v.name}
                </span>
              ))}
              {product.variants.length > 2 && (
                <span className="text-[10px] px-1.5 py-0.5 text-[#5a524a] font-medium">
                  +{product.variants.length - 2} más
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pricing & CTA */}
      <div className="p-4 pt-0 space-y-3">
        {/* Price row */}
        <div className="border-t border-[#f4efe6] pt-2.5">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl sm:text-2xl font-bold text-[#1a1612] tabular-nums">
              ${product.price.toLocaleString('es-AR')}
            </span>
            {hasDiscount && (
              <span className="text-xs line-through text-[#5a524a]/70 tabular-nums">
                ${product.originalPrice!.toLocaleString('es-AR')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#0b3821] font-semibold mt-0.5">
            <CreditCard className="w-3.5 h-3.5 text-[#a67c3f]" />
            <span>3 cuotas Galicia de ${cuota3Galicia.toLocaleString('es-AR')} (Noviembre)</span>
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={handleQuickAdd}
          className={`tap-interactive w-full py-2.5 px-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            isAdded
              ? 'bg-[#0b3821] text-white shadow-xs'
              : 'bg-[#1a1612] text-white hover:bg-[#a67c3f] shadow-xs'
          }`}
          aria-label={`Agregar ${product.name} a la bolsa`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4 text-[#25d366]" />
              <span>¡Agregado al Carrito!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4 text-[#c5a059]" />
              <span>Agregar al Carrito</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
