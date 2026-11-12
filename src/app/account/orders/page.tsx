import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { PackageSearch, ShoppingBasket } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrderCard, OrderListSkeleton } from '@/components/account/OrderCard';
import { getMyOrders, requireViewer } from '@/lib/data/account';

export const metadata: Metadata = { title: 'Orders' };

export default function AccountOrdersPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'My account', href: '/account' }, { label: 'Orders' }]} />
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#112a1d] sm:text-4xl">My orders</h1>
        <p className="mt-1 text-sm text-[#5a7165]">Every order placed while signed in, newest first. Tap one for full details and live status.</p>
      </div>
      <Suspense fallback={<OrderListSkeleton count={4} />}>
        <OrdersList />
      </Suspense>
    </div>
  );
}

async function OrdersList() {
  await requireViewer('/account/orders');
  const result = await getMyOrders(100);

  if (!result || !result.available) {
    return (
      <EmptyState
        icon={<PackageSearch className="h-8 w-8" />}
        title="Order history isn’t available yet"
        description="We’re finishing our setup. You can still follow any order using its order number and your phone number."
        actionLabel="Track an order"
        actionHref="/track-order"
      />
    );
  }

  if (result.orders.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBasket className="h-8 w-8" />}
        title="No orders yet"
        description="When you order while signed in, it shows up here so you can follow it and see what you bought."
        actionLabel="Browse groceries"
        actionHref="/shop"
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#5a7165]" aria-live="polite">
        Showing {result.orders.length} of {result.total} order{result.total === 1 ? '' : 's'}
      </p>
      <ul className="space-y-4">
        {result.orders.map((entry) => (
          <li key={entry.order.id}><OrderCard entry={entry} /></li>
        ))}
      </ul>
      <p className="pt-2 text-center text-xs text-[#7e9688]">
        Ordered as a guest? Find it on the <Link href="/track-order" className="font-semibold text-[#1a663b] hover:underline">track order</Link> page.
      </p>
    </div>
  );
}
