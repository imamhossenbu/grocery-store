'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Check, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { formatBDT } from '@/lib/format';
import { FilterLink, useListing } from './ListingProvider';
import { listingHref, parseFilters, pricePresets, type ListingFilters } from './params';

export interface FilterCategory {
  id: string;
  name: string;
  /** Products in this category and all its subcategories. */
  productCount: number;
  children?: FilterCategory[];
}

interface Props {
  basePath: string;
  filters: ListingFilters;
  priceRange: { min: number; max: number };
  /** Category radio tree (shop/search). Omit on a category page. */
  categories?: FilterCategory[];
  /** Category page: a tree of links to the category pages instead of radios. */
  categoryLinks?: { categories: FilterCategory[]; current: string };
  /** Called after any change is applied (closes the mobile sheet). */
  onApplied?: () => void;
  idPrefix: string;
}

const heading = 'text-[15px] font-bold text-[#112a1d]';

/**
 * Filters as a plain GET form: works without JavaScript (submit button), and
 * with JavaScript every change applies instantly via router.replace.
 */
export function FilterPanel({ basePath, filters, priceRange, categories, categoryLinks, onApplied, idPrefix }: Props) {
  const { navigate } = useListing();
  const formRef = useRef<HTMLFormElement>(null);

  const apply = () => {
    const form = formRef.current;
    if (!form) return;
    const data = Object.fromEntries(
      [...new FormData(form).entries()].map(([k, v]) => [k, typeof v === 'string' ? v : ''])
    );
    navigate(listingHref(basePath, parseFilters(data)));
    onApplied?.();
  };

  const presets = pricePresets(priceRange);
  const hasPrice = filters.min !== undefined || filters.max !== undefined;

  return (
    <form
      ref={formRef}
      action={basePath}
      method="get"
      // Remount when the URL changes so uncontrolled inputs reflect it (e.g. after removing a chip).
      key={listingHref(basePath, filters)}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="space-y-7"
      aria-label="Product filters"
    >
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      {filters.sort !== 'popular' && <input type="hidden" name="sort" value={filters.sort} />}

      {categories && (
        <fieldset>
          <legend className={heading}>Category</legend>
          <div className="mt-3 space-y-0.5">
            <CategoryOption
              id=""
              name="All categories"
              count={categories.reduce((n, c) => n + c.productCount, 0)}
              checked={!filters.category}
              onChange={apply}
            />
            <CategoryTree
              nodes={categories}
              active={filters.category}
              idPrefix={`${idPrefix}-cat`}
              render={(c, depth) => (
                <CategoryOption id={c.id} name={c.name} count={c.productCount} depth={depth} checked={filters.category === c.id} onChange={apply} />
              )}
            />
          </div>
        </fieldset>
      )}

      {categoryLinks && (
        <nav aria-label="Categories">
          <h3 className={heading}>Category</h3>
          <div className="mt-3 space-y-0.5">
            <Link href="/shop" className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-[#234835] hover:bg-[#f0f7f2]">
              All products
            </Link>
            <CategoryTree
              nodes={categoryLinks.categories}
              active={categoryLinks.current}
              idPrefix={`${idPrefix}-catl`}
              render={(c, depth) => {
                const on = c.id === categoryLinks.current;
                return (
                  <Link
                    href={`/category/${c.id}`}
                    aria-current={on ? 'page' : undefined}
                    className={`flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl py-2 pr-3 text-sm transition ${
                      on ? 'bg-[#e8f5ee] font-bold text-[#14522f]' : 'text-[#234835] hover:bg-[#f0f7f2]'
                    } pl-3 ${depth === 0 && !on ? 'font-semibold' : ''}`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="shrink-0 rounded-full bg-[#f0f7f2] px-2 py-0.5 text-xs font-semibold tabular-nums text-[#3f5649]">{c.productCount}</span>
                  </Link>
                );
              }}
            />
          </div>
        </nav>
      )}

      <fieldset>
        <legend className={heading}>Price</legend>
        <p className="mt-1 text-[13px] text-[#3f5649]">
          {formatBDT(priceRange.min)} – {formatBDT(priceRange.max)} in this range
        </p>
        {presets.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {presets.map((p) => {
              const on = filters.min === p.min && filters.max === p.max;
              return (
                <FilterLink
                  key={p.label}
                  href={listingHref(basePath, filters, on ? { min: undefined, max: undefined } : { min: p.min, max: p.max })}
                  onClick={() => onApplied?.()}
                  aria-pressed={on}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    on ? 'border-[#1a663b] bg-[#1a663b] text-white' : 'border-[#cfe3d6] bg-white text-[#234835] hover:border-[#1a663b]'
                  }`}
                >
                  {p.label}
                </FilterLink>
              );
            })}
          </div>
        )}
        <div className="mt-3 flex items-end gap-2">
          <label className="flex-1">
            <span className="text-[13px] font-medium text-[#3f5649]">Min (৳)</span>
            <input
              type="number"
              name="min"
              inputMode="numeric"
              min={0}
              placeholder={String(priceRange.min)}
              defaultValue={filters.min}
              className="mt-1 h-10 w-full rounded-xl border border-[#cfe3d6] bg-white px-3 text-sm outline-none focus:border-[#1a663b] focus:ring-2 focus:ring-[#1a663b]/20"
            />
          </label>
          <span className="pb-2.5 text-[#3f5649]">–</span>
          <label className="flex-1">
            <span className="text-[13px] font-medium text-[#3f5649]">Max (৳)</span>
            <input
              type="number"
              name="max"
              inputMode="numeric"
              min={0}
              placeholder={String(priceRange.max)}
              defaultValue={filters.max}
              className="mt-1 h-10 w-full rounded-xl border border-[#cfe3d6] bg-white px-3 text-sm outline-none focus:border-[#1a663b] focus:ring-2 focus:ring-[#1a663b]/20"
            />
          </label>
        </div>
        {hasPrice && (
          <FilterLink
            href={listingHref(basePath, filters, { min: undefined, max: undefined })}
            className="mt-2 inline-block text-xs font-semibold text-[#1a663b] underline-offset-2 hover:underline"
          >
            Reset price
          </FilterLink>
        )}
      </fieldset>

      <fieldset>
        <legend className={heading}>Availability &amp; offers</legend>
        <div className="mt-3 space-y-2">
          {(
            [
              ['stock', 'In stock only', filters.inStock],
              ['sale', 'On sale', filters.onSale],
            ] as const
          ).map(([name, label, on]) => (
            <label
              key={name}
              htmlFor={`${idPrefix}-${name}`}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#234835] hover:bg-[#f0f7f2] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#1a663b]"
            >
              <input id={`${idPrefix}-${name}`} type="checkbox" name={name} value="1" defaultChecked={on} onChange={apply} className="peer sr-only" />
              <span
                aria-hidden
                className="grid h-5 w-5 place-items-center rounded-md border-2 border-[#b9d8c5] bg-white text-transparent peer-checked:border-[#1a663b] peer-checked:bg-[#1a663b] peer-checked:text-white"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0f2c1d] text-sm font-semibold text-white transition hover:bg-[#19442e] cursor-pointer"
      >
        <SlidersHorizontal className="h-4 w-4" /> Apply filters
      </button>
    </form>
  );
}

/** Ids of `active` and its ancestors in `nodes` (empty when not found). */
function branchOf(nodes: FilterCategory[], active: string | undefined): string[] {
  if (!active) return [];
  for (const n of nodes) {
    if (n.id === active) return [n.id];
    const sub = branchOf(n.children ?? [], active);
    if (sub.length) return [n.id, ...sub];
  }
  return [];
}

/**
 * Collapsible category tree. Parents get a disclosure button; the branch that
 * holds the active category starts expanded.
 */
function CategoryTree({
  nodes,
  active,
  idPrefix,
  render,
}: {
  nodes: FilterCategory[];
  active?: string;
  idPrefix: string;
  render: (c: FilterCategory, depth: number) => React.ReactNode;
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(branchOf(nodes, active)));
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const level = (list: FilterCategory[], depth: number): React.ReactNode => (
    <ul className={depth ? 'mt-0.5 space-y-0.5 pl-5' : 'space-y-0.5'}>
      {list.map((c) => {
        const hasKids = (c.children?.length ?? 0) > 0;
        const expanded = hasKids && open.has(c.id);
        const listId = `${idPrefix}-${c.id}`;
        return (
          <li key={c.id}>
            <div className="flex items-center gap-0.5">
              {hasKids ? (
                <button
                  type="button"
                  onClick={() => toggle(c.id)}
                  aria-expanded={expanded}
                  aria-controls={listId}
                  aria-label={`${expanded ? 'Collapse' : 'Expand'} ${c.name}`}
                  className="grid h-8 w-6 shrink-0 place-items-center rounded-lg text-[#3f5649] transition hover:bg-[#f0f7f2] hover:text-[#1a663b] focus-visible:outline-2 focus-visible:outline-[#1a663b] cursor-pointer"
                >
                  <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} aria-hidden />
                </button>
              ) : (
                <span aria-hidden className="w-6 shrink-0" />
              )}
              {render(c, depth)}
            </div>
            {hasKids && (
              <div id={listId} hidden={!expanded}>
                {/* Always rendered (just hidden) so a checked radio inside stays in the form. */}
                {level(c.children!, depth + 1)}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return level(nodes, 0);
}

function CategoryOption({
  id,
  name,
  count,
  checked,
  depth = 0,
  onChange,
}: {
  id: string;
  name: string;
  count: number;
  checked: boolean;
  depth?: number;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#1a663b] ${
        checked ? 'bg-[#e8f5ee] font-bold text-[#14522f]' : 'text-[#234835] hover:bg-[#f0f7f2]'
      } ${depth === 0 && id && !checked ? 'font-semibold' : ''}`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <input type="radio" name="category" value={id} defaultChecked={checked} onChange={onChange} className="sr-only" />
        <span
          aria-hidden
          className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${checked ? 'border-[#1a663b] bg-[#1a663b]' : 'border-[#b9d8c5] bg-white'}`}
        >
          {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
        <span className="truncate">{name}</span>
      </span>
      <span className="shrink-0 rounded-full bg-[#f0f7f2] px-2 py-0.5 text-xs font-semibold tabular-nums text-[#3f5649]">{count}</span>
    </label>
  );
}
