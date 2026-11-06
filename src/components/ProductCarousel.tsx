'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';

interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllLink?: string;
  viewAllLabel?: string;
}

export function ProductCarousel({ title, subtitle, products, viewAllLink, viewAllLabel = 'Ver todos' }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLUListElement>(null);
  const headingId = useId();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', update);
    };
  }, [products.length]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const offset = el.clientWidth * 0.8;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction === 'left' ? -offset : offset, behavior: reduce ? 'auto' : 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="border-b border-[var(--amancay-border)] bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 id={headingId} className="font-display text-3xl tracking-tight text-[var(--ink-primary)] lg:text-4xl">
              {title}
            </h2>
            {subtitle && <p className="mt-1 max-w-2xl text-[var(--ink-muted)]">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            {viewAllLink && (
              <Link
                href={viewAllLink}
                className="mr-2 font-semibold text-[var(--ink-accent)] underline-offset-4 hover:text-[var(--ink-accent-hover)] hover:underline"
              >
                {viewAllLabel}
              </Link>
            )}
            {(canScrollLeft || canScrollRight) && (
              <>
                <button
                  type="button"
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  aria-label={`Anteriores: ${title}`}
                  className="tap-interactive flex h-11 w-11 items-center justify-center rounded-full border border-[var(--amancay-border)] bg-[var(--bg-page)] text-[var(--ink-primary)] hover:bg-[var(--ink-primary)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--bg-page)] disabled:hover:text-[var(--ink-primary)]"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  aria-label={`Siguientes: ${title}`}
                  className="tap-interactive flex h-11 w-11 items-center justify-center rounded-full border border-[var(--amancay-border)] bg-[var(--bg-page)] text-[var(--ink-primary)] hover:bg-[var(--ink-primary)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--bg-page)] disabled:hover:text-[var(--ink-primary)]"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>

        <ul ref={scrollRef} className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-4 sm:mx-0 sm:gap-6 sm:px-0">
          {products.map((product) => (
            <li key={product.id} className="w-[260px] shrink-0 snap-start sm:w-[300px]">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
