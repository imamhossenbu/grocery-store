import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CartSkeleton, CartView } from '@/components/cart/CartView';
import { getPublicCoupons } from '@/lib/data/catalog';

export const metadata: Metadata = {
  title: 'Your basket',
  description: 'Review the items in your FreshBasket basket, apply a coupon and check out with cash on delivery.',
  robots: { index: false, follow: true },
};

async function CartWithOffers() {
  const coupons = await getPublicCoupons().catch(() => []);
  return <CartView coupons={coupons} />;
}

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <Breadcrumbs items={[{ label: 'Basket' }]} />
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#112a1d] sm:text-4xl">Your basket</h1>
      <p className="mt-1 text-sm text-[#5a7165]">Same-day delivery across Dhaka · Pay cash when your groceries arrive.</p>
      <div className="mt-6 sm:mt-8">
        <Suspense fallback={<CartSkeleton />}>
          <CartWithOffers />
        </Suspense>
      </div>
    </div>
  );
}
