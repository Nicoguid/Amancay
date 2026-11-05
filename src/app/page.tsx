'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { HeroBannerCarousel } from '@/components/HeroBannerCarousel';
import { TrustBadgesMarquee } from '@/components/TrustBadgesMarquee';
import { ProductCarousel } from '@/components/ProductCarousel';
import { CategoryStorySlider } from '@/components/CategoryStorySlider';
import { MarqueeTicker } from '@/components/MarqueeTicker';
import { EditorialShowcase } from '@/components/EditorialShowcase';
import { Sparkles, ArrowRight, MessageCircle, ShieldCheck, MapPin, Truck, Store, HelpCircle, CreditCard, Bike } from 'lucide-react';

export function HomePage() {
  const { products } = useStore();

  const activeProducts = products.filter((p) => p.active);
  const matesProducts = activeProducts.filter((p) => p.category === 'mates');
  const bombillasProducts = activeProducts.filter((p) => p.category === 'bombillas');
  const perfumesProducts = activeProducts.filter((p) => p.category === 'perfumes');
  const bestSellers = activeProducts.filter((p) => p.isBestSeller);

  return (
    <div className="flex flex-col min-h-screen bg-[#faf7f0] text-[#1a1612] font-sans overflow-x-clip selection:bg-[#a67c3f] selection:text-white">
      
      {/* 1. HERO BANNER CAROUSEL */}
      <HeroBannerCarousel />

      {/* 2. TRUST BADGES STRIP */}
      <TrustBadgesMarquee />

      {/* 3. CATEGORY SHOWCASE (Mates, Bombillas, Perfumes) */}
      <CategoryStorySlider />

      {/* 4. PRODUCT CAROUSEL: Mates de Autor */}
      <ProductCarousel
        tag="Orfebrería Criolla"
        title="Mates Imperiales, Camioneros & Torpedos"
        subtitle="Calabazas gruesas, cuero vacuno legítimo y virolas de alpaca forjadas a mano."
        products={matesProducts}
        viewAllLink="/catalogo?rubro=mates"
      />

      {/* 5. EDITORIAL SPOTLIGHT: Piezas Insignia */}
      <EditorialShowcase
        products={bestSellers.length > 0 ? bestSellers : activeProducts}
      />

      {/* 6. PRODUCT CAROUSEL: Bombillas Cinceladas */}
      <ProductCarousel
        tag="Caudal & Filtrado"
        title="Bombillas de Alpaca Cincelada & Acero 304"
        subtitle="Pico de loro curvado anatómico y filtros de alta precisión que no se tapan."
        products={bombillasProducts}
        viewAllLink="/catalogo?rubro=bombillas"
      />

      {/* 7. INFINITE BRANDS RUNNING TICKER */}
      <MarqueeTicker variant="brands" />

      {/* 8. PRODUCT CAROUSEL: Perfumería Fina */}
      <ProductCarousel
        tag="Esencias Porteñas"
        title="Perfumería Fina & Fragancias de Autor"
        subtitle="Composiciones olfativas nobles, de larga fijación y frascos de diseño para obsequiar."
        products={perfumesProducts}
        viewAllLink="/catalogo?rubro=perfumes"
      />

      {/* 9. PROMO CALLOUT: 3 CUOTAS BANCO GALICIA (EXCLUSIVO NOVIEMBRE) */}
      <section className="py-16 sm:py-24 bg-[#14110e] text-white border-y border-[#2c2520]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2c2520] border border-[#a67c3f]/50 text-xs font-bold uppercase tracking-wider text-[#c5a059]">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Beneficio Exclusivo del Mes</span>
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
                3 Cuotas Sin Interés con Tarjetas Banco Galicia
              </h2>
              <p className="text-sm sm:text-base text-[#faf7f0]/80 max-w-2xl leading-relaxed font-sans">
                Aprovechá la financiación especial vigente durante todo el mes de noviembre en mates de autor, bombillas de alpaca y perfumería fina con tus tarjetas de crédito Visa y Mastercard emitidas por Banco Galicia.
              </p>
              
              <div className="pt-2 flex flex-wrap items-center gap-6 text-xs sm:text-sm font-semibold text-[#c5a059]">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#c5a059]" />
                  <span>Válido todo el mes de noviembre</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#c5a059]" />
                  <span>Envíos a todo el país a cargo del comprador</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#25d366]" />
                  <span>Retiro en Av. Corrientes 3666</span>
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-start lg:justify-end">
              <Link
                href="/catalogo"
                className="tap-interactive inline-flex items-center justify-center gap-2 bg-[#a67c3f] hover:bg-[#8c652d] text-white text-sm font-bold uppercase tracking-wider px-8 py-4 rounded-full transition-colors shadow-md text-center"
              >
                <span>Explorar Colección</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/5491136740676?text=Hola%20Amancay!%20Quiero%20consultar%20por%20las%203%20cuotas%20de%20Banco%20Galicia."
                target="_blank"
                rel="noopener noreferrer"
                className="tap-interactive inline-flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#128c7e] text-white text-sm font-bold uppercase tracking-wider px-8 py-3.5 rounded-full transition-colors shadow-xs text-center"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Consultar por WhatsApp</span>
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* 10. PHYSICAL STORE ITINERARY & DELIVERY INFO */}
      <section id="como-comprar" className="py-16 sm:py-24 bg-[#f4efe6] border-b border-[#e6dac6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#1a1612] tracking-tight">
              Opciones de Entrega y Retiro
            </h2>
            <p className="text-sm sm:text-base text-[#5a524a] font-sans">
              Coordinamos tu compra con la calidez y rapidez de nuestro mostrador tradicional de Almagro. Envíos a cargo del comprador.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-xl border border-[#e6dac6] space-y-3 relative shadow-xs hover:border-[#a67c3f] transition-all">
              <div className="w-10 h-10 rounded-full bg-[#faf7f0] border border-[#e6dac6] flex items-center justify-center text-[#a67c3f] mb-2">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#1a1612]">
                Retiro en Mostrador
              </h3>
              <p className="text-sm text-[#5a524a] leading-relaxed font-sans">
                Av. Corrientes 3666 (Almagro), a metros de Medrano y Carlos Gardel. Preparamos tu paquete en menos de 1 hora para que pases a retirar sin costo de flete.
              </p>
              <div className="pt-2 text-xs font-bold uppercase tracking-wider text-[#0b3821]">
                Sin costo de envío · Listo en 1 hora
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-xl border border-[#e6dac6] space-y-3 relative shadow-xs hover:border-[#a67c3f] transition-all">
              <div className="w-10 h-10 rounded-full bg-[#faf7f0] border border-[#e6dac6] flex items-center justify-center text-[#a67c3f] mb-2">
                <Bike className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#1a1612]">
                Motomensajería en CABA
              </h3>
              <p className="text-sm text-[#5a524a] leading-relaxed font-sans">
                Entregas en el día de lunes a viernes en todos los barrios de la Ciudad de Buenos Aires con costo a cargo del comprador.
              </p>
              <div className="pt-2 text-xs font-bold uppercase tracking-wider text-[#672d35]">
                Entrega en 24 hs hábiles · A cargo del comprador
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-xl border border-[#e6dac6] space-y-3 relative shadow-xs hover:border-[#a67c3f] transition-all">
              <div className="w-10 h-10 rounded-full bg-[#faf7f0] border border-[#e6dac6] flex items-center justify-center text-[#a67c3f] mb-2">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#1a1612]">
                Correo a Todo el País
              </h3>
              <p className="text-sm text-[#5a524a] leading-relaxed font-sans">
                Despachamos por Correo Argentino con código de seguimiento online para GBA y todas las provincias argentinas con flete a cargo del comprador.
              </p>
              <div className="pt-2 text-xs font-bold uppercase tracking-wider text-[#1a1612]">
                Envíos a todo el país · Correo Argentino
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 11. FAQ SECTION */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf7f0] border border-[#e6dac6] text-xs font-bold uppercase tracking-wider text-[#a67c3f]">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Dudas Habituales</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#1a1612] tracking-tight">
              Preguntas Frecuentes
            </h2>
            <p className="text-sm sm:text-base text-[#5a524a] font-sans">
              Todo lo que necesitás saber sobre nuestros productos, formas de pago y envíos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2 p-6 rounded-xl bg-[#faf7f0] border border-[#e6dac6]">
              <h3 className="font-display text-lg font-bold text-[#1a1612]">
                ¿Cómo funciona la promoción de 3 cuotas?
              </h3>
              <p className="text-xs sm:text-sm text-[#5a524a] leading-relaxed font-sans">
                Durante todo el mes de noviembre podés abonar en 3 cuotas sin interés utilizando tarjetas de crédito Visa o Mastercard emitidas exclusivamente por Banco Galicia.
              </p>
            </div>

            <div className="space-y-2 p-6 rounded-xl bg-[#faf7f0] border border-[#e6dac6]">
              <h3 className="font-display text-lg font-bold text-[#1a1612]">
                ¿Cómo se coordinan los envíos?
              </h3>
              <p className="text-xs sm:text-sm text-[#5a524a] leading-relaxed font-sans">
                Los envíos son siempre a cargo del comprador. En CABA enviamos por motomensajería en el día y al resto del país por Correo Argentino con código de seguimiento. También podés retirar sin costo en Av. Corrientes 3666.
              </p>
            </div>

            <div className="space-y-2 p-6 rounded-xl bg-[#faf7f0] border border-[#e6dac6]">
              <h3 className="font-display text-lg font-bold text-[#1a1612]">
                ¿Las fragancias son originales y con garantía?
              </h3>
              <p className="text-xs sm:text-sm text-[#5a524a] leading-relaxed font-sans">
                100% auténticas. Tanto nuestra fragancia de autor Amancay Néctar Silvestre como las marcas nacionales provienen de laboratorios oficiales con sello y número de lote verificado.
              </p>
            </div>

            <div className="space-y-2 p-6 rounded-xl bg-[#faf7f0] border border-[#e6dac6]">
              <h3 className="font-display text-lg font-bold text-[#1a1612]">
                ¿Puedo comprar directamente por WhatsApp?
              </h3>
              <p className="text-xs sm:text-sm text-[#5a524a] leading-relaxed font-sans">
                ¡Sí! Podés armar tu carrito y tocar en el botón de WhatsApp o escribirnos al +54 9 11 3674-0676. Te respondemos al instante de mostrador a cliente.
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

export default HomePage;
