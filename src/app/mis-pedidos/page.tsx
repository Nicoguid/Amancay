import type { Metadata } from 'next';
import { OrdersContent } from './OrdersContent';

export const metadata: Metadata = {
  title: 'Mis pedidos',
  description: 'Seguí el estado de los pedidos que hiciste desde este navegador o buscalos por su código.',
  robots: { index: false },
};

export default function OrdersPage() {
  return <OrdersContent />;
}
