'use client';

import React from 'react';
import {
  BadgeCheck,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBasket,
  Star,
  Truck,
} from 'lucide-react';
import { Product } from '@/types/store';
import { formatBDT } from '@/lib/supabase-db';
import { useStore } from '@/context/StoreContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductQuickViewModal({
  product,
  onClose,
}: ProductQuickViewModalProps) {
  const { getProductQty, addToCart, updateQty, setIsCartOpen } = useStore();

  if (!product) return null;

  const qty = getProductQty(product.id);
  const outOfStock = product.stock <= 0;
  const discountPct =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0;

  return (
    <Modal isOpen={!!product} onClose={onClose} size="xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-[#f0f7f2] border border-[#dfece3]">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            {product.badge && <Badge variant="emerald">{product.badge}</Badge>}
            {discountPct > 0 && (
              <Badge variant="amber">Save {discountPct}%</Badge>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#5a7165]">
            <span className="uppercase tracking-wider text-[#1a663b] bg-[#e8f5ee] px-3 py-1 rounded-full">
              {product.category}
            </span>
            <span>SKU: {product.sku}</span>
            <span className="inline-flex items-center gap-1 text-[#112a1d] ml-auto">
              <Star className="w-4 h-4 fill-[#f5b82e] text-[#f5b82e]" />
              {Number(product.rating || 4.8).toFixed(1)} Rating
            </span>
          </div>

          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-[#112a1d]">
            {product.name}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#5a7165]">
            Pack Size: <strong className="text-[#112a1d]">{product.unit}</strong>
          </p>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-[#1a663b]">
              {formatBDT(product.price)}
            </span>
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="text-lg text-[#7e9688] line-through">
                {formatBDT(product.oldPrice)}
              </span>
            )}
            <span
              className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${
                outOfStock
                  ? 'bg-red-100 text-red-700'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {outOfStock ? 'Out of Stock' : `${product.stock} units available`}
            </span>
          </div>

          <p className="mt-4 text-sm sm:text-base text-[#445c50] leading-relaxed">
            {product.description}
          </p>

          {/* Farm Origin & Nutrition Info */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-[#f4f9f5] p-4 border border-[#dfece3]">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#1a663b] shrink-0 mt-0.5" />
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#5a7165]">
                  Sourced From
                </span>
                <span className="text-xs font-bold text-[#112a1d]">
                  {product.origin || 'Partner Farms, Bangladesh'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <BadgeCheck className="w-4 h-4 text-[#1a663b] shrink-0 mt-0.5" />
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#5a7165]">
                  Quality Note
                </span>
                <span className="text-xs font-bold text-[#112a1d]">
                  {product.nutrition || '100% Chemical-Free & Fresh'}
                </span>
              </div>
            </div>
          </div>

          {/* Add to Cart Controls */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {qty > 0 ? (
              <div className="flex items-center gap-3 rounded-full bg-[#e8f5ee] border border-[#bce3cb] p-1.5">
                <button
                  onClick={() => updateQty(product.id, qty - 1)}
                  className="grid place-items-center w-9 h-9 rounded-full bg-white text-[#112a1d] hover:bg-[#1a663b] hover:text-white transition cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-3 text-sm font-extrabold text-[#14522f]">
                  {qty} in basket
                </span>
                <button
                  onClick={() => addToCart(product, 1)}
                  disabled={qty >= product.stock}
                  className="grid place-items-center w-9 h-9 rounded-full bg-[#1a663b] text-white hover:bg-[#14522f] transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="lg"
                disabled={outOfStock}
                onClick={() => addToCart(product, 1)}
                className="flex-1"
              >
                <ShoppingBasket className="w-5 h-5" />
                Add to Basket — {formatBDT(product.price)}
              </Button>
            )}

            {qty > 0 && (
              <Button
                variant="forest"
                size="lg"
                onClick={() => {
                  onClose();
                  setIsCartOpen(true);
                }}
              >
                View Basket & Checkout
              </Button>
            )}
          </div>

          {/* Promises */}
          <div className="mt-6 pt-5 border-t border-[#e5efe8] flex flex-wrap items-center justify-between gap-3 text-xs text-[#5a7165]">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Truck className="w-4 h-4 text-[#1a663b]" />
              Cash on Delivery Available
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#1a663b]" />
              24-Hour Freshness Replacement Guarantee
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

