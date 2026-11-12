'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select } from './Select';
import { Skeleton } from './Skeleton';
import { cx } from './overlay';

/* ===========================================================================
 * Pagination + URL state.
 *
 *   const [page, setPage] = useUrlNumber('page', 1);
 *   <Pagination page={page} total={orders.length} pageSize={10}
 *     onPageChange={setPage} itemLabel="orders" scrollTargetId="orders-list" />
 *
 * or the all-in-one hook for client-side lists:
 *
 *   const pager = usePagedList(items, { param: 'page', sizeParam: 'size', defaultSize: 10 });
 *   pager.items.map(…);  <Pagination {...pager.props} itemLabel="reviews" />
 *
 * URL params are read with useSyncExternalStore (server snapshot = defaults,
 * so there is no hydration mismatch and no Suspense requirement) and written
 * with history.replaceState, which Next.js keeps in sync with its router.
 * ========================================================================= */

const URL_EVENT = 'fb:urlchange';

function subscribeUrl(cb: () => void) {
  window.addEventListener('popstate', cb);
  window.addEventListener(URL_EVENT, cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener(URL_EVENT, cb);
  };
}

/** Replace some search params without a navigation (null / '' removes). */
export function setUrlParams(next: Record<string, string | number | null | undefined>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(next)) {
    if (v === null || v === undefined || v === '') url.searchParams.delete(k);
    else url.searchParams.set(k, String(v));
  }
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new Event(URL_EVENT));
}

/** A search param as reactive state. `fallback` is used on the server and when absent. */
export function useUrlParam(name: string, fallback = ''): [string, (value: string | null) => void] {
  const value = useSyncExternalStore(
    subscribeUrl,
    () => new URLSearchParams(window.location.search).get(name) ?? fallback,
    () => fallback
  );
  const set = useCallback((v: string | null) => setUrlParams({ [name]: v === fallback ? null : v }), [name, fallback]);
  return [value, set];
}

export function useUrlNumber(name: string, fallback: number): [number, (value: number) => void] {
  const [raw, setRaw] = useUrlParam(name, String(fallback));
  const n = Math.floor(Number(raw));
  const value = Number.isFinite(n) && n > 0 ? n : fallback;
  const set = useCallback((v: number) => setRaw(String(v)), [setRaw]);
  return [value, set];
}

export interface PagedListOptions {
  /** URL param for the page number (default "page"). */
  param?: string;
  /** URL param for the page size (omit to keep the size out of the URL). */
  sizeParam?: string;
  defaultSize?: number;
  sizeOptions?: number[];
  scrollTargetId?: string;
}

export function usePagedList<T>(all: T[], { param = 'page', sizeParam, defaultSize = 10, sizeOptions = [5, 10, 20, 50], scrollTargetId }: PagedListOptions = {}) {
  const [rawPage, setPage] = useUrlNumber(param, 1);
  const [rawSize] = useUrlNumber(sizeParam ?? `__${param}_size`, defaultSize);
  const pageSize = sizeOptions.includes(rawSize) ? rawSize : defaultSize;
  const pageCount = Math.max(1, Math.ceil(all.length / pageSize));
  const page = Math.min(rawPage, pageCount);
  const start = (page - 1) * pageSize;
  return {
    page,
    pageSize,
    pageCount,
    items: all.slice(start, start + pageSize),
    setPage,
    props: {
      page,
      pageSize,
      total: all.length,
      onPageChange: setPage,
      pageSizeOptions: sizeParam ? sizeOptions : undefined,
      onPageSizeChange: sizeParam
        ? (s: number) => {
            setUrlParams({ [sizeParam]: s === defaultSize ? null : s, [param]: null });
          }
        : undefined,
      scrollTargetId,
    } satisfies Omit<PaginationProps, 'itemLabel'>,
  };
}

export interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Plural noun for the summary: "Showing 1–10 of 37 orders". */
  itemLabel?: string;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  /** Element scrolled into view after a page change. */
  scrollTargetId?: string;
  /** Hide the whole bar when everything fits on one page (default true). */
  hideWhenSingle?: boolean;
  className?: string;
}

export function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  itemLabel = 'items',
  pageSizeOptions,
  onPageSizeChange,
  scrollTargetId,
  hideWhenSingle = true,
  className,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const minSize = Math.min(pageSize, ...(pageSizeOptions ?? []));
  if (total === 0 || (hideWhenSingle && total <= minSize)) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const go = (p: number) => {
    const next = Math.min(pageCount, Math.max(1, p));
    if (next === page) return;
    onPageChange(next);
    if (scrollTargetId) {
      const el = document.getElementById(scrollTargetId);
      if (el) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
    }
  };

  const btn = 'fb-press grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-semibold tabular-nums transition cursor-pointer disabled:pointer-events-none disabled:opacity-40';

  return (
    <div className={cx('flex flex-col items-center gap-3 sm:flex-row sm:justify-between', className)}>
      <p className="text-sm text-[#3f5649]" aria-live="polite">
        Showing <span className="font-semibold tabular-nums text-[#112a1d]">{from}–{to}</span> of{' '}
        <span className="font-semibold tabular-nums text-[#112a1d]">{total}</span> {itemLabel}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {pageSizeOptions && onPageSizeChange && (
          <div className="flex items-center gap-2 text-sm text-[#3f5649]">
            <span id={`${scrollTargetId ?? itemLabel}-size-label`}>Per page</span>
            <Select
              size="sm"
              searchable={false}
              aria-labelledby={`${scrollTargetId ?? itemLabel}-size-label`}
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
              options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
              className="w-20"
              triggerClassName="flex h-10 w-full items-center gap-1.5 rounded-full border border-[#cfe0d6] bg-white px-3.5 text-left text-sm font-semibold tabular-nums text-[#234835] hover:border-[#1a663b] cursor-pointer"
            />
          </div>
        )}
        {pageCount > 1 && (
          <nav aria-label={`${itemLabel} pages`} className="flex items-center gap-1">
            <button type="button" onClick={() => go(page - 1)} disabled={page === 1} aria-label="Previous page" className={cx(btn, 'border border-[#cfe0d6] bg-white px-0 text-[#234835] hover:border-[#1a663b]')}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            {pageList(page, pageCount).map((p, i) =>
              p === '…' ? (
                <span key={`gap-${i}`} className="grid h-10 w-6 place-items-center text-sm text-[#3f5649]" aria-hidden>
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => go(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                  className={cx(btn, p === page ? 'bg-[#0f2c1d] text-white shadow-md' : 'text-[#234835] hover:bg-[#eef6f1]')}
                >
                  {p}
                </button>
              )
            )}
            <button type="button" onClick={() => go(page + 1)} disabled={page === pageCount} aria-label="Next page" className={cx(btn, 'border border-[#cfe0d6] bg-white px-0 text-[#234835] hover:border-[#1a663b]')}>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

/** Numbered pages with ellipses: 1 … 4 5 6 … 12 */
export function pageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  if (current <= 3) [2, 3, 4].forEach((p) => set.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => set.add(p));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
}

export function PaginationSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <Skeleton className="h-4 w-44" rounded="full" />
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-10" rounded="full" />)}
      </div>
    </div>
  );
}
