'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ShippingMethod, PaymentMethod } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { ShoppingBag, ArrowLeft, Check, ShieldCheck, Copy, MessageCircle, Store, Truck, CreditCard } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, createOrder, clearCart, products } = useStore();

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dni: '',
    address: '',
    city: 'CABA',
    postalCode: '',
    notes: ''
  });

  const [orderCompleted, setOrderCompleted] = useState<any>(null);
  const [copiedAlias, setCopiedAlias] = useState(false);

  // Shipping: always at buyer's expense except local pickup
  const shippingCost = shippingMethod === 'pickup' 
    ? 0 
    : shippingMethod === 'moto_caba' 
      ? 3500 
      : 5800;

  const discount = 0;
  const finalTotal = cartTotal + shippingCost;

  // EMPTY STATE WITH H1 AND CURATED DISCOVERIES
  if (cart.length === 0 && !orderCompleted) {
    const featured = products.filter((p) => p.active).slice(0, 4);

    return (
      <div className="bg-[#faf7f0] min-h-screen py-12 sm:py-16 px-4 sm:px-6 lg:px-8 font-sans text-[#1a1612]">
        <div className="max-w-6xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-[#f4efe6] border border-[#e6dac6] flex items-center justify-center mx-auto mb-4 text-[#a67c3f]">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#1a1612] mb-3 tracking-tight">
            Finalizar Pedido en Amancay
          </h1>
          <p className="text-xs sm:text-base text-[#5a524a] mb-8 leading-relaxed max-w-xl mx-auto">
            Tu bolsa de compras está vacía. Elegí entre nuestros mates imperiales de autor, bombillas de alpaca forjadas o perfumes de alta gama.
          </p>
          <div className="mb-14">
            <Link
              href="/catalogo"
              className="tap-interactive inline-block bg-[#1a1612] hover:bg-[#a67c3f] text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-full transition-all shadow-md"
            >
              Explorar Catálogo Oficial →
            </Link>
          </div>

          {/* Curated Recommendations */}
          <div className="text-left pt-10 border-t border-[#e6dac6]">
            <h2 className="font-display text-2xl font-bold text-[#1a1612] mb-6">
              Sugerencias del Mostrador para Comenzar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((item) => (
                <div key={item.id}>
                  <ProductCard product={item} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.dni) {
      alert('Por favor completá nombre completo, teléfono y DNI.');
      return;
    }

    if (shippingMethod !== 'pickup' && !formData.address) {
      alert('Por favor ingresá la dirección de entrega.');
      return;
    }

    const newOrder = createOrder({
      customer: formData,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.images[0],
        variantName: item.selectedVariant?.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity
      })),
      subtotal: cartTotal,
      discount,
      shippingMethod,
      shippingCost,
      paymentMethod,
      total: finalTotal,
      status: 'pendiente'
    });

    clearCart();
    setOrderCompleted(newOrder);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2500);
  };

  // SUCCESS / CONFIRMATION RECEIPT SCREEN
  if (orderCompleted) {
    return (
      <div className="bg-[#faf7f0] min-h-screen py-12 sm:py-16 px-4 sm:px-6 lg:px-8 font-sans text-[#1a1612]">
        <div className="max-w-2xl mx-auto bg-[#ffffff] rounded-2xl border border-[#e6dac6] p-6 sm:p-10 shadow-lg space-y-6">
          
          <div className="text-center pb-6 border-b border-[#e6dac6] space-y-2">
            <div className="w-14 h-14 rounded-full bg-[#faf7f0] border border-[#a67c3f] flex items-center justify-center mx-auto text-[#0b3821]">
              <Check className="w-7 h-7 text-[#25d366]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#a67c3f] block">
              Comprobante de Pedido Registrado
            </span>
            <h1 className="font-display text-3xl font-bold text-[#1a1612]">
              ¡Muchas Gracias, {orderCompleted.customer.fullName}!
            </h1>
            <p className="text-xs sm:text-sm text-[#5a524a]">
              Orden <strong>#{orderCompleted.orderNumber}</strong> generada con éxito.
            </p>
          </div>

          {/* Delivery Note */}
          <div className="space-y-4">
            {orderCompleted.shippingMethod === 'pickup' ? (
              <div className="p-4 rounded-xl bg-[#faf7f0] border border-[#e6dac6] space-y-1 text-xs">
                <span className="font-bold text-[#0b3821] block">Retiro en Local Confirmado:</span>
                <p className="text-[#5a524a]">
                  Av. Corrientes 3666 (Almagro, CABA). Te esperamos de Lunes a Viernes de 09:30 a 20:00 hs y Sábados de 10:00 a 14:00 hs con tu DNI y número de orden.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#faf7f0] border border-[#e6dac6] space-y-1 text-xs">
                <span className="font-bold text-[#1a1612] block">Dirección de Envío:</span>
                <p className="text-[#5a524a]">
                  {orderCompleted.customer.address}, {orderCompleted.customer.city} (CP {orderCompleted.customer.postalCode}). Te contactaremos al teléfono {orderCompleted.customer.phone} para coordinar la entrega.
                </p>
              </div>
            )}

            {/* Transfer Details if applicable */}
            {orderCompleted.paymentMethod === 'transferencia' && (
              <div className="p-5 rounded-xl bg-[#14110e] text-white space-y-3 border border-[#2c2520]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-[#c5a059]">Datos para Realizar la Transferencia</span>
                </div>
                <div className="text-xs space-y-1.5 bg-white/10 p-4 rounded-lg border border-white/15">
                  <div className="flex justify-between"><strong>Banco:</strong> <span>Galicia</span></div>
                  <div className="flex justify-between"><strong>Titular:</strong> <span>Perfumería y Mates Amancay S.R.L.</span></div>
                  <div className="flex justify-between"><strong>Alias:</strong> <span className="font-mono text-[#c5a059] font-bold">AMANCAY.ALMAGRO.MP</span></div>
                  <div className="flex justify-between"><strong>CBU:</strong> <span className="font-mono">0070123430004567891234</span></div>
                  <div className="flex justify-between pt-1 border-t border-white/20 text-sm font-bold">
                    <span>Monto Exacto:</span>
                    <span className="text-[#c5a059]">${orderCompleted.total.toLocaleString('es-AR')}</span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard('AMANCAY.ALMAGRO.MP')}
                  className="tap-interactive w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors border border-white/20"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedAlias ? '¡Alias Copiado con Éxito!' : 'Copiar Alias Bancario'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <a
              href={`https://wa.me/5491136740676?text=${encodeURIComponent(
                `Hola Amancay! Acabo de registrar el pedido número ${orderCompleted.orderNumber} a nombre de ${orderCompleted.customer.fullName} por un total de $${orderCompleted.total.toLocaleString('es-AR')}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-interactive flex-1 bg-[#25d366] hover:bg-[#128c7e] text-white py-3 px-4 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors text-center shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Notificar Pedido por WhatsApp</span>
            </a>
            <Link
              href="/"
              className="tap-interactive bg-[#1a1612] hover:bg-[#a67c3f] text-white py-3 px-6 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center transition-colors text-center"
            >
              Volver a la Tienda
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf7f0] min-h-screen py-8 sm:py-12 font-sans text-[#1a1612]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-[#5a524a]">
          <Link href="/catalogo" className="hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Seguir Comprando</span>
          </Link>
          <span>/</span>
          <span className="text-[#1a1612] font-semibold">Checkout Seguro</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form & Methods */}
          <form onSubmit={handleSubmitOrder} className="lg:col-span-7 space-y-6">
            
            {/* Customer Data */}
            <div className="bg-[#ffffff] p-6 rounded-2xl border border-[#e6dac6] space-y-4 shadow-xs">
              <h2 className="font-display text-xl font-bold text-[#1a1612]">
                1. Datos de Contacto y Facturación
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Ej: Juan Pérez"
                    className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e6dac6] rounded-lg focus:outline-none focus:border-[#a67c3f]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">DNI / CUIL *</label>
                  <input
                    type="text"
                    required
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    placeholder="Sin puntos"
                    className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e6dac6] rounded-lg focus:outline-none focus:border-[#a67c3f]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ej: 11 3674 0676"
                    className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e6dac6] rounded-lg focus:outline-none focus:border-[#a67c3f]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="juan@gmail.com"
                    className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e6dac6] rounded-lg focus:outline-none focus:border-[#a67c3f]"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="bg-[#ffffff] p-6 rounded-2xl border border-[#e6dac6] space-y-4 shadow-xs">
              <h2 className="font-display text-xl font-bold text-[#1a1612]">
                2. Forma de Entrega
              </h2>
              <div className="space-y-2.5 text-xs">
                
                {/* Pickup */}
                <label className={`tap-interactive flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  shippingMethod === 'pickup'
                    ? 'border-[#1a1612] bg-[#faf7f0]'
                    : 'border-[#e6dac6] hover:bg-[#faf7f0]/50'
                }`}>
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="pickup"
                    checked={shippingMethod === 'pickup'}
                    onChange={() => setShippingMethod('pickup')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline font-bold text-[#1a1612]">
                      <span className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-[#a67c3f]" />
                        <span>Retiro Gratis en el Mostrador</span>
                      </span>
                      <span className="text-[#0b3821]">GRATIS</span>
                    </div>
                    <p className="text-[11px] text-[#5a524a] mt-0.5">
                      Av. Corrientes 3666 (Almagro, CABA). Listo en menos de 1 hora.
                    </p>
                  </div>
                </label>

                {/* Moto CABA */}
                <label className={`tap-interactive flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  shippingMethod === 'moto_caba'
                    ? 'border-[#1a1612] bg-[#faf7f0]'
                    : 'border-[#e6dac6] hover:bg-[#faf7f0]/50'
                }`}>
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="moto_caba"
                    checked={shippingMethod === 'moto_caba'}
                    onChange={() => setShippingMethod('moto_caba')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline font-bold text-[#1a1612]">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-[#a67c3f]" />
                        <span>Moto Express en CABA</span>
                      </span>
                      <span>$3.500</span>
                    </div>
                    <p className="text-[11px] text-[#5a524a] mt-0.5">
                      Entrega en el día coordinando de lunes a viernes.
                    </p>
                  </div>
                </label>

                {/* Correo Argentino */}
                <label className={`tap-interactive flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  shippingMethod === 'correo_argentino'
                    ? 'border-[#1a1612] bg-[#faf7f0]'
                    : 'border-[#e6dac6] hover:bg-[#faf7f0]/50'
                }`}>
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="correo_argentino"
                    checked={shippingMethod === 'correo_argentino'}
                    onChange={() => setShippingMethod('correo_argentino')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline font-bold text-[#1a1612]">
                      <span>Correo Argentino (Todo el País)</span>
                      <span>$5.800</span>
                    </div>
                    <p className="text-[11px] text-[#5a524a] mt-0.5">
                      Despacho con seguimiento online (a cargo del comprador).
                    </p>
                  </div>
                </label>

              </div>

              {shippingMethod !== 'pickup' && (
                <div className="pt-3 border-t border-[#e6dac6] space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Calle y Altura / Piso / Depto *</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Ej: Bulnes 742, 3° B"
                      className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e6dac6] rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Localidad / Barrio</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e6dac6] rounded-lg focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Código Postal</label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="Ej: 1176"
                        className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e6dac6] rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-[#ffffff] p-6 rounded-2xl border border-[#e6dac6] space-y-4 shadow-xs">
              <h2 className="font-display text-xl font-bold text-[#1a1612]">
                3. Medio de Pago
              </h2>
              <div className="space-y-2.5 text-xs">
                
                {/* Transferencia */}
                <label className={`tap-interactive flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'transferencia'
                    ? 'border-[#a67c3f] bg-[#faf7f0]'
                    : 'border-[#e6dac6] hover:bg-[#faf7f0]/50'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transferencia"
                    checked={paymentMethod === 'transferencia'}
                    onChange={() => setPaymentMethod('transferencia')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline font-bold text-[#1a1612]">
                      <span>Transferencia Bancaria</span>
                      <span className="text-[11px] text-[#5a524a]">CBU / Alias</span>
                    </div>
                    <p className="text-[11px] text-[#5a524a] mt-0.5">
                      Recibís el Alias y CBU oficial en pantalla para transferir de inmediato.
                    </p>
                  </div>
                </label>

                {/* Mercado Pago / Cuotas Galicia */}
                <label className={`tap-interactive flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'mercadopago'
                    ? 'border-[#a67c3f] bg-[#faf7f0]'
                    : 'border-[#e6dac6] hover:bg-[#faf7f0]/50'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="mercadopago"
                    checked={paymentMethod === 'mercadopago'}
                    onChange={() => setPaymentMethod('mercadopago')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline font-bold text-[#1a1612]">
                      <span>Tarjetas & Mercado Pago</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#0b3821] text-white font-bold text-[10px]">
                        3 Cuotas Galicia
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5a524a] mt-0.5">
                      3 cuotas sin interés con Banco Galicia (Promo Noviembre). Demás tarjetas en 1 pago.
                    </p>
                  </div>
                </label>

                {/* Mostrador */}
                <label className={`tap-interactive flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'whatsapp'
                    ? 'border-[#a67c3f] bg-[#faf7f0]'
                    : 'border-[#e6dac6] hover:bg-[#faf7f0]/50'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="whatsapp"
                    checked={paymentMethod === 'whatsapp'}
                    onChange={() => setPaymentMethod('whatsapp')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span className="font-bold block text-[#1a1612]">Abonar al Retirar en Mostrador</span>
                    <p className="text-[11px] text-[#5a524a] mt-0.5">
                      Pagás en efectivo o tarjeta directamente en Av. Corrientes 3666 al retirar.
                    </p>
                  </div>
                </label>

              </div>
            </div>

            {/* Confirm Button */}
            <button
              type="submit"
              className="tap-interactive w-full py-4 bg-[#1a1612] hover:bg-[#a67c3f] text-white rounded-full font-bold text-xs uppercase tracking-wider transition-colors shadow-lg"
            >
              Confirmar y Registrar Pedido · ${finalTotal.toLocaleString('es-AR')}
            </button>

          </form>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-[#ffffff] p-6 rounded-2xl border border-[#e6dac6] space-y-4 shadow-xs sticky top-28">
              <div className="border-b border-[#e6dac6] pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#a67c3f] block">
                  Mostrador Corrientes 3666
                </span>
                <h3 className="font-display text-xl font-bold text-[#1a1612]">
                  Resumen de Compra ({cart.length})
                </h3>
              </div>

              {/* Items */}
              <div className="space-y-3 divide-y divide-[#f4efe6] text-xs">
                {cart.map((item) => (
                  <div key={item.id} className="pt-2.5 first:pt-0 flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1a1612] truncate">{item.product.name}</p>
                      {item.selectedVariant && (
                        <p className="text-[#a67c3f] text-[11px]">{item.selectedVariant.name}</p>
                      )}
                      <p className="text-[#5a524a] text-[11px]">Cantidad: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-[#1a1612] shrink-0 tabular-nums">
                      ${(item.unitPrice * item.quantity).toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="pt-3 border-t border-[#e6dac6] space-y-2 text-xs">
                <div className="flex justify-between text-[#5a524a]">
                  <span>Subtotal productos:</span>
                  <span className="tabular-nums font-semibold">${cartTotal.toLocaleString('es-AR')}</span>
                </div>

                <div className="flex justify-between text-[#5a524a]">
                  <span>Costo de entrega:</span>
                  <span className="tabular-nums font-medium">
                    {shippingCost === 0 ? 'Sin cargo' : `$${shippingCost.toLocaleString('es-AR')}`}
                  </span>
                </div>

                <div className="pt-3 flex justify-between items-baseline font-bold text-sm text-[#1a1612] border-t border-[#e6dac6]">
                  <span className="uppercase text-xs tracking-wider">Total a Pagar:</span>
                  <span className="font-display text-2xl sm:text-3xl font-bold text-[#1a1612] tabular-nums">
                    ${finalTotal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#faf7f0] border border-[#e6dac6] flex items-center gap-2 text-[11px] text-[#5a524a]">
                <ShieldCheck className="w-4 h-4 text-[#0b3821] shrink-0" />
                <span>Compra protegida y retiro inmediato en Almagro.</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
