'use client';

import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export function FloatingWhatsApp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside
      aria-label="Contacto directo por WhatsApp"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2.5 font-sans"
    >
      {/* Speech bubble */}
      {isOpen && (
        <div className="relative bg-[#ffffff] text-[#1a1612] p-4 rounded-xl border border-[#e6dac6] max-w-[280px] animate-fade-in-up shadow-2xl">
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar aviso"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#f4efe6] hover:bg-[#e6dac6] text-[#1a1612] flex items-center justify-center text-xs font-bold transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 text-[#0b3821] font-bold text-xs mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#25d366] inline-block animate-pulse" />
            <span>Mostrador Almagro en Línea</span>
          </div>
          <p className="text-xs text-[#5a524a] leading-relaxed mb-3">
            ¿Tenés dudas sobre curado de mates, virolas cinceladas o notas de perfumes? Escribinos y te asesoramos al instante.
          </p>
          <a
            href="https://wa.me/5491136740676?text=Hola%20Amancay!%20Tengo%20una%20consulta%20sobre%20sus%20productos."
            target="_blank"
            rel="noopener noreferrer"
            className="tap-interactive flex items-center justify-center gap-2 text-center bg-[#25d366] hover:bg-[#128c7e] text-white text-xs font-bold py-2.5 px-4 rounded-full transition-colors shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Abrir Chat de WhatsApp</span>
          </a>
        </div>
      )}

      {/* Floating round button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Chatear por WhatsApp con el local"
        aria-expanded={isOpen}
        className="tap-interactive relative w-14 h-14 rounded-full bg-[#25d366] hover:bg-[#128c7e] text-white flex items-center justify-center shadow-xl transition-all"
      >
        <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-[#128c7e] animate-ping" />
        <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-[#ffffff] border-2 border-[#25d366]" />
        <MessageCircle className="w-7 h-7" />
      </button>
    </aside>
  );
}
