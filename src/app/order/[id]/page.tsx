import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertCircle, ArrowRight, Banknote, CalendarClock, CheckCircle2, Clock, CreditCard, Mail, MapPin, MessageSquareText, Phone, ShoppingBag, UserRound, XCircle } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/server';
import { getOrderForViewer } from '@/lib/data/orders';
import { formatBDT, formatDateTime } from '@/lib/format';
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/constants';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Block } from '@/components/ui/Skeleton';
import { OrderProgress } from '@/components/order/OrderProgress';
import { CopyButton, PrintButton } from '@/components/order/OrderActions';
import { StatusPill } from '@/components/order/StatusPill';
import { PaymentBadge, paymentMethodLabel } from '@/components/order/PaymentBadge';
import { CompletePaymentButton, RetryCheckoutButton } from '@/components/order/PaymentActions';
import { TotalsRows } from '@/components/cart/OrderTotals';
import type { Order } from '@/types/store';

export const metadata: Metadata = {
  title: 'Order details',
  robots: { index: false, follow: false, nocache: true },
  // The URL carries a private access token: never send it to other sites
  // (product images are served from third-party hosts).
  referrer: 'no-referrer',
};

const PRINT_CSS = `
@media print {
  body > :not(main) { display: none !important; }
  body { background: #fff !important; }
  .shadow-soft, .shadow-card, .shadow-glow { box-shadow: none !important; }
  @page { margin: 14mm; }
}`;

type SearchParams = Record<string, string | string[] | undefined>;

