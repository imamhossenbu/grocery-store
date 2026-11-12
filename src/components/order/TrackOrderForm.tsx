'use client';

import { useActionState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Loader2, PackageSearch } from 'lucide-react';
import { trackOrder } from '@/actions/orders';
import { formatBDT, formatDateTime } from '@/lib/format';
import { OrderProgress } from './OrderProgress';
import { StatusPill } from './StatusPill';
import { PaymentBadge, paymentMethodLabel } from './PaymentBadge';
import type { TrackState } from './types';

const INITIAL: TrackState = { status: 'idle' };

const INPUT =
  'w-full rounded-2xl border bg-[#f9fbf9] px-4 py-3 text-sm font-semibold text-[#112a1d] placeholder:font-normal placeholder:text-[#8aa595] focus:bg-white focus:outline-none focus:ring-2';
const inputTone = (bad?: string) =>
  bad ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-[#cfe3d6] focus:border-[#1a663b] focus:ring-[#1a663b]/20';

export function TrackOrderForm({ initialId = '' }: { initialId?: string }) {
  const [result, formAction, pending] = useActionState(trackOrder, INITIAL);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result.status !== 'idle') resultRef.current?.focus();
  }, [result]);

  const fe = result.fieldErrors ?? {};
  const found = result.status === 'found' ? result.result : undefined;

  return (
    <div className="space-y-6">
      <form action={formAction} noValidate className="rounded-3xl border border-[#dfece3] bg-white p-5 shadow-card sm:p-7" aria-busy={pending}>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
          <div>
            <label htmlFor="track-id" className="mb-1.5 block text-sm font-bold text-[#112a1d]">Order ID</label>
            <input
              id="track-id"
              name="orderId"
              defaultValue={result.values?.id ?? initialId}
              placeholder="e.g. FB-240901"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={40}
              required
              aria-invalid={!!fe.id}
              aria-describedby={fe.id ? 'track-id-error' : undefined}
              className={`${INPUT} ${inputTone(fe.id)} uppercase placeholder:normal-case`}
            />
            {fe.id && <p id="track-id-error" className="mt-1.5 text-xs font-semibold text-red-600">{fe.id}</p>}
          </div>
          <div>
            <label htmlFor="track-phone" className="mb-1.5 block text-sm font-bold text-[#112a1d]">Mobile number</label>
            <input
              id="track-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={result.values?.phone ?? ''}
              placeholder="The number used for the order"
              maxLength={30}
              required
              aria-invalid={!!fe.phone}
              aria-describedby={fe.phone ? 'track-phone-error' : undefined}
              className={`${INPUT} ${inputTone(fe.phone)}`}
            />
            {fe.phone && <p id="track-phone-error" className="mt-1.5 text-xs font-semibold text-red-600">{fe.phone}</p>}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-gradient px-6 py-3 text-sm font-bold text-white shadow-glow hover:brightness-105 disabled:opacity-60 cursor-pointer sm:mt-[1.875rem]"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PackageSearch className="h-4 w-4" aria-hidden />}
            {pending ? 'Looking up…' : 'Track order'}
          </button>
        </div>
      </form>

      <div ref={resultRef} tabIndex={-1} className="focus:outline-none" aria-live="polite">
        {(result.status === 'error' || result.status === 'unavailable') && result.message && (
          <div role="alert" className={`flex gap-3 rounded-2xl border p-4 text-sm ${result.status === 'unavailable' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-red-200 bg-red-50 text-red-800'}`}>
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">{result.message}</p>
              {result.status === 'error' && !result.fieldErrors && (
                <p className="mt-1 text-xs">Check the order ID in your confirmation and use the same mobile number you ordered with.</p>
              )}
            </div>
          </div>
        )}

        {found && (
          <section aria-labelledby="track-result" className="rounded-3xl border border-[#dfece3] bg-white p-5 shadow-soft sm:p-7 animate-slideIn">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-[#5a7165]">Order</p>
                <h2 id="track-result" className="font-display text-2xl font-bold text-[#112a1d]">{found.id}</h2>
                <p className="text-sm text-[#5a7165]">Placed {formatDateTime(found.createdAt)}</p>
              </div>
              <StatusPill status={found.status} />
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Fact label="Items" value={String(found.itemCount)} />
              <Fact label={found.paymentMethod === 'cod' ? 'Total (COD)' : 'Total (online)'} value={formatBDT(found.total)} />
              <Fact label="Area" value={found.area} />
              <Fact label="Delivery slot" value={found.deliverySlot} />
            </dl>

            <p className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#445c50]">
              Payment: {paymentMethodLabel(found.paymentMethod)}
              <PaymentBadge method={found.paymentMethod} status={found.paymentStatus} />
            </p>

            <div className="mt-6 border-t border-[#eef5f0] pt-6">
              <OrderProgress status={found.status} history={found.statusHistory} createdAt={found.createdAt} layout="responsive" />
            </div>

            <Link
              href={`/order/${encodeURIComponent(found.id)}?token=${encodeURIComponent(found.accessToken)}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0f2c1d] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#19442e]"
            >
              View full order <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f4f9f5] px-3 py-2.5">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-[#5a7165]">{label}</dt>
      <dd className="mt-0.5 break-words font-bold text-[#112a1d]">{value}</dd>
    </div>
  );
}
