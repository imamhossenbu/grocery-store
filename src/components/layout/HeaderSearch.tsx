'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Search, TrendingUp, X } from 'lucide-react';
import { popupMotion } from '@/components/ui/motion';
import { POPULAR_SEARCHES } from '@/lib/constants';
import { formatBDT } from '@/lib/format';

export interface SearchIndex {
  products: { id: string; name: string; unit: string; price: number; image: string; category: string }[];
  /** All categories; `parent` is the parent category's name for subcategories. */
  categories: { id: string; name: string; parent?: string }[];
}

type Option =
  | { kind: 'popular'; label: string; href: string }
  | { kind: 'category'; label: string; parent?: string; href: string }
  | { kind: 'product'; product: SearchIndex['products'][number]; href: string }
  | { kind: 'all'; label: string; href: string };

const searchHref = (q: string) => `/search?q=${encodeURIComponent(q)}`;

/** True while the user is typing somewhere else, so "/" must not steal focus. */
function isTyping(el: Element | null) {
  return !!el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || (el as HTMLElement).isContentEditable);
}

/** The matched words in bold, for scanning the list quickly. */
function Highlight({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return (
    <>
      {text.split(re).map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-transparent font-extrabold text-[#0f2c1d]">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

/**
 * Header search with instant suggestions from a small prefetched index.
 * Focusing it empty shows popular searches; typing shows matching categories
 * and products. ↑/↓ move through every row, Enter opens the active row or
 * searches, Esc closes. With `shortcut`, "/" or Ctrl/⌘+K focuses it.
 */
export function HeaderSearch({
  index,
  autoFocus = false,
  shortcut = false,
  onDone,
}: {
  index: SearchIndex;
  autoFocus?: boolean;
  shortcut?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [mac, setMac] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = q.trim();
  const words = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query]);

  const options = useMemo<Option[]>(() => {
    if (!words.length) return POPULAR_SEARCHES.map((label) => ({ kind: 'popular', label, href: searchHref(label) }));
    const match = (s: string) => words.every((w) => s.toLowerCase().includes(w));
    // Name matches first, then subcategories whose parent matches ("fruits" → Local fruits in Fruits).
    const categories = [
      ...index.categories.filter((c) => match(c.name)),
      ...index.categories.filter((c) => !match(c.name) && c.parent && match(`${c.name} ${c.parent}`)),
    ].slice(0, 4);
    const products = index.products.filter((p) => match(`${p.name} ${p.category}`)).slice(0, 6);
    return [
      ...categories.map((c): Option => ({ kind: 'category', label: c.name, parent: c.parent, href: `/category/${c.id}` })),
      ...products.map((p): Option => ({ kind: 'product', product: p, href: `/product/${p.id}` })),
      { kind: 'all', label: query, href: searchHref(query) },
    ];
  }, [words, query, index]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    if (!shortcut) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- platform is only known in the browser
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const onKey = (e: KeyboardEvent) => {
      const slash = e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(document.activeElement);
      const cmdK = e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey);
      if (!slash && !cmdK) return;
      // Skip when the desktop box is hidden (mobile uses the header toggle).
      if (!inputRef.current?.offsetParent) return;
      e.preventDefault();
      inputRef.current.focus();
      inputRef.current.select();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shortcut]);

  const go = (href: string) => {
    setOpen(false);
    setQ('');
    setActive(-1);
    inputRef.current?.blur();
    onDone?.();
    router.push(href);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && options[active]) return go(options[active].href);
    if (query) go(searchHref(query));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1 >= options.length ? 0 : a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a <= 0 ? options.length - 1 : a - 1));
    } else if (e.key === 'Escape') {
      if (open) setOpen(false);
      else if (q) setQ('');
      else inputRef.current?.blur();
    }
  };

  const optionId = (i: number) => `${listId}-opt-${i}`;
  const rowClass = (i: number) =>
    `flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors ${i === active ? 'bg-[#eef7f1]' : 'hover:bg-[#f4f9f5]'}`;

  const categories = options.map((o, i) => [o, i] as const).filter(([o]) => o.kind === 'category');
  const products = options.map((o, i) => [o, i] as const).filter(([o]) => o.kind === 'product');
  const popular = options.map((o, i) => [o, i] as const).filter(([o]) => o.kind === 'popular');
  const allIndex = options.findIndex((o) => o.kind === 'all');

  return (
    <div ref={boxRef} className="relative w-full">
      <form role="search" onSubmit={submit}>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a7165]" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search mango, doi, honey, rice…"
          aria-label="Search products"
          aria-keyshortcuts={shortcut ? '/ Control+K Meta+K' : undefined}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
          className="peer w-full rounded-full border border-[#cfe3d6] bg-[#f4f9f5] py-2.5 pl-11 pr-12 text-sm text-[#112a1d] placeholder-[#6c8577] transition focus:border-[#1a663b] focus:bg-white focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ('');
              setActive(-1);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[#5a7165] hover:bg-[#e8f2ec] hover:text-[#112a1d] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          shortcut && (
            <kbd
              aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center rounded-md border border-[#cfe3d6] bg-white px-1.5 py-0.5 font-sans text-xs font-semibold text-[#3f5649] shadow-sm peer-focus:opacity-0 lg:inline-flex"
            >
              {mac ? '⌘K' : '/'}
            </kbd>
          )
        )}
      </form>

      <AnimatePresence>
        {open && (
          <motion.div
            {...popupMotion('bottom')}
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#dfece3] bg-white shadow-card"
          >
            <div id={listId} role="listbox" aria-label="Search suggestions">
              {popular.length > 0 && (
                <div className="p-3">
                  <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-widest text-[#5a7165]">
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden /> Popular searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {popular.map(([o, i]) => (
                      <button
                        key={o.href}
                        id={optionId(i)}
                        type="button"
                        role="option"
                        aria-selected={i === active}
                        tabIndex={-1}
                        onClick={() => go(o.href)}
                        onPointerMove={() => setActive(i)}
                        className={`rounded-full px-3 py-1.5 text-[13px] font-semibold text-[#14522f] transition-colors cursor-pointer ${
                          i === active ? 'bg-[#d3eadc]' : 'bg-[#e8f5ee] hover:bg-[#d3eadc]'
                        }`}
                      >
                        {o.kind === 'popular' && o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 border-b border-[#eef5f0] p-3">
                  {categories.map(([o, i]) =>
                    o.kind === 'category' ? (
                      <button
                        key={o.href}
                        id={optionId(i)}
                        type="button"
                        role="option"
                        aria-selected={i === active}
                        aria-label={o.parent ? `${o.label} in ${o.parent}` : o.label}
                        tabIndex={-1}
                        onClick={() => go(o.href)}
                        onPointerMove={() => setActive(i)}
                        className={`rounded-full px-3 py-1.5 text-[13px] font-bold text-[#14522f] transition-colors cursor-pointer ${
                          i === active ? 'bg-[#d3eadc] ring-2 ring-[#1a663b]/30' : 'bg-[#e8f5ee] hover:bg-[#d3eadc]'
                        }`}
                      >
                        <Highlight text={o.label} words={words} />
                        {o.parent && <span className="font-medium text-[#3f5649]"> in {o.parent}</span>}
                      </button>
                    ) : null
                  )}
                </div>
              )}

              {query && products.length === 0 && (
                <p className="p-4 text-sm text-[#3f5649]">No products match “{query}”.</p>
              )}

              {products.length > 0 && (
                <ul className="py-1">
                  {products.map(([o, i]) =>
                    o.kind === 'product' ? (
                      <li key={o.href}>
                        <button
                          id={optionId(i)}
                          type="button"
                          role="option"
                          aria-selected={i === active}
                          tabIndex={-1}
                          onClick={() => go(o.href)}
                          onPointerMove={() => setActive(i)}
                          className={rowClass(i)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={o.product.image} alt="" className="h-10 w-10 rounded-xl bg-[#f0f7f2] object-cover" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-[#234835]">
                              <Highlight text={o.product.name} words={words} />
                            </span>
                            <span className="text-[13px] text-[#3f5649]">{o.product.unit}</span>
                          </span>
                          <span className="text-sm font-extrabold tabular-nums text-[#1a663b]">{formatBDT(o.product.price)}</span>
                        </button>
                      </li>
                    ) : null
                  )}
                </ul>
              )}

              {allIndex >= 0 && (
                <button
                  id={optionId(allIndex)}
                  type="button"
                  role="option"
                  aria-selected={allIndex === active}
                  tabIndex={-1}
                  onClick={() => go(options[allIndex].href)}
                  onPointerMove={() => setActive(allIndex)}
                  className={`${rowClass(allIndex)} border-t border-[#eef5f0] text-[13px] font-bold text-[#1a663b]`}
                >
                  <span className="flex-1">See all results for “{query}”</span>
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>

            {shortcut && (
              <p className="hidden items-center gap-3 border-t border-[#eef5f0] bg-[#f9fbf9] px-4 py-2 text-xs text-[#3f5649] lg:flex">
                <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> to move</span>
                <span><Kbd>Enter</Kbd> to open</span>
                <span><Kbd>Esc</Kbd> to close</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-[#d3e5da] bg-white px-1 font-sans font-semibold text-[#234835]">{children}</kbd>;
}
