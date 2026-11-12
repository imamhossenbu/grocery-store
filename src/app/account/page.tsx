import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  ArrowRight,
  BadgePercent,
  CalendarClock,
  CheckCircle2,
  CircleX,
  Clock,
  ClipboardCheck,
  MapPin,
  Package,
  PackageCheck,
  PencilLine,
  Phone,
  Repeat,
  ShoppingBasket,
  Truck,
  Wallet,
} from 'lucide-react';
import { connection } from 'next/server';
import { OverviewHero } from '@/components/account/dashboard/OverviewHero';
import { OrderTile } from '@/components/account/dashboard/OrderTile';
import { orderUrl } from '@/components/account/dashboard/order-links';
import { SegmentBar } from '@/components/account/dashboard/SegmentBar';
import { SpendingChart } from '@/components/account/dashboard/SpendingChart';
import { ProductStrip, RecentlyViewedStrip } from '@/components/account/dashboard/ProductStrip';
import { Panel } from '@/components/account/dashboard/PageHeader';
import { OverviewSkeleton } from '@/components/account/dashboard/skeletons';
import { OrderProgress } from '@/components/order/OrderProgress';
import { StatusPill } from '@/components/order/StatusPill';
import { CountUp } from '@/components/ui/CountUp';
import { getAllMyOrders, getMyProfile, isActiveOrder, requireViewer, type MyOrder } from '@/lib/data/account';
import { getProductsByIds } from '@/lib/data/catalog';
import { buyAgainIds, monthlySpendingUntilNow, orderKpis, statusBreakdown } from '@/lib/account-stats';
import { formatBDT, formatDateTime } from '@/lib/format';
import type { OrderStatus, Profile } from '@/types/store';
import { Reveal } from '@/components/ui/motion';

export const metadata: Metadata = { title: { absolute: 'My account | FreshBasket' } };

