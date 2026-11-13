import Link from 'next/link';
import { Leaf, Star } from 'lucide-react';
import type { Product } from '@/types/store';
import { formatBDT } from '@/lib/format';
import { discountPercent } from '@/lib/pricing';
import { AddToCartButton } from './AddToCartButton';
import { WishlistButton } from './WishlistButton';

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const out = product.stock <= 0;
  const low = !out && product.stock <= 20;
  const pct = discountPercent(product.price, product.oldPrice);
  const href = `/product/${product.id}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-[#dfece3] bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-[#1a663b]/40 hover:shadow-card">
      <Link href={href} className="relative block aspect-square w-full overflow-hidden bg-[#f0f7f2]" aria-label={product.name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.badge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#1a663b] shadow-sm">
              <Leaf className="w-3 h-3 text-[#1a663b]" />
              {product.badge}
            </span>
          )}
          {pct > 0 && (
            <span className="rounded-full bg-[#f5b82e] px-2.5 py-1 text-[11px] font-extrabold text-[#3a2502] shadow-sm">-{pct}%</span>
          )}
        </div>
        {out && (
          <div className="absolute inset-0 grid place-items-center bg-[#0f2c1d]/55">
            <span className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">Out of stock</span>
          </div>
        )}
      </Link>
      <WishlistButton product={product} className="absolute right-3 top-3" />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2 text-xs text-[#5a7165]">
          <span className="font-semibold bg-[#f0f7f2] text-[#1a663b] px-2.5 py-0.5 rounded-full">{product.unit}</span>
          <span className="inline-flex items-center gap-1 font-bold text-[#112a1d]">
            <Star className="w-3.5 h-3.5 fill-[#f5b82e] text-[#f5b82e]" />
            {product.rating.toFixed(1)}
            {product.reviewCount ? <span className="font-medium text-[#7e9688]">({product.reviewCount})</span> : null}
          </span>
        </div>
        <h3 className="mt-2.5 text-[15px] font-bold leading-snug text-[#112a1d] line-clamp-2 min-h-[2.6em]">
          <Link href={href} className="hover:text-[#1a663b] transition-colors">{product.name}</Link>
        </h3>
        <div className="mt-auto pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-[#1a663b]">{formatBDT(product.price)}</span>
              {pct > 0 && <span className="text-xs text-[#7e9688] line-through">{formatBDT(product.oldPrice!)}</span>}
            </div>
            <span className={`text-[11px] font-bold ${out ? 'text-red-600' : low ? 'text-amber-600' : 'text-emerald-700'}`}>
              {out ? 'Sold out' : low ? `Only ${product.stock} left` : 'In stock'}
            </span>
          </div>
          <AddToCartButton product={product} className="mt-3" />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
