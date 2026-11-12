'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { formatBDT } from '@/lib/format';

export interface SearchIndex {
  products: { id: string; name: string; unit: string; price: number; image: string; category: string }[];
  /** All categories; `parent` is the parent category's name for subcategories. */
  categories: { id: string; name: string; parent?: string }[];
}

/** Instant suggestions from a small prefetched index; Enter goes to /search. */
export function HeaderSearch({ index, autoFocus = false, onDone }: { index: SearchIndex; autoFocus?: boolean; onDone?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return { products: [], categories: [] };
    const match = (s: string) => words.every((w) => s.toLowerCase().includes(w));
    return {
      // Name matches first, then subcategories whose parent matches ("fruits" → Local fruits in Fruits).
      categories: [
        ...index.categories.filter((c) => match(c.name)),
        ...index.categories.filter((c) => !match(c.name) && c.parent && match(`${c.name} ${c.parent}`)),
      ].slice(0, 5),
      products: index.products.filter((p) => match(`${p.name} ${p.category}`)).slice(0, 6),
    };
  }, [q, index]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQ('');
    onDone?.();
    router.push(href);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && results.products[active]) return go(`/product/${results.products[active].id}`);
    if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const showPanel = open && q.trim().length > 0;

  return (
    <div ref={boxRef} className="relative w-full">
      <form role="search" onSubmit={submit}>
        <Search className="w-4 h-4 text-[#5a7165] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.products.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="Search mango, doi, honey, rice…"
          aria-label="Search products"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls="search-suggestions"
          className="w-full rounded-full border border-[#cfe3d6] bg-[#f4f9f5] pl-11 pr-10 py-2.5 text-sm text-[#112a1d] placeholder-[#6c8577] focus:border-[#1a663b] focus:bg-white focus:outline-none transition [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a7165] hover:text-[#112a1d] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {showPanel && (
        <div id="search-suggestions" className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-2xl border border-[#dfece3] bg-white shadow-card">
          {results.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-[#eef5f0] p-3">
              {results.categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => go(`/category/${c.id}`)}
                  aria-label={c.parent ? `${c.name} in ${c.parent}` : c.name}
                  className="rounded-full bg-[#e8f5ee] px-3 py-1 text-xs font-bold text-[#14522f] hover:bg-[#d3eadc] cursor-pointer"
                >
                  {c.name}
                  {c.parent && <span className="font-medium text-[#5a7165]"> in {c.parent}</span>}
                </button>
              ))}
            </div>
          )}
          {results.products.length === 0 ? (
            <p className="p-4 text-sm text-[#5a7165]">No products match “{q}”.</p>
          ) : (
            <ul>
              {results.products.map((p, i) => (
                <li key={p.id}>
                  <Link
                    href={`/product/${p.id}`}
                    onClick={() => { setOpen(false); setQ(''); onDone?.(); }}
                    className={`flex items-center gap-3 px-3 py-2.5 hover:bg-[#f4f9f5] ${i === active ? 'bg-[#f4f9f5]' : ''}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" className="w-10 h-10 rounded-xl object-cover bg-[#f0f7f2]" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-[#112a1d] truncate">{p.name}</span>
                      <span className="text-xs text-[#5a7165]">{p.unit}</span>
                    </span>
                    <span className="text-sm font-extrabold text-[#1a663b]">{formatBDT(p.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}`)} className="block w-full border-t border-[#eef5f0] px-4 py-2.5 text-left text-xs font-bold text-[#1a663b] hover:bg-[#f4f9f5] cursor-pointer">
            See all results for “{q.trim()}” →
          </button>
        </div>
      )}
    </div>
  );
}
