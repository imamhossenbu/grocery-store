import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { supabaseAdmin, isMissingTableError } from '@/lib/supabase/admin';
import { INITIAL_STORE_DATA } from '@/lib/seed-data';
import { toCategory, toCoupon, toProduct, toReview } from './mappers';
import type { Category, CategoryNode, CategoryWithCount, Coupon, Product, Review } from '@/types/store';

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

/* ---------------------------------------------------------------------------
 * Category tree. Derived (in memory) from the cached catalog: categories may
 * have a parent; a category's product count and listing cover its subtree.
 * ------------------------------------------------------------------------- */

interface CategoryIndex {
  /** Every category in depth-first tree order (parent, then its children). */
  flat: CategoryWithCount[];
  roots: CategoryNode[];
  nodes: Map<string, CategoryNode>;
  parentOf: Map<string, string>;
}

const indexCache = new WeakMap<object, CategoryIndex>();

function buildCategoryIndex(categories: Category[], products: Product[]): CategoryIndex {
  const ids = new Set(categories.map((c) => c.id));
  const kids = new Map<string | null, Category[]>();
  for (const c of categories) {
    // Unknown parents (or a self reference) fall back to top level.
    const parent = c.parentId && c.parentId !== c.id && ids.has(c.parentId) ? c.parentId : null;
    const list = kids.get(parent) ?? [];
    list.push(c);
    kids.set(parent, list);
  }
  const direct = new Map<string, number>();
  for (const p of products) direct.set(p.category, (direct.get(p.category) ?? 0) + 1);

  const nodes = new Map<string, CategoryNode>();
  const parentOf = new Map<string, string>();
  const flat: CategoryWithCount[] = [];

  const build = (c: Category, depth: number, parent: string | null): CategoryNode => {
    const node: CategoryNode = { ...c, depth, productCount: direct.get(c.id) ?? 0, children: [] };
    if (parent) parentOf.set(c.id, parent);
    else delete node.parentId;
    nodes.set(c.id, node);
    const flatEntry: CategoryWithCount = { ...c, depth, productCount: 0 };
    if (!parent) delete flatEntry.parentId;
    flat.push(flatEntry);
    for (const child of kids.get(c.id) ?? []) {
      if (nodes.has(child.id)) continue; // cycle guard (the DB trigger forbids them anyway)
      const n = build(child, depth + 1, c.id);
      node.children.push(n);
      node.productCount += n.productCount;
    }
    flatEntry.productCount = node.productCount;
    return node;
  };

  const roots = (kids.get(null) ?? []).map((c) => build(c, 0, null));
  return { flat, roots, nodes, parentOf };
}

function categoryIndex(catalog: { categories: Category[]; products: Product[] }): CategoryIndex {
  let idx = indexCache.get(catalog);
  if (!idx) {
    idx = buildCategoryIndex(catalog.categories, catalog.products);
    indexCache.set(catalog, idx);
  }
  return idx;
}

function descendantsOf(idx: CategoryIndex, id: string): string[] {
  const out: string[] = [];
  const walk = (n: CategoryNode) => {
    for (const c of n.children) {
      out.push(c.id);
      walk(c);
    }
  };
  const node = idx.nodes.get(id);
  if (node) walk(node);
  return out;
}

function pathOf(idx: CategoryIndex, id: string): CategoryWithCount[] {
  const chain: CategoryWithCount[] = [];
  const seen = new Set<string>();
  let cur: string | undefined = id;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const entry = idx.flat.find((c) => c.id === cur);
    if (!entry) break;
    chain.unshift(entry);
    cur = idx.parentOf.get(cur);
  }
  return chain;
}

/** Flat list of all categories (tree order), each with its subtree product count. */
export async function getCategories(): Promise<CategoryWithCount[]> {
  return categoryIndex(await loadCatalog()).flat;
}

