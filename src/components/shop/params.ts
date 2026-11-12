/**
 * URL <-> filter state for the product listings (/shop, /category/[slug],
 * /search). Shared by server and client components, so no server imports.
 *
 * Query keys: q, category, min, max, stock=1, sale=1, sort, page, per
 */

/** Page sizes offered on listings; the first one is the default. */
export const PER_PAGE_OPTIONS = [12, 24, 48] as const;
export const DEFAULT_PER_PAGE = PER_PAGE_OPTIONS[0];

export const SORT_OPTIONS = [
  { value: 'popular', label: 'Most popular' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name: A to Z' },
] as const;

export type ListingSort = (typeof SORT_OPTIONS)[number]['value'];

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface ListingFilters {
  q?: string;
  category?: string;
  min?: number;
  max?: number;
  inStock: boolean;
  onSale: boolean;
  sort: ListingSort;
  page: number;
  perPage: number;
}

function first(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  const t = s?.trim();
  return t ? t : undefined;
}

function money(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((o) => o.value));

export function parseFilters(sp: RawSearchParams): ListingFilters {
  const sort = first(sp.sort);
  const page = Number(first(sp.page) ?? 1);
  let min = money(first(sp.min));
  let max = money(first(sp.max));
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];
  const q = first(sp.q)?.slice(0, 100);
  const category = first(sp.category)?.slice(0, 60);
  const per = Number(first(sp.per));
  return {
    q,
    category,
    min,
    max,
    inStock: first(sp.stock) === '1',
    onSale: first(sp.sale) === '1',
    sort: sort && SORT_VALUES.has(sort) ? (sort as ListingSort) : 'popular',
    page: Number.isInteger(page) && page > 0 ? Math.min(page, 1000) : 1,
    perPage: (PER_PAGE_OPTIONS as readonly number[]).includes(per) ? per : DEFAULT_PER_PAGE,
  };
}

/** Serialise filters to a query string (defaults omitted, keys in a stable order). */
export function toSearchParams(f: Partial<ListingFilters>): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.category) p.set('category', f.category);
  if (f.min !== undefined) p.set('min', String(f.min));
  if (f.max !== undefined) p.set('max', String(f.max));
  if (f.inStock) p.set('stock', '1');
  if (f.onSale) p.set('sale', '1');
  if (f.sort && f.sort !== 'popular') p.set('sort', f.sort);
  if (f.perPage && f.perPage !== DEFAULT_PER_PAGE) p.set('per', String(f.perPage));
  if (f.page && f.page > 1) p.set('page', String(f.page));
  return p;
}

/**
 * Href for `basePath` with `filters` + `changes`. Any change other than a
 * page change resets pagination to page 1.
 */
export function listingHref(basePath: string, filters: ListingFilters, changes: Partial<ListingFilters> = {}): string {
  const next: Partial<ListingFilters> = { ...filters, ...changes };
  if (!('page' in changes)) next.page = 1;
  const qs = toSearchParams(next).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Number of user-chosen filters (not counting query, sort or page). */
export function activeFilterCount(f: ListingFilters, lockedCategory?: string): number {
  return (
    (f.category && !lockedCategory ? 1 : 0) +
    (f.min !== undefined || f.max !== undefined ? 1 : 0) +
    (f.inStock ? 1 : 0) +
    (f.onSale ? 1 : 0)
  );
}

/** Price shortcuts that overlap the catalog's actual price range. */
export function pricePresets(range: { min: number; max: number }): { label: string; min?: number; max?: number }[] {
  const all = [
    { label: 'Under ৳100', max: 100 },
    { label: '৳100 – ৳300', min: 100, max: 300 },
    { label: '৳300 – ৳600', min: 300, max: 600 },
    { label: '৳600 – ৳1,000', min: 600, max: 1000 },
    { label: 'Over ৳1,000', min: 1000 },
  ];
  return all.filter((b) => (b.min ?? 0) <= range.max && (b.max ?? Infinity) >= range.min);
}
