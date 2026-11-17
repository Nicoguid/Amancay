import type { ProductCategory } from './types';

/**
 * Los rubros del local, en un solo lugar: menú, catálogo, home, panel y filtros salen de acá.
 * Para sumar un rubro: agregalo en `ProductCategory` (types.ts) y en esta lista.
 */
export interface CategoryInfo {
  id: ProductCategory;
  label: string;
  /** Texto corto para la tarjeta del rubro en el inicio. */
  blurb: string;
  /** Foto de portada del rubro. */
  image: string;
  /** Qué elige el cliente cuando el producto tiene variantes. */
  variantNoun: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'mates',
    label: 'Mates',
    blurb: 'Imperiales, camioneros, torpedos y poritos de calabaza, y mates de caldén y algarrobo.',
    image: '/productos/mate-imperial-calabaza-cuero-virola-alpaca-cincelada.webp',
    variantNoun: 'opción',
  },
  {
    id: 'bombillas',
    label: 'Bombillas',
    blurb: 'Pico de loro, chatas y de cuchara, en alpaca y acero inoxidable.',
    image: '/productos/bombilla-pico-de-loro-alpaca-cincelada.webp',
    variantNoun: 'opción',
  },
  {
    id: 'perfumes',
    label: 'Perfumes',
    blurb: 'Kevin, Bross London, CaroCuore, Valeria Mazza, Colbert, Ciel y Cannon.',
    image: '/productos/carocuore-cuore-perfume.webp',
    variantNoun: 'tamaño',
  },
  {
    id: 'desodorantes',
    label: 'Desodorantes',
    blurb: 'Los desodorantes en aerosol de cada línea, para acompañar tu perfume.',
    image: '/productos/kevin-dubai-desodorante.webp',
    variantNoun: 'tamaño',
  },
  {
    id: 'combos',
    label: 'Combos',
    blurb: 'Perfume y desodorante de la misma línea, en caja. Resuelven un regalo.',
    image: '/productos/bross-london-gold-perfume-desodorante.webp',
    variantNoun: 'opción',
  },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export function categoryInfo(id: ProductCategory): CategoryInfo {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

export function categoryLabel(id: ProductCategory): string {
  return categoryInfo(id).label;
}

/** "Mates, bombillas, perfumes, desodorantes y combos" */
export const CATEGORY_SENTENCE = new Intl.ListFormat('es', { type: 'conjunction' }).format(
  CATEGORIES.map((c, i) => (i === 0 ? c.label : c.label.toLowerCase()))
);
