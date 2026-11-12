'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { formatBDT } from '@/lib/supabase-db';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export function CartSlideOver() {
  const {
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    cartLines,
    cartCount,
    subtotal,
    discount,
    appliedCoupon,
    deliveryFee,
    total,
    updateQty,
    removeFromCart,
    clearCart,
    applyCouponCode,
    removeCoupon,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCouponCode(couponInput);
    setCouponFeedback({
      text: res.message,
      isError: !res.ok,
    });
    if (res.ok) setCouponInput('');
  };

  const freeDeliveryThreshold = 1000;
  const progressToFreeDelivery = Math.min(
    100,
    Math.round((subtotal / freeDeliveryThreshold) * 100)
  );

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-[#071a10]/60 backdrop-blur-xs transition-opacity"
      onClick={() => setIsCartOpen(false)}
    >
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className="relative w-screen max-w-md bg-white shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#e2efe6] px-6 py-5 bg-[#f7faf8]">
            <div className="flex items-center gap-2.5">
              <div className="grid place-items-center w-9 h-9 rounded-full bg-emerald-gradient text-white shadow-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-[#112a1d]">
                  Your Basket
                </h3>
                <span className="text-xs font-semibold text-[#5a7165]">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'} selected
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="rounded-full p-2 text-[#5a7165] hover:bg-[#e8f5ee] hover:text-[#112a1d] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Meter */}
          <div className="bg-[#f0f7f2] border-b border-[#dfece3] px-6 py-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#1a663b]">
              <span>
                {subtotal >= freeDeliveryThreshold
                  ? '🎉 You unlocked FREE delivery!'
                  : `Add ${formatBDT(freeDeliveryThreshold - subtotal)} more for FREE delivery`}
              </span>
              <span>{progressToFreeDelivery}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-[#d5e7dc] overflow-hidden">
              <div
                className="h-full bg-emerald-gradient transition-all duration-300 rounded-full"
                style={{ width: `${progressToFreeDelivery}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {cartLines.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag className="w-8 h-8" />}
                title="Your basket is empty"
                description="Browse our farm-fresh fruits, vegetables, and daily groceries to get started."
                actionLabel="Explore Fresh Picks"
                onAction={() => setIsCartOpen(false)}
              />
            ) : (
              cartLines.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 rounded-2xl border border-[#e2efe6] p-3.5 bg-white shadow-soft transition hover:border-[#1a663b]/30"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover bg-[#f0f7f2] shrink-0"
                  />
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-[#112a1d] line-clamp-1">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-[#8ba395] hover:text-red-600 transition cursor-pointer p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-xs text-[#5a7165] font-medium">
                        {item.unit} · {formatBDT(item.price)} each
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Stepper */}
                      <div className="flex items-center rounded-full bg-[#e8f5ee] border border-[#bce3cb] p-0.5">
                        <button
                          onClick={() => updateQty(item.productId, item.qty - 1)}
                          className="w-6 h-6 rounded-full bg-white text-[#112a1d] grid place-items-center hover:bg-[#1a663b] hover:text-white transition cursor-pointer text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-[#14522f]">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.productId, item.qty + 1)}
                          disabled={item.qty >= item.stock}
                          className="w-6 h-6 rounded-full bg-[#1a663b] text-white grid place-items-center hover:bg-[#14522f] disabled:opacity-40 transition cursor-pointer text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-extrabold text-[#1a663b]">
                        {formatBDT(item.lineTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Breakdown */}
          {cartLines.length > 0 && (
            <div className="border-t border-[#e2efe6] bg-[#fbfdfc] px-6 py-5 space-y-4">
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-[#5a7165] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Promo code (e.g. WELCOME50)"
                      className="w-full rounded-xl border border-[#cfe3d6] bg-white pl-9 pr-3 py-2 text-xs uppercase tracking-wide focus:border-[#1a663b] focus:outline-none"
                    />
                  </div>
                  <Button variant="secondary" size="sm" type="submit">
                    Apply
                  </Button>
                </div>
                {couponFeedback && (
                  <p
                    className={`text-[11px] font-semibold ${
                      couponFeedback.isError ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {couponFeedback.text}
                  </p>
                )}
                {appliedCoupon && (
                  <div className="flex items-center justify-between rounded-xl bg-[#e8f5ee] px-3 py-1.5 text-xs text-[#14522f]">
                    <span className="inline-flex items-center gap-1 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-[#1a663b]" />
                      {appliedCoupon.code} applied ({appliedCoupon.label})
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </form>

              {/* Price Calculation */}
              <div className="space-y-1.5 text-xs text-[#5a7165]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#112a1d]">
                    {formatBDT(subtotal)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount</span>
                    <span>-{formatBDT(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-[#112a1d]">
                    {deliveryFee === 0 ? (
                      <strong className="text-emerald-700">FREE</strong>
                    ) : (
                      formatBDT(deliveryFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#e2efe6] pt-2 text-base font-extrabold text-[#112a1d]">
                  <span>Total Payable (COD)</span>
                  <span className="text-[#1a663b]">{formatBDT(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-between"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                >
                  <span>Proceed to Cash on Delivery</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <div className="mt-2 text-center">
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-[#789283] hover:text-red-600 transition cursor-pointer"
                  >
                    Empty Entire Basket
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

