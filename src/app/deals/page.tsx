import type { Metadata } from 'next';
import { Flame, Percent, TicketPercent } from 'lucide-react';
import { getDeals, getPublicCoupons } from '@/lib/data/catalog';
import { formatBDT } from '@/lib/format';
import { discountPercent } from '@/lib/pricing';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductGrid } from '@/components/product/ProductCard';
import { CouponCard } from '@/components/shop/CouponCard';
import { DealCountdown } from '@/components/home/DealCountdown';

export const metadata: Metadata = {
  title: 'Deals & offers',
  description: 'Today’s biggest grocery savings in Dhaka: discounted fresh produce, dairy, fish and pantry staples plus coupon codes for your basket.',
  alternates: { canonical: '/deals' },
};

export default async function DealsPage() {
  const [deals, coupons] = await Promise.all([getDeals(200), getPublicCoupons()]);
  const top = deals[0] ? discountPercent(deals[0].price, deals[0].oldPrice) : 0;
  const totalSaving = deals.reduce((s, p) => s + (p.oldPrice! - p.price), 0);

  return (
    <div className="bg-hero-mesh">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Deals & offers' }]} />

        <header className="relative mt-4 overflow-hidden rounded-[2rem] bg-forest-gradient px-6 py-10 shadow-card sm:px-10 sm:py-14">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-[#f5b82e]/20 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5b82e] px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-[#3a2502]">
                <Flame className="h-3.5 w-3.5" /> Today&apos;s deals
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {top > 0 ? `Save up to ${top}% on fresh groceries` : 'Deals & offers'}
              </h1>
              <p className="mt-3 max-w-xl text-sm text-[#d6eadd] sm:text-lg">
                {deals.length > 0
                  ? `${deals.length} products marked down — ${formatBDT(totalSaving)} in combined savings, biggest discounts first.`
                  : 'Fresh markdowns land every morning. Check back soon.'}
              </p>
            </div>
            <DealCountdown />
          </div>
        </header>

        {coupons.length > 0 && (
          <section aria-labelledby="coupons-heading" className="mt-12">
            <h2 id="coupons-heading" className="flex items-center gap-2 font-display text-2xl font-bold text-[#112a1d] sm:text-3xl">
              <TicketPercent className="h-6 w-6 text-[#1a663b]" aria-hidden /> Coupon codes
            </h2>
            <p className="mt-1 text-sm text-[#5a7165]">One coupon per order. Copy a code and paste it at checkout.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coupons.map((c) => (
                <CouponCard key={c.code} coupon={c} />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="deals-heading" className="mt-14">
          <h2 id="deals-heading" className="flex items-center gap-2 font-display text-2xl font-bold text-[#112a1d] sm:text-3xl">
            <Percent className="h-6 w-6 text-[#1a663b]" aria-hidden /> Biggest savings first
          </h2>
          <div className="mt-6">
            {deals.length > 0 ? (
              <ProductGrid products={deals} priorityCount={4} />
            ) : (
              <EmptyState
                icon={<Percent className="h-8 w-8" />}
                title="No markdowns right now"
                description="Our buyers set new deals every morning. Meanwhile, browse the full range at fair everyday prices."
                actionLabel="Shop all products"
                actionHref="/shop"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
