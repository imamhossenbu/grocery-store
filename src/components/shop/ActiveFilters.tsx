import { X } from 'lucide-react';
import { formatBDT } from '@/lib/format';
import { FilterLink } from './ListingProvider';
import { listingHref, type ListingFilters } from './params';

interface Props {
  basePath: string;
  filters: ListingFilters;
  categoryNames: Record<string, string>;
  /** On a category page the category is part of the path, not a removable filter. */
  lockedCategory?: string;
  /** Keep the search query when clearing (search page). */
  keepQuery?: boolean;
}

export function ActiveFilters({ basePath, filters, categoryNames, lockedCategory, keepQuery }: Props) {
  const chips: { label: string; href: string }[] = [];
  if (filters.q && !keepQuery) chips.push({ label: `“${filters.q}”`, href: listingHref(basePath, filters, { q: undefined }) });
  if (filters.category && !lockedCategory)
    chips.push({ label: categoryNames[filters.category] ?? filters.category, href: listingHref(basePath, filters, { category: undefined }) });
  if (filters.min !== undefined || filters.max !== undefined) {
    const label =
      filters.min !== undefined && filters.max !== undefined
        ? `${formatBDT(filters.min)} – ${formatBDT(filters.max)}`
        : filters.min !== undefined
          ? `From ${formatBDT(filters.min)}`
          : `Up to ${formatBDT(filters.max!)}`;
    chips.push({ label, href: listingHref(basePath, filters, { min: undefined, max: undefined }) });
  }
  if (filters.inStock) chips.push({ label: 'In stock', href: listingHref(basePath, filters, { inStock: false }) });
  if (filters.onSale) chips.push({ label: 'On sale', href: listingHref(basePath, filters, { onSale: false }) });

  if (!chips.length) return null;

  const clearAll = listingHref(basePath, {
    sort: filters.sort,
    page: 1,
    inStock: false,
    onSale: false,
    q: keepQuery ? filters.q : undefined,
  });

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((c) => (
        <FilterLink
          key={c.label}
          href={c.href}
          aria-label={`Remove filter ${c.label}`}
          className="group inline-flex items-center gap-1.5 rounded-full border border-[#bce3cb] bg-[#e8f5ee] py-1.5 pl-3 pr-2 text-xs font-bold text-[#14522f] transition hover:border-[#1a663b]"
        >
          {c.label}
          <span className="grid h-4 w-4 place-items-center rounded-full bg-white text-[#1a663b] group-hover:bg-[#1a663b] group-hover:text-white">
            <X className="h-3 w-3" />
          </span>
        </FilterLink>
      ))}
      {chips.length > 1 && (
        <FilterLink href={clearAll} className="px-2 text-xs font-bold text-[#1a663b] underline-offset-2 hover:underline">
          Clear all
        </FilterLink>
      )}
    </div>
  );
}
