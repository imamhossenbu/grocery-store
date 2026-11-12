import type { Coupon } from '@/types/store';

// Keep these numbers in sync with place_order() in supabase/schema.sql — the
// database is the source of truth; this file only drives what the shopper
// sees before the order is placed.
export const FREE_DELIVERY_THRESHOLD = 1000;
export const DELIVERY_FEE = 60;
/** Flat courier fee for every district except Dhaka (no free-delivery threshold). */
export const OUTSIDE_DHAKA_DELIVERY_FEE = 130;

export function deliveryFeeFor(subtotal: number, opts?: { outsideDhaka?: boolean }): number {
  if (subtotal <= 0) return 0;
  if (opts?.outsideDhaka) return OUTSIDE_DHAKA_DELIVERY_FEE;
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

export function discountFor(coupon: Coupon | null, subtotal: number): number {
  if (!coupon || subtotal < coupon.minSubtotal) return 0;
  if (coupon.discountType === 'fixed') return Math.min(coupon.value, subtotal);
  const raw = Math.round((subtotal * coupon.value) / 100);
  return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
}

export function discountPercent(price: number, oldPrice?: number): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((1 - price / oldPrice) * 100);
}
