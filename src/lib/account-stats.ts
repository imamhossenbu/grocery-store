import type { Order, OrderStatus } from '@/types/store';

/**
 * Pure helpers that turn a customer's order list into dashboard numbers.
 * No I/O: callable from server or client code.
 */

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const MONTH_LABEL = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });
const MONTH_LONG = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export interface MonthPoint {
  /** "2026-11" */
  key: string;
  /** "Nov" */
  label: string;
  /** "November 2026" */
  longLabel: string;
  spent: number;
  orders: number;
}

function dhakaMonthKey(ms: number) {
  const d = new Date(ms + DHAKA_OFFSET_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** monthlySpending() for the current time. Call only from request-time code. */
export function monthlySpendingUntilNow(orders: Order[], months = 6): MonthPoint[] {
  return monthlySpending(orders, Date.now(), months);
}

/** Spending (non-cancelled order totals) per Dhaka calendar month, oldest first. */
export function monthlySpending(orders: Order[], nowMs: number, months = 6): MonthPoint[] {
  const now = new Date(nowMs + DHAKA_OFFSET_MS);
  const points: MonthPoint[] = [];
  const index = new Map<string, MonthPoint>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const p = { key, label: MONTH_LABEL.format(d), longLabel: MONTH_LONG.format(d), spent: 0, orders: 0 };
    points.push(p);
    index.set(key, p);
  }
  for (const o of orders) {
    if (o.status === 'Cancelled') continue;
    const p = index.get(dhakaMonthKey(Date.parse(o.createdAt)));
    if (p) {
      p.spent += o.total;
      p.orders += 1;
    }
  }
  return points;
}

export interface OrderKpis {
  totalOrders: number;
  activeOrders: number;
  delivered: number;
  cancelled: number;
  totalSpent: number;
  /** Coupon discounts + free delivery value on non-cancelled orders. */
  saved: number;
  averageOrder: number;
}

export function orderKpis(orders: Order[]): OrderKpis {
  let totalSpent = 0;
  let saved = 0;
  let counted = 0;
  let active = 0;
  let delivered = 0;
  let cancelled = 0;
  for (const o of orders) {
    if (o.status === 'Cancelled') {
      cancelled++;
      continue;
    }
    if (o.status === 'Delivered') delivered++;
    else active++;
    counted++;
    totalSpent += o.total;
    saved += Math.max(0, o.discount);
  }
  return {
    totalOrders: orders.length,
    activeOrders: active,
    delivered,
    cancelled,
    totalSpent,
    saved,
    averageOrder: counted ? totalSpent / counted : 0,
  };
}

export const STATUS_ORDER: OrderStatus[] = ['Pending', 'Confirmed', 'Packed', 'Out for delivery', 'Delivered', 'Cancelled'];

export function statusBreakdown(orders: Order[]): { status: OrderStatus; count: number }[] {
  const counts = new Map<OrderStatus, number>();
  for (const o of orders) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
  return STATUS_ORDER.map((status) => ({ status, count: counts.get(status) ?? 0 })).filter((s) => s.count > 0);
}

/** Product ids from delivered orders, most often bought first. */
export function buyAgainIds(orders: Order[], limit = 12): string[] {
  const score = new Map<string, { qty: number; last: string }>();
  for (const o of orders) {
    if (o.status !== 'Delivered') continue;
    for (const i of o.items) {
      const s = score.get(i.productId) ?? { qty: 0, last: '' };
      s.qty += i.qty;
      if (o.createdAt > s.last) s.last = o.createdAt;
      score.set(i.productId, s);
    }
  }
  return [...score.entries()]
    .sort((a, b) => b[1].qty - a[1].qty || b[1].last.localeCompare(a[1].last))
    .slice(0, limit)
    .map(([id]) => id);
}
