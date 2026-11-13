'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SlidersHorizontal } from 'lucide-react';
import { BottomSheet } from '@/components/store-ui/BottomSheet';
import { FilterPanel, type FilterCategory } from './FilterPanel';
import { FilterLink, useListing } from './ListingProvider';
import type { ListingFilters } from './params';

interface Props {
  basePath: string;
  filters: ListingFilters;
  priceRange: { min: number; max: number };
  categories?: FilterCategory[];
  categoryLinks?: { categories: FilterCategory[]; current: string };
  activeCount: number;
  total: number;
  clearHref: string;
}

/**
 * Small screens: a "Filters" button that opens the same filter form in a
 * bottom sheet. Changes apply live behind the sheet; the sticky footer shows
 * the up-to-date result count.
 */
export function MobileFilters({ activeCount, total, clearHref, ...panel }: Props) {
  const [open, setOpen] = useState(false);
  const { pending } = useListing();
  const label = `${total} ${total === 1 ? 'product' : 'products'}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fb-press inline-flex h-10 items-center gap-2 rounded-full border border-[#cfe0d6] bg-white px-4 text-sm font-semibold text-[#112a1d] shadow-sm hover:border-[#1a663b] cursor-pointer lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4 text-[#1a663b]" aria-hidden />
        Filters
        <AnimatePresence initial={false}>
          {activeCount > 0 && (
            <motion.span
              key={activeCount}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="grid h-5 min-w-5 place-items-center rounded-full bg-[#1a663b] px-1 text-xs font-bold tabular-nums text-white"
            >
              {activeCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="Filter products"
        className="lg:hidden"
        headerAction={
          activeCount > 0 ? (
            <FilterLink href={clearHref} className="rounded-full px-3 py-2 text-sm font-bold text-[#1a663b] hover:bg-[#eef6f1]">
              Clear all
            </FilterLink>
          ) : null
        }
        footer={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="fb-press relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-emerald-gradient text-[15px] font-bold text-white shadow-glow cursor-pointer"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={pending ? 'pending' : label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="tabular-nums"
              >
                {pending ? 'Updating results…' : total === 0 ? 'No matches — adjust filters' : `Show ${label}`}
              </motion.span>
            </AnimatePresence>
          </button>
        }
      >
        <FilterPanel {...panel} idPrefix="m" />
      </BottomSheet>
    </>
  );
}
