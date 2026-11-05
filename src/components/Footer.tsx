'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, MessageCircle, ShieldCheck, ArrowUpRight, ChevronUp, FileText, CreditCard, Truck, Bike } from 'lucide-react';

export function Footer() {
  const [isArrepentimientoOpen, setIsArrepentimientoOpen] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [emailRef, setEmailRef] = useState('');
  const [arrepentimientoSent, setArrepentimientoSent] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleArrepentimientoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderRef.trim() && emailRef.trim()) {
      setArrepentimientoSent(true);
    }
  };

  return (
    <footer className="w-full bg-[#14110e] text-[#faf7f0] pt-16 pb-12 font-sans border-t border-[#2c2520] overflow-x-clip">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid: 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-14 border-b border-[#2c2520] text-sm text-[#faf7f0]/80">
          
          {/* Column 1: Brand Manifesto & Local Presence */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="font-display text-3xl font-bold text-white tracking-tight">
                AMANCAY
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#2c2520] text-[#c5a059] border border-[#a67c3f]/40">
                Almagro · CABA
              </span>
            </div>
            <p className="text-[#faf7f0]/75 text-sm leading-relaxed max-w-sm">
              Especialistas en mates criollos de autor, virolas de alpaca cincelada y perfumería fina sobre Avenida Corrientes. Tradición de mostrador, garantía de oficio y asesoramiento genuino.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-[#faf7f0]/60">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#a67c3f]" />
                Av. Corrientes 3666, Almagro
              </span>
              <span>·</span>
              <span>Subte B Carlos Gardel</span>
            </div>
          </div>

          {/* Column 2: Categorías Exclusivas */}
          <div className="lg:col-span-3 space-y-3">
            <span className="font-display text-base font-semibold text-[#c5a059] block tracking-wide">
              Categorías
            </span>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/catalogo?rubro=mates" className="hover:text-white transition-colors flex items-center justify-between group">
                  <span>Mates Imperiales & Camioneros</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#a67c3f]" />
                </Link>
              </li>
              <li>
                <Link href="/catalogo?rubro=bombillas" className="hover:text-white transition-colors flex items-center justify-between group">
                  <span>Bombillas de Alpaca & Acero 304</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#a67c3f]" />
                </Link>
              </li>
              <li>
                <Link href="/catalogo?rubro=perfumes" className="hover:text-white transition-colors flex items-center justify-between group">
                  <span>Perfumería Fina & Autor</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#a67c3f]" />
                </Link>
              </li>
              <li>
                <Link href="/catalogo" className="hover:text-white transition-colors flex items-center justify-between group text-[#a67c3f]">
                  <span>Catálogo Completo</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/#como-comprar" className="text-[#c5a059] font-bold hover:underline flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>3 Cuotas Banco Galicia (Noviembre)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Información & Horarios */}
          <div className="lg:col-span-3 space-y-3">
            <span className="font-display text-base font-semibold text-[#c5a059] block tracking-wide">
              Atención & Retiros
            </span>
            <div className="space-y-2 text-sm text-[#faf7f0]/75">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#a67c3f] shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Lunes a Viernes: 09:30 a 20:00 hs</p>
                  <p className="text-xs">Sábados: 10:00 a 14:00 hs</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Phone className="w-4 h-4 text-[#a67c3f] shrink-0" />
                <span className="text-white">+54 9 11 3674-0676</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#a67c3f] shrink-0" />
                <span>mostrador@amancay.com.ar</span>
              </div>
            </div>
          </div>

          {/* Column 4: WhatsApp Directo & Botón Volver */}
          <div className="lg:col-span-2 flex flex-col justify-between items-start lg:items-end gap-4">
            <button
              onClick={scrollToTop}
              className="tap-interactive text-xs font-bold uppercase tracking-wider text-[#c5a059] hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Subir al inicio</span>
              <ChevronUp className="w-4 h-4" />
            </button>
            <a
              href="https://wa.me/5491136740676?text=Hola%20Amancay!%20Quería%20hacer%20una%20consulta."
              target="_blank"
              rel="noopener noreferrer"
              className="tap-interactive w-full lg:w-auto bg-[#25d366] hover:bg-[#128c7e] text-white text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-full flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chatear por WhatsApp</span>
            </a>
            <Link
              href="/admin"
              className="text-xs text-[#faf7f0]/40 hover:text-[#c5a059] transition-colors"
            >
              Acceso Mostrador / Admin
            </Link>
          </div>

        </div>

        {/* Medium Row: Medios de Pago & Envíos */}
        <div className="py-8 border-b border-[#2c2520] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#c5a059] block">
              Medios de Pago Aceptados
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-sm bg-[#0b3821] text-white font-bold">3 Cuotas Banco Galicia (Noviembre)</span>
              <span className="px-2.5 py-1 rounded-sm bg-[#1a1612] border border-[#2c2520] font-medium text-white">Mercado Pago</span>
              <span className="px-2.5 py-1 rounded-sm bg-[#1a1612] border border-[#2c2520] font-medium text-white">Transferencia Bancaria</span>
              <span className="px-2.5 py-1 rounded-sm bg-[#1a1612] border border-[#2c2520] text-[#faf7f0]/70">Efectivo en mostrador</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#c5a059] block">
              Envíos y Logística (a cargo del comprador)
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-sm bg-[#1a1612] border border-[#2c2520] font-medium text-white">🛵 Motomensajería en el día (CABA)</span>
              <span className="px-2.5 py-1 rounded-sm bg-[#1a1612] border border-[#2c2520] font-medium text-white">📦 Correo Argentino (Todo el país)</span>
              <span className="px-2.5 py-1 rounded-sm bg-[#1a1612] border border-[#2c2520] text-[#faf7f0]/80">📍 Retiro en Av. Corrientes 3666</span>
            </div>
          </div>
        </div>

        {/* Legal Row: Defensa al consumidor, Botón de arrepentimiento, Garantías */}
        <div className="pt-8 pb-4 text-xs text-[#faf7f0]/60 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <a
                href="https://buenosaires.gob.ar/defensadelconsumidor"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white underline decoration-dotted transition-colors"
              >
                Defensa de las y los Consumidores CABA
              </a>
              <span>·</span>
              <button
                onClick={() => setIsArrepentimientoOpen(true)}
                className="hover:text-[#c5a059] underline decoration-dotted font-semibold text-white transition-colors"
              >
                Botón de Arrepentimiento
              </button>
              <span>·</span>
              <span className="text-[#faf7f0]/70">
                Garantía artesanal y cambios de 30 días
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="border border-[#2c2520] px-2 py-1 rounded-xs bg-[#1a1612] text-[10px] uppercase tracking-wider text-[#a67c3f]">
                Data Fiscal ARCA / AFIP
              </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-[#2c2520]/60 text-[11px] text-[#faf7f0]/50">
            <span>© 2026 AMANCAY · Todos los derechos reservados. Av. Corrientes 3666, Almagro, Buenos Aires.</span>
            <span>Mates de Autor, Bombillas de Alpaca y Perfumería Fina.</span>
          </div>
        </div>

      </div>

      {/* Modal Botón de Arrepentimiento */}
      {isArrepentimientoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#ffffff] text-[#1a1612] max-w-md w-full p-6 rounded-xl shadow-2xl border border-[#e6dac6] space-y-4 font-sans animate-fade-in-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-[#672d35]">
                <FileText className="w-5 h-5" />
                <h3 className="font-display text-xl font-bold text-[#1a1612]">
                  Botón de Arrepentimiento
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsArrepentimientoOpen(false);
                  setArrepentimientoSent(false);
                }}
                className="text-[#5a524a] hover:text-[#1a1612] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5a524a] leading-relaxed">
              De acuerdo con el Artículo 34 de la Ley 24.240 de Defensa del Consumidor, contás con 10 (diez) días corridos desde la recepción del producto para revocar tu compra online sin costo alguno.
            </p>

            {arrepentimientoSent ? (
              <div className="bg-[#faf7f0] p-4 rounded-md border border-[#e6dac6] text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-[#0b3821] mx-auto" />
                <h4 className="font-bold text-sm text-[#1a1612]">Solicitud Registrada con Éxito</h4>
                <p className="text-xs text-[#5a524a]">
                  Hemos recibido tu pedido de revocación. Nuestro equipo del mostrador te contactará por email en menos de 24 horas hábiles para coordinar la devolución.
                </p>
              </div>
            ) : (
              <form onSubmit={handleArrepentimientoSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1a1612] mb-1">
                    Número de Orden o Pedido
                  </label>
                  <input
                    type="text"
                    required
                    value={orderRef}
                    onChange={(e) => setOrderRef(e.target.value)}
                    placeholder="Ej: AMC-2026-089"
                    className="w-full text-xs px-3 py-2 border border-[#e6dac6] rounded-md focus:outline-none focus:border-[#a67c3f]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1a1612] mb-1">
                    Email de la compra
                  </label>
                  <input
                    type="email"
                    required
                    value={emailRef}
                    onChange={(e) => setEmailRef(e.target.value)}
                    placeholder="tuemail@ejemplo.com"
                    className="w-full text-xs px-3 py-2 border border-[#e6dac6] rounded-md focus:outline-none focus:border-[#a67c3f]"
                  />
                </div>
                <button
                  type="submit"
                  className="tap-interactive w-full py-2.5 bg-[#672d35] hover:bg-[#4a1d23] text-white text-xs font-bold uppercase tracking-wider rounded-md transition-colors"
                >
                  Confirmar Revocación de Compra
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </footer>
  );
}
