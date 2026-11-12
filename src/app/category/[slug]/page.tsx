import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getCategories, getCategory } from '@/lib/data/catalog';
import { SITE_URL } from '@/lib/constants';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Block } from '@/components/ui/Skeleton';
import { JsonLd } from '@/components/product/JsonLd';
import { ProductListing } from '@/components/shop/ProductListing';
import { ListingSkeleton } from '@/components/shop/ListingSkeleton';
import { parseFilters, type RawSearchParams } from '@/components/shop/params';

type Params = Promise<{ slug: string }>;
type SP = Promise<RawSearchParams>;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.length ? categories.map((c) => ({ slug: c.id })) : [{ slug: 'fruits' }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const description = `${category.blurb}. Order ${category.name.toLowerCase()} online with same-day delivery and cash on delivery in Dhaka.`;
  return {
    title: `${category.name} — buy online in Dhaka`,
    description,
    alternates: { canonical: `/category/${category.id}` },
    openGraph: {
      title: category.name,
      description,
      url: `/category/${category.id}`,
      images: category.image ? [{ url: category.image, alt: category.name }] : undefined,
    },
  };
}

export default function CategoryPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  return (
    <div className="bg-hero-mesh">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <Suspense fallback={<CategoryHeroSkeleton />}>
          <CategoryHero params={params} />
        </Suspense>
        <div className="mt-10">
          <Suspense fallback={<ListingSkeleton />}>
            <CategoryResults params={params} searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function CategoryHero({ params }: { params: Params }) {
  const { slug } = await params;
  const [category, categories] = await Promise.all([getCategory(slug), getCategories()]);
  if (!category) notFound();
  const count = categories.find((c) => c.id === category.id)?.productCount ?? 0;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
            { '@type': 'ListItem', position: 3, name: category.name, item: `${SITE_URL}/category/${category.id}` },
          ],
        }}
      />
      <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: category.name }]} />

      <header className="relative mt-4 overflow-hidden rounded-[2rem] bg-[#0f2c1d] shadow-card">
        {category.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={category.image} alt="" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f2c1d] via-[#0f2c1d]/80 to-[#0f2c1d]/10" aria-hidden />
        <div className="relative px-6 py-10 sm:px-10 sm:py-14 lg:py-16">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#b9f2cf] backdrop-blur">
            {count} {count === 1 ? 'product' : 'products'}
          </span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">{category.name}</h1>
          <p className="mt-3 max-w-xl text-sm text-[#d6eadd] sm:text-lg">{category.blurb}</p>
        </div>
      </header>

      <nav aria-label="Other categories" className="-mx-4 mt-6 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <ul className="flex gap-2 sm:flex-wrap">
          <li className="shrink-0">
            <Link href="/shop" className="inline-flex h-10 items-center rounded-full border border-[#cfe3d6] bg-white px-4 text-sm font-semibold text-[#234835] hover:border-[#1a663b]">
              All products
            </Link>
          </li>
          {categories.map((c) => {
            const on = c.id === category.id;
            return (
              <li key={c.id} className="shrink-0">
                <Link
                  href={`/category/${c.id}`}
                  aria-current={on ? 'page' : undefined}
                  className={`inline-flex h-10 items-center gap-2 rounded-full border pl-1 pr-4 text-sm font-semibold transition ${
                    on ? 'border-[#1a663b] bg-[#1a663b] text-white shadow-glow' : 'border-[#cfe3d6] bg-white text-[#234835] hover:border-[#1a663b]'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt="" loading="lazy" className="h-8 w-8 rounded-full object-cover" />
                  {c.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

async function CategoryResults({ params, searchParams }: { params: Params; searchParams: SP }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) notFound();
  return <ProductListing basePath={`/category/${category.id}`} filters={parseFilters(sp)} lockedCategory={category.id} />;
}

function CategoryHeroSkeleton() {
  return (
    <div>
      <Block className="h-3 w-40" />
      <Block className="mt-4 h-56 w-full rounded-[2rem] sm:h-64" />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Block key={i} className="h-10 w-32 rounded-full" />
        ))}
      </div>
    </div>
  );
}
