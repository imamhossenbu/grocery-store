import type { MetadataRoute } from 'next';
import { getAllProducts, getCategories } from '@/lib/data/catalog';
import { SITE_URL } from '@/lib/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getAllProducts()]);

  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/deals`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/category`, changeFrequency: 'weekly', priority: 0.6 },
    ...['/about', '/contact', '/faq', '/delivery', '/returns', '/privacy', '/terms'].map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    })),
  ];

  return [
    ...pages,
    ...categories.map((c) => ({
      url: `${SITE_URL}/category/${c.id}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/product/${p.id}`,
      ...(p.createdAt ? { lastModified: p.createdAt } : {}),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      images: [p.image, ...(p.images ?? [])].filter(Boolean),
    })),
  ];
}
