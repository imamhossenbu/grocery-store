'use client';

import { useMemo, useState } from 'react';
import { PackageSearch } from 'lucide-react';
import type { MyOrder } from '@/lib/data/account';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/Field';
import { Pagination, setUrlParams, useUrlNumber, useUrlParam } from '@/components/ui/Pagination';
import { OrderTile } from './OrderTile';

const FILTERS = ['all', 'active', 'delivered', 'cancelled'] as const;
type Filter = (typeof FILTERS)[number];
const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'total-desc', label: 'Highest total' },
  { value: 'total-asc', label: 'Lowest total' },
];
const SIZES = [5, 10, 20, 50];

function matchesFilter({ order }: MyOrder, f: Filter) {
  if (f === 'all') return true;
  if (f === 'delivered') return order.status === 'Delivered';
  if (f === 'cancelled') return order.status === 'Cancelled';
  return order.status !== 'Delivered' && order.status !== 'Cancelled';
}

const SORTERS: Record<string, (a: MyOrder, b: MyOrder) => number> = {
  newest: (a, b) => b.order.createdAt.localeCompare(a.order.createdAt),
  oldest: (a, b) => a.order.createdAt.localeCompare(b.order.createdAt),
  'total-desc': (a, b) => b.order.total - a.order.total,
  'total-asc': (a, b) => a.order.total - b.order.total,
};

/**
 * Filter / search / sort / paginate the user's orders (already scoped to the
 * user on the server). Every control lives in the URL (?status=&q=&sort=&page=&size=).
 */
export function OrdersExplorer({ orders }: { orders: MyOrder[] }) {
  const [statusParam] = useUrlParam('status', 'all');
  const [urlQ] = useUrlParam('q', '');
  const [sortParam] = useUrlParam('sort', 'newest');
  const [page, setPage] = useUrlNumber('page', 1);
  const [sizeParam] = useUrlNumber('size', 10);
  const [draft, setDraft] = useState<string | null>(null);

  const filter: Filter = (FILTERS as readonly string[]).includes(statusParam) ? (statusParam as Filter) : 'all';
  const sort = SORTERS[sortParam] ? sortParam : 'newest';
  const pageSize = SIZES.includes(sizeParam) ? sizeParam : 10;
  const query = draft ?? urlQ;
  const q = urlQ.trim().toLowerCase();

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, active: 0, delivered: 0, cancelled: 0 };
    for (const o of orders) for (const f of FILTERS) if (matchesFilter(o, f)) c[f]++;
    return c;
  }, [orders]);

  const results = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            matchesFilter(o, filter) &&
            (!q || o.order.id.toLowerCase().includes(q) || o.order.items.some((i) => i.name.toLowerCase().includes(q)))
        )
        .sort(SORTERS[sort]),
    [orders, filter, q, sort]
  );

  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const current = Math.min(page, pageCount);
  const shown = results.slice((current - 1) * pageSize, current * pageSize);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Tabs
          idBase="orders"
          aria-label="Filter orders by status"
          value={filter}
          onValueChange={(v) => setUrlParams({ status: v === 'all' ? null : v, page: null })}
          items={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'active', label: 'Active', count: counts.active },
            { value: 'delivered', label: 'Delivered', count: counts.delivered },
            { value: 'cancelled', label: 'Cancelled', count: counts.cancelled },
          ]}
          className="self-start"
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput
            value={query}
            onValueChange={setDraft}
            onDebouncedChange={(v) => {
              if (v.trim() !== urlQ.trim()) setUrlParams({ q: v.trim() || null, page: null });
            }}
            placeholder="Order ID or product"
            aria-label="Search orders by order ID or product name"
            className="min-w-0 sm:flex-1 xl:w-72 xl:flex-none"
          />
          <Select
            aria-label="Sort orders"
            size="sm"
            value={sort}
            onValueChange={(v) => setUrlParams({ sort: v === 'newest' ? null : v })}
            options={SORTS}
            searchable={false}
            className="w-full shrink-0 sm:w-44"
            triggerClassName="flex h-10 w-full items-center gap-2 rounded-full border border-[#cfe0d6] bg-white px-4 text-left text-sm font-semibold text-[#234835] shadow-sm transition hover:border-[#1a663b] cursor-pointer"
          />
        </div>
      </div>

      <TabPanel idBase="orders" value={filter} className="scroll-mt-44">
        {results.length === 0 ? (
          <div className="fb-crossfade flex flex-col items-center rounded-3xl border-2 border-dashed border-[#cfe3d6] bg-white/70 px-6 py-14 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e8f5ee] text-[#1a663b]">
              <PackageSearch className="h-7 w-7" aria-hidden />
            </span>
            <p className="mt-4 font-display text-xl font-bold text-[#112a1d]">Nothing here</p>
            <p className="mt-1 max-w-sm text-sm leading-relaxed text-[#3f5649]">
              {q ? `No ${filter === 'all' ? '' : `${filter} `}orders contain “${urlQ.trim()}”.` : `You have no ${filter} orders.`}
            </p>
            {(q || filter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setDraft(null);
                  setUrlParams({ q: null, status: null, page: null });
                }}
                className="fb-press mt-5 inline-flex h-10 items-center rounded-full border border-[#cfe0d6] bg-white px-5 text-sm font-bold text-[#14522f] hover:border-[#1a663b] cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-3" key={`${filter}|${q}|${sort}|${current}|${pageSize}`}>
            {shown.map((entry, i) => (
              <li key={entry.order.id}>
                <OrderTile entry={entry} index={i} highlight={q} />
              </li>
            ))}
          </ul>
        )}
      </TabPanel>

      <Pagination
        page={current}
        total={results.length}
        pageSize={pageSize}
        onPageChange={setPage}
        pageSizeOptions={SIZES}
        onPageSizeChange={(s) => setUrlParams({ size: s === 10 ? null : s, page: null })}
        itemLabel="orders"
        scrollTargetId="orders-panel"
        className="border-t border-[#e6f0e9] pt-5"
      />
    </div>
  );
}
