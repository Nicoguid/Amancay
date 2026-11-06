'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, Pause, Play } from 'lucide-react';
import { ProductImage } from './ProductImage';
import { STORE } from '@/lib/storeConfig';

interface BannerSlide {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: { text: string; href: string };
  secondaryCta: { text: string; href: string };
  image: string;
  imageAlt: string;
}

// Fotos de archivo (Unsplash): reemplazar por fotos propias del local (PRODUCT.md).
const SLIDES: BannerSlide[] = [
  {
    id: 'slide-mates',
    eyebrow: 'Mates',
    title: 'Mates imperiales, camioneros y torpedos',
    description: 'Calabaza y algarrobo con virolas de alpaca y acero. Precio y stock a la vista.',
    primaryCta: { text: 'Ver mates', href: '/catalogo?rubro=mates' },
    secondaryCta: { text: 'Ver bombillas', href: '/catalogo?rubro=bombillas' },
    image: 'https://images.unsplash.com/photo-1583321500900-82807e458f3c?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Mate de calabaza forrado en cuero',
  },
  {
    id: 'slide-perfumes',
    eyebrow: 'Perfumería',
    title: 'Perfumes de autor y marcas nacionales',
    description: 'Fragancias de la casa y clásicos nacionales en 50 y 100 ml.',
    primaryCta: { text: 'Ver perfumes', href: '/catalogo?rubro=perfumes' },
    secondaryCta: { text: 'Ver todo el catálogo', href: '/catalogo' },
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Frascos de perfume',
  },
  {
    id: 'slide-bombillas',
    eyebrow: 'Bombillas',
    title: 'Bombillas de alpaca y acero',
    description: 'Pico de loro, chatas y desarmables con cepillo.',
    primaryCta: { text: 'Ver bombillas', href: '/catalogo?rubro=bombillas' },
    secondaryCta: { text: 'Ver mates', href: '/catalogo?rubro=mates' },
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Bombilla de metal',
  },
];

const INTERVAL_MS = 7000;

export function HeroBannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hoverOrFocus, setHoverOrFocus] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const paused = userPaused || hoverOrFocus;

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused]);

  const go = (index: number) => setCurrent((index + SLIDES.length) % SLIDES.length);
  const slide = SLIDES[current];

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carrusel"
      aria-label="Destacados"
      className="focus-on-dark relative overflow-hidden bg-[#14110e] text-white"
      onMouseEnter={() => setHoverOrFocus(true)}
      onMouseLeave={() => setHoverOrFocus(false)}
      onFocus={() => setHoverOrFocus(true)}
      onBlur={(e) => {
        if (!sectionRef.current?.contains(e.relatedTarget as Node)) setHoverOrFocus(false);
      }}
    >
      {/* Fondo: solo la imagen activa */}
      <div className="absolute inset-0" aria-hidden="true">
        <ProductImage
          key={slide.id}
          src={slide.image}
          alt=""
          width={1200}
          height={800}
          priority={current === 0}
          className="animate-fade-in-up h-full w-full object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/35" />
      </div>

      <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-center px-4 py-12 sm:min-h-[520px] sm:px-6 sm:py-16 lg:px-8">
        <div
          role="group"
          aria-roledescription="diapositiva"
          aria-label={`${current + 1} de ${SLIDES.length}`}
          className="max-w-2xl space-y-5"
        >
          <p className="text-sm font-semibold text-[var(--amancay-gold-light)]">{slide.eyebrow}</p>
          <h2 className="font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">{slide.title}</h2>
          <p className="text-lg leading-relaxed text-white/90">{slide.description}</p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={slide.primaryCta.href}
              className="tap-interactive inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--amancay-gold-light)] px-7 font-semibold text-[var(--ink-primary)] shadow-md hover:bg-white"
            >
              <span>{slide.primaryCta.text}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={slide.secondaryCta.href}
              className="tap-interactive inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 font-semibold text-white hover:bg-white/20"
            >
              {slide.secondaryCta.text}
            </Link>
          </div>
          <p className="hidden pt-2 text-sm text-white/85 sm:block">
            {STORE.address}, {STORE.neighborhood} · Retiro sin costo
          </p>
        </div>
      </div>

      {/* Controles: anterior, pausa, puntos y siguiente */}
      <div className="relative mx-auto flex max-w-7xl items-center gap-2 px-4 pb-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => go(current - 1)}
          aria-label="Destacado anterior"
          className="tap-interactive flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/40 hover:bg-black/70"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setUserPaused((p) => !p)}
          aria-label={userPaused ? 'Reanudar destacados' : 'Pausar destacados'}
          className="tap-interactive flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/40 hover:bg-black/70"
        >
          {userPaused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
        </button>
        <div className="flex items-center">
          {SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(idx)}
              aria-label={`Ir al destacado ${idx + 1}: ${s.eyebrow}`}
              aria-current={idx === current ? 'true' : undefined}
              className="flex h-11 w-8 items-center justify-center"
            >
              <span
                className={`block h-2 rounded-full transition-[width,background-color] duration-300 ${
                  idx === current ? 'w-6 bg-[var(--amancay-gold-light)]' : 'w-2 bg-white/50'
                }`}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(current + 1)}
          aria-label="Destacado siguiente"
          className="tap-interactive flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/40 hover:bg-black/70"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
