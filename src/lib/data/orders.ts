import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { supabaseAdmin, isMissingTableError } from '@/lib/supabase/admin';
import { normalizePhone } from '@/lib/format';
import { toOrder } from './mappers';
import type { Order, Profile } from '@/types/store';

/**
 * Order reads for the storefront. Orders are private: every read goes through
 * the secret-key client and is gated here (guest access token, owning user,
 * or order id + phone). Nothing in this file is cached — order data is
 * per-customer and must never land in a shared cache entry.
 */

export type OrderLookup =
  | { state: 'ok'; order: Order; accessToken: string }
  | { state: 'not-found' }
  | { state: 'unavailable' };

const ORDER_ID_RE = /^[A-Za-z0-9-]{3,40}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Compare two strings without leaking where they differ (hash first so lengths match). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function isValidOrderId(id: string): boolean {
  return ORDER_ID_RE.test(id);
}

async function fetchOrderRow(id: string) {
  const { data, error } = await supabaseAdmin().from('orders').select('*').eq('id', id).maybeSingle();
  if (isMissingTableError(error)) return { state: 'unavailable' as const };
  if (error) throw new Error(`orders: ${error.message}`);
  return { state: 'ok' as const, row: data as Record<string, unknown> | null };
}

/**
 * Load an order for the order page. Allowed when `token` matches the order's
 * access token, or when `userId` (the signed-in user) owns it. Any other case
 * — including a missing order — returns 'not-found', so the response never
 * reveals whether an order id exists.
 */
export async function getOrderForViewer(
  id: string,
  { token, userId }: { token?: string | null; userId?: string | null }
): Promise<OrderLookup> {
  if (!isValidOrderId(id)) return { state: 'not-found' };
  const res = await fetchOrderRow(id);
  if (res.state === 'unavailable') return res;

  const row = res.row;
  const stored = row ? String(row.access_token ?? '') : '';
  const tokenOk = !!token && UUID_RE.test(token) && safeEqual(token.toLowerCase(), stored.toLowerCase());
  const ownerOk = !!row && !!userId && row.user_id === userId;

  if (!row || !(tokenOk || ownerOk)) return { state: 'not-found' };
  return { state: 'ok', order: toOrder(row), accessToken: stored };
}

/** Track-order lookup: order id and the phone used must both match. */
export async function findOrderByIdAndPhone(id: string, phone: string): Promise<OrderLookup> {
  const wanted = normalizePhone(phone) ?? '';
  const cleanId = id.trim().toUpperCase();
  if (!isValidOrderId(cleanId)) {
    // Still spend the comparison so invalid input costs about the same.
    safeEqual(wanted, '00000000000');
    return { state: 'not-found' };
  }

  const res = await fetchOrderRow(cleanId);
  if (res.state === 'unavailable') return res;

  const row = res.row;
  const storedPhone = row ? normalizePhone(String(row.customer_phone ?? '')) ?? String(row.customer_phone ?? '') : '';
  // Always run the comparison, even with no row, to keep timing uniform.
  const match = safeEqual(wanted, storedPhone || '00000000000') && !!row && !!wanted;
  if (!match || !row) return { state: 'not-found' };
  return { state: 'ok', order: toOrder(row), accessToken: String(row.access_token ?? '') };
}

/** The signed-in shopper's saved delivery details, if the profiles table exists. */
export async function getProfileForUser(userId: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin()
    .from('profiles')
    .select('full_name, phone, address, area, city')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    fullName: String(data.full_name ?? ''),
    phone: String(data.phone ?? ''),
    address: String(data.address ?? ''),
    area: String(data.area ?? ''),
    city: String(data.city ?? 'Dhaka'),
  };
}
