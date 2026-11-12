import type { MyOrder } from '@/lib/data/account';

/** Links for an order owned by the signed-in user (server- and client-safe). */
export function orderUrl({ order, accessToken }: MyOrder, extra?: Record<string, string>) {
  const params = new URLSearchParams();
  if (accessToken) params.set('token', accessToken);
  for (const [k, v] of Object.entries(extra ?? {})) params.set(k, v);
  const q = params.toString();
  return `/order/${encodeURIComponent(order.id)}${q ? `?${q}` : ''}`;
}

export function canPayNow({ order }: MyOrder) {
  return order.paymentMethod === 'sslcommerz' && order.paymentStatus === 'pending' && order.status !== 'Cancelled';
}
