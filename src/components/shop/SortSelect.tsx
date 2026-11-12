'use client';

import { ArrowUpDown } from 'lucide-react';
import { useListing } from './ListingProvider';
import { SORT_OPTIONS, listingHref, toSearchParams, type ListingFilters, type ListingSort } from './params';

/** Sort dropdown; a GET form with a no-JS submit fallback. */
export function SortSelect({ basePath, filters }: { basePath: string; filters: ListingFilters }) {
  const { navigate } = useListing();
  const hidden = [...toSearchParams({ ...filters, sort: undefined, page: undefined }).entries()];

  return (
    <form action={basePath} method="get" className="flex items-center gap-2" onSubmit={(e) => e.preventDefault()}>
      {hidden.map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label htmlFor="sort" className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#5a7165]">
        <ArrowUpDown className="h-3.5 w-3.5" /> Sort by
      </label>
      <select
        id="sort"
        name="sort"
        defaultValue={filters.sort}
        key={filters.sort}
        aria-label="Sort products"
        onChange={(e) => navigate(listingHref(basePath, filters, { sort: e.target.value as ListingSort }))}
        className="h-10 rounded-full border border-[#cfe3d6] bg-white pl-4 pr-9 text-sm font-semibold text-[#112a1d] shadow-sm outline-none focus:border-[#1a663b] focus:ring-2 focus:ring-[#1a663b]/20 cursor-pointer"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="h-10 rounded-full bg-[#0f2c1d] px-4 text-xs font-semibold text-white">
          Sort
        </button>
      </noscript>
    </form>
  );
}
