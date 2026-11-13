import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { SearchX } from 'lucide-react';
import { getBestSellers, getTopCategories } from '@/lib/data/catalog';
import { suggestQuery } from '@/lib/data/discovery';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProductGrid } from '@/components/product/ProductCard';
import { ProductListing } from '@/components/shop/ProductListing';
import { ListingSkeleton } from '@/components/store-ui/Skeletons';
import { SearchBar } from '@/components/store-ui/SearchBar';
import { parseFilters, type RawSearchParams } from '@/components/shop/params';

type SP = Promise<RawSearchParams>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { q } = parseFilters(await searchParams);
  return {
    title: q ? `Search results for “${q}”` : 'Search groceries',
    description: 'Search fresh groceries, produce, dairy, fish and pantry staples with same-day delivery in Dhaka.',
    robots: { index: false, follow: true },
  };
}

export default function SearchPage({ searchParams }: { searchParams: SP }) {
  return (
    <div className="bg-hero-mesh">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Search' }]} />
        <Suspense
          fallback={
            <>
              <SearchHeader />
              <ListingSkeleton />
            </>
          }
        >
          <SearchResults searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

function SearchHeader({ q }: { q?: string }) {
  return (
    <header className="mt-4 mb-8">
      <h1 className="font-display text-3xl font-bold tracking-tight text-[#112a1d] sm:text-4xl">
        {q ? (
          <>
            Results for <span className="text-[#1a663b]">“{q}”</span>
          </>
        ) : (
          'Search groceries'
        )}
      </h1>
      <SearchBar id="search-page-q" defaultValue={q} placeholder="Search for mango, doi, rice…" label="Search products" className="mt-5 max-w-2xl shadow-soft" />
    </header>
  );
}

async function SearchResults({ searchParams }: { searchParams: SP }) {
  const filters = parseFilters(await searchParams);
  const [categories, popular, suggestion] = await Promise.all([
    getTopCategories(),
    getBestSellers(4),
    filters.q ? suggestQuery(filters.q) : Promise.resolve(null),
  ]);

  const discover = (
    <div className="space-y-10">
      <div>
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#5a7165]">Popular categories</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/category/${c.id}`}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-[#cfe3d6] bg-white pl-1 pr-4 text-sm font-semibold text-[#234835] transition hover:border-[#1a663b]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image} alt="" loading="lazy" className="h-8 w-8 rounded-full object-cover" />
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {popular.length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-bold text-[#112a1d]">Popular right now</h2>
          <div className="mt-5">
            <ProductGrid products={popular} />
          </div>
        </div>
      )}
    </div>
  );

  if (!filters.q) {
    return (
      <>
        <SearchHeader />
        {discover}
      </>
    );
  }

  const noResults = (
    <div className="space-y-10">
      <div className="rounded-[2rem] border-2 border-dashed border-[#cfe3d6] bg-white/80 px-6 py-12 text-center shadow-soft">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e8f5ee] text-[#1a663b]">
          <SearchX className="h-8 w-8" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-2xl font-bold text-[#112a1d]">No matches for “{filters.q}”</h2>
        {suggestion ? (
          <p className="mt-2 text-base text-[#5a7165]">
            Did you mean{' '}
            <Link href={`/search?q=${encodeURIComponent(suggestion)}`} className="font-bold text-[#1a663b] underline underline-offset-4">
              {suggestion}
            </Link>
            ?
          </p>
        ) : (
          <p className="mx-auto mt-2 max-w-md text-sm text-[#5a7165]">
            Check the spelling, try a more general word (like “rice” or “fish”), or browse a category below.
          </p>
        )}
      </div>
      {discover}
    </div>
  );

  return (
    <>
      <SearchHeader q={filters.q} />
      <ProductListing basePath="/search" filters={filters} searchMode emptyFallback={noResults} />
    </>
  );
}
