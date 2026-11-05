'use client';

import React from 'react';

interface MarqueeTickerProps {
  variant?: 'top' | 'accent' | 'brands';
}

export function MarqueeTicker({ variant = 'top' }: MarqueeTickerProps) {
  if (variant === 'top') {
    const items = [
      '💳 3 CUOTAS SIN INTERÉS CON BANCO GALICIA (EXCLUSIVO MES DE NOVIEMBRE)',
      '🛵 ENTREGAS EN EL DÍA EN CABA POR MOTOMENSAJERÍA',
      '📦 ENVÍOS A TODO EL PAÍS POR CORREO ARGENTINO (A CARGO DEL COMPRADOR)',
      '🧉 MATES IMPERIALES DE CALABAZA Y ALGARROBO SELECCIONADO',
      '✨ PERFUMERÍA FINA & FRAGANCIAS DE AUTOR AMANCAY',
      '📍 RETIRO EN MOSTRADOR: Av. Corrientes 3666 (Almagro, CABA)',
      '📲 PEDIDOS Y ASESORAMIENTO DIRECTO POR WHATSAPP: +54 9 11 3674-0676'
    ];

    return (
      <div className="bg-[#1a1612] text-[#faf7f0] border-b border-[#2c2520] overflow-x-clip py-2.5 text-xs sm:text-sm font-semibold tracking-wide select-none max-w-full">
        <div className="animate-marquee flex items-center gap-10 whitespace-nowrap">
          {items.concat(items).map((text, idx) => (
            <span key={idx} className="flex items-center gap-8">
              <span className="w-2 h-2 rounded-full bg-[#a67c3f] inline-block shadow-xs" />
              <span>{text}</span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'brands') {
    const brands = [
      'Amancay Orfebrería',
      'Kevin',
      'Banco Galicia (3 Cuotas Noviembre)',
      'Paula Cahen d\'Anvers',
      'Alpaca Cincelada',
      'Colbert',
      'Calabazas Seleccionadas',
      'Acero Quirúrgico 304'
    ];

    return (
      <div className="bg-[#f4efe6] py-5 border-y border-[#e6dac6] overflow-x-clip select-none max-w-full">
        <div className="animate-marquee-reverse flex items-center gap-12 whitespace-nowrap">
          {brands.concat(brands).map((brand, idx) => (
            <span key={idx} className="flex items-center gap-8 font-display text-xl sm:text-2xl text-[#1a1612]/85 hover:text-[#0b3821] transition-colors">
              <span>{brand}</span>
              <span className="w-2 h-2 rounded-full bg-[#672d35] inline-block" />
            </span>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
