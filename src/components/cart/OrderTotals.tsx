import { Truck } from 'lucide-react';
import { formatBDT } from '@/lib/format';
import { FREE_DELIVERY_THRESHOLD, OUTSIDE_DHAKA_DELIVERY_FEE } from '@/lib/pricing';

export function FreeDeliveryProgress({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const progress = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));
  return (
    <div className="rounded-2xl border border-[#d5eadc] bg-[#f4f9f5] p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-[#14522f]">
        <Truck className="h-4 w-4 shrink-0" aria-hidden />
        {remaining > 0 ? (
          <span>
            Add <strong className="font-extrabold">{formatBDT(remaining)}</strong> more for <strong className="font-extrabold">free delivery</strong>
          </span>
        ) : (
          <span>You&apos;ve unlocked <strong className="font-extrabold">free delivery</strong>!</span>
        )}
      </p>
      <div
        className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#dcebe2]"
        role="progressbar"
        aria-label="Progress towards free delivery"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div className="h-full rounded-full bg-emerald-gradient transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-[13px] text-[#3f5649]">Inside Dhaka. Outside Dhaka, courier delivery is a flat {formatBDT(OUTSIDE_DHAKA_DELIVERY_FEE)}.</p>
    </div>
  );
}

export function TotalsRows({
  subtotal,
  discount,
  couponCode,
  deliveryFee,
  total,
  itemCount,
}: {
  subtotal: number;
  discount: number;
  couponCode?: string | null;
  deliveryFee: number;
  total: number;
  itemCount?: number;
}) {
  return (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between text-[#445c50]">
        <dt>Subtotal{itemCount !== undefined ? ` (${itemCount} item${itemCount === 1 ? '' : 's'})` : ''}</dt>
        <dd className="font-semibold text-[#112a1d]">{formatBDT(subtotal)}</dd>
      </div>
      {discount > 0 && (
        <div className="flex justify-between font-semibold text-[#1a663b]">
          <dt>Discount{couponCode ? ` (${couponCode})` : ''}</dt>
          <dd>−{formatBDT(discount)}</dd>
        </div>
      )}
      <div className="flex justify-between text-[#445c50]">
        <dt>Delivery</dt>
        <dd className={deliveryFee === 0 ? 'font-bold text-[#1a663b]' : 'font-semibold text-[#112a1d]'}>
          {deliveryFee === 0 ? 'Free' : formatBDT(deliveryFee)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-dashed border-[#d5e6db] pt-3">
        <dt className="text-base font-extrabold text-[#112a1d]">Total</dt>
        <dd className="font-display text-2xl font-bold text-[#112a1d]">{formatBDT(total)}</dd>
      </div>
    </dl>
  );
}
