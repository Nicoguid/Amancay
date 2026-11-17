import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/storeConfig';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/checkout'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
