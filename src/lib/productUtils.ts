import type { Product, ProductCategory, ProductVariant } from './types';

/*
 * Funciones puras sobre productos. Viven acá (y no en StoreContext, que es 'use client')
 * para que las puedan usar tanto el servidor como el navegador.
 */

export type MassFilter = 'all' | 'category' | 'brand';

export interface CsvProductRow {
  sku?: string;
  id?: string;
  name?: string;
  brand?: string;
  category?: ProductCategory;
  price?: number;
  stock?: number;
}

export const roundTo50 = (value: number) => Math.round(value / 50) * 50;

/** Las variantes valen precio base + modificador; el stock del producto es la suma de sus variantes. */
export function normalizeProduct(product: Product): Product {
  if (!product.variants || product.variants.length === 0) return product;
  const variants = product.variants.map((v) => ({
    ...v,
    price: Math.max(0, product.price + (v.priceModifier ?? 0)),
    stock: Math.max(0, Math.floor(v.stock)),
  }));
  return { ...product, variants, stock: variants.reduce((sum, v) => sum + v.stock, 0) };
}

export function availableStock(product: Product, variant?: ProductVariant): number {
  return variant ? variant.stock : product.stock;
}

/** Precio mínimo y máximo (para mostrar "Desde $X" cuando las variantes tienen precios distintos). */
export function priceRange(product: Product): { min: number; max: number } {
  const prices = product.variants?.length ? product.variants.map((v) => v.price) : [product.price];
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function matchesMassFilter(product: Product, filterType: MassFilter, filterValue: string) {
  if (filterType === 'all') return true;
  if (filterType === 'category') return product.category === filterValue;
  return product.brand.toLowerCase() === filterValue.toLowerCase();
}

/** Mismo cálculo para la vista previa y para el aumento real. */
export function applyPercentage(product: Product, percentage: number): Product {
  const factor = 1 + percentage / 100;
  return normalizeProduct({
    ...product,
    price: roundTo50(product.price * factor),
    originalPrice: product.originalPrice ? roundTo50(product.originalPrice * factor) : undefined,
    variants: product.variants?.map((v) => ({ ...v, priceModifier: roundTo50((v.priceModifier ?? 0) * factor) })),
  });
}
