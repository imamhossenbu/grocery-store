import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { supabaseAdmin, isMissingTableError } from '@/lib/supabase/admin';
import { DEFAULT_DELIVERY, type DeliverySettings } from '@/lib/pricing';

/**
 * Delivery charges from the `store_settings` row the admin edits.
 * Tagged 'settings': the admin's revalidate call drops it at once (no stale
 * copy), so the basket and checkout show the new fee on the next request.
 * Falls back to DEFAULT_DELIVERY (which matches delivery_fee_for()'s own
 * fallback) until the table exists or if it can't be read.
 */
export async function getDeliverySettings(): Promise<DeliverySettings> {
  'use cache';
  cacheLife('hours');
  cacheTag('settings');

  try {
    const { data, error } = await supabaseAdmin()
      .from('store_settings')
      .select('delivery_fee_dhaka, free_delivery_dhaka_from, delivery_fee_outside, free_delivery_outside_from')
      .eq('id', 1)
      .maybeSingle();
    if (error) {
      if (!isMissingTableError(error)) console.error('[settings] could not read store_settings:', error.message);
      return DEFAULT_DELIVERY;
    }
    if (!data) return DEFAULT_DELIVERY;
    const num = (v: unknown, fallback: number) => (Number.isFinite(Number(v)) && v !== null ? Number(v) : fallback);
    const opt = (v: unknown) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));
    return {
      dhakaFee: num(data.delivery_fee_dhaka, DEFAULT_DELIVERY.dhakaFee),
      dhakaFreeFrom: opt(data.free_delivery_dhaka_from),
      outsideFee: num(data.delivery_fee_outside, DEFAULT_DELIVERY.outsideFee),
      outsideFreeFrom: opt(data.free_delivery_outside_from),
    };
  } catch (err) {
    console.error('[settings] could not read store_settings:', err instanceof Error ? err.message : err);
    return DEFAULT_DELIVERY;
  }
}
