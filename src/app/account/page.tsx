import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight, Heart, MapPin, Package, PackageSearch, ShoppingBasket, UserRound } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Block } from '@/components/ui/Skeleton';
import { OrderCard, OrderListSkeleton } from '@/components/account/OrderCard';
import { getMyOrders, getMyProfile, requireViewer } from '@/lib/data/account';
import { formatBDT, formatDate } from '@/lib/format';

export const metadata: Metadata = { title: { absolute: 'My account | FreshBasket' } };

export default function AccountOverviewPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'My account' }]} />
      <Suspense fallback={<OverviewSkeleton />}>
        <Overview />
      </Suspense>
    </div>
  );
}

async function Overview() {
  const viewer = await requireViewer('/account');
  const [profileResult, ordersResult] = await Promise.all([getMyProfile(), getMyOrders(100)]);
  const profile = profileResult?.profile;
  const orders = ordersResult?.orders ?? [];

  const name = profile?.fullName || viewer.fullName;
  const firstName = name.split(' ')[0] || 'there';
  const active = orders.filter(({ order }) => !['Delivered', 'Cancelled'].includes(order.status)).length;
  const spent = orders.filter(({ order }) => order.status !== 'Cancelled').reduce((s, { order }) => s + order.total, 0);
  const hasAddress = !!(profile?.phone && profile.address && profile.area);

  return (
    <>
      <section className="relative overflow-hidden rounded-[2rem] bg-forest-gradient p-6 text-white shadow-card sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#9fd8b5]">My account</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Hello, {firstName}!</h1>
        <p className="mt-2 text-sm text-[#b9d8c5]">
          {viewer.email} · Member since {formatDate(viewer.createdAt)}
        </p>
        <dl className="mt-6 grid grid-cols-3 gap-3 sm:max-w-lg">
          {[
            { label: 'Orders', value: String(ordersResult?.total ?? 0) },
            { label: 'In progress', value: String(active) },
            { label: 'Spent', value: formatBDT(spent) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur">
              <dt className="text-[11px] uppercase tracking-wider text-[#9fd8b5]">{s.label}</dt>
              <dd className="mt-1 text-lg font-extrabold sm:text-xl">{s.value}</dd>
            </div>
          ))}
        </dl>
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#f5b82e]/15 blur-3xl" />
      </section>

      {!hasAddress && profileResult?.available !== false && (
        <Link
          href="/account/profile"
          className="flex items-center gap-4 rounded-3xl border border-[#fde68a] bg-[#fffbeb] p-4 text-sm transition hover:border-[#f5b82e] sm:p-5"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f5b82e] text-[#3a2502]">
            <MapPin className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block font-bold text-[#3a2502]">Save your delivery address</span>
            <span className="text-[#78350f]">Add your mobile number and address once — checkout fills them in automatically.</span>
          </span>
          <ArrowRight className="h-5 w-5 text-[#78350f]" aria-hidden="true" />
        </Link>
      )}

      <section aria-labelledby="recent-orders" className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 id="recent-orders" className="font-display text-2xl font-bold text-[#112a1d]">Recent orders</h2>
          {orders.length > 0 && (
            <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm font-bold text-[#1a663b] hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        {ordersResult?.available === false ? (
          <p className="rounded-3xl border border-dashed border-[#cfe3d6] bg-white p-6 text-sm text-[#5a7165]">
            Order history isn’t available yet — we’re finishing our setup. Your orders are safe and you can still follow them from the{' '}
            <Link href="/track-order" className="font-semibold text-[#1a663b] hover:underline">track order</Link> page.
          </p>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#cfe3d6] bg-white p-8 text-center">
            <ShoppingBasket className="mx-auto h-10 w-10 text-[#1a663b]" />
            <p className="mt-3 font-display text-xl font-bold text-[#112a1d]">No orders yet</p>
            <p className="mt-1 text-sm text-[#5a7165]">Your first basket is a few taps away — delivered today, paid at your door.</p>
            <Link href="/shop" className="mt-5 inline-flex h-11 items-center rounded-full bg-emerald-gradient px-6 text-sm font-bold text-white shadow-glow">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 3).map((entry) => <OrderCard key={entry.order.id} entry={entry} />)}
          </div>
        )}
      </section>

      <section aria-labelledby="quick-links">
        <h2 id="quick-links" className="sr-only">Quick links</h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { href: '/account/orders', label: 'My orders', icon: Package },
            { href: '/account/profile', label: 'Profile & address', icon: UserRound },
            { href: '/wishlist', label: 'Wishlist', icon: Heart },
            { href: '/track-order', label: 'Track an order', icon: PackageSearch },
          ].map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="flex h-full flex-col gap-3 rounded-3xl border border-[#dfece3] bg-white p-4 text-sm font-bold text-[#112a1d] shadow-soft transition hover:-translate-y-0.5 hover:border-[#1a663b]/40">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e8f5ee] text-[#1a663b]">
                  <Icon className="h-5 w-5" />
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your account">
      <Block className="h-56 rounded-[2rem]" />
      <Block className="h-7 w-48" />
      <OrderListSkeleton count={2} />
    </div>
  );
}
