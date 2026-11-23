import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getProductBySlugOrId } from '@/lib/server/catalog';
import { productPath } from '@/lib/storeConfig';
import { categoryLabel } from '@/lib/categories';
import { ProductDetail } from './ProductDetail';
import { productJsonLd, serializeJsonLd } from '@/lib/structuredData';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductBySlugOrId(id);
  if (!product) return { title: 'Producto', robots: { index: false } };
  const rubro = categoryLabel(product.category);
  // Meta descripción: qué es + dónde se consigue (150-160 caracteres).
  const base = (product.shortDescription ?? product.description).replace(/\.$/, '');
  const description = `${base}. ${rubro} en Perfumería Amancay, Av. Corrientes 3666 (Almagro): retiro sin costo o envío.`;
  return {
    title: `${product.name} | ${rubro} en Almagro`,
    description: description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description,
    alternates: { canonical: productPath(product) },
    openGraph: product.images[0] ? { images: [{ url: product.images[0], alt: product.name }] } : undefined,
  };
}

async function ProductResolver({ params }: { params: Params }) {
  const { id } = await params;
  const product = await getProductBySlugOrId(id);
  return (
    <>
      {product && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd(product)) }} />
      )}
      <ProductDetail id={id} />
    </>
  );
}

export default function ProductPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<p className="p-16 text-center text-[var(--ink-muted)]">Cargando producto…</p>}>
      <ProductResolver params={params} />
    </Suspense>
  );
}
