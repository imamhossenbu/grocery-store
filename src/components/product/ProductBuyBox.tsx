'use client';

import { useState } from 'react';
import type { Product } from '@/types/store';
import { formatBDT } from '@/lib/format';
import { discountPercent } from '@/lib/pricing';
import { defaultVariant } from '@/lib/variants';
import { ProductPurchasePanel } from './ProductPurchasePanel';

const LOW_STOCK = 20;

/**
 * The price card on the product page: price, saving, stock line, the size
 * picker for a product sold in sizes, and the purchase buttons. Price and
 * stock follow the chosen size.
 */
export function ProductBuyBox({ product }: { product: Product }) {
  const variants = product.variants ?? [];
  const [variantId, setVariantId] = useState<string | undefined>(() => defaultVariant(product)?.id);
  // The catalog can change under an open page; fall back if the chosen size is gone.
  const variant = variants.find((v) => v.id === variantId) ?? defaultVariant(product);

  const price = variant ? variant.price : product.price;
  const oldPrice = variant ? variant.oldPrice : product.oldPrice;
  const unit = variant ? variant.label : product.unit;
  const stock = variant ? variant.stock : product.stock;
  const pct = discountPercent(price, oldPrice);
  const saved = pct > 0 ? oldPrice! - price : 0;
  const out = stock <= 0;
  const low = !out && stock <= LOW_STOCK;

  return (
    <div className="mt-6 rounded-3xl border border-[#dfece3] bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <span className="font-display text-4xl font-bold text-[#1a663b]">{formatBDT(price)}</span>
        {pct > 0 && <span className="pb-1 text-lg text-[#7e9688] line-through">{formatBDT(oldPrice!)}</span>}
        <span className="pb-1.5 text-sm text-[#5a7165]">/ {unit}</span>
      </div>
      {pct > 0 && (
        <p className="mt-2 inline-flex rounded-full bg-[#fef3c7] px-3 py-1 text-xs font-extrabold text-[#78350f]">
          You save {formatBDT(saved)} ({pct}%)
        </p>
      )}

      {variants.length > 0 && (
        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-[#234835]">Size</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((v) => {
              const selected = v.id === variant?.id;
              const soldOut = v.stock <= 0;
              return (
                <label
                  key={v.id}
                  className={`relative inline-flex cursor-pointer flex-col rounded-2xl border px-4 py-2 text-left transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#1a663b] has-[:focus-visible]:ring-offset-2 ${
                    selected
                      ? 'border-[#1a663b] bg-[#e8f5ee] shadow-sm'
                      : 'border-[#cfe3d6] bg-white hover:border-[#1a663b]'
                  } ${soldOut ? 'opacity-60' : ''}`}
                >
                  <input
                    type="radio"
                    name="product-size"
                    value={v.id}
                    checked={selected}
                    onChange={() => setVariantId(v.id)}
                    className="sr-only"
                  />
                  <span className={`text-sm font-bold ${selected ? 'text-[#14522f]' : 'text-[#112a1d]'}`}>{v.label}</span>
                  <span className="text-xs font-semibold text-[#5a7165]">{soldOut ? 'Sold out' : formatBDT(v.price)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <p
        aria-live="polite"
        className={`mt-3 flex items-center gap-2 text-sm font-bold ${out ? 'text-red-600' : low ? 'text-amber-700' : 'text-emerald-700'}`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${out ? 'bg-red-500' : low ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} aria-hidden />
        {out
          ? variant && variants.some((v) => v.stock > 0)
            ? 'This size is out of stock — other sizes are available'
            : 'Out of stock — check back tomorrow morning'
          : low
            ? `Only ${stock} left in stock — order soon`
            : 'In stock, ready for same-day delivery'}
      </p>

      <div className="mt-5">
        <ProductPurchasePanel key={variant?.id ?? 'plain'} product={product} variant={variant} />
      </div>
    </div>
  );
}
