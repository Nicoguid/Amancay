'use client';

import Link from 'next/link';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, MessageCircle } from 'lucide-react';
import { useStore, useCategories } from '@/context/StoreContext';
import { Dialog } from './Dialog';
import { ProductImage } from './ProductImage';
import { STORE, formatPrice, whatsappUrl } from '@/lib/storeConfig';
import { cartWhatsappMessage } from '@/lib/cartMessage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const CATEGORIES = useCategories();
  const { cart, removeFromCart, updateCartQuantity, cartTotal, cartCount } = useStore();

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      variant="drawer"
      title={cartCount > 0 ? `Tu carrito (${cartCount})` : 'Tu carrito'}
      footer={
        cart.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-[var(--ink-primary)]">Subtotal</span>
              <span className="font-display text-2xl tabular-nums text-[var(--ink-primary)]">{formatPrice(cartTotal)}</span>
            </div>
            <p className="text-sm text-[var(--ink-muted)]">
              Retiro sin costo en {STORE.address}. El envío se calcula en el checkout.
            </p>
            <Link
              href="/checkout"
              onClick={onClose}
              className="btn btn-lg btn-primary w-full"
            >
              <span>Finalizar compra</span>
              <ArrowRight className="arrow-nudge h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href={whatsappUrl(cartWhatsappMessage(cart, cartTotal))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-lg btn-whatsapp w-full"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>Pedir por WhatsApp</span>
            </a>
            <Link href="/carrito" onClick={onClose} className="link-brass flex min-h-11 items-center justify-center text-sm">
              Ver el carrito completo y elegir la entrega
            </Link>
          </div>
        ) : undefined
      }
    >
      {cart.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--brand-gold)] text-[var(--ink-on-gold)]">
            <ShoppingBag className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="mb-2 font-display text-2xl text-[var(--ink-primary)]">Tu carrito está vacío</p>
          <p className="mb-6 max-w-xs text-[var(--ink-muted)]">Elegí un rubro para empezar.</p>
          <div className="flex w-full max-w-xs flex-wrap justify-center gap-2">
            {CATEGORIES.map((c) => ({ href: `/catalogo?rubro=${c.id}`, label: c.label })).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="chip"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--bg-subtle)]">
          {cart.map((item) => (
            <li key={item.id} className="flex items-start gap-4 py-4">
              <ProductImage
                src={item.product.images[0]}
                alt=""
                width={72}
                height={72}
                className="photo-on-linen h-18 w-18 shrink-0 rounded-md bg-[var(--bg-sunken)] object-contain p-1.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 font-semibold leading-tight text-[var(--ink-primary)]">{item.product.name}</h3>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--amancay-wine)]"
                    aria-label={`Quitar ${item.product.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                {item.selectedVariant && <p className="mt-1"><span className="tag tag-quiet">{item.selectedVariant.name}</span></p>}

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center rounded-btn bg-[var(--bg-subtle)]">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id, -1)}
                      className="tap-interactive flex h-11 w-11 items-center justify-center rounded-btn text-[var(--ink-primary)] hover:bg-[var(--bg-sunken)]"
                      aria-label={`Restar una unidad de ${item.product.name}`}
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id, 1)}
                      disabled={item.quantity >= item.available}
                      className="tap-interactive flex h-11 w-11 items-center justify-center rounded-btn text-[var(--ink-primary)] hover:bg-[var(--bg-sunken)] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Sumar una unidad de ${item.product.name}`}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums text-[var(--ink-primary)]">{formatPrice(item.unitPrice * item.quantity)}</p>
                    {item.quantity > 1 && <p className="text-sm text-[var(--ink-muted)]">{formatPrice(item.unitPrice)} c/u</p>}
                  </div>
                </div>
                {item.quantity >= item.available && (
                  <p className="mt-2 text-sm text-[var(--amancay-wine)]">No hay más unidades disponibles.</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
