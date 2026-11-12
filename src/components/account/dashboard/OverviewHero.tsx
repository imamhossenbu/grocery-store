'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { LifeBuoy, Loader2, RotateCcw, Truck } from 'lucide-react';
import type { MyOrder } from '@/lib/data/account';
import { useReorder } from './useReorder';
import { orderUrl } from './order-links';
import { Reveal } from '@/components/ui/motion';

/** Greeting by the current hour in Dhaka (UTC+6), computed in the browser. */
function greetingNow() {
  const hour = new Date(Date.now() + 6 * 3600_000).getUTCHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Hello';
}
const noopSubscribe = () => () => {};

export function OverviewHero({
  firstName,
  activeCount,
  activeOrder,
  lastOrder,
}: {
  firstName: string;
  activeCount: number;
  activeOrder: MyOrder | null;
  lastOrder: MyOrder | null;
}) {
  // Server snapshot is a neutral greeting; the browser swaps in the time-based one.
  const greeting = useSyncExternalStore(noopSubscribe, greetingNow, () => 'Welcome back');
  const { reorder, pendingId } = useReorder();

  const btn = 'fb-press inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold';

  return (
    <Reveal as="section" index={0} className="relative overflow-hidden rounded-[2rem] bg-forest-gradient p-6 text-white shadow-card sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#f5b82e]/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#2ca05d]/25 blur-3xl" />
      <div className="relative">
        <p className="text-sm font-semibold text-[#b9e4c9]">My dashboard</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
          <span suppressHydrationWarning>{greeting}</span>, {firstName}!
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#b9d8c5]">
          {activeCount > 0
            ? `You have ${activeCount} order${activeCount === 1 ? '' : 's'} on the way. Fresh groceries, coming right up.`
            : lastOrder
              ? 'Everything’s delivered. Ready to stock up again?'
              : 'Welcome to FreshBasket — your first basket is a few taps away.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {activeOrder ? (
            <Link href={`${orderUrl(activeOrder)}#order-heading`} className={`${btn} bg-[#f5b82e] text-[#3a2502] shadow-md hover:bg-[#ffc94d]`}>
              <Truck className="h-4 w-4" aria-hidden /> Track order
            </Link>
          ) : (
            <Link href="/track-order" className={`${btn} bg-[#f5b82e] text-[#3a2502] shadow-md hover:bg-[#ffc94d]`}>
              <Truck className="h-4 w-4" aria-hidden /> Track an order
            </Link>
          )}
          {lastOrder && (
            <button
              type="button"
              onClick={() => reorder(lastOrder.order.id, lastOrder.order.items)}
              disabled={pendingId !== null}
              className={`${btn} bg-white/12 text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/20 disabled:opacity-70 cursor-pointer`}
            >
              {pendingId ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RotateCcw className="h-4 w-4" aria-hidden />}
              Reorder last
            </button>
          )}
          <Link href="/account/support" className={`${btn} bg-white/12 text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/20`}>
            <LifeBuoy className="h-4 w-4" aria-hidden /> Contact support
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
