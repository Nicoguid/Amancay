'use client';

import Link from 'next/link';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, MessageCircle } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Dialog } from './Dialog';
import { ProductImage } from './ProductImage';
import { STORE, formatPrice, whatsappUrl } from '@/lib/storeConfig';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, updateCartQuantity, cartTotal, cartCount } = useStore();

  const whatsappMessage = () => {
    const lines = cart.map((item, index) => {
      const variant = item.selectedVariant ? ` (${item.selectedVariant.name})` : '';
      return `${index + 1}. ${item.product.name}${variant} x ${item.quantity} = ${formatPrice(item.unitPrice * item.quantity)}`;
    });
    return [
      'Hola Amancay, quiero consultar por este pedido:',
      '',
      ...lines,
      '',
      `Total productos: ${formatPrice(cartTotal)}`,
      '',
      '¿Tienen stock para coordinar retiro o envío?',
    ].join('\n');
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      variant="drawer"
      eyebrow="Tu carrito"
      title={cartCount === 1 ? '1 producto' : `${cartCount} productos`}
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
              className="tap-interactive flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--ink-primary)] px-4 font-semibold text-white shadow-md hover:bg-[var(--ink-secondary)]"
            >
              <span>Ir a pagar</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href={whatsappUrl(whatsappMessage())}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-interactive flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--whatsapp-action)] px-4 font-semibold text-white hover:bg-[var(--whatsapp-action-hover)]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>Pedir por WhatsApp</span>
            </a>
          </div>
        ) : undefined
      }
    >
      {cart.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--amancay-border)] bg-[var(--bg-page)] text-[var(--ink-accent)]">
            <ShoppingBag className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="mb-2 font-display text-2xl text-[var(--ink-primary)]">Tu carrito está vacío</p>
          <p className="mb-6 max-w-xs text-[var(--ink-muted)]">Elegí un rubro para empezar.</p>
          <div className="flex w-full max-w-xs flex-col gap-2">
            {[
              { href: '/catalogo?rubro=mates', label: 'Ver mates' },
              { href: '/catalogo?rubro=bombillas', label: 'Ver bombillas' },
              { href: '/catalogo?rubro=perfumes', label: 'Ver perfumes' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="tap-interactive flex min-h-11 items-center justify-center rounded-full border border-[var(--amancay-border)] bg-[var(--bg-page)] px-5 font-semibold text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)]"
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
                className="h-18 w-18 shrink-0 rounded-md border border-[var(--amancay-border)] bg-[var(--bg-page)] object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 font-semibold leading-tight text-[var(--ink-primary)]">{item.product.name}</h3>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--amancay-wine)]"
                    aria-label={`Quitar ${item.product.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                {item.selectedVariant && <p className="mt-1 text-sm text-[var(--ink-accent)]">{item.selectedVariant.name}</p>}

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center rounded-full border border-[var(--amancay-border)] bg-[var(--bg-page)]">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id, -1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)]"
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
                      className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)] disabled:cursor-not-allowed disabled:opacity-40"
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
