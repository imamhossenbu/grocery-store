import { DELIVERY_SLOTS } from '@/lib/constants';

/**
 * Delivery-day rules shared by the checkout form (to grey out slots) and the
 * placeOrder action (the authority). Dhaka is UTC+6 all year (no DST).
 */

export type DeliveryDay = 'today' | 'tomorrow';
export const DELIVERY_DAYS: readonly DeliveryDay[] = ['today', 'tomorrow'];

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

/** Last Dhaka hour (exclusive) at which a slot can still be booked for today. */
const SAME_DAY_CUTOFF_HOUR: Record<string, number> = {
  Morning: 9,
  Afternoon: 14,
  Evening: 18,
};

export type SlotId = (typeof DELIVERY_SLOTS)[number]['id'];

export function findSlot(id: string) {
  return DELIVERY_SLOTS.find((s) => s.id === id) ?? null;
}

function dhakaParts(nowMs: number) {
  const d = new Date(nowMs + DHAKA_OFFSET_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate(), hour: d.getUTCHours() };
}

export function isSlotAvailable(slotId: string, day: DeliveryDay, nowMs: number): boolean {
  const slot = findSlot(slotId);
  if (!slot) return false;
  if (day === 'tomorrow') return true;
  return dhakaParts(nowMs).hour < (SAME_DAY_CUTOFF_HOUR[slot.label] ?? 0);
}

const DAY_LABEL = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/** "Thu, 12 Nov" for today/tomorrow in Dhaka. */
export function deliveryDateLabel(day: DeliveryDay, nowMs: number): string {
  const { y, m, day: d } = dhakaParts(nowMs);
  return DAY_LABEL.format(new Date(Date.UTC(y, m, d + (day === 'tomorrow' ? 1 : 0))));
}

/**
 * Outside Dhaka district orders go by courier, so there is no slot to pick.
 * Stored in orders.delivery_slot in place of a slot.
 */
export const COURIER_DELIVERY_TEXT = 'Courier delivery · 2–4 days';

/** The text stored in orders.delivery_slot, e.g. "Morning (8:00 AM – 11:00 AM) · Tomorrow, Fri, 13 Nov". */
export function deliverySlotText(slotId: string, day: DeliveryDay, nowMs: number): string {
  return `${slotId} · ${day === 'today' ? 'Today' : 'Tomorrow'}, ${deliveryDateLabel(day, nowMs)}`;
}
