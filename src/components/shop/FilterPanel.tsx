'use client';

import Link from 'next/link';
import { useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronRight } from 'lucide-react';
import { formatBDT } from '@/lib/format';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Field';
import { cx } from '@/components/ui/overlay';
import { RangeSlider } from '@/components/store-ui/RangeSlider';
import { FilterLink, useListing } from './ListingProvider';
import { DEFAULT_PER_PAGE, listingHref, parseFilters, pricePresets, type ListingFilters } from './params';

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
  /** Category tree that filters in place (shop/search). Omit on a category page. */
  categories?: FilterCategory[];
  /** Category page: a tree of links to the category pages instead. */
  categoryLinks?: { categories: FilterCategory[]; current: string };
  idPrefix: string;
}

const heading = 'text-[15px] font-bold text-[#112a1d]';

/**
 * Filters as a plain GET form: works without JavaScript (the noscript submit
 * button), and with JavaScript every change applies in place via
 * router.replace — checkboxes on toggle, the price slider on release, the
 * price boxes on Enter / blur.
 */
export function FilterPanel({ basePath, filters, priceRange, categories, categoryLinks, idPrefix }: Props) {
  const { navigate } = useListing();
  const formRef = useRef<HTMLFormElement>(null);

  // Price boxes hold text; empty means "no bound" (the placeholder shows the catalog bound).
  const [minText, setMinText] = useState(filters.min !== undefined ? String(filters.min) : '');
  const [maxText, setMaxText] = useState(filters.max !== undefined ? String(filters.max) : '');
  const lo = minText === '' ? priceRange.min : Number(minText);
  const hi = maxText === '' ? priceRange.max : Number(maxText);
  const step = priceRange.max - priceRange.min > 2000 ? 50 : priceRange.max - priceRange.min > 300 ? 10 : 1;

  const priceChanges = (min: number | undefined, max: number | undefined): Partial<ListingFilters> => {
    if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];
    return {
      min: min !== undefined && min > priceRange.min ? min : undefined,
      max: max !== undefined && max < priceRange.max ? max : undefined,
    };
  };

  const applyForm = () => {
    const form = formRef.current;
    if (!form) return;
    const data = Object.fromEntries([...new FormData(form).entries()].map(([k, v]) => [k, typeof v === 'string' ? v : '']));
    const next = parseFilters(data);
    navigate(listingHref(basePath, { ...next, ...priceChanges(next.min, next.max) }));
  };

  const applyPrice = (min: number | undefined, max: number | undefined) => {
    const changes = priceChanges(min, max);
    if (changes.min === filters.min && changes.max === filters.max) return;
    navigate(listingHref(basePath, filters, changes));
  };

  const priceDirty = (minText === '' ? undefined : Number(minText)) !== filters.min || (maxText === '' ? undefined : Number(maxText)) !== filters.max;
  const presets = pricePresets(priceRange);
  const hasPrice = filters.min !== undefined || filters.max !== undefined;
  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 7);

  return (
    <form
      ref={formRef}
      action={basePath}
      method="get"
      // Remount when the URL changes so the boxes reflect it (e.g. after removing a chip).
      key={listingHref(basePath, filters)}
      onSubmit={(e) => {
        e.preventDefault();
        applyForm();
      }}
      className="space-y-7"
      aria-label="Product filters"
    >
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      {filters.sort !== 'popular' && <input type="hidden" name="sort" value={filters.sort} />}
      {filters.perPage !== DEFAULT_PER_PAGE && <input type="hidden" name="per" value={filters.perPage} />}
      {categories && filters.category && <input type="hidden" name="category" value={filters.category} />}

      {categories && (
        <section aria-labelledby={`${idPrefix}-cat-h`}>
          <h3 id={`${idPrefix}-cat-h`} className={heading}>
            Category
          </h3>
          <div className="mt-3 space-y-0.5">
            <div className="flex min-w-0 items-center gap-0.5">
              <span aria-hidden className="w-6 shrink-0" />
              <CategoryRow
                href={listingHref(basePath, filters, { category: undefined })}
                name="All categories"
                count={categories.reduce((n, c) => n + c.productCount, 0)}
                selected={!filters.category}
                filterInPlace
              />
            </div>
            <CategoryTree
              nodes={categories}
              active={filters.category}
              idPrefix={`${idPrefix}-cat`}
              render={(c, depth) => (
                <CategoryRow
                  href={listingHref(basePath, filters, { category: c.id })}
                  name={c.name}
                  count={c.productCount}
                  depth={depth}
                  selected={filters.category === c.id}
                  filterInPlace
                />
              )}
            />
          </div>
        </section>
      )}

      {categoryLinks && (
        <nav aria-labelledby={`${idPrefix}-catl-h`}>
          <h3 id={`${idPrefix}-catl-h`} className={heading}>
            Category
          </h3>
          <div className="mt-3 space-y-0.5">
            <div className="flex min-w-0 items-center gap-0.5">
              <span aria-hidden className="w-6 shrink-0" />
              <CategoryRow href="/shop" name="All products" selected={false} />
            </div>
            <CategoryTree
              nodes={categoryLinks.categories}
              active={categoryLinks.current}
              idPrefix={`${idPrefix}-catl`}
              render={(c, depth) => (
                <CategoryRow href={`/category/${c.id}`} name={c.name} count={c.productCount} depth={depth} selected={c.id === categoryLinks.current} />
              )}
            />
          </div>
        </nav>
      )}

      <fieldset className="min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <legend className={heading}>Price</legend>
          {hasPrice && (
            <FilterLink
              href={listingHref(basePath, filters, { min: undefined, max: undefined })}
              className="text-[13px] font-semibold text-[#1a663b] underline-offset-2 hover:underline"
            >
              Reset
            </FilterLink>
          )}
        </div>
        <p className="mt-1 text-[13px] text-[#3f5649]">
          <span className="tabular-nums">{formatBDT(priceRange.min)}</span> – <span className="tabular-nums">{formatBDT(priceRange.max)}</span> in these results
        </p>

        {priceRange.max > priceRange.min && (
          <RangeSlider
            className="mt-3"
            label="Price range"
            min={priceRange.min}
            max={priceRange.max}
            step={step}
            value={[Math.max(priceRange.min, Math.min(lo, hi)), Math.min(priceRange.max, Math.max(lo, hi))]}
            formatValue={formatBDT}
            onValueChange={([a, b]) => {
              setMinText(a <= priceRange.min ? '' : String(a));
              setMaxText(b >= priceRange.max ? '' : String(b));
            }}
            onValueCommit={([a, b]) => applyPrice(a, b)}
          />
        )}

        <div className="mt-2 flex items-end gap-2">
          <PriceBox
            id={`${idPrefix}-min`}
            label="Min"
            name="min"
            value={minText}
            placeholder={String(priceRange.min)}
            onChange={(v) => setMinText(digits(v))}
            onCommit={() => priceDirty && formRef.current?.requestSubmit()}
          />
          <span aria-hidden className="pb-3 text-[#3f5649]">
            –
          </span>
          <PriceBox
            id={`${idPrefix}-max`}
            label="Max"
            name="max"
            value={maxText}
            placeholder={String(priceRange.max)}
            onChange={(v) => setMaxText(digits(v))}
            onCommit={() => priceDirty && formRef.current?.requestSubmit()}
          />
        </div>

        {presets.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {presets.map((p) => {
              const on = filters.min === p.min && filters.max === p.max;
              return (
                <FilterLink
                  key={p.label}
                  href={listingHref(basePath, filters, on ? { min: undefined, max: undefined } : { min: p.min, max: p.max })}
                  aria-current={on ? 'true' : undefined}
                  className={cx(
                    'fb-press inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[13px] font-semibold tabular-nums transition-colors',
                    on ? 'border-[#1a663b] bg-[#1a663b] text-white' : 'border-[#cfe0d6] bg-white text-[#234835] hover:border-[#1a663b] hover:text-[#14522f]'
                  )}
                >
                  {on && <Check className="h-3.5 w-3.5" aria-hidden />}
                  {p.label}
                </FilterLink>
              );
            })}
          </div>
        )}
      </fieldset>

      <fieldset className="min-w-0">
        <legend className={heading}>Availability &amp; offers</legend>
        <div className="mt-3 space-y-2">
          <FilterCheck
            id={`${idPrefix}-stock`}
            name="stock"
            label="In stock only"
            description="Hide items that are sold out today"
            checked={filters.inStock}
            onToggle={applyForm}
          />
          <FilterCheck
            id={`${idPrefix}-sale`}
            name="sale"
            label="On sale"
            description="Only products with a markdown"
            checked={filters.onSale}
            onToggle={applyForm}
          />
        </div>
      </fieldset>

      <noscript>
        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#0f2c1d] text-sm font-semibold text-white"
        >
          Apply filters
        </button>
      </noscript>
    </form>
  );
}

