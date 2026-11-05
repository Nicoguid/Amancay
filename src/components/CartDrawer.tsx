'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { ShoppingBag, X, Plus, Minus, Trash2, Truck, ArrowRight, MessageCircle, ShieldCheck, CreditCard, Bike } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, updateCartQuantity, cartTotal, cartCount } = useStore();

  if (!isOpen) return null;

  const cuota3Galicia = Math.round(cartTotal / 3);

  // Pre-filled WhatsApp message
  const generateWhatsAppMessage = () => {
    let msg = `Hola Amancay! Quiero consultar disponibilidad para encargar este pedido:\n\n`;
    cart.forEach((item, index) => {
      const variantInfo = item.selectedVariant ? ` (${item.selectedVariant.name})` : '';
      msg += `${index + 1}. ${item.product.name}${variantInfo} x ${item.quantity} = $${(item.unitPrice * item.quantity).toLocaleString('es-AR')}\n`;
    });
    msg += `\nTotal productos: $${cartTotal.toLocaleString('es-AR')}`;
    msg += `\n(O en 3 cuotas con Banco Galicia de $${cuota3Galicia.toLocaleString('es-AR')} - Promo Noviembre)`;
    msg += `\n\n¿Tienen stock en Av. Corrientes 3666 para coordinar retiro, moto en CABA o envío por Correo Argentino?`;
    return encodeURIComponent(msg);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-[#1a1612]/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-12">
        {/* Ticket Drawer Container */}
        <div data-ui="cart-drawer" className="w-screen max-w-md bg-[#ffffff] border-l border-[#e6dac6] flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-5 border-b border-[#e6dac6] bg-[#faf7f0] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#1a1612] text-[#faf7f0] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-[#a67c3f]" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#a67c3f] block">
                  Tu Carrito
                </span>
                <h2 className="font-display text-xl font-bold text-[#1a1612] tracking-tight">
                  Productos Seleccionados ({cartCount})
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="tap-interactive text-[#5a524a] hover:text-[#1a1612] p-2 rounded-full hover:bg-[#e6dac6]/40 transition-colors"
              aria-label="Cerrar carrito"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Shipping & Delivery Policy Banner */}
          <div className="bg-[#f4efe6] px-5 py-3 border-b border-[#e6dac6] space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#1a1612]">
              <Truck className="w-4 h-4 text-[#a67c3f]" />
              <span>Envíos a cargo del comprador</span>
            </div>
            <p className="text-[11px] text-[#5a524a] leading-tight">
              🛵 Motomensajería en el día a CABA · 📦 Correo Argentino a todo el país.
            </p>
          </div>

          {/* Local Pickup Tag */}
          <div className="bg-[#faf7f0] text-[#1a1612] px-5 py-2 flex items-center justify-between text-xs font-medium border-b border-[#e6dac6]">
            <span className="text-[#5a524a]">Retiro sin cargo:</span>
            <span className="text-[#0b3821] font-bold">Av. Corrientes 3666 (Listo en el día)</span>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-[#f4efe6]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 text-[#5a524a]">
                <div className="w-16 h-16 rounded-full bg-[#faf7f0] border border-[#e6dac6] flex items-center justify-center mb-4 text-[#a67c3f]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="font-display text-2xl text-[#1a1612] mb-2 font-semibold">Tu carrito está vacío</p>
                <p className="text-xs sm:text-sm max-w-xs leading-relaxed mb-6 text-[#5a524a]">
                  Sumá mates artesanales de algarrobo, bombillas de alpaca cincelada o fragancias finas a tu pedido.
                </p>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  <Link
                    href="/catalogo?rubro=mates"
                    onClick={onClose}
                    className="tap-interactive text-xs font-bold uppercase tracking-wider bg-[#1a1612] text-white px-5 py-3 rounded-full hover:bg-[#a67c3f] transition-colors text-center"
                  >
                    Ver Mates Imperiales
                  </Link>
                  <Link
                    href="/catalogo?rubro=perfumes"
                    onClick={onClose}
                    className="tap-interactive text-xs font-bold uppercase tracking-wider bg-[#faf7f0] border border-[#e6dac6] text-[#1a1612] px-5 py-2.5 rounded-full hover:bg-[#f4efe6] transition-colors text-center"
                  >
                    Ver Perfumes de Autor
                  </Link>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 items-start">
                  {/* Thumbnail */}
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-18 h-18 object-cover bg-[#faf7f0] rounded-md border border-[#e6dac6] shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-[#1a1612] leading-tight line-clamp-2">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[#5a524a] hover:text-[#672d35] transition-colors p-1"
                        title="Eliminar producto"
                        aria-label={`Eliminar ${item.product.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.selectedVariant && (
                      <span className="inline-block mt-1 text-xs text-[#a67c3f] font-medium bg-[#faf7f0] px-2 py-0.5 rounded-full border border-[#e6dac6]/60">
                        {item.selectedVariant.name}
                      </span>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#e6dac6] rounded-full bg-[#faf7f0]">
                        <button
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center text-[#5a524a] hover:text-[#1a1612] transition-colors"
                          aria-label="Restar una unidad"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-[#1a1612] tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#5a524a] hover:text-[#1a1612] transition-colors"
                          aria-label="Sumar una unidad"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <span className="text-sm font-bold text-[#1a1612] tabular-nums block">
                          ${(item.unitPrice * item.quantity).toLocaleString('es-AR')}
                        </span>
                        <span className="text-[11px] text-[#5a524a]">
                          (${item.unitPrice.toLocaleString('es-AR')} c/u)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Totals & Action Buttons */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-[#e6dac6] bg-[#faf7f0] space-y-3.5">
              
              {/* Totals Summary */}
              <div className="bg-[#ffffff] p-3.5 rounded-xl border border-[#e6dac6] text-xs space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[#1a1612] text-sm">Subtotal productos:</span>
                  <span className="font-display text-2xl font-bold text-[#1a1612] tabular-nums">
                    ${cartTotal.toLocaleString('es-AR')}
                  </span>
                </div>

                {/* Galicia 3 Installments Highlight */}
                <div className="p-2 rounded-lg bg-[#faf7f0] border border-[#e6dac6] flex items-center justify-between text-[#0b3821] font-semibold text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#a67c3f]" />
                    <span>3 cuotas Banco Galicia:</span>
                  </span>
                  <span className="font-bold">3 de ${cuota3Galicia.toLocaleString('es-AR')} (Noviembre)</span>
                </div>

                <p className="text-[10px] text-[#5a524a] text-center pt-0.5">
                  El costo del envío se calcula al ingresar tu dirección en el checkout.
                </p>
              </div>

              {/* Action 1: Iniciar Compra */}
              <Link
                href="/checkout"
                onClick={onClose}
                className="tap-interactive w-full bg-[#1a1612] hover:bg-[#a67c3f] text-white py-3.5 px-4 rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <span>Iniciar Compra Segura</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Action 2: Pedir por WhatsApp */}
              <a
                href={`https://wa.me/5491136740676?text=${generateWhatsAppMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-interactive w-full bg-[#25d366] hover:bg-[#128c7e] text-white py-3 px-4 rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Pedir y Coordinar por WhatsApp</span>
              </a>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#5a524a] pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0b3821]" />
                <span>Compra protegida y retiro en Av. Corrientes 3666</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
