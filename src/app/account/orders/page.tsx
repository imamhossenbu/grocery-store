import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { PackageSearch, ShoppingBasket } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrdersHeader } from '@/components/account/dashboard/headers';
import { OrdersExplorer } from '@/components/account/dashboard/OrdersExplorer';
import { OrdersSkeleton } from '@/components/account/dashboard/skeletons';
import { getAllMyOrders, requireViewer } from '@/lib/data/account';

export const metadata: Metadata = { title: 'Orders' };

export default function AccountOrdersPage() {
  return (
    <>
      <OrdersHeader />
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersContent />
      </Suspense>
    </>
  );
}

async function OrdersContent() {
  await requireViewer('/account/orders');
  const result = await getAllMyOrders();

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
      <div className="fb-crossfade">
        <EmptyState
          icon={<ShoppingBasket className="h-8 w-8" />}
          title="No orders yet"
          description="When you order while signed in, it shows up here so you can track it, reorder and print invoices."
          actionLabel="Browse groceries"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="fb-crossfade space-y-6">
      <OrdersExplorer orders={result.orders} />
      <p className="text-center text-[13px] text-[#3f5649]">
        Ordered as a guest? Find it on the{' '}
        <Link href="/track-order" className="font-semibold text-[#1a663b] hover:underline">track order</Link> page.
      </p>
    </div>
  );
}
