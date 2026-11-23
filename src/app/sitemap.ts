import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/server/catalog';
import { CATEGORY_IDS } from '@/lib/categories';
import { SITE_URL, productPath } from '@/lib/storeConfig';
import { LEGAL_ORDER, legalPath } from '@/lib/legal';

/* Sin lastModified por ahora: una fecha inventada confunde a los buscadores. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getCatalog();
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/catalogo`, changeFrequency: 'weekly', priority: 0.9 },
    ...CATEGORY_IDS.map((id) => ({ url: `${SITE_URL}/catalogo?rubro=${id}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...products.filter((p) => p.active).map((p) => ({
      url: `${SITE_URL}${productPath(p)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    { url: `${SITE_URL}/arrepentimiento`, changeFrequency: 'yearly' as const, priority: 0.3 },
    ...LEGAL_ORDER.map((slug) => ({ url: `${SITE_URL}${legalPath(slug)}`, changeFrequency: 'yearly' as const, priority: 0.2 })),
  ];
}
