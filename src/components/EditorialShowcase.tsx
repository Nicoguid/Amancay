'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { useStore } from '@/context/StoreContext';
import { ShoppingBag, Check, CreditCard, Sparkles, ArrowRight } from 'lucide-react';

interface EditorialShowcaseProps {
  products: Product[];
}

export function EditorialShowcase({ products }: EditorialShowcaseProps) {
  const { addToCart } = useStore();
  const [addedId, setAddedId] = useState<string | null>(null);

  if (!products || products.length === 0) return null;

  const spotlight = products[0];
  const sideItems = products.slice(1, 4);

  const handleAdd = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : undefined;
    addToCart(product, 1, defaultVariant);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  const cuota3Spotlight = Math.round(spotlight.price / 3);

  return (
    <section className="py-16 sm:py-24 bg-[#ffffff] border-b border-[#e6dac6] overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-2xl mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf7f0] border border-[#e6dac6] text-xs font-bold uppercase tracking-wider text-[#a67c3f]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Selección de Autor</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#1a1612] tracking-tight">
            Destacados de Orfebrería & Perfumería
          </h2>
          <p className="text-sm sm:text-base text-[#5a524a] font-sans">
            Piezas seleccionadas a mano por nuestros maestros orfebres y perfumistas. Embalaje protegido y listo para regalar sin cargo adicional.
          </p>
        </div>

        {/* Editorial Asymmetric Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Main Large Spotlight (7 cols) */}
          <div className="lg:col-span-7 group bg-[#faf7f0] rounded-xl border border-[#e6dac6] hover:border-[#a67c3f] transition-all overflow-hidden flex flex-col justify-between shadow-sm">
            <Link href={`/producto/${spotlight.id}`} className="block relative aspect-[16/11] overflow-hidden bg-[#f4efe6]">
              <img
                src={spotlight.images[0]}
                alt={spotlight.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#1a1612] text-white shadow-xs">
                  Pieza Insignia
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0b3821] text-white shadow-xs">
                  3 Cuotas Galicia
                </span>
              </div>
            </Link>

            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between text-xs text-[#5a524a]">
                <span className="font-bold uppercase tracking-wider text-[#a67c3f]">{spotlight.brand}</span>
                <span className="capitalize font-semibold">{spotlight.category}</span>
              </div>

              <Link href={`/producto/${spotlight.id}`} className="block">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#1a1612] group-hover:text-[#a67c3f] transition-colors leading-tight">
                  {spotlight.name}
                </h3>
              </Link>

              <p className="text-sm sm:text-base text-[#5a524a] line-clamp-2 leading-relaxed font-sans">
                {spotlight.description}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#e6dac6] pt-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl sm:text-3xl font-bold text-[#1a1612] tabular-nums">
                      ${spotlight.price.toLocaleString('es-AR')}
                    </span>
                    {spotlight.originalPrice && spotlight.originalPrice > spotlight.price && (
                      <span className="text-xs line-through text-[#5a524a] tabular-nums">
                        ${spotlight.originalPrice.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#0b3821] font-semibold mt-0.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#a67c3f]" />
                    <span>3 cuotas Galicia de ${cuota3Spotlight.toLocaleString('es-AR')} (Noviembre)</span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleAdd(spotlight, e)}
                  className={`tap-interactive py-3 px-6 rounded-full text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                    addedId === spotlight.id
                      ? 'bg-[#0b3821] text-white'
                      : 'bg-[#1a1612] hover:bg-[#a67c3f] text-white shadow-sm'
                  }`}
                >
                  {addedId === spotlight.id ? (
                    <>
                      <Check className="w-4 h-4 text-[#25d366]" />
                      <span>¡Agregado!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-[#c5a059]" />
                      <span>Agregar al Carrito</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Side Items (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            {sideItems.map((item) => {
              const itemCuota = Math.round(item.price / 3);
              return (
                <div
                  key={item.id}
                  className="group bg-[#faf7f0] rounded-xl border border-[#e6dac6] hover:border-[#a67c3f] transition-all p-4 flex gap-4 items-center shadow-xs"
                >
                  <Link href={`/producto/${item.id}`} className="block relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-[#f4efe6] shrink-0 border border-[#e6dac6]">
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#a67c3f]">
                      <span>{item.brand}</span>
                      <span>·</span>
                      <span className="capitalize">{item.category}</span>
                    </div>

                    <Link href={`/producto/${item.id}`} className="block">
                      <h4 className="font-display text-base font-bold text-[#1a1612] group-hover:text-[#a67c3f] transition-colors leading-snug line-clamp-1">
                        {item.name}
                      </h4>
                    </Link>

                    <div className="pt-1">
                      <span className="font-display text-base sm:text-lg font-bold text-[#1a1612] tabular-nums block">
                        ${item.price.toLocaleString('es-AR')}
                      </span>
                      <span className="text-[11px] text-[#0b3821] font-semibold block">
                        3 cuotas Galicia de ${itemCuota.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleAdd(item, e)}
                      className="tap-interactive text-[11px] font-bold uppercase tracking-wider text-[#1a1612] hover:text-[#a67c3f] transition-colors flex items-center gap-1 pt-1"
                    >
                      <span>{addedId === item.id ? '✓ Agregado' : '+ Sumar al carrito'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