/** Top-level categories only (counts include their subcategories). */
export async function getTopCategories(): Promise<CategoryWithCount[]> {
  return (await getCategories()).filter((c) => !c.parentId);
}

/** Nested tree of categories with subtree product counts. */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  return categoryIndex(await loadCatalog()).roots;
}

/** The node for one category (with its children), or null. */
export async function getCategoryNode(id: string): Promise<CategoryNode | null> {
  return categoryIndex(await loadCatalog()).nodes.get(id) ?? null;
}

/** Ancestors → self, for breadcrumbs. Empty when the id is unknown. */
export async function getCategoryPath(id: string): Promise<CategoryWithCount[]> {
  return pathOf(categoryIndex(await loadCatalog()), id);
}

/** Ids of every category below `id` (not including `id` itself). */
export async function getDescendantIds(id: string): Promise<string[]> {
  return descendantsOf(categoryIndex(await loadCatalog()), id);
}

export async function getCategory(id: string): Promise<CategoryWithCount | null> {
  return (await getCategories()).find((c) => c.id === id) ?? null;
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

function score(p: Product, words: string[], categoryText = ''): number {
  const name = p.name.toLowerCase();
  const hay = `${name} ${p.description} ${p.category} ${categoryText} ${p.origin ?? ''} ${(p.tags ?? []).join(' ')}`.toLowerCase();
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
  const catalog = await loadCatalog();
  const { products } = catalog;
  const perPage = query.perPage ?? 12;

  let list = products;
  if (query.category) {
    const ids = new Set([query.category, ...descendantsOf(categoryIndex(catalog), query.category)]);
    list = products.filter((p) => ids.has(p.category));
  }
  const prices = list.map((p) => p.price);
  const priceRange = { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 };

  const words = (query.q ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  let scored: Map<string, number> | null = null;
  if (words.length) {
    scored = new Map();
    const idx = categoryIndex(catalog);
    const chainText = new Map<string, string>();
    const textFor = (id: string) => {
      let t = chainText.get(id);
      if (t === undefined) {
        t = pathOf(idx, id).map((c) => c.name).join(' ');
        chainText.set(id, t);
      }
      return t;
    };
    for (const p of list) {
      const s = score(p, words, textFor(p.category));
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

/**
 * Related products: same category first, then the rest of the parent's
 * subtree (siblings), then the rest of the top-level branch.
 */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const catalog = await loadCatalog();
  const idx = categoryIndex(catalog);
  const chain = pathOf(idx, product.category).map((c) => c.id).reverse(); // self → root
  const out: Product[] = [];
  const taken = new Set([product.id]);
  const tiers = chain.length ? chain : [product.category];
  for (const id of tiers) {
    if (out.length >= limit) break;
    const ids = new Set([id, ...descendantsOf(idx, id)]);
    const pool = sortProducts(
      catalog.products.filter((p) => ids.has(p.category) && !taken.has(p.id)),
      'popular'
    );
    for (const p of pool.slice(0, limit - out.length)) {
      out.push(p);
      taken.add(p.id);
    }
  }
  return out;
}

/** Lightweight index for the header's instant search (client side). */
export async function getSearchIndex() {
  const catalog = await loadCatalog();
  const idx = categoryIndex(catalog);
  const names = new Map(idx.flat.map((c) => [c.id, c.name]));
  // Category chain names ("Fruits Local fruits") so "fruits" also finds subcategory products.
  const chainText = new Map(idx.flat.map((c) => [c.id, pathOf(idx, c.id).map((x) => x.name).join(' ')]));
  return {
    products: catalog.products.map((p) => ({
      id: p.id,
      name: p.name,
      unit: p.unit,
      price: p.price,
      image: p.image,
      category: chainText.get(p.category) ?? p.category,
    })),
    categories: idx.flat.map((c) => {
      const parent = idx.parentOf.get(c.id);
      return { id: c.id, name: c.name, ...(parent ? { parent: names.get(parent) ?? parent } : {}) };
    }),
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
