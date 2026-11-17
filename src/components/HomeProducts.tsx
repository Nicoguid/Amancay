'use client';

import { useStore } from '@/context/StoreContext';
import { EditorialShowcase } from './EditorialShowcase';
import { ProductCarousel } from './ProductCarousel';
import { categoryInfo } from '@/lib/categories';
import type { ProductCategory } from '@/lib/types';

export function BestSellers() {
  const { products } = useStore();
  const active = products.filter((p) => p.active && p.stock > 0);
  // Primero los más vendidos; el filtro por rubro completa con el resto.
  const sorted = [...active].sort((a, b) => Number(!!b.isBestSeller) - Number(!!a.isBestSeller));
  return <EditorialShowcase products={sorted} />;
}

/** Carrusel de un rubro (no se usa en el inicio actual; queda disponible para otras páginas). */
export function CategoryCarousel({ rubro }: { rubro: ProductCategory }) {
  const { products } = useStore();
  const info = categoryInfo(rubro);
  const items = products.filter((p) => p.active && p.category === rubro);
  return (
    <ProductCarousel
      title={info.label}
      subtitle={info.blurb}
      products={items}
      viewAllLink={`/catalogo?rubro=${rubro}`}
      viewAllLabel={`Ver ${info.label.toLowerCase()}`}
    />
  );
}
