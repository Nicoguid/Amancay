import type { Metadata } from 'next';
import { SavedContent } from './SavedContent';

export const metadata: Metadata = {
  title: 'Guardados',
  description: 'Los productos que guardaste para ver o comprar después. Quedan en este navegador, sin crear una cuenta.',
  robots: { index: false },
};

export default function SavedPage() {
  return <SavedContent />;
}
