import type { ProductCategory } from './types';

/**
 * Los rubros del local. Viven en la tabla `categories` y la dueña los edita desde el panel;
 * la tienda los recibe con el catálogo (useCategories en el navegador, getCategories en el servidor).
 * Esta lista es solo el respaldo para cuando no hay base configurada.
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
  /** false = oculto en la tienda (solo lo ve el panel). */
  active?: boolean;
  position?: number;
}

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
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

/** Datos de un rubro. Si no está (rubro borrado u oculto), devuelve uno genérico con el id. */
export function categoryInfo(id: ProductCategory, list: CategoryInfo[] = DEFAULT_CATEGORIES): CategoryInfo {
  return (
    list.find((c) => c.id === id) ?? { id, label: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '), blurb: '', image: '', variantNoun: 'opción' }
  );
}

export function categoryLabel(id: ProductCategory, list: CategoryInfo[] = DEFAULT_CATEGORIES): string {
  return categoryInfo(id, list).label;
}

/** "Mates, bombillas, perfumes, desodorantes y combos" */
export function categorySentence(list: CategoryInfo[]): string {
  return new Intl.ListFormat('es', { type: 'conjunction' }).format(list.map((c, i) => (i === 0 ? c.label : c.label.toLowerCase())));
}
