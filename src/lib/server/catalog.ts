import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import type { Product, ProductCategory, ProductVariant } from '@/lib/types';
import { normalizeProduct } from '@/lib/productUtils';
import { INITIAL_PRODUCTS } from '@/lib/mockData';
import type { DbCategory, DbProduct, DbVariant } from './database.types';
import { DEFAULT_CATEGORIES, type CategoryInfo } from '@/lib/categories';
import { db, dbConfigured } from './supabase';

/** Etiqueta de caché del catálogo: el panel la invalida cada vez que cambia un producto. */
export const CATALOG_TAG = 'catalog';

type ProductWithVariants = DbProduct & { product_variants: DbVariant[] };

/** Fila de la base -> el mismo `Product` que ya usa toda la tienda. */
export function toProduct(row: ProductWithVariants): Product {
  const variants: ProductVariant[] = [...(row.product_variants ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((v) => ({
      id: v.id,
      name: v.name,
      price: Number(v.price),
      // La tienda trabaja con "precio base + modificador": se deriva del precio guardado.
      priceModifier: Number(v.price) - Number(row.price),
      stock: v.stock,
      sku: v.sku,
    }));

  return normalizeProduct({
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category as ProductCategory,
    brand: row.brand,
    description: row.description,
    shortDescription: row.short_description ?? undefined,
    price: Number(row.price),
    originalPrice: row.original_price == null ? undefined : Number(row.original_price),
    stock: row.stock,
    images: row.images ?? [],
    variants: variants.length ? variants : undefined,
    isFeatured: row.is_featured,
    isBestSeller: row.is_best_seller,
    isNew: row.is_new,
    sku: row.sku,
    active: row.active,
    specifications: (row.specifications ?? {}) as Record<string, string>,
    curadoOGuia: row.curado_o_guia ?? undefined,
    weightG: row.weight_g ?? undefined,
    lengthCm: row.length_cm ?? undefined,
    widthCm: row.width_cm ?? undefined,
    heightCm: row.height_cm ?? undefined,
  });
}

async function fetchCatalog(): Promise<Product[]> {
  // Sin base configurada (por ejemplo, alguien que clona el repo para mirar el diseño) se usa la demo.
  if (!dbConfigured()) return INITIAL_PRODUCTS.map(normalizeProduct);

  const { data, error } = await db()
    .from('products')
    .select('*, product_variants(*)')
    .order('category')
    .order('id');

  if (error) throw new Error(`No se pudo leer el catálogo: ${error.message}`);
  return data.map(toProduct);
}

/**
 * Catálogo completo (activos e inactivos: el panel necesita los dos; la tienda filtra por `active`).
 * Queda en caché y se invalida con updateTag(CATALOG_TAG) cuando el panel guarda un cambio.
 * El stock lo vuelve a controlar create_order al comprar, así que un número un poco viejo nunca vende de más.
 */
export async function getCatalog(): Promise<Product[]> {
  'use cache';
  cacheTag(CATALOG_TAG);
  cacheLife('minutes');
  return fetchCatalog();
}

export function toCategory(row: DbCategory): CategoryInfo {
  return {
    id: row.id,
    label: row.label,
    blurb: row.blurb,
    image: row.image ?? '',
    variantNoun: row.variant_noun,
    active: row.active,
    position: row.position,
  };
}

/** Todos los rubros (activos y ocultos), en el orden que eligió la dueña. La tienda filtra los ocultos. */
export async function getAllCategories(): Promise<CategoryInfo[]> {
  'use cache';
  cacheTag(CATALOG_TAG);
  cacheLife('minutes');
  if (!dbConfigured()) return DEFAULT_CATEGORIES;
  const { data, error } = await db().from('categories').select('*').order('position').order('label');
  if (error) throw new Error(`No se pudieron leer los rubros: ${error.message}`);
  return data.map(toCategory);
}

/** Rubros visibles en la tienda. */
export async function getCategories(): Promise<CategoryInfo[]> {
  return (await getAllCategories()).filter((c) => c.active !== false);
}

export async function getProductBySlugOrId(slugOrId: string): Promise<Product | undefined> {
  const catalog = await getCatalog();
  return catalog.find((p) => p.slug === slugOrId || p.id === slugOrId);
}
