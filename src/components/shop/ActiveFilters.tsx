'use client';

import { AnimatePresence, motion } from 'motion/react';
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

const chipMotion = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.12 } },
  transition: { type: 'spring', stiffness: 520, damping: 32 },
} as const;

/** Removable chips for every active filter; they animate in and out as the URL changes. */
export function ActiveFilters({ basePath, filters, categoryNames, lockedCategory, keepQuery }: Props) {
  const chips: { key: string; label: string; href: string }[] = [];
  if (filters.q && !keepQuery) chips.push({ key: 'q', label: `“${filters.q}”`, href: listingHref(basePath, filters, { q: undefined }) });
  if (filters.category && !lockedCategory)
    chips.push({ key: 'category', label: categoryNames[filters.category] ?? filters.category, href: listingHref(basePath, filters, { category: undefined }) });
  if (filters.min !== undefined || filters.max !== undefined) {
    const label =
      filters.min !== undefined && filters.max !== undefined
        ? `${formatBDT(filters.min)} – ${formatBDT(filters.max)}`
        : filters.min !== undefined
          ? `From ${formatBDT(filters.min)}`
          : `Up to ${formatBDT(filters.max!)}`;
    chips.push({ key: 'price', label, href: listingHref(basePath, filters, { min: undefined, max: undefined }) });
  }
  if (filters.inStock) chips.push({ key: 'stock', label: 'In stock', href: listingHref(basePath, filters, { inStock: false }) });
  if (filters.onSale) chips.push({ key: 'sale', label: 'On sale', href: listingHref(basePath, filters, { onSale: false }) });

  const clearAll = listingHref(basePath, {
    sort: filters.sort,
    perPage: filters.perPage,
    page: 1,
    inStock: false,
    onSale: false,
    q: keepQuery ? filters.q : undefined,
  });

  return (
    <motion.div layout="position" className="flex min-h-0 flex-wrap items-center gap-2" aria-label="Active filters" role="group">
      <AnimatePresence initial={false} mode="popLayout">
        {chips.map((c) => (
          <motion.span key={c.key} layout {...chipMotion} className="inline-flex">
            <FilterLink
              href={c.href}
              aria-label={`Remove filter: ${c.label}`}
              className="group fb-press inline-flex h-8 items-center gap-1.5 rounded-full border border-[#bce3cb] bg-[#e8f5ee] pl-3 pr-1.5 text-[13px] font-semibold tabular-nums text-[#14522f] transition hover:border-[#1a663b]"
            >
              {c.label}
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[#1a663b] transition-colors group-hover:bg-[#1a663b] group-hover:text-white">
                <X className="h-3 w-3" aria-hidden />
              </span>
            </FilterLink>
          </motion.span>
        ))}
        {chips.length > 1 && (
          <motion.span key="__clear" layout {...chipMotion} className="inline-flex">
            <FilterLink href={clearAll} className="inline-flex h-8 items-center rounded-full px-2.5 text-[13px] font-bold text-[#1a663b] underline-offset-2 hover:underline">
              Clear all
            </FilterLink>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