export default function AccountOverviewPage() {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const viewer = await requireViewer('/account');
  await connection();
  const [profileResult, ordersResult] = await Promise.all([getMyProfile(), getAllMyOrders()]);
  const profile = profileResult?.profile;
  const entries = ordersResult?.orders ?? [];
  const orders = entries.map((e) => e.order);

  const name = profile?.fullName || viewer.fullName || viewer.email.split('@')[0];
  const firstName = name.split(' ')[0] || 'there';
  const kpis = orderKpis(orders);
  const months = monthlySpendingUntilNow(orders);
  const breakdown = statusBreakdown(orders);
  const activeEntries = entries.filter((e) => isActiveOrder(e.order));
  const activeOrder = activeEntries[0] ?? null;
  const lastOrder = entries.find((e) => e.order.status !== 'Cancelled') ?? null;

  const againIds = buyAgainIds(orders, 14);
  const againProducts = againIds.length
    ? (await getProductsByIds(againIds).catch(() => []))
        .sort((a, b) => againIds.indexOf(a.id) - againIds.indexOf(b.id))
        .map((p) => ({ id: p.id, name: p.name, unit: p.unit, price: p.price, oldPrice: p.oldPrice, image: p.image, stock: p.stock }))
    : [];

  return (
    <div className="fb-crossfade space-y-5 lg:space-y-6">
      <OverviewHero firstName={firstName} activeCount={kpis.activeOrders} activeOrder={activeOrder} lastOrder={lastOrder} />

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Kpi i={0} label="Total orders" icon={<Package />} value={<CountUp value={kpis.totalOrders} />} note={`${kpis.delivered} delivered`} />
        <Kpi i={1} label="Total spent" icon={<Wallet />} value={<CountUp value={kpis.totalSpent} format="bdt" />} note={kpis.averageOrder ? `≈ ${formatBDT(kpis.averageOrder)} per order` : 'No orders yet'} />
        <Kpi i={2} label="Money saved" icon={<BadgePercent />} value={<CountUp value={kpis.saved} format="bdt" />} note="with coupons & deals" accent />
        <Kpi i={3} label="Active orders" icon={<Truck />} value={<CountUp value={kpis.activeOrders} />} note={kpis.activeOrders ? 'On their way to you' : 'Nothing in transit'} />
      </section>

      <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActiveOrderCard entry={activeOrder} more={activeEntries.length - 1} />
        </div>
        <div>
          <AddressCard profile={profile ?? null} available={profileResult?.available !== false} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-3">
        <Reveal as="div" index={2} className="xl:col-span-2">
          <SpendingChart points={months} />
        </Reveal>
        <StatusBreakdownCard breakdown={breakdown} total={orders.length} />
      </div>

      <ProductStrip
        id="buy-again"
        title="Buy again"
        icon={<Repeat />}
        description="Your delivered favourites at today’s prices."
        products={againProducts}
        action={
          <Link href="/account/orders?status=delivered" className="inline-flex items-center gap-1 text-sm font-bold text-[#1a663b] hover:underline">
            Past orders <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      />

      <RecentOrders entries={entries.slice(0, 3)} total={ordersResult?.total ?? 0} available={ordersResult?.available !== false} />

      <RecentlyViewedStrip />
    </div>
  );
}

function Kpi({ i, label, icon, value, note, accent }: { i: number; label: string; icon: React.ReactNode; value: React.ReactNode; note: string; accent?: boolean }) {
  return (
    <Reveal as="div" index={i + 1}
      className={`fb-lift rounded-3xl border p-4 shadow-soft sm:p-5 ${accent ? 'border-[#fde7a8] bg-gradient-to-br from-[#fffaf0] to-white' : 'border-[#dfece3] bg-white'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#3f5649]">{label}</p>
        <span aria-hidden className={`grid h-9 w-9 place-items-center rounded-xl [&>svg]:h-[18px] [&>svg]:w-[18px] ${accent ? 'bg-[#fdf0c4] text-[#8a5a00]' : 'bg-[#e8f5ee] text-[#1a663b]'}`}>
          {icon}
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-[#112a1d] sm:text-[1.75rem]">{value}</p>
      <p className="mt-0.5 truncate text-[13px] text-[#3f5649]">{note}</p>
    </Reveal>
  );
}

function ActiveOrderCard({ entry, more }: { entry: MyOrder | null; more: number }) {
  if (!entry) {
    return (
      <Panel title="Active order" icon={<Truck />} className="h-full" index={1}>
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-[#d9eadf] px-6 py-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e8f5ee] text-[#1a663b]">
            <PackageCheck className="h-7 w-7" aria-hidden />
          </span>
          <p className="mt-4 font-display text-xl font-bold text-[#112a1d]">No orders on the way</p>
          <p className="mt-1 max-w-sm text-sm text-[#3f5649]">Order before 9 AM for morning delivery — same day across Dhaka.</p>
          <Link href="/shop" className="fb-press mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-emerald-gradient px-5 text-sm font-bold text-white shadow-glow hover:brightness-105">
            <ShoppingBasket className="h-4 w-4" aria-hidden /> Start shopping
          </Link>
        </div>
      </Panel>
    );
  }
  const { order } = entry;
  const href = orderUrl(entry);
  const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
  return (
    <Reveal as="section" index={1} aria-labelledby="active-order-title" className="relative h-full overflow-hidden rounded-3xl border border-[#cfe6d8] bg-white shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eef5f0] bg-gradient-to-r from-[#f1faf4] to-white px-5 py-4 sm:px-6">
        <div>
          <p className="flex items-center gap-2 text-[13px] font-semibold text-[#1a663b]">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2ca05d] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1a663b]" />
            </span>
            Active order{more > 0 ? ` · +${more} more` : ''}
          </p>
          <h2 id="active-order-title" className="mt-1 font-display text-xl font-bold text-[#112a1d] sm:text-2xl">
            <Link href={href} className="hover:text-[#1a663b]">{order.id}</Link>
          </h2>
          <p className="text-[13px] text-[#3f5649]">
            Placed {formatDateTime(order.createdAt)} · {itemCount} item{itemCount === 1 ? '' : 's'} · {formatBDT(order.total)}
          </p>
        </div>
        <StatusPill status={order.status} />
      </div>
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3 rounded-2xl bg-[#fff8e6] px-4 py-3 text-sm text-[#5b3d00]">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-[#b7791f]" aria-hidden />
          <div className="min-w-0">
            <p className="font-bold text-[#3a2502]">Estimated delivery</p>
            <p className="truncate">{order.customer.deliverySlot || 'We’ll call to confirm your slot.'}</p>
          </div>
        </div>
        <OrderProgress status={order.status} history={order.statusHistory ?? []} createdAt={order.createdAt} layout="responsive" />
        <div className="flex flex-wrap items-center gap-2 border-t border-[#eef5f0] pt-4">
          <Link href={`${href}#order-heading`} className="fb-press inline-flex h-10 items-center gap-2 rounded-full bg-[#0f2c1d] px-4 text-sm font-bold text-white hover:bg-[#19442e]">
            <Truck className="h-4 w-4" aria-hidden /> Track live
          </Link>
          <Link href={href} className="fb-press inline-flex h-10 items-center gap-2 rounded-full border border-[#d3e5da] px-4 text-sm font-semibold text-[#234835] hover:border-[#1a663b]">
            View details
          </Link>
          <Link href={`/account/support?order=${encodeURIComponent(order.id)}`} className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a663b] hover:underline">
            <Phone className="h-4 w-4" aria-hidden /> Need help?
          </Link>
        </div>
      </div>
    </Reveal>
  );
}

function AddressCard({ profile, available }: { profile: Profile | null; available: boolean }) {
  const has = !!(profile?.address && profile.area);
  return (
    <Panel
      title="Delivery address"
      icon={<MapPin />}
      className="h-full"
      index={2}
      action={
        <Link href="/account/profile" className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-bold text-[#1a663b] hover:bg-[#eef6f1]">
          <PencilLine className="h-3.5 w-3.5" aria-hidden /> {has ? 'Edit' : 'Add'}
        </Link>
      }
    >
      {has ? (
        <div className="rounded-2xl border border-[#e6f0e9] bg-[#f9fcfa] p-4 text-sm">
          <p className="font-bold text-[#112a1d]">{profile!.fullName}</p>
          <p className="mt-1 leading-relaxed text-[#445c50]">{profile!.address}</p>
          <p className="text-[#445c50]">{profile!.area}, {profile!.city}</p>
          {profile!.phone && <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-[#234835]"><Phone className="h-3.5 w-3.5" aria-hidden /> {profile!.phone}</p>}
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#e3f5ea] px-2.5 py-1 text-xs font-bold text-[#145732]">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Default · filled in at checkout
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-4 text-sm">
          <p className="font-bold text-[#3a2502]">{available ? 'No saved address yet' : 'Saved addresses are coming soon'}</p>
          <p className="mt-1 text-[#78350f]">Save it once — checkout fills in your name, phone and address automatically.</p>
          {available && (
            <Link href="/account/profile" className="fb-press mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f5b82e] px-4 text-[13px] font-bold text-[#3a2502] hover:bg-[#e5a91f]">
              <MapPin className="h-3.5 w-3.5" aria-hidden /> Add address
            </Link>
          )}
        </div>
      )}
    </Panel>
  );
}

const STATUS_META: Record<OrderStatus, { color: string; icon: React.ReactNode }> = {
  Pending: { color: '#d99a1e', icon: <Clock /> },
  Confirmed: { color: '#3b82c4', icon: <ClipboardCheck /> },
  Packed: { color: '#6366c9', icon: <Package /> },
  'Out for delivery': { color: '#2ca05d', icon: <Truck /> },
  Delivered: { color: '#14522f', icon: <CheckCircle2 /> },
  Cancelled: { color: '#d14343', icon: <CircleX /> },
};

function StatusBreakdownCard({ breakdown, total }: { breakdown: { status: OrderStatus; count: number }[]; total: number }) {
  return (
    <Panel title="Order status" icon={<PackageCheck />} className="h-full" index={3}>
      {total === 0 ? (
        <p className="rounded-2xl bg-[#f6faf7] px-4 py-8 text-center text-sm text-[#3f5649]">Your order history will show up here.</p>
      ) : (
        <>
          <SegmentBar
            label={breakdown.map((b) => `${b.status}: ${b.count}`).join(', ')}
            segments={breakdown.map((b) => ({ key: b.status, value: b.count, color: STATUS_META[b.status].color }))}
          />
          <ul className="mt-5 space-y-2.5">
            {breakdown.map((b) => (
              <li key={b.status} className="flex items-center gap-3 text-sm">
                <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-lg [&>svg]:h-4 [&>svg]:w-4" style={{ color: STATUS_META[b.status].color, backgroundColor: `${STATUS_META[b.status].color}1a` }}>
                  {STATUS_META[b.status].icon}
                </span>
                <span className="flex-1 font-semibold text-[#234835]">{b.status}</span>
                <span className="font-extrabold tabular-nums text-[#112a1d]">{b.count}</span>
                <span className="w-10 text-right text-[13px] tabular-nums text-[#3f5649]">{Math.round((b.count / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

function RecentOrders({ entries, total, available }: { entries: MyOrder[]; total: number; available: boolean }) {
  return (
    <section aria-labelledby="recent-orders" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 id="recent-orders" className="font-display text-xl font-bold text-[#112a1d] sm:text-2xl">Recent orders</h2>
        {total > 0 && (
          <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm font-bold text-[#1a663b] hover:underline">
            All {total} orders <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>
      {!available ? (
        <p className="rounded-3xl border border-dashed border-[#cfe3d6] bg-white p-6 text-sm text-[#3f5649]">
          Order history isn’t available yet — follow any order from the{' '}
          <Link href="/track-order" className="font-semibold text-[#1a663b] hover:underline">track order</Link> page.
        </p>
      ) : entries.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-[#cfe3d6] bg-white/70 p-8 text-center">
          <ShoppingBasket className="mx-auto h-10 w-10 text-[#1a663b]" aria-hidden />
          <p className="mt-3 font-display text-xl font-bold text-[#112a1d]">No orders yet</p>
          <p className="mt-1 text-sm text-[#3f5649]">Your first basket is a few taps away — delivered today, paid at your door.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((e, i) => (
            <li key={e.order.id}><OrderTile entry={e} index={i} /></li>
          ))}
        </ul>
      )}
    </section>
  );
}
