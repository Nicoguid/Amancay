import type { Product } from './types';
import { SITE_URL, STORE, productPath } from './storeConfig';
import { categoryLabel, type CategoryInfo } from './categories';

/**
 * Datos estructurados (schema.org, JSON-LD). Solo describen lo que la página muestra:
 * dirección, horarios, precio y stock. Sin reseñas ni calificaciones inventadas.
 */

export function storeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${SITE_URL}/#local`,
    name: STORE.name,
    url: SITE_URL,
    image: `${SITE_URL}/productos/mate-imperial-calabaza-cuero-virola-alpaca-cincelada.webp`,
    telephone: STORE.whatsappDisplay.replace(/\s/g, ''),
    email: STORE.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: STORE.address,
      addressLocality: 'Almagro',
      addressRegion: 'Ciudad Autónoma de Buenos Aires',
      addressCountry: 'AR',
    },
    hasMap: STORE.mapsUrl,
    geo: { '@type': 'GeoCoordinates', latitude: -34.6038041, longitude: -58.4163253 },
    // Turno cortado = dos bloques el mismo día. El domingo no figura: cerrado.
    openingHoursSpecification: STORE.hours.flatMap((h) =>
      h.shifts.map(([opens, closes]) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: h.dayCodes,
        opens,
        closes,
      }))
    ),
    currenciesAccepted: 'ARS',
  };
}

function absolute(path: string) {
  return path.startsWith('http') ? path : `${SITE_URL}${path}`;
}

export function productJsonLd(product: Product, categories?: CategoryInfo[]) {
  const prices = product.variants?.length ? product.variants.map((v) => v.price) : [product.price];
  const inStock = product.active && product.stock > 0;
  const availability = inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const url = `${SITE_URL}${productPath(product)}`;
  const offers =
    prices.length > 1
      ? {
          '@type': 'AggregateOffer',
          priceCurrency: 'ARS',
          lowPrice: Math.min(...prices),
          highPrice: Math.max(...prices),
          offerCount: prices.length,
          availability,
          url,
        }
      : { '@type': 'Offer', priceCurrency: 'ARS', price: prices[0], availability, url };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: product.name,
        sku: product.sku,
        description: product.shortDescription ?? product.description,
        category: categoryLabel(product.category, categories),
        brand: { '@type': 'Brand', name: product.brand },
        ...(product.images.length ? { image: product.images.map(absolute) } : {}),
        offers: { ...offers, seller: { '@id': `${SITE_URL}/#local` } },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
          {
            '@type': 'ListItem',
            position: 2,
            name: categoryLabel(product.category, categories),
            item: `${SITE_URL}/catalogo?rubro=${product.category}`,
          },
          { '@type': 'ListItem', position: 3, name: product.name, item: url },
        ],
      },
    ],
  };
}

/** JSON.stringify no escapa "<": se reemplaza para que un texto no pueda cerrar el <script>. */
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
