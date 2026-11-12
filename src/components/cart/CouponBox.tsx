'use client';

import { useId, useState, useTransition } from 'react';
import { CheckCircle2, Loader2, Tag, X } from 'lucide-react';
import { Input } from '@/components/ui/Field';
import { useShop } from '@/context/ShopContext';
import { validateCoupon } from '@/actions/orders';
import { formatBDT } from '@/lib/format';
import type { Coupon } from '@/types/store';

/**
 * Coupon entry + one-click chips. The coupon is checked on the server against
 * the database; the context keeps it only to show the discount preview.
 */
export function CouponBox({ coupons, compact = false }: { coupons: Coupon[]; compact?: boolean }) {
  const { cart, coupon, setCoupon, subtotal, toast } = useShop();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputId = useId();
  const errorId = `${inputId}-error`;

  const apply = (raw: string) => {
    const value = raw.trim().toUpperCase();
    if (!value) {
      setError('Enter a coupon code.');
      return;
    }
    setError(null);
    setPendingCode(value);
    startTransition(async () => {
      const res = await validateCoupon(value, cart.map((i) => ({ id: i.id, qty: i.qty })));
      setPendingCode(null);
      if (res.ok) {
        setCoupon(res.coupon);
        setCode('');
        toast('Coupon applied', `${res.coupon.code} · you save ${formatBDT(res.discount)}`);
      } else {
        setError(res.error);
      }
    });
  };

  const shortfall = coupon ? coupon.minSubtotal - subtotal : 0;

  return (
    <div className={compact ? '' : 'rounded-2xl border border-[#dfece3] bg-white p-5 shadow-soft'}>
      {!compact && (
        <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-[#14522f]">
          <Tag className="h-4 w-4" aria-hidden /> Coupon
        </h2>
      )}

      {coupon ? (
        <div className={`${compact ? '' : 'mt-3'} rounded-2xl border border-[#bce3cb] bg-[#f0f9f3] p-3`}>
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1a663b]" aria-hidden />
              <span>
                <strong className="font-extrabold text-[#112a1d]">{coupon.code}</strong>
                <span className="block text-[13px] text-[#3f5649]">{coupon.label}</span>
              </span>
            </p>
            <button
              type="button"
              onClick={() => {
                setCoupon(null);
                toast('Coupon removed', coupon.code, 'info');
              }}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-[#5a7165] hover:bg-white hover:text-red-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden /> Remove
            </button>
          </div>
          {shortfall > 0 && (
            <p className="mt-2 text-xs font-semibold text-amber-800" role="status">
              Add {formatBDT(shortfall)} more to use this coupon (minimum {formatBDT(coupon.minSubtotal)}).
            </p>
          )}
        </div>
      ) : (
        <>
          <form
            className={`${compact ? '' : 'mt-3'} flex gap-2`}
            onSubmit={(e) => {
              e.preventDefault();
              apply(code);
            }}
          >
            <label htmlFor={inputId} className="sr-only">Coupon code</label>
            <Input
              id={inputId}
              size="sm"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              placeholder="Enter coupon code"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={30}
              state={error ? 'error' : 'default'}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              leadingIcon={<Tag />}
              className="h-11 min-w-0 flex-1 rounded-full"
              inputClassName="font-semibold uppercase tracking-wide placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
            />
            <button
              type="submit"
              disabled={isPending || cart.length === 0}
              className="fb-press inline-flex h-11 items-center gap-1.5 rounded-full bg-[#0f2c1d] px-5 text-sm font-bold text-white hover:bg-[#19442e] disabled:opacity-50 cursor-pointer"
            >
              {isPending && pendingCode === code.trim().toUpperCase() && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Apply
            </button>
          </form>
          {error && (
            <p id={errorId} role="alert" className="mt-2 text-[13px] font-semibold text-red-700">{error}</p>
          )}
          {coupons.length > 0 && (
            <div className="mt-3">
              <p className="text-[13px] font-semibold text-[#3f5649]">Available offers</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {coupons.map((c) => {
                  const locked = subtotal < c.minSubtotal;
                  return (
                    <li key={c.code}>
                      <button
                        type="button"
                        onClick={() => apply(c.code)}
                        disabled={isPending || cart.length === 0}
                        aria-label={`Apply ${c.code}: ${c.label}${locked ? ` (spend ${formatBDT(c.minSubtotal - subtotal)} more)` : ''}`}
                        className={`group inline-flex flex-col items-start rounded-2xl border border-dashed px-3 py-1.5 text-left transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                          locked
                            ? 'border-[#d6e4db] bg-white text-[#3f5649] hover:border-[#8fb3a0]'
                            : 'border-[#1a663b]/50 bg-[#f0f9f3] text-[#14522f] hover:border-[#1a663b] hover:bg-[#e3f5ea]'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide">
                          {isPending && pendingCode === c.code ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <Tag className="h-3 w-3" aria-hidden />}
                          {c.code}
                        </span>
                        <span className="text-[13px] leading-tight">{c.label}</span>
                        {locked && <span className="text-xs font-semibold text-amber-800">Spend {formatBDT(c.minSubtotal - subtotal)} more</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
