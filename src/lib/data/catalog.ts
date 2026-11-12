import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { supabaseAdmin, isMissingTableError } from '@/lib/supabase/admin';
import { INITIAL_STORE_DATA } from '@/lib/seed-data';
import { toCategory, toCoupon, toProduct, toReview } from './mappers';
import type { Category, Coupon, Product, Review } from '@/types/store';

/**
 * Catalog reads. Cached with `use cache` and tagged 'catalog' so the
 * storefront is served from the static shell; the admin panel (or an order)
 * invalidates via /api/revalidate or updateTag('catalog').
 *
 * Until supabase/schema.sql has been run the tables don't exist; we fall back
 * to the bundled seed catalog so the site still renders (orders are refused).
 */

export type SortKey = 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'name';

async function loadCatalog(): Promise<{ categories: Category[]; products: Product[]; live: boolean }> {
  'use cache';
  cacheLife('minutes');
  cacheTag('catalog');

  const db = supabaseAdmin();
  const [cats, prods] = await Promise.all([
    db.from('categories').select('*').order('sort_order').order('name'),
    db.from('products').select('*').eq('active', true),
  ]);

  if (isMissingTableError(cats.error) || isMissingTableError(prods.error)) {
    return {
      categories: INITIAL_STORE_DATA.categories,
      products: INITIAL_STORE_DATA.products.filter((p) => p.active),
      live: false,
    };
  }
  if (cats.error) throw new Error(`categories: ${cats.error.message}`);
  if (prods.error) throw new Error(`products: ${prods.error.message}`);

  return {
    categories: (cats.data ?? []).map(toCategory),
    products: (prods.data ?? []).map(toProduct),
    live: true,
  };
}

export async function isDatabaseLive(): Promise<boolean> {
  return (await loadCatalog()).live;
}

export async function getCategories(): Promise<(Category & { productCount: number })[]> {
  const { categories, products } = await loadCatalog();
  return categories.map((c) => ({
    ...c,
    productCount: products.filter((p) => p.category === c.id).length,
  }));
}

export async function getCategory(id: string): Promise<Category | null> {
  const { categories } = await loadCatalog();
  return categories.find((c) => c.id === id) ?? null;
}

export async function getAllProducts(): Promise<Product[]> {
  return (await loadCatalog()).products;
}

export async function getProduct(id: string): Promise<Product | null> {
  const { products } = await loadCatalog();
  return products.find((p) => p.id === id) ?? null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const { products } = await loadCatalog();
  const set = new Set(ids);
  return products.filter((p) => set.has(p.id));
}

export interface ProductQuery {
  q?: string;
  category?: string;
  sort?: SortKey;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  page?: number;
  perPage?: number;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  pageCount: number;
  priceRange: { min: number; max: number };
}

function score(p: Product, words: string[]): number {
  const name = p.name.toLowerCase();
  const hay = `${name} ${p.description} ${p.category} ${p.origin ?? ''} ${(p.tags ?? []).join(' ')}`.toLowerCase();
  let s = 0;
  for (const w of words) {
    if (!hay.includes(w)) return 0;
    s += name.startsWith(w) ? 5 : name.includes(w) ? 3 : 1;
  }
  return s;
}

export function sortProducts(list: Product[], sort: SortKey = 'popular'): Product[] {
  const out = [...list];
  switch (sort) {
    case 'price-asc': return out.sort((a, b) => a.price - b.price);
    case 'price-desc': return out.sort((a, b) => b.price - a.price);
    case 'rating': return out.sort((a, b) => b.rating - a.rating || (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    case 'name': return out.sort((a, b) => a.name.localeCompare(b.name));
    case 'newest': return out.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    default:
      return out.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          (b.soldCount ?? 0) - (a.soldCount ?? 0) ||
          b.rating - a.rating
      );
  }
}

export async function queryProducts(query: ProductQuery): Promise<ProductPage> {
  const { products } = await loadCatalog();
  const perPage = query.perPage ?? 12;

  let list = query.category ? products.filter((p) => p.category === query.category) : products;
  const prices = list.map((p) => p.price);
  const priceRange = { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 };

  const words = (query.q ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  let scored: Map<string, number> | null = null;
  if (words.length) {
    scored = new Map();
    for (const p of list) {
      const s = score(p, words);
      if (s > 0) scored.set(p.id, s);
    }
    list = list.filter((p) => scored!.has(p.id));
  }
  if (query.minPrice !== undefined) list = list.filter((p) => p.price >= query.minPrice!);
  if (query.maxPrice !== undefined) list = list.filter((p) => p.price <= query.maxPrice!);
  if (query.inStock) list = list.filter((p) => p.stock > 0);
  if (query.onSale) list = list.filter((p) => p.oldPrice && p.oldPrice > p.price);

  list = scored && (!query.sort || query.sort === 'popular')
    ? [...list].sort((a, b) => scored!.get(b.id)! - scored!.get(a.id)!)
    : sortProducts(list, query.sort);

  const total = list.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, query.page ?? 1), pageCount);
  return { items: list.slice((page - 1) * perPage, page * perPage), total, page, pageCount, priceRange };
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const { products } = await loadCatalog();
  return sortProducts(products.filter((p) => p.featured), 'popular').slice(0, limit);
}

export async function getBestSellers(limit = 8): Promise<Product[]> {
  const { products } = await loadCatalog();
  return [...products].sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0) || b.rating - a.rating).slice(0, limit);
}

export async function getDeals(limit = 8): Promise<Product[]> {
  const { products } = await loadCatalog();
  return products
    .filter((p) => p.oldPrice && p.oldPrice > p.price)
    .sort((a, b) => b.oldPrice! / b.price - a.oldPrice! / a.price)
    .slice(0, limit);
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  return sortProducts(await getAllProducts(), 'newest').slice(0, limit);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const { products } = await loadCatalog();
  return sortProducts(
    products.filter((p) => p.category === product.category && p.id !== product.id),
    'popular'
  ).slice(0, limit);
}

/** Lightweight index for the header's instant search (client side). */
export async function getSearchIndex() {
  const { products, categories } = await loadCatalog();
  return {
    products: products.map((p) => ({ id: p.id, name: p.name, unit: p.unit, price: p.price, image: p.image, category: p.category })),
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
  };
}

export async function getPublicCoupons(): Promise<Coupon[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag('catalog');
  const { data, error } = await supabaseAdmin().from('coupons').select('*').eq('active', true).order('min_subtotal');
  if (isMissingTableError(error)) return INITIAL_STORE_DATA.coupons.filter((c) => c.active);
  if (error) throw new Error(error.message);
  const now = new Date().toISOString();
  return (data ?? [])
    .filter(
      (r) =>
        (!r.starts_at || String(r.starts_at) <= now) &&
        (r.usage_limit === null || r.usage_limit === undefined || Number(r.used_count ?? 0) < Number(r.usage_limit))
    )
    .map(toCoupon)
    .filter((c) => !c.expiresAt || new Date(c.expiresAt).getTime() > Date.parse(now));
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag('catalog', `reviews:${productId}`);
  const { data, error } = await supabaseAdmin()
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return [];
  return (data ?? []).map(toReview);
}
