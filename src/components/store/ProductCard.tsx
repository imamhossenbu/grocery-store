'use client';

import React from 'react';
import { Eye, Minus, Plus, ShoppingBasket, Star, Sparkles } from 'lucide-react';
import { Product } from '@/types/store';
import { formatBDT } from '@/lib/supabase-db';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/Button';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { getProductQty, addToCart, updateQty } = useStore();
  const qty = getProductQty(product.id);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 20;
  const discountPct =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-[#dfece3] bg-white shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-[#1a663b]/40 hover:shadow-card">
      {/* Image Container */}
      <div
        onClick={() => onQuickView(product)}
        className="relative aspect-square w-full overflow-hidden bg-[#f0f7f2] cursor-pointer"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
        />

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5 z-10">
          {product.badge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#1a663b] shadow-sm">
              <Sparkles className="w-3 h-3 text-[#f5b82e] fill-[#f5b82e]" />
              {product.badge}
            </span>
          )}
          {discountPct > 0 && (
            <span className="rounded-full bg-[#f5b82e] px-2.5 py-1 text-[11px] font-extrabold text-[#3a2502] shadow-sm">
              -{discountPct}% OFF
            </span>
          )}
        </div>

        {/* Quick View Hover Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          aria-label={`Quick view ${product.name}`}
          className="absolute right-3 top-3 grid place-items-center w-9 h-9 rounded-full bg-white/90 backdrop-blur text-[#112a1d] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 hover:bg-[#1a663b] hover:text-white shadow-md cursor-pointer"
        >
          <Eye className="w-4 h-4" />
        </button>

        {outOfStock && (
          <div className="absolute inset-0 bg-[#0f2c1d]/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-[#5a7165]">
          <span className="font-semibold bg-[#f0f7f2] text-[#1a663b] px-2.5 py-0.5 rounded-full">
            {product.unit}
          </span>
          <span className="inline-flex items-center gap-1 font-bold text-[#112a1d]">
            <Star className="w-3.5 h-3.5 fill-[#f5b82e] text-[#f5b82e]" />
            {Number(product.rating || 4.8).toFixed(1)}
          </span>
        </div>

        <h3
          onClick={() => onQuickView(product)}
          className="mt-2.5 font-sans text-base font-bold leading-snug text-[#112a1d] group-hover:text-[#1a663b] transition-colors cursor-pointer line-clamp-1"
        >
          {product.name}
        </h3>

        <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-[#5a7165] leading-relaxed">
          {product.description}
        </p>

        {/* Price & Stock Row */}
        <div className="mt-auto pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-[#1a663b]">
                {formatBDT(product.price)}
              </span>
              {product.oldPrice && product.oldPrice > product.price && (
                <span className="text-xs font-medium text-[#7e9688] line-through">
                  {formatBDT(product.oldPrice)}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] font-bold ${
                outOfStock
                  ? 'text-red-600'
                  : lowStock
                  ? 'text-amber-600'
                  : 'text-emerald-700'
              }`}
            >
              {outOfStock
                ? 'Sold out'
                : lowStock
                ? `Only ${product.stock} left`
                : 'In stock'}
            </span>
          </div>

          {/* Action / Cart Stepper */}
          {qty > 0 ? (
            <div className="mt-3.5 flex items-center justify-between rounded-full bg-[#e8f5ee] border border-[#bce3cb] p-1">
              <button
                onClick={() => updateQty(product.id, qty - 1)}
                aria-label="Decrease quantity"
                className="grid place-items-center w-8 h-8 rounded-full bg-white text-[#112a1d] hover:bg-[#1a663b] hover:text-white transition shadow-sm cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs sm:text-sm font-extrabold text-[#14522f]">
                {qty} in basket
              </span>
              <button
                onClick={() => addToCart(product, 1)}
                disabled={qty >= product.stock}
                aria-label="Increase quantity"
                className="grid place-items-center w-8 h-8 rounded-full bg-[#1a663b] text-white hover:bg-[#14522f] disabled:opacity-40 transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="md"
              disabled={outOfStock}
              onClick={() => addToCart(product, 1)}
              className="mt-3.5 w-full"
            >
              <ShoppingBasket className="w-4 h-4" />
              Add to Basket
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

