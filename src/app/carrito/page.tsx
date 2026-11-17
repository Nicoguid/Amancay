import type { Metadata } from 'next';
import { CartContent } from './CartContent';

export const metadata: Metadata = {
  title: 'Tu carrito',
  robots: { index: false },
};

export default function CartPage() {
  return <CartContent />;
}
