import type { Metadata } from 'next';
import { CheckoutContent } from './CheckoutContent';

export const metadata: Metadata = {
  title: 'Finalizar compra',
  robots: { index: false },
};

export default function CheckoutPage() {
  return <CheckoutContent />;
}
