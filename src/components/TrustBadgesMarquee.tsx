'use client';

import React from 'react';
import { CreditCard, Bike, Truck, Store } from 'lucide-react';

export function TrustBadgesMarquee() {
  const features = [
    {
      icon: CreditCard,
      title: '3 Cuotas Banco Galicia',
      desc: 'Sin interés con tarjetas de crédito Galicia (Exclusivo Noviembre).',
      badge: 'Exclusivo Galicia',
      badgeColor: 'bg-[#a67c3f] text-[#ffffff]'
    },
    {
      icon: Bike,
      title: 'Motomensajería en CABA',
      desc: 'Entregas en el día coordinando de lunes a viernes (a cargo del comprador).',
      badge: 'En el Día',
      badgeColor: 'bg-[#0b3821] text-[#ffffff]'
    },
    {
      icon: Truck,
      title: 'Correo Argentino',
      desc: 'Envíos a todo el país con seguimiento online (a cargo del comprador).',
      badge: 'Nacional',
      badgeColor: 'bg-[#672d35] text-[#ffffff]'
    },
    {
      icon: Store,
      title: 'Retiro en Mostrador',
      desc: 'Av. Corrientes 3666 (Almagro). Listo en menos de 1 hora.',
      badge: 'Almagro',
      badgeColor: 'bg-[#1a1612] text-[#ffffff]'
    }
  ];

  return (
    <section className="bg-[#ffffff] text-[#1a1612] py-8 sm:py-10 border-y border-[#e6dac6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-3 rounded-md hover:bg-[#faf7f0] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#f4efe6] flex items-center justify-center shrink-0 text-[#1a1612] border border-[#e6dac6]">
                  <Icon className="w-5 h-5 text-[#a67c3f]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${feat.badgeColor}`}>
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-[#1a1612] leading-snug">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-[#5a524a] mt-0.5 font-sans leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
