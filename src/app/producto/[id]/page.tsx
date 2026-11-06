import type { Metadata } from 'next';
import { Suspense } from 'react';
import { INITIAL_PRODUCTS } from '@/lib/mockData';
import { ProductDetail } from './ProductDetail';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const product = INITIAL_PRODUCTS.find((p) => p.id === id || p.slug === id);
  if (!product) return { title: 'Producto' };
  return {
    title: product.name,
    description: product.shortDescription ?? product.description.slice(0, 155),
    openGraph: product.images[0] ? { images: [product.images[0]] } : undefined,
  };
}

async function ProductResolver({ params }: { params: Params }) {
  const { id } = await params;
  return <ProductDetail id={id} />;
}

export default function ProductPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<p className="p-16 text-center text-[var(--ink-muted)]">Cargando producto…</p>}>
      <ProductResolver params={params} />
    </Suspense>
  );
}
