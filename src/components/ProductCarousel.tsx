'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  products: Product[];
  tag?: string;
  viewAllLink?: string;
}

export function ProductCarousel({ title, subtitle, products, tag, viewAllLink }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth'
    });
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 bg-[#ffffff] border-b border-[#e6dac6] overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Title and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {tag && (
                <span className="text-xs font-bold uppercase tracking-wider text-[#a67c3f] bg-[#faf7f0] px-2.5 py-0.5 rounded-full border border-[#e6dac6]">
                  {tag}
                </span>
              )}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-[#1a1612] tracking-tight font-bold">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-[#5a524a] font-sans mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            {viewAllLink && (
              <Link
                href={viewAllLink}
                className="text-xs font-bold uppercase tracking-wider text-[#a67c3f] hover:text-[#1a1612] flex items-center gap-1 transition-colors mr-2"
              >
                <span>Ver todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Desplazar hacia la izquierda"
              className={`tap-interactive w-10 h-10 rounded-full border border-[#e6dac6] flex items-center justify-center transition-colors ${
                canScrollLeft
                  ? 'bg-[#faf7f0] hover:bg-[#1a1612] hover:text-white text-[#1a1612]'
                  : 'bg-[#faf7f0]/40 text-[#5a524a]/40 cursor-not-allowed opacity-40'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Desplazar hacia la derecha"
              className={`tap-interactive w-10 h-10 rounded-full border border-[#e6dac6] flex items-center justify-center transition-colors ${
                canScrollRight
                  ? 'bg-[#faf7f0] hover:bg-[#1a1612] hover:text-white text-[#1a1612]'
                  : 'bg-[#faf7f0]/40 text-[#5a524a]/40 cursor-not-allowed opacity-40'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Products Ribbon */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-5 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[280px] sm:w-[310px] shrink-0"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
