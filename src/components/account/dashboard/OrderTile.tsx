'use client';

import Link from 'next/link';
import { CalendarClock, CreditCard, Eye, FileText, LifeBuoy, Loader2, MoreHorizontal, RotateCcw, Truck } from 'lucide-react';
import type { MyOrder } from '@/lib/data/account';
import { StatusPill } from '@/components/order/StatusPill';
import { PaymentBadge } from '@/components/order/PaymentBadge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { formatBDT, formatDateTime } from '@/lib/format';
import { cx } from '@/components/ui/overlay';
import { useReorder } from './useReorder';
import { canPayNow, orderUrl } from './order-links';
import { Reveal } from '@/components/ui/motion';

const ACTIVE = new Set(['Pending', 'Confirmed', 'Packed', 'Out for delivery']);

/** Rich order card for the dashboard: thumbnails, badges, totals and actions. */
export function OrderTile({ entry, index = 0, highlight }: { entry: MyOrder; index?: number; highlight?: string }) {
  const { order } = entry;
  const { reorder, pendingId } = useReorder();
  const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
  const thumbs = order.items.slice(0, 5);
  const extra = order.items.length - thumbs.length;
  const active = ACTIVE.has(order.status);
  const pay = canPayNow(entry);
  const details = orderUrl(entry);
  const busy = pendingId === order.id;

  return (
    <Reveal as="article" index={index}
      className="fb-lift group relative rounded-3xl border border-[#dfece3] bg-white p-4 shadow-soft hover:border-[#1a663b]/35 sm:p-5"
      aria-labelledby={`order-${order.id}`}
    >
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={`order-${order.id}`} className="text-base font-bold tabular-nums text-[#112a1d]">
              <Link href={details} className="rounded-md hover:text-[#1a663b]">
                {highlight ? <Highlight text={order.id} query={highlight} /> : order.id}
              </Link>
            </h3>
            <StatusPill status={order.status} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] tabular-nums text-[#3f5649]">
            <span>{formatDateTime(order.createdAt)}</span>
            <span aria-hidden>·</span>
            <span>{itemCount} item{itemCount === 1 ? '' : 's'}</span>
            <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} />
          </p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-medium text-[#3f5649]">Total</p>
          <p className="text-xl font-extrabold tabular-nums text-[#112a1d]">{formatBDT(order.total)}</p>
          {order.discount > 0 && <p className="text-[13px] font-semibold text-[#1a663b]">Saved {formatBDT(order.discount)}</p>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f5f2] pt-4">
        <ul className="flex items-center -space-x-2.5" aria-label={`${order.items.length} products`}>
          {thumbs.map((item) => (
            <li key={item.productId} title={item.name} className="h-11 w-11 overflow-hidden rounded-xl border-2 border-white bg-[#f0f7f2] shadow-sm sm:h-12 sm:w-12">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <span className="sr-only">{item.name}</span>
              )}
            </li>
          ))}
          {extra > 0 && (
            <li className="grid h-11 w-11 place-items-center rounded-xl border-2 border-white bg-[#e8f5ee] text-xs font-bold text-[#14522f] shadow-sm sm:h-12 sm:w-12">+{extra}</li>
          )}
        </ul>

        <div className="flex flex-wrap items-center gap-2">
          {pay && (
            <Link href={details} className="fb-press inline-flex h-10 items-center gap-2 rounded-full bg-[#f5b82e] px-4 text-sm font-bold text-[#3a2502] shadow-md hover:bg-[#e5a91f]">
              <CreditCard className="h-4 w-4" aria-hidden /> Pay now
            </Link>
          )}
          {active ? (
            <Link href={`${details}#order-heading`} className="fb-press inline-flex h-10 items-center gap-2 rounded-full bg-[#0f2c1d] px-4 text-sm font-bold text-white hover:bg-[#19442e]">
              <Truck className="h-4 w-4" aria-hidden /> Track
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => reorder(order.id, order.items)}
              disabled={busy}
              className="fb-press inline-flex h-10 items-center gap-2 rounded-full bg-emerald-gradient px-4 text-sm font-bold text-white shadow-glow hover:brightness-105 disabled:opacity-70 cursor-pointer"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RotateCcw className="h-4 w-4" aria-hidden />}
              Reorder
            </button>
          )}
          <Link href={details} className="fb-press hidden h-10 items-center gap-2 rounded-full border border-[#d3e5da] bg-white px-4 text-sm font-semibold text-[#234835] hover:border-[#1a663b] sm:inline-flex">
            <Eye className="h-4 w-4" aria-hidden /> Details
          </Link>
          <DropdownMenu
            label={`More actions for order ${order.id}`}
            trigger={<MoreHorizontal className="h-4 w-4" aria-hidden />}
            triggerClassName="fb-press grid h-10 w-10 place-items-center rounded-full border border-[#d3e5da] bg-white text-[#234835] hover:border-[#1a663b] cursor-pointer"
            items={[
              { label: 'View details', href: details, icon: <Eye /> },
              ...(active ? [{ label: 'Track delivery', href: `${details}#order-heading`, icon: <Truck /> }] : []),
              { label: 'Reorder items', icon: <RotateCcw />, onSelect: () => reorder(order.id, order.items), disabled: busy },
              { label: 'Print / save invoice', href: orderUrl(entry, { print: '1' }), icon: <FileText /> },
              ...(pay ? [{ label: 'Pay now', href: details, icon: <CreditCard /> }] : []),
              { type: 'separator' as const },
              { label: 'Get help with this order', href: `/account/support?order=${encodeURIComponent(order.id)}`, icon: <LifeBuoy /> },
            ]}
          />
        </div>
      </div>

      {active && order.customer.deliverySlot && (
        <p className={cx('mt-3 flex items-center gap-2 rounded-2xl bg-[#f4faf6] px-3 py-2 text-[13px] font-medium text-[#234835]')}>
          <CalendarClock className="h-4 w-4 shrink-0 text-[#1a663b]" aria-hidden />
          <span className="truncate">Delivery: {order.customer.deliverySlot} · {order.customer.area}</span>
        </p>
      )}
    </Reveal>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (!query || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-[#fdf0c4] px-0.5 text-inherit">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}
