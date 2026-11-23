import type { CartItem } from '@/context/StoreContext';
import { formatPrice, waText } from './storeConfig';

/** Texto del pedido para mandar por WhatsApp desde el carrito. */
export function cartWhatsappMessage(cart: CartItem[], total: number, delivery?: string): string {
  const lines = cart.map((item, index) => {
    const variant = item.selectedVariant ? ` (${waText(item.selectedVariant.name)})` : '';
    return `${index + 1}. ${waText(item.product.name)}${variant} x ${item.quantity} = ${formatPrice(item.unitPrice * item.quantity)}`;
  });
  return [
    'Hola Amancay, quiero consultar por este pedido:',
    '',
    ...lines,
    '',
    `Total productos: ${formatPrice(total)}`,
    ...(delivery ? [`Entrega: ${delivery}`] : []),
    '',
    '¿Tienen stock para coordinar retiro o envío?',
  ].join('\n');
}

/** Dónde se recuerda, durante la visita, la entrega elegida en el carrito para precargar el checkout. */
export const DELIVERY_CHOICE_KEY = 'amancay_entrega';
