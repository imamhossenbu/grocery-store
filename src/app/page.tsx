import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';
import {
  getBestSellers,
  getCategories,
  getDeals,
  getFeaturedProducts,
  getNewArrivals,
  getPublicCoupons,
} from '@/lib/data/catalog';
import { SITE_NAME, SITE_URL, SUPPORT_PHONE } from '@/lib/constants';
import { discountPercent } from '@/lib/pricing';
import { ProductRail } from '@/components/product/ProductRail';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import { JsonLd } from '@/components/product/JsonLd';
import { CouponCard } from '@/components/shop/CouponCard';
import { Hero } from '@/components/home/Hero';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { DealCountdown } from '@/components/home/DealCountdown';
import { HomeSection } from '@/components/home/HomeSection';
import { WhyChooseUsSection } from '@/components/home/WhyChooseUsSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [categories, featured, deals, bestSellers, newArrivals, coupons] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
    getDeals(8),
    getBestSellers(4),
    getNewArrivals(4),
    getPublicCoupons(),
  ]);
  const biggestDeal = deals[0] ? discountPercent(deals[0].price, deals[0].oldPrice) : 0;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'GroceryStore',
          name: SITE_NAME,
          url: SITE_URL,
          telephone: SUPPORT_PHONE,
          priceRange: '৳',
          currenciesAccepted: 'BDT',
          paymentAccepted: 'Cash',
          address: { '@type': 'PostalAddress', addressLocality: 'Dhaka', addressCountry: 'BD' },
          areaServed: { '@type': 'City', name: 'Dhaka' },
          potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }}
      />

      <Hero categories={categories} spotlight={deals[0] ?? featured[0]} />

      <HomeSection
        eyebrow="Shop by aisle"
        title="Browse categories"
        subtitle="Everything for the Bangladeshi kitchen, from the bazaar to your door."
        href="/shop"
        hrefLabel="Shop all products"
      >
        <CategoryGrid categories={categories} />
      </HomeSection>

      {featured.length > 0 && (
        <HomeSection
          eyebrow="Handpicked"
          title="Featured this week"
          subtitle="Our buyers' picks from this week's harvest."
          href="/shop"
          className="bg-white/60"
        >
          <ProductRail products={featured} label="Featured products" priorityCount={2} />
        </HomeSection>
      )}

      {deals.length > 0 && (
        <section className="py-6 sm:py-10" aria-labelledby="deals-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-forest-gradient px-4 py-10 shadow-card sm:px-8 lg:px-10">
              <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#f5b82e]/15 blur-3xl" />
              <div className="relative flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5b82e] px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-[#3a2502]">
                    <Flame className="h-3.5 w-3.5" /> Hot deals
                  </span>
                  <h2 id="deals-heading" className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
                    Save up to {biggestDeal}% today
                  </h2>
                  <p className="mt-1 text-sm text-[#b9d8c5]">Fresh markdowns on seasonal favourites — while stocks last.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <DealCountdown />
                  <Link href="/deals" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-[#0f2c1d] hover:bg-[#f0f7f2]">
                    All deals <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="relative mt-8">
                <ProductRail products={deals.slice(0, 4)} label="Deals" />
              </div>
            </div>
          </div>
        </section>
      )}

      <HomeSection eyebrow="Most loved" title="Best sellers" subtitle="What Dhaka households reorder most." href="/shop">
        <ProductRail products={bestSellers} label="Best sellers" />
      </HomeSection>

      <HomeSection eyebrow="Just in" title="New arrivals" href="/shop?sort=newest" className="bg-white/60">
        <ProductRail products={newArrivals} label="New arrivals" />
      </HomeSection>

      {coupons.length > 0 && (
        <HomeSection
          eyebrow="Offers"
          title="Coupons for your basket"
          subtitle="Copy a code and apply it at checkout."
          href="/deals"
          hrefLabel="See all offers"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {coupons.slice(0, 3).map((c) => (
              <CouponCard key={c.code} coupon={c} />
            ))}
          </div>
        </HomeSection>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RecentlyViewed className="py-10" />
      </div>

      <WhyChooseUsSection />
      <TestimonialsSection />
    </>
  );
}
