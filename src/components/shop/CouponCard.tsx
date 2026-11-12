'use client';

import { useState } from 'react';
import { Check, Copy, TicketPercent } from 'lucide-react';
import type { Coupon } from '@/types/store';
import { formatBDT, formatDate } from '@/lib/format';
import { useShop } from '@/context/ShopContext';

export function couponHeadline(c: Coupon): string {
  return c.discountType === 'percent' ? `${c.value}% OFF` : `${formatBDT(c.value)} OFF`;
}

/** Ticket-style coupon with a copy-code button. */
export function CouponCard({ coupon }: { coupon: Coupon }) {
  const { toast } = useShop();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      toast('Coupon code copied', `Paste ${coupon.code} at checkout.`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Copy failed', `Use code ${coupon.code} at checkout.`, 'info');
    }
  };

  return (
    <article className="relative flex overflow-hidden rounded-3xl border border-[#dfece3] bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-1 bg-forest-gradient px-3 py-5 text-center text-white sm:w-32">
        <TicketPercent className="h-6 w-6 text-[#f5b82e]" aria-hidden />
        <span className="font-display text-xl font-bold leading-tight">{couponHeadline(coupon)}</span>
      </div>
      {/* ticket notches */}
      <span aria-hidden className="absolute left-28 top-0 h-3 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f9fbf9] sm:left-32" />
      <span aria-hidden className="absolute bottom-0 left-28 h-3 w-6 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#f9fbf9] sm:left-32" />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 border-l-2 border-dashed border-[#dfece3] p-4">
        <div>
          <h3 className="text-sm font-bold text-[#112a1d]">{coupon.label}</h3>
          <p className="mt-1 text-xs text-[#5a7165]">
            {coupon.minSubtotal > 0 ? `Min. order ${formatBDT(coupon.minSubtotal)}` : 'No minimum order'}
            {coupon.maxDiscount ? ` · Max ${formatBDT(coupon.maxDiscount)} off` : ''}
            {coupon.expiresAt ? ` · Valid till ${formatDate(coupon.expiresAt)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <code className="rounded-lg border border-dashed border-[#1a663b]/50 bg-[#f0f7f2] px-2.5 py-1.5 text-sm font-extrabold tracking-widest text-[#14522f]">
            {coupon.code}
          </code>
          <button
            type="button"
            onClick={copy}
            aria-label={`Copy coupon code ${coupon.code}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#f5b82e] px-3 text-xs font-bold text-[#3a2502] transition hover:bg-[#e5a91f] cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </article>
  );
}