function PriceBox({
  id,
  label,
  name,
  value,
  placeholder,
  onChange,
  onCommit,
}: {
  id: string;
  label: string;
  name: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onCommit: () => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="mb-1 block text-[13px] font-semibold text-[#3f5649]">
        {label}
      </label>
      <Input
        id={id}
        name={name}
        size="sm"
        prefix="৳"
        inputMode="numeric"
        autoComplete="off"
        enterKeyHint="done"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        className="rounded-xl px-3"
        inputClassName="tabular-nums"
      />
    </div>
  );
}

function FilterCheck({
  id,
  name,
  label,
  description,
  checked,
  onToggle,
}: {
  id: string;
  name: string;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cx(
        'rounded-xl border px-3 py-2.5 transition-colors',
        checked ? 'border-[#bfe0cc] bg-[#f0f9f3]' : 'border-[#e3eee7] bg-white hover:border-[#c6dccf]'
      )}
    >
      <Checkbox id={id} name={name} value="1" defaultChecked={checked} onCheckedChange={onToggle} label={label} description={description} className="w-full" />
    </div>
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
 * Collapsible category tree: disclosure arrows on the left, everything
 * collapsed except the branch that holds the active category.
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
  render: (c: FilterCategory, depth: number) => ReactNode;
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(branchOf(nodes, active)));
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const level = (list: FilterCategory[], depth: number): ReactNode => (
    <ul className={depth ? 'mt-0.5 space-y-0.5 pl-5' : 'space-y-0.5'}>
      {list.map((c) => {
        const hasKids = (c.children?.length ?? 0) > 0;
        const expanded = hasKids && open.has(c.id);
        const listId = `${idPrefix}-${c.id}`;
        return (
          <li key={c.id}>
            <div className="flex min-w-0 items-center gap-0.5">
              {hasKids ? (
                <button
                  type="button"
                  onClick={() => toggle(c.id)}
                  aria-expanded={expanded}
                  aria-controls={listId}
                  aria-label={`${expanded ? 'Collapse' : 'Expand'} ${c.name}`}
                  className="grid h-8 w-6 shrink-0 place-items-center rounded-lg text-[#3f5649] transition hover:bg-[#f0f7f2] hover:text-[#1a663b] focus-visible:outline-2 focus-visible:outline-[#1a663b] cursor-pointer"
                >
                  <ChevronRight className={cx('h-4 w-4 transition-transform duration-200', expanded && 'rotate-90')} aria-hidden />
                </button>
              ) : (
                <span aria-hidden className="w-6 shrink-0" />
              )}
              {render(c, depth)}
            </div>
            {hasKids && (
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    id={listId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    {level(c.children!, depth + 1)}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </li>
        );
      })}
    </ul>
  );

  return level(nodes, 0);
}

/** One row of the tree: radio-style dot, name, count pill. A real link, so it works without JS. */
function CategoryRow({
  href,
  name,
  count,
  depth = 0,
  selected,
  filterInPlace,
}: {
  href: string;
  name: string;
  count?: number;
  depth?: number;
  selected: boolean;
  filterInPlace?: boolean;
}) {
  const className = cx(
    'group flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#1a663b]',
    selected ? 'bg-[#e8f5ee] font-bold text-[#14522f]' : 'text-[#234835] hover:bg-[#f0f7f2]',
    depth === 0 && !selected && 'font-semibold'
  );
  const body = (
    <>
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden
          className={cx(
            'grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition-colors',
            selected ? 'border-[#1a663b] bg-[#1a663b]' : 'border-[#b9d3c3] bg-white group-hover:border-[#1a663b]'
          )}
        >
          {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
        <span className="truncate">{name}</span>
      </span>
      {count !== undefined && (
        <span
          className={cx(
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
            selected ? 'bg-white text-[#14522f]' : 'bg-[#f0f7f2] text-[#3f5649]'
          )}
        >
          {count}
        </span>
      )}
    </>
  );
  return filterInPlace ? (
    <FilterLink href={href} aria-current={selected ? 'true' : undefined} className={className}>
      {body}
    </FilterLink>
  ) : (
    <Link href={href} aria-current={selected ? 'page' : undefined} className={className}>
      {body}
    </Link>
  );
}
