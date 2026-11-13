import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase/server';
import { supabaseAdmin, isMissingTableError } from '@/lib/supabase/admin';
import { profileAddressFields } from '@/lib/address/profile';
import { toOrder } from './mappers';
import { getProductsByIds } from './catalog';
import type { Order, Product, Profile } from '@/types/store';

/**
 * Data access layer for the signed-in customer. Every exported function
 * resolves the user from the request's auth cookies itself and scopes the
 * (RLS-bypassing) admin queries to that user's id — callers can never ask
 * for somebody else's data by passing an id.
 */

export interface Viewer {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  lastSignInAt: string | null;
}

function toViewer(user: User): Viewer {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: user.id,
    email: user.email ?? '',
    fullName: typeof meta.full_name === 'string' ? meta.full_name : '',
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
}

/** The verified user for this request (memoised per request), or null. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  // Opt out of (runtime) prerendering before the Supabase client starts:
  // it reads the clock while loading the session.
  await connection();
  const user = await getCurrentUser();
  return user ? toViewer(user) : null;
});

/** Like getViewer but sends signed-out visitors to /login?next=<path>. */
export async function requireViewer(nextPath: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return viewer;
}

export interface ProfileResult {
  profile: Profile;
  /** false until supabase/schema.sql has been run (profiles table missing). */
  available: boolean;
}

export const getMyProfile = cache(async (): Promise<ProfileResult | null> => {
  const viewer = await getViewer();
  if (!viewer) return null;

  const empty: Profile = { fullName: viewer.fullName, phone: '', address: '', area: '', city: 'Dhaka' };
  const { data, error } = await supabaseAdmin()
    .from('profiles')
    // '*' so the address-picker columns (division … postcode) come along
    // when they exist, without failing on a database that predates them.
    .select('*')
    .eq('id', viewer.id)
    .maybeSingle();

  if (isMissingTableError(error)) return { profile: empty, available: false };
  if (error) throw new Error('Could not load your profile.');
  if (!data) return { profile: empty, available: true };

  return {
    available: true,
    profile: {
      fullName: data.full_name || viewer.fullName,
      phone: data.phone ?? '',
      address: data.address ?? '',
      area: data.area ?? '',
      city: data.city || 'Dhaka',
      ...profileAddressFields(data),
    },
  };
});

export interface MyOrder {
  order: Order;
  accessToken: string;
}

export interface MyOrdersResult {
  orders: MyOrder[];
  total: number;
  /** false until supabase/schema.sql has been run (orders table missing). */
  available: boolean;
}

export async function getMyOrders(limit = 50): Promise<MyOrdersResult | null> {
  const viewer = await getViewer();
  if (!viewer) return null;

  const { data, error, count } = await supabaseAdmin()
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('user_id', viewer.id)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(1, limit), 100));

  if (isMissingTableError(error)) return { orders: [], total: 0, available: false };
  if (error) throw new Error('Could not load your orders.');

  const rows = (data ?? []) as Record<string, unknown>[];
  return {
    available: true,
    total: count ?? rows.length,
    orders: rows.map((r) => ({ order: toOrder(r), accessToken: String(r.access_token ?? '') })),
  };
}

/**
 * Every order of the signed-in user (newest first, capped at 500), memoised
 * per request so the sidebar counts and the page share one query.
 */
export const getAllMyOrders = cache(async (): Promise<MyOrdersResult | null> => {
  const viewer = await getViewer();
  if (!viewer) return null;

  const { data, error, count } = await supabaseAdmin()
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('user_id', viewer.id)
    .order('created_at', { ascending: false })
    .range(0, 499);

  if (isMissingTableError(error)) return { orders: [], total: 0, available: false };
  if (error) throw new Error('Could not load your orders.');

  const rows = (data ?? []) as Record<string, unknown>[];
  return {
    available: true,
    total: count ?? rows.length,
    orders: rows.map((r) => ({ order: toOrder(r), accessToken: String(r.access_token ?? '') })),
  };
});

export const ACTIVE_STATUSES: readonly Order['status'][] = ['Pending', 'Confirmed', 'Packed', 'Out for delivery'];

