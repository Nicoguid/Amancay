'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, MessageCircle, Sparkles, CreditCard, Truck, Bike } from 'lucide-react';

interface BannerSlide {
  id: string;
  tag: string;
  title: string;
  highlight: string;
  description: string;
  primaryCta: { text: string; href: string };
  secondaryCta: { text: string; href: string };
  bgColor: string;
  badgeBg: string;
  badgeText: string;
  image: string;
  accentBadge: string;
}

const SLIDES: BannerSlide[] = [
  {
    id: 'slide-1',
    tag: 'Orfebrería Criolla de Autor',
    title: 'Mates Imperiales en Calabaza',
    highlight: '& Alpaca Cincelada.',
    description: 'Calabazas de pared extra gruesa seleccionadas a mano, revestidas en cuero vacuno legítimo con costura reforzada y 4 patas estructuradas. El ritual matero elevado a su máxima expresión.',
    primaryCta: { text: 'Ver Mates Imperiales', href: '/catalogo?rubro=mates' },
    secondaryCta: { text: 'Ver Bombillas de Alpaca', href: '/catalogo?rubro=bombillas' },
    bgColor: 'bg-[#14110e]',
    badgeBg: 'bg-[#a67c3f]',
    badgeText: 'text-[#ffffff]',
    accentBadge: '3 Cuotas Banco Galicia (Noviembre)',
    image: 'https://images.unsplash.com/photo-1583321500900-82807e458f3c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'slide-2',
    tag: 'Perfumería Fina Amancay',
    title: 'Fragancias de Autor',
    highlight: '& Esencias Porteñas.',
    description: 'Creaciones olfativas exclusivas elaboradas con aceites esenciales puros de alta fijación. Notas amaderadas, florales y cítricas que perduran todo el día.',
    primaryCta: { text: 'Descubrir Perfumes', href: '/catalogo?rubro=perfumes' },
    secondaryCta: { text: 'Consultar por WhatsApp', href: 'https://wa.me/5491136740676?text=Hola%20Amancay!%20Quiero%20asesoramiento%20sobre%20fragancias.' },
    bgColor: 'bg-[#1e1316]',
    badgeBg: 'bg-[#672d35]',
    badgeText: 'text-[#ffffff]',
    accentBadge: 'Entregas en el Día en CABA',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'slide-3',
    tag: 'Filtrado de Alta Precisión',
    title: 'Bombillas Pico de Loro',
    highlight: 'en Alpaca y Acero 304.',
    description: 'Caño labrado criollo, pico anatómico y pala con ranuras microperforadas que no se tapan. Piezas forjadas para resistir toda la vida sin calentar los labios.',
    primaryCta: { text: 'Ver Colección Bombillas', href: '/catalogo?rubro=bombillas' },
    secondaryCta: { text: 'Ver Todo el Catálogo', href: '/catalogo' },
    bgColor: 'bg-[#0f1712]',
    badgeBg: 'bg-[#0b3821]',
    badgeText: 'text-[#ffffff]',
    accentBadge: 'Envíos por Correo Argentino',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80'
  }
];

export function HeroBannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(nextSlide, 7000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current, isPaused]);

  const activeSlide = SLIDES[current];

  return (
    <section
      aria-label="Banners Promocionales Destacados"
      className="relative overflow-hidden bg-[#14110e] text-white font-sans"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Slides with Crossfade */}
      <div className="relative min-h-[560px] sm:min-h-[620px] lg:min-h-[680px] flex items-center">
        {SLIDES.map((slide, idx) => {
          const isActive = idx === current;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${slide.bgColor} ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* High-Resolution Background Imagery Overlay */}
              <div className="absolute inset-0 opacity-30">
                <img
                  src={slide.image}
                  alt=""
                  className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-10000"
                />
              </div>

              {/* Scrim for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
            </div>
          );
        })}

        {/* Foreground Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Badges placed above or with title */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${activeSlide.badgeBg} ${activeSlide.badgeText} shadow-xs`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{activeSlide.tag}</span>
                </span>
                <span className="inline-block px-3 py-0.5 rounded-full bg-white/15 text-[#faf7f0] text-xs font-semibold backdrop-blur-xs">
                  {activeSlide.accentBadge}
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-white">
                {activeSlide.title}{' '}
                <span className="text-[#c5a059] block sm:inline font-bold">
                  {activeSlide.highlight}
                </span>
              </h1>

              {/* Subtitle Description */}
              <p className="text-sm sm:text-lg text-white/90 max-w-2xl leading-relaxed font-sans font-normal">
                {activeSlide.description}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href={activeSlide.primaryCta.href}
                  className="tap-interactive inline-flex items-center justify-center gap-2 bg-[#a67c3f] hover:bg-[#8c652d] text-white text-sm sm:text-base font-bold uppercase tracking-wider px-7 py-3.5 rounded-full transition-all shadow-md"
                >
                  <span>{activeSlide.primaryCta.text}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href={activeSlide.secondaryCta.href}
                  target={activeSlide.secondaryCta.href.startsWith('http') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="tap-interactive inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm sm:text-base font-semibold px-6 py-3.5 rounded-full backdrop-blur-xs transition-colors border border-white/20"
                >
                  <span>{activeSlide.secondaryCta.text}</span>
                </a>
              </div>

              {/* Quick Trust Highlights under CTA */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-white/85 font-medium border-t border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#c5a059]" />
                  <span>Av. Corrientes 3666, Almagro</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#c5a059]" />
                  <span>Retiro en 1 hora sin costo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#25d366]" />
                  <span>Atención directa por WhatsApp</span>
                </div>
              </div>

            </div>

            {/* Right Column: Hero Visual Card */}
            <div className="lg:col-span-4 hidden lg:block">
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-black/40 border border-[#a67c3f]/40 shadow-2xl">
                <img
                  src={activeSlide.image}
                  alt={activeSlide.title}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {/* Floating Tag overlay */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-lg bg-[#14110e]/95 backdrop-blur-xs border border-[#a67c3f]/30 text-white">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#c5a059] block mb-1">
                    Garantía Artesanal
                  </span>
                  <p className="font-display text-lg font-bold leading-tight">
                    {activeSlide.highlight}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        <button
          onClick={prevSlide}
          aria-label="Banner anterior"
          className="tap-interactive absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors border border-white/20"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextSlide}
          aria-label="Siguiente banner"
          className="tap-interactive absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors border border-white/20"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              aria-label={`Ir al banner ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === current ? 'w-8 bg-[#c5a059]' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
