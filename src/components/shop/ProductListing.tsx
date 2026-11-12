import { PackageSearch } from 'lucide-react';
import { getCategories, getCategoryTree, queryProducts } from '@/lib/data/catalog';
import type { CategoryNode } from '@/types/store';
import { ProductGrid } from '@/components/product/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { PRODUCTS_PER_PAGE } from '@/lib/constants';
import { ActiveFilters } from './ActiveFilters';
import { FilterPanel, type FilterCategory } from './FilterPanel';
import { ListingProvider, PendingArea } from './ListingProvider';
import { MobileFilters } from './MobileFilters';
import { Pagination } from './Pagination';
import { SortSelect } from './SortSelect';
import { activeFilterCount, listingHref, type ListingFilters } from './params';

interface Props {
  basePath: string;
  filters: ListingFilters;
  /** Category page: the category comes from the path and can't be removed. */
  lockedCategory?: string;
  /** Search page: the query is shown in the search box, not as a chip. */
  searchMode?: boolean;
  /** Rendered instead of the default empty state when nothing matches and no filters are set. */
  emptyFallback?: React.ReactNode;
}

/** Shared listing for /shop, /category/[slug] and /search (URL-driven filters). */
export async function ProductListing({ basePath, filters: raw, lockedCategory, searchMode, emptyFallback }: Props) {
  const filters: ListingFilters = lockedCategory ? { ...raw, category: undefined } : raw;
  const [result, categories, tree] = await Promise.all([
    queryProducts({
      q: filters.q,
      category: lockedCategory ?? filters.category,
      sort: filters.sort,
      minPrice: filters.min,
      maxPrice: filters.max,
      inStock: filters.inStock,
      onSale: filters.onSale,
      page: filters.page,
      perPage: PRODUCTS_PER_PAGE,
    }),
    getCategories(),
    getCategoryTree(),
  ]);

  const { items, total, page, pageCount, priceRange } = result;
  // Chip labels show the full chain: "Fruits › Local fruits".
  const nameOf = new Map(categories.map((c) => [c.id, c]));
  const categoryNames = Object.fromEntries(
    categories.map((c) => {
      const chain: string[] = [];
      for (let cur: typeof c | undefined = c; cur && chain.length < 4; cur = cur.parentId ? nameOf.get(cur.parentId) : undefined) {
        chain.unshift(cur.name);
      }
      return [c.id, chain.join(' › ')];
    })
  );
  const filterCats = tree.map(toFilterCategory);
  const panel = {
    basePath,
    filters,
    priceRange,
    ...(lockedCategory
      ? { categoryLinks: { categories: filterCats, current: lockedCategory } }
      : { categories: filterCats }),
  };
  const activeCount = activeFilterCount(filters, lockedCategory);
  const from = total ? (page - 1) * PRODUCTS_PER_PAGE + 1 : 0;
  const to = Math.min(page * PRODUCTS_PER_PAGE, total);

  const clearHref = listingHref(basePath, { sort: filters.sort, page: 1, inStock: false, onSale: false, q: searchMode ? filters.q : undefined });

  return (
    <ListingProvider>
      <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="fb-scroll sticky top-44 max-h-[calc(100vh-12rem)] overflow-y-auto overscroll-contain rounded-2xl border border-[#dfece3] bg-white p-4 shadow-soft [scrollbar-gutter:stable]">
            <FilterPanel {...panel} idPrefix="d" />
          </div>
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p id="results-heading" className="text-sm text-[#5a7165]" aria-live="polite">
              {total > 0 ? (
                <>
                  Showing <strong className="text-[#112a1d]">{from}–{to}</strong> of{' '}
                  <strong className="text-[#112a1d]">{total}</strong> {total === 1 ? 'product' : 'products'}
                </>
              ) : (
                'No products found'
              )}
            </p>
            <div className="flex items-center gap-2">
              <MobileFilters {...panel} activeCount={activeCount} total={total} />
              <SortSelect basePath={basePath} filters={filters} />
            </div>
          </div>

          <div className="mt-4">
            <ActiveFilters basePath={basePath} filters={filters} categoryNames={categoryNames} lockedCategory={lockedCategory} keepQuery={searchMode} />
          </div>

          <div className="mt-6">
            <PendingArea>
              {items.length > 0 ? (
                <ProductGrid products={items} priorityCount={4} />
              ) : activeCount === 0 && emptyFallback ? (
                emptyFallback
              ) : (
                <EmptyState
                  icon={<PackageSearch className="h-8 w-8" />}
                  title="No products match these filters"
                  description="Try widening the price range or removing a filter — fresh stock arrives every morning."
                  actionLabel={activeCount > 0 ? 'Clear all filters' : 'Browse all products'}
                  actionHref={activeCount > 0 ? clearHref : '/shop'}
                />
              )}
            </PendingArea>
          </div>

          <Pagination basePath={basePath} filters={filters} page={page} pageCount={pageCount} />
        </section>
      </div>
    </ListingProvider>
  );
}

function toFilterCategory(n: CategoryNode): FilterCategory {
  return {
    id: n.id,
    name: n.name,
    productCount: n.productCount,
    ...(n.children.length ? { children: n.children.map(toFilterCategory) } : {}),
  };
}