export function isActiveOrder(order: Order): boolean {
  return ACTIVE_STATUSES.includes(order.status);
}

export interface MyReview {
  id: string;
  productId: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  approved: boolean;
  createdAt: string;
  /** Current catalog entry, or null when the product is no longer sold. */
  product: Pick<Product, 'id' | 'name' | 'image' | 'unit'> | null;
}

export interface MyReviewsResult {
  reviews: MyReview[];
  available: boolean;
}

/** The signed-in user's reviews (all products), newest first. */
export const getMyReviews = cache(async (): Promise<MyReviewsResult | null> => {
  const viewer = await getViewer();
  if (!viewer) return null;

  const { data, error } = await supabaseAdmin()
    .from('reviews')
    .select('id, product_id, rating, comment, verified_purchase, approved, created_at')
    .eq('user_id', viewer.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (isMissingTableError(error)) return { reviews: [], available: false };
  if (error) throw new Error('Could not load your reviews.');

  const rows = data ?? [];
  const products = await getProductsByIds(rows.map((r) => String(r.product_id))).catch(() => [] as Product[]);
  const byId = new Map(products.map((p) => [p.id, p]));

  return {
    available: true,
    reviews: rows.map((r) => {
      const p = byId.get(String(r.product_id));
      return {
        id: String(r.id),
        productId: String(r.product_id),
        rating: Number(r.rating),
        comment: String(r.comment ?? ''),
        verifiedPurchase: Boolean(r.verified_purchase),
        approved: r.approved !== false,
        createdAt: String(r.created_at),
        product: p ? { id: p.id, name: p.name, image: p.image, unit: p.unit } : null,
      };
    }),
  };
});

export interface ReviewQueueItem {
  product: Pick<Product, 'id' | 'name' | 'image' | 'unit'>;
  deliveredAt: string;
  orderId: string;
}

/**
 * Products from the user's delivered orders that they haven't reviewed yet
 * and that are still in the catalog (so the review form exists).
 */
export const getReviewQueue = cache(async (): Promise<ReviewQueueItem[]> => {
  const [orders, reviews] = await Promise.all([getAllMyOrders(), getMyReviews()]);
  if (!orders?.available) return [];
  const reviewed = new Set((reviews?.reviews ?? []).map((r) => r.productId));

  const seen = new Map<string, { deliveredAt: string; orderId: string }>();
  for (const { order } of orders.orders) {
    if (order.status !== 'Delivered') continue;
    const deliveredAt = order.statusHistory?.findLast((h) => h.status === 'Delivered')?.at ?? order.createdAt;
    for (const item of order.items) {
      if (!reviewed.has(item.productId) && !seen.has(item.productId)) seen.set(item.productId, { deliveredAt, orderId: order.id });
    }
  }
  if (!seen.size) return [];

  const products = await getProductsByIds([...seen.keys()]).catch(() => [] as Product[]);
  return products
    .map((p) => ({ product: { id: p.id, name: p.name, image: p.image, unit: p.unit }, ...seen.get(p.id)! }))
    .sort((a, b) => b.deliveredAt.localeCompare(a.deliveredAt));
});

export interface AccountSummary {
  viewer: Viewer;
  displayName: string;
  totalOrders: number;
  activeOrders: number;
  awaitingReviews: number;
}

/** Identity + live counts for the dashboard sidebar. */
export async function getAccountSummary(): Promise<AccountSummary | null> {
  const viewer = await getViewer();
  if (!viewer) return null;
  const [profile, orders, queue] = await Promise.all([
    getMyProfile().catch(() => null),
    getAllMyOrders().catch(() => null),
    getReviewQueue().catch(() => [] as ReviewQueueItem[]),
  ]);
  const list = orders?.orders ?? [];
  return {
    viewer,
    displayName: profile?.profile.fullName || viewer.fullName || viewer.email.split('@')[0],
    totalOrders: orders?.total ?? 0,
    activeOrders: list.filter(({ order }) => isActiveOrder(order)).length,
    awaitingReviews: queue.length,
  };
}
