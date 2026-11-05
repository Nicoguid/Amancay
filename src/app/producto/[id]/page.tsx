'use client';

import React, { useState, use, Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import { ProductVariant } from '@/lib/types';
import { 
  ShoppingBag, 
  Check, 
  CreditCard, 
  Truck, 
  Store, 
  ShieldCheck, 
  MessageCircle, 
  ArrowLeft, 
  Sparkles, 
  HelpCircle,
  FileText,
  ChevronDown,
  X
} from 'lucide-react';

function ProductDetailContent({ id }: { id: string }) {
  const { products, addToCart } = useStore();
  const product = products.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  // Selected variant state
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [postalCodeInput, setPostalCodeInput] = useState('');
  const [shippingResult, setShippingResult] = useState<{ type: string; price: string; note: string } | null>(null);
  const [isFinancingModalOpen, setIsFinancingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'guia' | 'envios'>('specs');

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const cuota3 = Math.round(currentPrice / 3);
  const cuota6 = Math.round(currentPrice / 6);
  const transferPrice = Math.round(currentPrice * 0.85);
  const savings = currentPrice - transferPrice;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const handleCalculateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postalCodeInput.trim()) return;
    const cp = parseInt(postalCodeInput.trim(), 10);
    if (isNaN(cp)) {
      setShippingResult({ type: 'Código Postal Inválido', price: '', note: 'Por favor ingresá un código numérico válido.' });
      return;
    }

    if (cp >= 1000 && cp <= 1499) {
      setShippingResult({
        type: 'Cadetería / Motomensajería CABA',
        price: '$3.500',
        note: 'Entrega en el día coordinando de lunes a viernes (a cargo del comprador).'
      });
    } else if (cp >= 1600 && cp <= 1999) {
      setShippingResult({
        type: 'Correo Argentino (GBA)',
        price: '$5.800',
        note: 'Entrega estimada entre 48 y 72 horas hábiles (a cargo del comprador).'
      });
    } else {
      setShippingResult({
        type: 'Correo Argentino a Todo el País',
        price: '$7.900',
        note: 'Envío seguro a domicilio con código de seguimiento (a cargo del comprador).'
      });
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hola Amancay! Quiero consultar disponibilidad sobre: ${product.name}${
      selectedVariant ? ` (${selectedVariant.name})` : ''
    } por $${currentPrice.toLocaleString('es-AR')}. ¿Tienen stock en Av. Corrientes 3666 para coordinar retiro o envío?`
  );

  const whatsappUrl = `https://wa.me/5491136740676?text=${whatsappMessage}`;

  // Related products from same category
  const related = products
    .filter((p) => p.id !== product.id && p.active && p.category === product.category)
    .slice(0, 4);

  return (
    <div className="bg-[#faf7f0] min-h-screen py-8 sm:py-12 pb-32 font-sans text-[#1a1612]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center justify-between text-xs text-[#5a524a]">
          <Link
            href="/catalogo"
            className="tap-interactive inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#a67c3f] hover:text-[#1a1612]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Catálogo</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/" className="hover:underline">Inicio</Link>
            <span>/</span>
            <Link href={`/catalogo?rubro=${product.category}`} className="capitalize hover:underline">{product.category}</Link>
            <span>/</span>
            <span className="text-[#1a1612] font-semibold truncate max-w-xs">{product.name}</span>
          </div>
        </div>

        {/* Product Sheet Container (Matesur + Fine Perfumery High-End Layout) */}
        <div className="bg-[#ffffff] rounded-2xl border border-[#e6dac6] p-6 sm:p-10 mb-14 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* Gallery Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="aspect-[4/5] sm:aspect-square w-full rounded-xl overflow-hidden bg-[#faf7f0] border border-[#e6dac6] relative group">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                  {product.isBestSeller && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0b3821] text-white shadow-xs">
                      Más Vendido
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`tap-interactive w-20 h-20 rounded-lg overflow-hidden shrink-0 border transition-all ${
                        selectedImage === img
                          ? 'border-[#a67c3f] ring-2 ring-[#a67c3f]/30 opacity-100'
                          : 'border-[#e6dac6] opacity-70 hover:opacity-100 bg-[#faf7f0]'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Local Availability Notice */}
              <div className="p-4 rounded-xl bg-[#faf7f0] border border-[#e6dac6] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#25d366] inline-block animate-pulse" />
                  <span className="font-bold text-[#0b3821]">Stock confirmado en local:</span>
                  <span className="text-[#5a524a]">Av. Corrientes 3666 (Almagro)</span>
                </div>
                <span className="font-semibold text-[#1a1612] hidden sm:inline">Listo en 1 hora</span>
              </div>
            </div>

            {/* Product Meta & Actions Column (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Category, Brand & Title */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a67c3f] mb-2">
                  <span>{product.brand}</span>
                  <span>·</span>
                  <span className="capitalize">{product.category}</span>
                </div>
                <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#1a1612] tracking-tight leading-tight">
                  {product.name}
                </h1>
                <p className="text-xs text-[#5a524a] mt-1 font-mono">
                  SKU: {selectedVariant ? selectedVariant.sku : product.sku}
                </p>
              </div>

              {/* Pricing & Installments Box (Matesur Style) */}
              <div className="p-5 rounded-xl bg-[#faf7f0] border border-[#e6dac6] space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl sm:text-4xl font-bold text-[#1a1612] tabular-nums">
                    ${currentPrice.toLocaleString('es-AR')}
                  </span>
                  {product.originalPrice && product.originalPrice > currentPrice && (
                    <span className="text-sm text-[#5a524a] line-through tabular-nums">
                      ${product.originalPrice.toLocaleString('es-AR')}
                    </span>
                  )}
                </div>

                {/* Financing breakdown */}
                <div className="flex items-center justify-between text-xs text-[#0b3821] font-semibold pt-1">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#a67c3f]" />
                    <span>3 cuotas Galicia de <strong>${cuota3.toLocaleString('es-AR')}</strong> (Noviembre)</span>
                  </div>
                  <button
                    onClick={() => setIsFinancingModalOpen(true)}
                    className="text-[#a67c3f] hover:underline font-bold"
                  >
                    Ver cuotas
                  </button>
                </div>
              </div>

              {/* Short Description */}
              <p className="text-xs sm:text-sm text-[#5a524a] leading-relaxed">
                {product.description}
              </p>

              {/* Variant Selector (e.g. Virola for mates, volume ml for perfumes) */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#1a1612]">
                    Seleccioná una opción:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`tap-interactive px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-[#1a1612] text-white border-[#1a1612] shadow-xs'
                              : 'bg-[#faf7f0] text-[#1a1612] border-[#e6dac6] hover:bg-[#f4efe6]'
                          }`}
                        >
                          <span>{v.name}</span>
                          <span className="ml-2 font-bold opacity-80 tabular-nums">
                            ${v.price.toLocaleString('es-AR')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Stepper & Add to Cart */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-[#1a1612]">Cantidad:</span>
                  <span className="text-[#0b3821] font-semibold">
                    {currentStock > 5 ? '✓ Stock disponible para entrega hoy' : `Últimas ${currentStock} unidades`}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Stepper */}
                  <div className="flex items-center border border-[#e6dac6] rounded-full bg-[#faf7f0] px-1 py-0.5">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center text-[#1a1612] hover:bg-[#e6dac6]/50 rounded-full text-base font-bold transition-colors"
                      aria-label="Restar una unidad"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-bold text-sm tabular-nums text-[#1a1612]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      className="w-8 h-8 flex items-center justify-center text-[#1a1612] hover:bg-[#e6dac6]/50 rounded-full text-base font-bold transition-colors"
                      aria-label="Sumar una unidad"
                    >
                      +
                    </button>
                  </div>

                  {/* Primary Add Button */}
                  <button
                    onClick={handleAddToCart}
                    className={`tap-interactive flex-1 py-3.5 px-6 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md ${
                      addedSuccess
                        ? 'bg-[#0b3821] text-white'
                        : 'bg-[#1a1612] hover:bg-[#a67c3f] text-white'
                    }`}
                  >
                    {addedSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-[#25d366]" />
                        <span>¡Agregado a la Bolsa!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-[#c5a059]" />
                        <span>Agregar al Carrito · ${(currentPrice * quantity).toLocaleString('es-AR')}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Direct WhatsApp Purchase Action (Matesur style) */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-interactive w-full py-3 px-4 rounded-full bg-[#25d366] hover:bg-[#128c7e] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Comprar o Consultar por WhatsApp</span>
                </a>
              </div>

              {/* Postal Code Shipping Calculator */}
              <div className="pt-4 border-t border-[#e6dac6] space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1a1612]">
                  <Truck className="w-4 h-4 text-[#a67c3f]" />
                  <span>Calculá el costo de envío</span>
                </div>
                <form onSubmit={handleCalculateShipping} className="flex gap-2">
                  <input
                    type="text"
                    value={postalCodeInput}
                    onChange={(e) => setPostalCodeInput(e.target.value)}
                    placeholder="Tu Código Postal (Ej: 1176)"
                    className="flex-1 px-3.5 py-2 bg-[#faf7f0] rounded-lg text-xs text-[#1a1612] placeholder-[#5a524a] border border-[#e6dac6] focus:border-[#a67c3f] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="tap-interactive bg-[#1a1612] hover:bg-[#a67c3f] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Calcular
                  </button>
                </form>

                {shippingResult && (
                  <div className="p-3 rounded-lg bg-[#faf7f0] border border-[#e6dac6] text-xs space-y-1 animate-fade-in-up">
                    <div className="flex items-center justify-between font-bold text-[#1a1612]">
                      <span>{shippingResult.type}</span>
                      <span className="text-[#0b3821] tabular-nums">{shippingResult.price}</span>
                    </div>
                    <p className="text-[11px] text-[#5a524a]">{shippingResult.note}</p>
                  </div>
                )}
              </div>

              {/* Trust Signals Strip */}
              <div className="pt-2 grid grid-cols-2 gap-3 text-xs text-[#5a524a]">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#faf7f0]">
                  <Store className="w-4 h-4 text-[#a67c3f] shrink-0" />
                  <span>Retiro gratis en Almagro</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#faf7f0]">
                  <ShieldCheck className="w-4 h-4 text-[#0b3821] shrink-0" />
                  <span>Garantía artesanal 30 días</span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Detailed Information Tabs (Specs, Curing / Notes, Shipping) */}
        <div className="bg-[#ffffff] rounded-2xl border border-[#e6dac6] overflow-hidden mb-16 shadow-xs">
          {/* Tab Navigation */}
          <div className="flex border-b border-[#e6dac6] bg-[#faf7f0] text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('specs')}
              className={`py-3.5 px-6 transition-colors border-b-2 ${
                activeTab === 'specs'
                  ? 'border-[#a67c3f] text-[#1a1612] bg-[#ffffff]'
                  : 'border-transparent text-[#5a524a] hover:text-[#1a1612]'
              }`}
            >
              Ficha Técnica
            </button>
            <button
              onClick={() => setActiveTab('guia')}
              className={`py-3.5 px-6 transition-colors border-b-2 ${
                activeTab === 'guia'
                  ? 'border-[#a67c3f] text-[#1a1612] bg-[#ffffff]'
                  : 'border-transparent text-[#5a524a] hover:text-[#1a1612]'
              }`}
            >
              {product.category === 'perfumes' ? 'Notas & Pirámide Olfativa' : 'Guía de Curado & Cuidados'}
            </button>
            <button
              onClick={() => setActiveTab('envios')}
              className={`py-3.5 px-6 transition-colors border-b-2 ${
                activeTab === 'envios'
                  ? 'border-[#a67c3f] text-[#1a1612] bg-[#ffffff]'
                  : 'border-transparent text-[#5a524a] hover:text-[#1a1612]'
              }`}
            >
              Envíos & Retiros en Local
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8 text-sm">
            {activeTab === 'specs' && (
              <div className="space-y-4">
                <h3 className="font-display text-xl font-bold text-[#1a1612]">
                  Especificaciones del Artículo
                </h3>
                {product.specifications ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(product.specifications).map(([key, val]) => (
                      <div key={key} className="p-3 rounded-lg bg-[#faf7f0] border border-[#e6dac6] flex justify-between gap-4 text-xs">
                        <span className="font-bold text-[#5a524a]">{key}:</span>
                        <span className="font-semibold text-[#1a1612] text-right">{val}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#5a524a] leading-relaxed">
                    Pieza de alta calidad confeccionada con materias primas nobles seleccionadas. Para consultas personalizadas sobre dimensiones o detalles orfebres, escribinos por WhatsApp.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'guia' && (
              <div className="space-y-3">
                <h3 className="font-display text-xl font-bold text-[#1a1612]">
                  {product.category === 'perfumes' ? 'Composición & Notas Olfativas' : 'Instrucciones de Curado y Mantenimiento'}
                </h3>
                <div className="p-4 rounded-xl bg-[#faf7f0] border border-[#e6dac6] text-xs leading-relaxed text-[#5a524a] space-y-2">
                  {product.curadoOGuia ? (
                    <p>{product.curadoOGuia}</p>
                  ) : (
                    <p>
                      Mantené tus piezas de orfebrería secas luego de cada cebado y utilizá bicarbonato de sodio periódicamente para conservar el brillo de la alpaca. Para perfumes, conservá el frasco lejos de la luz solar directa y fuentes de calor para preservar la pureza de sus aceites esenciales.
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'envios' && (
              <div className="space-y-4 text-xs text-[#5a524a] leading-relaxed">
                <h3 className="font-display text-xl font-bold text-[#1a1612]">
                  Política de Retiro y Logística
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#faf7f0] border border-[#e6dac6] space-y-1">
                    <strong className="text-[#1a1612] block">Retiro en Local</strong>
                    <p>Av. Corrientes 3666 (Almagro, CABA). Sin costo alguno. Listo en 1 hora tras confirmar la compra.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#faf7f0] border border-[#e6dac6] space-y-1">
                    <strong className="text-[#1a1612] block">Moto en CABA</strong>
                    <p>Entregas en el día coordinando de lunes a viernes. Embalaje protegido antigolpes.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#faf7f0] border border-[#e6dac6] space-y-1">
                    <strong className="text-[#1a1612] block">Correo Argentino</strong>
                    <p>Despachos a todo el país con código de seguimiento online (envíos a cargo del comprador).</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Carousel / Grid */}
        {related.length > 0 && (
          <div className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#a67c3f]">Combinan Perfecto</span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1a1612]">
                  Otros Artículos Relacionados
                </h2>
              </div>
              <Link href={`/catalogo?rubro=${product.category}`} className="text-xs font-bold uppercase tracking-wider text-[#a67c3f] hover:underline">
                Ver todos →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((rel) => (
                <div key={rel.id}>
                  <ProductCard product={rel} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Financing & Payment Options Modal (Todo Mates + Matesur Style) */}
      {isFinancingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans">
          <div className="bg-[#ffffff] text-[#1a1612] max-w-md w-full p-6 rounded-2xl shadow-2xl border border-[#e6dac6] space-y-4 animate-fade-in-up">
            <div className="flex items-start justify-between border-b border-[#e6dac6] pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#a67c3f]">Financiación</span>
                <h3 className="font-display text-xl font-bold text-[#1a1612]">
                  Medios de Pago y Cuotas
                </h3>
              </div>
              <button
                onClick={() => setIsFinancingModalOpen(false)}
                className="text-[#5a524a] hover:text-[#1a1612] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#faf7f0] border border-[#e6dac6] space-y-2">
                <span className="font-bold text-[#1a1612] block">Tarjetas de Crédito Banco Galicia (Exclusivo Noviembre)</span>
                <div className="space-y-1 text-[#5a524a]">
                  <div className="flex justify-between font-semibold text-[#0b3821]">
                    <span>3 cuotas sin interés:</span>
                    <span className="font-bold">3 de ${cuota3.toLocaleString('es-AR')}</span>
                  </div>
                  <p className="text-[11px] text-[#5a524a] pt-1">
                    Promoción vigente durante todo el mes de noviembre para tarjetas de crédito Visa y Mastercard emitidas por Banco Galicia.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#faf7f0] border border-[#e6dac6] space-y-1">
                <span className="font-bold text-[#1a1612] block">Mercado Pago / Otras Tarjetas</span>
                <p className="text-[11px] text-[#5a524a]">
                  Aboná con todas las tarjetas en 1 pago o según los planes y costos de financiación vigentes de la entidad emisora.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#faf7f0] border border-[#e6dac6] space-y-1">
                <span className="font-bold text-[#1a1612] block">Transferencia Bancaria</span>
                <p className="text-[11px] text-[#5a524a]">
                  Aboná de forma directa con Alias o CBU bancario tras confirmar tu pedido.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#faf7f0] border border-[#e6dac6] space-y-1">
                <span className="font-bold text-[#1a1612] block">Efectivo al retirar en Mostrador</span>
                <p className="text-[11px] text-[#5a524a]">
                  Aboná en el local de Av. Corrientes 3666 al momento de retirar tu pedido.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsFinancingModalOpen(false)}
              className="tap-interactive w-full py-2.5 bg-[#1a1612] hover:bg-[#a67c3f] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

function ProductDetailResolver({ params }: { params: Promise<{ id: string }> }) {
  const resolved = use(params);
  return <ProductDetailContent id={resolved.id} />;
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-16 text-center text-sm text-[#5a524a]">Cargando detalle del producto...</div>}>
      <ProductDetailResolver params={params} />
    </Suspense>
  );
}
