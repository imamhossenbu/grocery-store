import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account', '/checkout', '/cart', '/order', '/api', '/auth'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
