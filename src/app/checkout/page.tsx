import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getCurrentUser } from '@/lib/supabase/server';
import { getProfileForUser } from '@/lib/data/orders';
import { getPublicCoupons, isDatabaseLive } from '@/lib/data/catalog';
import { isOnlinePaymentEnabled } from '@/lib/payments/sslcommerz';
import { CheckoutForm } from './CheckoutForm';
import { CheckoutSkeleton } from './CheckoutSkeleton';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Enter your delivery details and place your FreshBasket order — cash on delivery or online payment across Dhaka.',
  robots: { index: false, follow: false },
};

async function CheckoutLoader() {
  const [user, live, coupons] = await Promise.all([
    getCurrentUser().catch(() => null),
    isDatabaseLive().catch(() => false),
    getPublicCoupons().catch(() => []),
  ]);
  const profile = user && live ? await getProfileForUser(user.id).catch(() => null) : null;

  return (
    <CheckoutForm
      live={live}
      signedIn={!!user}
      email={user?.email ?? null}
      profile={profile}
      coupons={coupons}
      onlinePayment={isOnlinePaymentEnabled()}
    />
  );
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <Breadcrumbs items={[{ label: 'Basket', href: '/cart' }, { label: 'Checkout' }]} />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#112a1d] sm:text-4xl">Checkout</h1>
          <p className="mt-1 text-sm text-[#5a7165]">A few details and your groceries are on their way.</p>
        </div>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f5ee] px-3 py-1.5 text-xs font-bold text-[#14522f]">
          <ShieldCheck className="h-4 w-4" aria-hidden /> Secure checkout · Cash on delivery or pay online
        </p>
      </div>
      <div className="mt-6 sm:mt-8">
        <Suspense fallback={<CheckoutSkeleton />}>
          <CheckoutLoader />
        </Suspense>
      </div>
    </div>
  );
}
