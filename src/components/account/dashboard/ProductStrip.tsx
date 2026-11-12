'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { History } from 'lucide-react';
import type { ProductSnapshot } from '@/types/store';
import { useShop } from '@/context/ShopContext';
import { AddToCartButton } from '@/components/product/AddToCartButton';
import { formatBDT } from '@/lib/format';
import { discountPercent } from '@/lib/pricing';
import { Reveal } from '@/components/ui/motion';

/** Horizontal product rail with one-click add to basket. */
export function ProductStrip({
  id,
  title,
  icon,
  description,
  products,
  action,
}: {
  id: string;
  title: string;
  icon: ReactNode;
  description?: string;
  products: ProductSnapshot[];
  action?: ReactNode;
}) {
  if (!products.length) return null;
  return (
    <Reveal as="section" index={0} aria-labelledby={id} className="rounded-3xl border border-[#dfece3] bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id={id} className="flex items-center gap-2.5 font-display text-lg font-bold text-[#112a1d] sm:text-xl">
            <span aria-hidden className="grid h-8 w-8 place-items-center rounded-xl bg-[#e8f5ee] text-[#1a663b] [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-[#3f5649]">{description}</p>}
        </div>
        {action}
      </div>
      <ul className="fb-scroll-x -mx-5 mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6">
        {products.map((p, i) => {
          const pct = discountPercent(p.price, p.oldPrice);
          const out = p.stock <= 0;
          return (
            <Reveal as="li" index={Math.min(i, 8)} key={p.id} className="w-40 shrink-0 snap-start sm:w-44">
              <div className="fb-lift flex h-full flex-col overflow-hidden rounded-2xl border border-[#e6f0e9] bg-white">
                <Link href={`/product/${p.id}`} className="group relative block aspect-[4/3] overflow-hidden bg-[#f0f7f2]" tabIndex={-1} aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" loading="lazy" className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${out ? 'opacity-60 grayscale-[40%]' : ''}`} />
                  {pct > 0 && <span className="absolute left-2 top-2 rounded-full bg-[#f5b82e] px-2 py-0.5 text-xs font-extrabold text-[#3a2502]">-{pct}%</span>}
                </Link>
                <div className="flex flex-1 flex-col p-3">
                  <Link href={`/product/${p.id}`} className="line-clamp-2 min-h-[2.5em] text-sm font-bold leading-snug text-[#112a1d] hover:text-[#1a663b]">
                    {p.name}
                  </Link>
                  <p className="mt-1 text-[13px] tabular-nums text-[#3f5649]">
                    <span className="font-extrabold text-[#1a663b]">{formatBDT(p.price)}</span> · {p.unit}
                  </p>
                  <div className="mt-auto pt-3">
                    {out ? (
                      <p className="flex h-10 items-center justify-center rounded-full bg-[#eef3f0] text-[13px] font-bold text-[#3f5649]">Out of stock</p>
                    ) : (
                      <AddToCartButton product={p} />
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </ul>
    </Reveal>
  );
}

/** Recently viewed products (localStorage via ShopContext). */
export function RecentlyViewedStrip() {
  const { recentlyViewed, hydrated } = useShop();
  // Rendered last on the page, so appearing after hydration shifts nothing above it.
  if (!hydrated) return null;
  return (
    <ProductStrip
      id="recently-viewed"
      title="Recently viewed"
      icon={<History />}
      description="Pick up where you left off."
      products={recentlyViewed.slice(0, 10)}
    />
  );
}
