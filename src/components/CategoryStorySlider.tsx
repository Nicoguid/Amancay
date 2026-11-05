'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  subtitle: string;
  image: string;
  count: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'mates',
    slug: 'mates',
    name: 'Mates de Autor',
    tagline: 'Imperiales & Camioneros',
    subtitle: 'Calabazas gruesas seleccionadas, cuero vacuno legítimo y virolas de alpaca cincelada.',
    image: 'https://images.unsplash.com/photo-1583321500900-82807e458f3c?auto=format&fit=crop&w=800&q=80',
    count: 'Ver Mates'
  },
  {
    id: 'bombillas',
    slug: 'bombillas',
    name: 'Bombillas Cinceladas',
    tagline: 'Alpaca & Acero 304',
    subtitle: 'Pico de loro curvado anatómico, caño labrado criollo y filtrado microperforado.',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    count: 'Ver Bombillas'
  },
  {
    id: 'perfumes',
    slug: 'perfumes',
    name: 'Perfumería Fina',
    tagline: 'Fragancias de Autor',
    subtitle: 'Composiciones exclusivas, esencias porteñas y clásicos de alta fijación.',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
    count: 'Ver Perfumes'
  }
];

export function CategoryStorySlider() {
  return (
    <section className="py-16 sm:py-24 bg-[#faf7f0] border-b border-[#e6dac6] overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4efe6] border border-[#e6dac6] text-xs font-bold uppercase tracking-wider text-[#a67c3f]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nuestras Especialidades</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl text-[#1a1612] tracking-tight font-bold">
            Tres Pasiones, Una Sola Casa
          </h2>
          <p className="text-sm sm:text-base text-[#5a524a] font-sans leading-relaxed">
            Curaduría artesanal de mates criollos, orfebrería en bombillas y perfumería fina con retiro en nuestro mostrador de Almagro o envío seguro a todo el país.
          </p>
        </div>

        {/* 3 Prominent Heroic Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {CATEGORIES.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/catalogo?rubro=${cat.slug}`}
              className="tap-interactive group relative h-[420px] sm:h-[480px] rounded-xl overflow-hidden transition-all duration-300 flex flex-col justify-end p-6 sm:p-8 bg-[#1a1612] border border-[#e6dac6] hover:border-[#a67c3f] shadow-sm hover:shadow-xl"
            >
              {/* Background Picture with Smooth Zoom */}
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 opacity-80"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#14110e] via-[#14110e]/60 to-transparent group-hover:via-[#14110e]/50 transition-colors" />

              {/* Content on bottom */}
              <div className="relative z-10 text-white space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#c5a059] block">
                  {cat.tagline}
                </span>

                <h3 className="font-display text-2xl sm:text-3xl font-bold text-white group-hover:text-[#c5a059] transition-colors leading-tight">
                  {cat.name}
                </h3>

                <p className="text-xs sm:text-sm text-[#faf7f0]/85 line-clamp-2 leading-relaxed font-sans pt-1">
                  {cat.subtitle}
                </p>

                <div className="pt-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                    <span>{cat.count}</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] text-[#faf7f0]/60 font-medium px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-xs">
                    Colección 2026
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
