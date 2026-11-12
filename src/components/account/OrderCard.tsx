import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { OrderStatus } from '@/types/store';
import type { MyOrder } from '@/lib/data/account';
import { formatBDT, formatDateTime } from '@/lib/format';

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
  Confirmed: 'bg-sky-50 text-sky-800 border-sky-200',
  Packed: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  'Out for delivery': 'bg-[#fef3c7] text-[#78350f] border-[#fde68a]',
  Delivered: 'bg-[#e3f5ea] text-[#145732] border-[#bce3cb]',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[status] ?? STATUS_STYLES.Pending}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}

export function orderHref({ order, accessToken }: MyOrder) {
  const base = `/order/${encodeURIComponent(order.id)}`;
  return accessToken ? `${base}?token=${encodeURIComponent(accessToken)}` : base;
}

export function OrderCard({ entry }: { entry: MyOrder }) {
  const { order } = entry;
  const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
  const thumbs = order.items.slice(0, 4);
  const extra = order.items.length - thumbs.length;

  return (
    <article className="group relative rounded-3xl border border-[#dfece3] bg-white p-4 shadow-soft transition hover:border-[#1a663b]/40 hover:shadow-card sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-[#112a1d]">
            <Link href={orderHref(entry)} className="after:absolute after:inset-0 after:rounded-3xl focus:outline-none">
              Order {order.id}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-[#5a7165]">
            Placed {formatDateTime(order.createdAt)} · {itemCount} item{itemCount === 1 ? '' : 's'}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <ul className="flex items-center -space-x-2" aria-label="Items">
          {thumbs.map((item) => (
            <li key={item.productId} className="h-11 w-11 overflow-hidden rounded-xl border-2 border-white bg-[#f0f7f2] shadow-sm sm:h-12 sm:w-12">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <span className="sr-only">{item.name}</span>
              )}
            </li>
          ))}
          {extra > 0 && (
            <li className="grid h-11 w-11 place-items-center rounded-xl border-2 border-white bg-[#e8f5ee] text-xs font-bold text-[#14522f] shadow-sm sm:h-12 sm:w-12">
              +{extra}
            </li>
          )}
        </ul>
        <div className="flex items-center gap-2 text-right">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#7e9688]">Total</p>
            <p className="text-lg font-extrabold text-[#1a663b]">{formatBDT(order.total)}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-[#9ab5a5] transition group-hover:translate-x-0.5 group-hover:text-[#1a663b]" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 text-xs text-[#5a7165]">
        {order.customer.deliverySlot} · {order.customer.area}
      </p>
    </article>
  );
}

export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse rounded-3xl border border-[#e2efe6] bg-white p-5">
          <div className="flex justify-between">
            <div className="h-5 w-40 rounded-full bg-[#e8f2ec]" />
            <div className="h-6 w-20 rounded-full bg-[#eef5f0]" />
          </div>
          <div className="mt-5 flex justify-between">
            <div className="flex gap-1">
              {[0, 1, 2].map((j) => <div key={j} className="h-12 w-12 rounded-xl bg-[#e8f2ec]" />)}
            </div>
            <div className="h-8 w-20 rounded-lg bg-[#e8f2ec]" />
          </div>
        </div>
      ))}
    </div>
  );
}
