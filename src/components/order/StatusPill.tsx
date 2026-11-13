import type { OrderStatus } from '@/types/store';

const STATUS_STYLE: Record<OrderStatus, string> = {
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
  Confirmed: 'bg-sky-50 text-sky-800 border-sky-200',
  Packed: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  'Out for delivery': 'bg-[#fef3c7] text-[#78350f] border-[#fde68a]',
  Delivered: 'bg-[#e3f5ea] text-[#145732] border-[#bce3cb]',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider ${STATUS_STYLE[status] ?? STATUS_STYLE.Pending}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  );
}
