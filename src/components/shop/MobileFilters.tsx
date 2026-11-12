'use client';

import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { FilterPanel, type FilterCategory } from './FilterPanel';
import { useListing } from './ListingProvider';
import type { ListingFilters } from './params';

interface Props {
  basePath: string;
  filters: ListingFilters;
  priceRange: { min: number; max: number };
  categories?: FilterCategory[];
  categoryLinks?: { categories: FilterCategory[]; current: string };
  activeCount: number;
  total: number;
}

/** Bottom sheet with the same filter form, for small screens. */
export function MobileFilters({ activeCount, total, ...panel }: Props) {
  const [open, setOpen] = useState(false);
  const { pending } = useListing();
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-[#cfe3d6] bg-white px-4 text-sm font-semibold text-[#112a1d] shadow-sm hover:border-[#1a663b] cursor-pointer lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4 text-[#1a663b]" />
        Filters
        {activeCount > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#1a663b] px-1 text-[11px] font-bold text-white">{activeCount}</span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-filters-title">
          <div className="absolute inset-0 bg-[#071a10]/60 backdrop-blur-sm animate-fadeIn" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[2rem] bg-white shadow-2xl animate-slideIn">
            <div className="flex items-center justify-between border-b border-[#e6f0e9] px-5 py-4">
              <h2 id="mobile-filters-title" className="font-display text-xl font-bold text-[#112a1d]">Filter products</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="grid h-10 w-10 place-items-center rounded-full text-[#5a7165] hover:bg-[#f0f7f2] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <FilterPanel {...panel} idPrefix="m" />
            </div>
            <div className="border-t border-[#e6f0e9] p-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-12 w-full rounded-full bg-emerald-gradient text-sm font-bold text-white shadow-glow cursor-pointer"
              >
                {pending ? 'Updating…' : `Show ${total} ${total === 1 ? 'product' : 'products'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
