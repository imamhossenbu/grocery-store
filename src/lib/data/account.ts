import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase/server';
import { supabaseAdmin, isMissingTableError } from '@/lib/supabase/admin';
import { toOrder } from './mappers';
import type { Order, Profile } from '@/types/store';

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
    .select('full_name, phone, address, area, city')
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
