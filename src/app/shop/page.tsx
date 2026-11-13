import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProductListing } from '@/components/shop/ProductListing';
import { ListingSkeleton } from '@/components/shop/ListingSkeleton';
import { parseFilters, type RawSearchParams } from '@/components/shop/params';

export const metadata: Metadata = {
  title: 'Shop all groceries',
  description:
    'Browse fresh fruits, vegetables, dairy, fish, meat, organic food and daily grocery essentials. Same-day delivery in Dhaka with cash on delivery.',
  alternates: { canonical: '/shop' },
};

type SP = Promise<RawSearchParams>;

export default function ShopPage({ searchParams }: { searchParams: SP }) {
  return (
    <div className="bg-hero-mesh">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Shop' }]} />
        <header className="mt-4 mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#112a1d] sm:text-4xl">Shop all groceries</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#5a7165] sm:text-base">
            Farm-fresh produce and pantry staples, sourced daily and delivered to your door across Dhaka.
          </p>
        </header>
        <Suspense fallback={<ListingSkeleton />}>
          <ShopResults searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function ShopResults({ searchParams }: { searchParams: SP }) {
  const filters = parseFilters(await searchParams);
  return <ProductListing basePath="/shop" filters={filters} />;
}
