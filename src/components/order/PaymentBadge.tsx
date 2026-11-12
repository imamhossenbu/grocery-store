import type { PaymentMethod, PaymentStatus } from '@/types/store';

const STYLE: Record<PaymentStatus, string> = {
  unpaid: 'bg-[#f0f7f2] text-[#14522f] border-[#cfe3d6]',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  paid: 'bg-[#e3f5ea] text-[#145732] border-[#bce3cb]',
  failed: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  refunded: 'bg-sky-50 text-sky-800 border-sky-200',
};

export function paymentStatusLabel(method: PaymentMethod, status: PaymentStatus): string {
  if (method === 'cod') return status === 'paid' ? 'Paid' : status === 'refunded' ? 'Refunded' : 'Pay on delivery';
  switch (status) {
    case 'pending':
      return 'Awaiting payment';
    case 'paid':
      return 'Paid';
    case 'failed':
      return 'Payment failed';
    case 'cancelled':
      return 'Payment cancelled';
    case 'refunded':
      return 'Refunded';
    default:
      return 'Unpaid';
  }
}

export function paymentMethodLabel(method: PaymentMethod): string {
  return method === 'sslcommerz' ? 'Online (SSLCommerz)' : 'Cash on delivery';
}

export function PaymentBadge({ method, status }: { method: PaymentMethod; status: PaymentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${STYLE[status] ?? STYLE.unpaid}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {paymentStatusLabel(method, status)}
    </span>
  );
}