export default function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 print:max-w-none print:p-0">
      <style>{PRINT_CSS}</style>
      <div className="print:hidden">
        <Breadcrumbs items={[{ label: 'Order details' }]} />
      </div>
      <Suspense fallback={<OrderSkeleton />}>
        <OrderContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OrderContent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  const [{ id: rawId }, sp] = await Promise.all([params, searchParams]);
  const token = typeof sp.token === 'string' ? sp.token : null;
  const justPlaced = sp.placed === '1';
  const paymentFlag = sp.payment === 'success' || sp.payment === 'failed' || sp.payment === 'cancelled' ? sp.payment : null;

  let id = rawId;
  try {
    id = decodeURIComponent(rawId);
  } catch {
    notFound();
  }

  const user = await getCurrentUser().catch(() => null);
  const res = await getOrderForViewer(id, { token, userId: user?.id ?? null });

  if (res.state === 'unavailable') return <Unavailable />;
  if (res.state !== 'ok') notFound();

  const { order, accessToken } = res;
  const orderUrl = `${SITE_URL}/order/${encodeURIComponent(order.id)}?token=${accessToken}`;

  return (
    <div className="mt-4 space-y-6">
      {/* Print-only invoice header */}
      <div className="hidden items-start justify-between border-b border-[#ccc] pb-4 print:flex">
        <div>
          <p className="font-display text-2xl font-bold">{SITE_NAME}</p>
          <p className="text-xs">{SUPPORT_PHONE} · {SUPPORT_EMAIL}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">Invoice</p>
          <p className="text-xs">Order {order.id}</p>
          <p className="text-xs">{formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      {order.status !== 'Cancelled' &&
        (justPlaced || (paymentFlag === 'success' && order.paymentStatus === 'paid')) && <SuccessHero order={order} />}
      <PaymentNotice order={order} flag={paymentFlag} />

      <section aria-labelledby="order-heading" className="rounded-3xl border border-[#dfece3] bg-white p-5 shadow-soft sm:p-7 print:border-0 print:p-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#5a7165]">Order</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 id="order-heading" className="font-display text-3xl font-bold tracking-tight text-[#112a1d]">{order.id}</h1>
              <CopyButton value={order.id} label="Copy ID" />
            </div>
            <p className="mt-1 text-sm text-[#5a7165]">Placed on {formatDateTime(order.createdAt)}</p>
          </div>
          <StatusPill status={order.status} />
        </div>

        <div className="mt-6 border-t border-[#eef5f0] pt-6 print:hidden">
          <h2 className="sr-only">Delivery progress</h2>
          <OrderProgress status={order.status} history={order.statusHistory ?? []} createdAt={order.createdAt} layout="responsive" />
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2">
        <section aria-labelledby="delivery-heading" className="rounded-3xl border border-[#dfece3] bg-white p-5 shadow-soft sm:p-6">
          <h2 id="delivery-heading" className="font-display text-xl font-bold text-[#112a1d]">Delivery details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Detail icon={<UserRound className="h-4 w-4" />} label="Name" value={order.customer.name} />
            <Detail icon={<Phone className="h-4 w-4" />} label="Phone" value={order.customer.phone} />
            {order.customer.email && <Detail icon={<Mail className="h-4 w-4" />} label="Email" value={order.customer.email} />}
            <Detail
              icon={<MapPin className="h-4 w-4" />}
              label="Address"
              value={`${order.customer.address}, ${order.customer.area}, ${order.customer.city}`}
            />
            <Detail icon={<CalendarClock className="h-4 w-4" />} label="Delivery slot" value={order.customer.deliverySlot} />
            {order.customer.notes && <Detail icon={<MessageSquareText className="h-4 w-4" />} label="Notes" value={order.customer.notes} />}
          </dl>
        </section>

        <section aria-labelledby="payment-heading" className="rounded-3xl border border-[#dfece3] bg-white p-5 shadow-soft sm:p-6">
          <h2 id="payment-heading" className="font-display text-xl font-bold text-[#112a1d]">Payment</h2>
          {order.paymentMethod === 'cod' ? (
            <p className="mt-4 flex items-center gap-2 rounded-2xl bg-[#f0f9f3] px-3 py-2.5 text-sm font-semibold text-[#14522f]">
              <Banknote className="h-4 w-4" aria-hidden /> Cash on delivery
              {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                <span className="ml-auto text-xs font-bold">Pay {formatBDT(order.total)} on arrival</span>
              )}
            </p>
          ) : (
            <div className="mt-4 space-y-3 rounded-2xl bg-[#f0f9f3] px-3 py-2.5 text-sm text-[#14522f]">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                <CreditCard className="h-4 w-4" aria-hidden /> {paymentMethodLabel(order.paymentMethod)}
                <span className="ml-auto">
                  <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} />
                </span>
              </p>
              {order.paymentStatus === 'paid' && order.paidAt && (
                <p className="text-xs">Paid {formatBDT(order.total)} on {formatDateTime(order.paidAt)}.</p>
              )}
              {order.paymentStatus === 'pending' && order.status !== 'Cancelled' && (
                <div className="print:hidden">
                  <p className="mb-2 text-xs">We are holding your items until the payment is complete.</p>
                  <CompletePaymentButton orderId={order.id} token={token} amountLabel={formatBDT(order.total)} />
                </div>
              )}
            </div>
          )}
          <div className="mt-5">
            <TotalsRows
              subtotal={order.subtotal}
              discount={order.discount}
              couponCode={order.couponCode}
              deliveryFee={order.deliveryFee}
              total={order.total}
              itemCount={order.items.reduce((s, i) => s + i.qty, 0)}
            />
          </div>
        </section>
      </div>

      <section aria-labelledby="items-heading" className="overflow-hidden rounded-3xl border border-[#dfece3] bg-white shadow-soft">
        <h2 id="items-heading" className="border-b border-[#eef5f0] px-5 py-4 font-display text-xl font-bold text-[#112a1d] sm:px-6">
          Items ({order.items.length})
        </h2>
        <table className="w-full text-sm">
          <thead className="sr-only print:not-sr-only">
            <tr className="text-left text-xs uppercase tracking-wider text-[#5a7165]">
              <th scope="col" className="px-5 py-2">Item</th>
              <th scope="col" className="px-2 py-2 text-right">Qty</th>
              <th scope="col" className="px-5 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef5f0]">
            {order.items.map((item) => (
              <tr key={item.productId}>
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-xl bg-[#f0f7f2] object-cover print:hidden" />
                    ) : null}
                    <div className="min-w-0">
                      <Link href={`/product/${item.productId}`} className="line-clamp-2 font-bold text-[#112a1d] hover:text-[#1a663b] print:no-underline">
                        {item.name}
                      </Link>
                      <p className="text-xs text-[#5a7165]">{item.unit} · {formatBDT(item.price)} each</p>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-4 text-right font-semibold tabular-nums text-[#445c50]">×{item.qty}</td>
                <td className="px-5 py-4 text-right font-extrabold tabular-nums text-[#112a1d] sm:px-6">{formatBDT(item.price * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <PrintButton />
        <a
          href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, '')}`}
          className="inline-flex items-center gap-2 rounded-full border-2 border-[#cce2d4] bg-white px-5 py-2.5 text-sm font-semibold text-[#112a1d] hover:border-[#1a663b] hover:bg-[#f0f7f2]"
        >
          <Phone className="h-4 w-4" aria-hidden /> Call support
        </a>
        {user && (
          <Link href="/account/orders" className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-[#14522f] hover:bg-[#e8f3ec]">
            My orders
          </Link>
        )}
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:brightness-105 sm:ml-auto"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden /> Continue shopping <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {!user && (
        <aside className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-[#cfe3d6] bg-[#f9fbf9] p-4 text-sm text-[#445c50] print:hidden">
          <p>
            <strong className="text-[#112a1d]">Keep this link private.</strong> Anyone with it can see this order. Bookmark it, or track your order any time with your order ID and phone number.
          </p>
          <CopyButton value={orderUrl} label="Copy order link" />
        </aside>
      )}

      <p className="hidden pt-6 text-center text-xs print:block">
        Thank you for shopping with {SITE_NAME}. Payment:{' '}
        {order.paymentMethod === 'cod' ? 'cash on delivery' : order.paymentStatus === 'paid' ? 'paid online' : 'online (not paid)'}.
      </p>
    </div>
  );
}

function SuccessHero({ order }: { order: Order }) {
  const firstName = order.customer.name.split(' ')[0];
  return (
    <section className="relative overflow-hidden rounded-3xl bg-emerald-gradient p-6 text-white shadow-glow sm:p-8 animate-slideIn print:hidden" aria-live="polite">
      <div aria-hidden className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
      <div aria-hidden className="absolute -bottom-16 right-20 h-40 w-40 rounded-full bg-[#f5b82e]/20" />
      <div className="relative flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 animate-float">
          <CheckCircle2 className="h-8 w-8 text-[#f5b82e]" aria-hidden />
        </span>
        <div>
          <p className="font-display text-2xl font-bold sm:text-3xl">Thank you, {firstName}! Your order is placed.</p>
          <p className="mt-2 max-w-xl text-sm text-[#d7f0e0] sm:text-base">
            {order.paymentMethod === 'sslcommerz' && order.paymentStatus === 'paid' ? (
              <>
                We received your payment of {formatBDT(order.total)}. We&apos;ll deliver in your chosen slot:{' '}
                <strong className="text-white">{order.customer.deliverySlot}</strong>, and call{' '}
                <strong className="text-white">{order.customer.phone}</strong> if we need anything.
              </>
            ) : (
              <>
                We&apos;ll call <strong className="text-white">{order.customer.phone}</strong> shortly to confirm, then deliver in your chosen slot:{' '}
                <strong className="text-white">{order.customer.deliverySlot}</strong>. Please keep {formatBDT(order.total)} ready in cash.
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

/** Banners for online orders: failed / cancelled / still confirming / paid after cancellation. */
function PaymentNotice({ order, flag }: { order: Order; flag: 'success' | 'failed' | 'cancelled' | null }) {
  if (order.paymentMethod !== 'sslcommerz') return null;
  const box = 'flex gap-3 rounded-3xl border p-5 text-sm print:hidden';

  if (order.paymentStatus === 'paid' && order.status === 'Cancelled') {
    return (
      <div role="status" className={`${box} border-amber-200 bg-amber-50 text-amber-900`}>
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-bold">We received your payment after this order was cancelled</p>
          <p className="mt-0.5">
            Don&apos;t worry — we&apos;ll call you to deliver it or refund the full amount. You can also call{' '}
            <a href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, '')}`} className="font-bold underline">{SUPPORT_PHONE}</a>.
          </p>
        </div>
      </div>
    );
  }

  if ((order.paymentStatus === 'failed' || order.paymentStatus === 'cancelled') && order.status === 'Cancelled') {
    const cancelledByShopper = order.paymentStatus === 'cancelled' || flag === 'cancelled';
    return (
      <div role="alert" className={`${box} border-red-200 bg-red-50 text-red-800`}>
        <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="space-y-2">
          <p className="font-bold">{cancelledByShopper ? 'Payment cancelled' : 'Payment failed'} — order cancelled</p>
          <p>Nothing was charged. Try again, or choose cash on delivery at checkout.</p>
          <div className="flex flex-wrap gap-2">
            <RetryCheckoutButton items={order.items} />
            <Link href="/checkout" className="inline-flex items-center rounded-full px-3 py-2 text-xs font-bold text-red-700 hover:underline">
              Go to checkout
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (order.paymentStatus === 'pending' && order.status !== 'Cancelled') {
    return (
      <div role="status" className={`${box} border-amber-200 bg-amber-50 text-amber-900`}>
        <Clock className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          {flag === 'success' ? (
            <>
              <p className="font-bold">We&apos;re confirming your payment</p>
              <p className="mt-0.5">
                This usually takes a moment. If money was taken from your account, please don&apos;t pay again — refresh this page in a
                few minutes or call {SUPPORT_PHONE}.
              </p>
            </>
          ) : (
            <>
              <p className="font-bold">Payment not completed yet</p>
              <p className="mt-0.5">
                Your order is reserved but not confirmed until it is paid. Use <strong>Complete payment</strong> below; unpaid orders are
                cancelled automatically after about an hour.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="relative min-w-0 pl-7">
      <dt className="text-xs font-semibold text-[#5a7165]">
        <span className="absolute left-0 top-0.5 text-[#1a663b]" aria-hidden>{icon}</span>
        {label}
      </dt>
      <dd className="break-words font-semibold text-[#112a1d]">{value}</dd>
    </div>
  );
}

function Unavailable() {
  return (
    <div role="status" className="mt-6 flex gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
      <AlertCircle className="mt-0.5 h-6 w-6 shrink-0" aria-hidden />
      <div>
        <h1 className="font-display text-2xl font-bold">Order details aren&apos;t available yet</h1>
        <p className="mt-1 text-sm">
          Our online store is still being set up, so orders can&apos;t be viewed here right now. For help with an order, call{' '}
          <a href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, '')}`} className="font-bold underline">{SUPPORT_PHONE}</a>.
        </p>
        <Link href="/shop" className="mt-4 inline-block text-sm font-bold underline">Continue shopping</Link>
      </div>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="mt-4 space-y-6" aria-busy="true" aria-label="Loading order">
      <Block className="h-48 rounded-3xl" />
      <div className="grid gap-6 md:grid-cols-2">
        <Block className="h-64 rounded-3xl" />
        <Block className="h-64 rounded-3xl" />
      </div>
      <Block className="h-56 rounded-3xl" />
    </div>
  );
}
