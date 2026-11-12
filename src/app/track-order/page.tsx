import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Headphones, PackageSearch } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { TrackOrderForm } from '@/components/order/TrackOrderForm';
import { SUPPORT_PHONE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Track your order',
  description: 'Check the delivery status of your FreshBasket order with your order ID and mobile number.',
  alternates: { canonical: '/track-order' },
};

type SearchParams = Record<string, string | string[] | undefined>;

async function PrefilledForm({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const id = typeof sp.id === 'string' ? sp.id.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40) : '';
  return <TrackOrderForm initialId={id} />;
}

export default function TrackOrderPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <Breadcrumbs items={[{ label: 'Track order' }]} />
      <div className="mt-4 flex items-start gap-4">
        <span className="hidden h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#e8f5ee] text-[#1a663b] sm:grid">
          <PackageSearch className="h-7 w-7" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#112a1d] sm:text-4xl">Track your order</h1>
          <p className="mt-1 text-sm text-[#5a7165] sm:text-base">
            Enter the order ID from your confirmation and the mobile number you ordered with.
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        <Suspense fallback={<TrackOrderForm />}>
          <PrefilledForm searchParams={searchParams} />
        </Suspense>
      </div>

      <p className="mt-8 flex items-center gap-2 text-sm text-[#5a7165]">
        <Headphones className="h-4 w-4 text-[#1a663b]" aria-hidden />
        Need help? Call us on{' '}
        <a href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, '')}`} className="font-bold text-[#1a663b] hover:underline">{SUPPORT_PHONE}</a>
      </p>
    </div>
  );
}
