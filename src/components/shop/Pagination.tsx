'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { cx } from '@/components/ui/overlay';
import { pageList } from '@/components/ui/Pagination';
import { FilterLink, useListing } from './ListingProvider';
import { PER_PAGE_OPTIONS, listingHref, toSearchParams, type ListingFilters } from './params';

interface Props {
  basePath: string;
  filters: ListingFilters;
  page: number;
  pageCount: number;
  total: number;
  /** Element scrolled into view after a page change. */
  scrollTargetId?: string;
}

/**
 * Listing pagination: "Showing 13–24 of 58", prev / numbered pages with
 * ellipses / next, and a page-size menu. Every page is a real link (crawlable,
 * works without JS); with JS it swaps results in place and scrolls to the top
 * of the list.
 */
export function Pagination({ basePath, filters, page, pageCount, total, scrollTargetId = 'results-top' }: Props) {
  const { navigate } = useListing();
  if (total === 0) return null;

  const per = filters.perPage;
  const from = (page - 1) * per + 1;
  const to = Math.min(total, page * per);
  const href = (p: number) => listingHref(basePath, filters, { page: p });
  const toTop = () => {
    const el = document.getElementById(scrollTargetId);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const arrow =
    'fb-press inline-flex h-10 items-center gap-1 rounded-full border border-[#cfe0d6] bg-white px-3 text-sm font-semibold text-[#112a1d] transition hover:border-[#1a663b] hover:text-[#14522f]';
  const disabledArrow = 'inline-flex h-10 items-center gap-1 rounded-full border border-[#e3eee7] bg-white/60 px-3 text-sm font-semibold text-[#9bb0a3]';
  const hidden = [...toSearchParams({ ...filters, perPage: undefined, page: undefined }).entries()];

  return (
    <div className="mt-10 flex flex-col items-center gap-4 border-t border-[#e3eee7] pt-6 md:flex-row md:justify-between">
      <p className="order-2 text-sm text-[#3f5649] md:order-1">
        Showing{' '}
        <strong className="font-semibold tabular-nums text-[#112a1d]">
          {from}–{to}
        </strong>{' '}
        of <strong className="font-semibold tabular-nums text-[#112a1d]">{total}</strong> {total === 1 ? 'product' : 'products'}
      </p>

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="order-1 flex items-center gap-1 md:order-2">
          {page > 1 ? (
            <FilterLink href={href(page - 1)} rel="prev" onClick={toTop} className={arrow} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Previous</span>
            </FilterLink>
          ) : (
            <span className={disabledArrow} aria-disabled="true">
              <ChevronLeft className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Previous</span>
            </span>
          )}
          <ol className="flex items-center gap-0.5 sm:gap-1">
            {pageList(page, pageCount).map((p, i) =>
              p === '…' ? (
                <li key={`gap${i}`} aria-hidden className="grid h-10 w-6 place-items-center text-sm text-[#3f5649]">
                  …
                </li>
              ) : (
                <li key={p}>
                  <FilterLink
                    href={href(p)}
                    onClick={toTop}
                    aria-current={p === page ? 'page' : undefined}
                    aria-label={`Page ${p}`}
                    className={cx(
                      'fb-press grid h-10 min-w-10 place-items-center rounded-full px-2 text-sm font-semibold tabular-nums transition-colors',
                      p === page ? 'bg-[#0f2c1d] text-white shadow-md' : 'text-[#234835] hover:bg-[#eef6f1]'
                    )}
                  >
                    {p}
                  </FilterLink>
                </li>
              )
            )}
          </ol>
          {page < pageCount ? (
            <FilterLink href={href(page + 1)} rel="next" onClick={toTop} className={arrow} aria-label="Next page">
              <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" aria-hidden />
            </FilterLink>
          ) : (
            <span className={disabledArrow} aria-disabled="true">
              <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" aria-hidden />
            </span>
          )}
        </nav>
      )}

      <form action={basePath} method="get" className="order-3 flex items-center gap-2 text-sm text-[#3f5649]" onSubmit={(e) => e.preventDefault()}>
        {hidden.map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <span id="per-page-label">Per page</span>
        <Select
          key={per}
          id="per-page-trigger"
          name="per"
          size="sm"
          searchable={false}
          aria-labelledby="per-page-label per-page-trigger"
          defaultValue={String(per)}
          onValueChange={(v) => {
            navigate(listingHref(basePath, filters, { perPage: Number(v) }));
            toTop();
          }}
          options={PER_PAGE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
          className="w-[4.75rem]"
          triggerClassName="flex h-10 w-full items-center gap-1.5 rounded-full border border-[#cfe0d6] bg-white px-3.5 text-left text-sm font-semibold tabular-nums text-[#234835] transition hover:border-[#1a663b] aria-expanded:border-[#1a663b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1a663b]/15 cursor-pointer"
        />
        <noscript>
          <button type="submit" className="h-10 rounded-full bg-[#0f2c1d] px-3 text-[13px] font-semibold text-white">
            Go
          </button>
        </noscript>
      </form>
    </div>
  );
}
