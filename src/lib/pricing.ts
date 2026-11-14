import type { Coupon } from '@/types/store';
import { formatBDT } from '@/lib/format';

/**
 * Delivery charges, editable in the admin panel (Settings → Delivery).
 *
 * Stored in the `store_settings` table; place_order() in supabase/schema.sql
 * applies the same rule through delivery_fee_for() and is the source of
 * truth. This file only drives what the shopper sees before ordering.
 * Server code reads the live values with getDeliverySettings()
 * (lib/data/settings.ts); client components get them from useShop().delivery.
 */
export interface DeliverySettings {
  /** Fee inside Dhaka district. */
  dhakaFee: number;
  /** Dhaka orders at or above this subtotal deliver free; null = never free. */
  dhakaFreeFrom: number | null;
  /** Courier fee for every other district. */
  outsideFee: number;
  /** Outside-Dhaka orders at or above this deliver free; null = never free. */
  outsideFreeFrom: number | null;
}

/** Used until the settings table exists, and if it can't be read. */
export const DEFAULT_DELIVERY: DeliverySettings = {
  dhakaFee: 60,
  dhakaFreeFrom: 1000,
  outsideFee: 130,
  outsideFreeFrom: null,
};

export function deliveryFeeFor(subtotal: number, s: DeliverySettings, opts?: { outsideDhaka?: boolean }): number {
  if (subtotal <= 0) return 0;
  const fee = opts?.outsideDhaka ? s.outsideFee : s.dhakaFee;
  const freeFrom = opts?.outsideDhaka ? s.outsideFreeFrom : s.dhakaFreeFrom;
  return freeFrom !== null && subtotal >= freeFrom ? 0 : fee;
}

/** "Free delivery in Dhaka over ৳1,000" — or null when Dhaka delivery is never free. */
export function freeDeliveryLine(s: DeliverySettings, place = 'in Dhaka'): string | null {
  if (s.dhakaFreeFrom === null) return null;
  return s.dhakaFreeFrom <= 0 ? `Free delivery ${place}` : `Free delivery ${place} over ${formatBDT(s.dhakaFreeFrom)}`;
}

/** One sentence for the Dhaka rule, e.g. "free on orders over ৳1,000, otherwise ৳60". */
export function dhakaFeeSentence(s: DeliverySettings): string {
  if (s.dhakaFreeFrom === null) return s.dhakaFee > 0 ? `a flat ${formatBDT(s.dhakaFee)}` : 'free';
  if (s.dhakaFreeFrom <= 0 || s.dhakaFee <= 0) return 'free';
  return `free on orders of ${formatBDT(s.dhakaFreeFrom)} or more, otherwise ${formatBDT(s.dhakaFee)}`;
}

/** The outside-Dhaka courier charge, e.g. "a flat ৳130" (callers say "courier"). */
export function outsideFeeSentence(s: DeliverySettings): string {
  const flat = s.outsideFee > 0 ? `a flat ${formatBDT(s.outsideFee)}` : 'free';
  if (s.outsideFreeFrom === null || s.outsideFee <= 0) return flat;
  return `${flat}, free on orders of ${formatBDT(s.outsideFreeFrom)} or more`;
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
