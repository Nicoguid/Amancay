'use client';

import { useStore } from '@/context/StoreContext';
import { EditorialShowcase } from './EditorialShowcase';
import { ProductCarousel } from './ProductCarousel';

export function BestSellers() {
  const { products } = useStore();
  const active = products.filter((p) => p.active && p.stock > 0);
  const best = active.filter((p) => p.isBestSeller);
  return <EditorialShowcase products={best.length > 0 ? best : active} />;
}

const CAROUSELS = [
  { rubro: 'mates', title: 'Mates', subtitle: 'Calabaza y algarrobo, con virolas de alpaca o acero.' },
  { rubro: 'bombillas', title: 'Bombillas', subtitle: 'Alpaca y acero inoxidable.' },
  { rubro: 'perfumes', title: 'Perfumes', subtitle: 'Fragancias de la casa y marcas nacionales.' },
] as const;

export function CategoryCarousel({ rubro }: { rubro: (typeof CAROUSELS)[number]['rubro'] }) {
  const { products } = useStore();
  const config = CAROUSELS.find((c) => c.rubro === rubro)!;
  const items = products.filter((p) => p.active && p.category === rubro);
  return (
    <ProductCarousel
      title={config.title}
      subtitle={config.subtitle}
      products={items}
      viewAllLink={`/catalogo?rubro=${rubro}`}
      viewAllLabel={`Ver todos los ${config.title.toLowerCase()}`}
    />
  );
}
