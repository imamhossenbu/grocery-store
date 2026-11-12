'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';
import { formatBDT } from '@/lib/format';
import { FilterLink, useListing } from './ListingProvider';
import { listingHref, parseFilters, pricePresets, type ListingFilters } from './params';

export interface FilterCategory {
  id: string;
  name: string;
  productCount: number;
}

interface Props {
  basePath: string;
  filters: ListingFilters;
  priceRange: { min: number; max: number };
  /** Category radio list (shop/search). Omit on a category page. */
  categories?: FilterCategory[];
  /** Category page: links to the other category pages instead of radios. */
  categoryLinks?: { categories: FilterCategory[]; current: string };
  /** Called after any change is applied (closes the mobile sheet). */
  onApplied?: () => void;
  idPrefix: string;
}

const heading = 'text-xs font-extrabold uppercase tracking-widest text-[#5a7165]';

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
          <div className="mt-3 space-y-1">
            {[{ id: '', name: 'All categories', productCount: categories.reduce((s, c) => s + c.productCount, 0) }, ...categories].map((c) => {
              const checked = (filters.category ?? '') === c.id;
              return (
                <label
                  key={c.id || 'all'}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#1a663b] ${
                    checked ? 'bg-[#e8f5ee] font-bold text-[#14522f]' : 'text-[#234835] hover:bg-[#f0f7f2]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="category"
                      value={c.id}
                      defaultChecked={checked}
                      onChange={apply}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={`grid h-4 w-4 place-items-center rounded-full border-2 ${checked ? 'border-[#1a663b] bg-[#1a663b]' : 'border-[#b9d8c5] bg-white'}`}
                    >
                      {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    {c.name}
                  </span>
                  <span className="text-xs font-semibold text-[#7e9688]">{c.productCount}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {categoryLinks && (
        <nav aria-label="Categories">
          <h3 className={heading}>Category</h3>
          <ul className="mt-3 space-y-1">
            <li>
              <Link href="/shop" className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-[#234835] hover:bg-[#f0f7f2]">
                All products
              </Link>
            </li>
            {categoryLinks.categories.map((c) => {
              const on = c.id === categoryLinks.current;
              return (
                <li key={c.id}>
                  <Link
                    href={`/category/${c.id}`}
                    aria-current={on ? 'page' : undefined}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                      on ? 'bg-[#e8f5ee] font-bold text-[#14522f]' : 'text-[#234835] hover:bg-[#f0f7f2]'
                    }`}
                  >
                    {c.name}
                    <span className="text-xs font-semibold text-[#7e9688]">{c.productCount}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <fieldset>
        <legend className={heading}>Price</legend>
        <p className="mt-1 text-xs text-[#7e9688]">
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
            <span className="text-[11px] font-semibold text-[#5a7165]">Min (৳)</span>
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
          <span className="pb-2.5 text-[#9ab5a5]">–</span>
          <label className="flex-1">
            <span className="text-[11px] font-semibold text-[#5a7165]">Max (৳)</span>
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
