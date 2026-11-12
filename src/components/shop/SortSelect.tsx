'use client';

import { ArrowUpDown } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { useListing } from './ListingProvider';
import { SORT_OPTIONS, listingHref, toSearchParams, type ListingFilters, type ListingSort } from './params';

const triggerClass =
  'flex h-10 w-full items-center gap-2 rounded-full border border-[#cfe0d6] bg-white pl-3.5 pr-3 text-left text-sm font-semibold text-[#112a1d] shadow-sm transition hover:border-[#1a663b] aria-expanded:border-[#1a663b] aria-expanded:ring-4 aria-expanded:ring-[#1a663b]/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1a663b]/15 cursor-pointer';

/**
 * Sort menu (brand Select). Inside a GET form, so without JavaScript the
 * hidden `sort` input + noscript button still work.
 */
export function SortSelect({ basePath, filters }: { basePath: string; filters: ListingFilters }) {
  const { navigate } = useListing();
  const hidden = [...toSearchParams({ ...filters, sort: undefined, page: undefined }).entries()];

  return (
    <form action={basePath} method="get" className="flex items-center gap-2" onSubmit={(e) => e.preventDefault()}>
      {hidden.map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <span id="sort-label" className="hidden items-center gap-1.5 text-[13px] font-semibold text-[#3f5649] sm:inline-flex">
        <ArrowUpDown className="h-4 w-4" aria-hidden /> Sort by
      </span>
      <Select
        key={filters.sort}
        name="sort"
        id="sort-trigger"
        aria-labelledby="sort-label sort-trigger"
        searchable={false}
        size="sm"
        defaultValue={filters.sort}
        onValueChange={(v) => navigate(listingHref(basePath, filters, { sort: v as ListingSort }))}
        options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        className="w-[11.5rem]"
        triggerClassName={triggerClass}
      />
      <noscript>
        <button type="submit" className="h-10 rounded-full bg-[#0f2c1d] px-4 text-[13px] font-semibold text-white">
          Sort
        </button>
      </noscript>
    </form>
  );
}
