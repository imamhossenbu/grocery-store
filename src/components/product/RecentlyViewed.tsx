'use client';

import Link from 'next/link';
import { History } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { formatBDT } from '@/lib/format';
import { discountPercent } from '@/lib/pricing';
import { AddToCartButton } from './AddToCartButton';

/** "Recently viewed" strip from localStorage. Renders nothing until there is something to show. */
export function RecentlyViewed({ excludeId, className = '' }: { excludeId?: string; className?: string }) {
  const { recentlyViewed, hydrated } = useShop();
  const items = hydrated ? recentlyViewed.filter((p) => p.id !== excludeId).slice(0, 8) : [];
  if (!items.length) return null;

  return (
    <section aria-labelledby="recently-viewed" className={className}>
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e8f5ee] text-[#1a663b]">
          <History className="h-4.5 w-4.5" />
        </span>
        <h2 id="recently-viewed" className="font-display text-2xl font-bold text-[#112a1d]">
          Recently viewed
        </h2>
      </div>
      <ul className="-mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((p) => {
          const pct = discountPercent(p.price, p.oldPrice);
          return (
            <li key={p.id} className="w-40 shrink-0 snap-start sm:w-48">
              <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#dfece3] bg-white shadow-soft">
                <Link href={`/product/${p.id}`} className="group relative block aspect-[4/3] overflow-hidden bg-[#f0f7f2]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  {pct > 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-[#f5b82e] px-2 py-0.5 text-[10px] font-extrabold text-[#3a2502]">-{pct}%</span>
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-3">
                  <Link href={`/product/${p.id}`} className="line-clamp-2 text-sm font-bold leading-snug text-[#112a1d] hover:text-[#1a663b]">
                    {p.name}
                  </Link>
                  <p className="mt-1 text-xs text-[#5a7165]">
                    <span className="font-extrabold text-[#1a663b]">{formatBDT(p.price)}</span> · {p.unit}
                  </p>
                  <div className="mt-auto pt-3">
                    <AddToCartButton product={p} />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
