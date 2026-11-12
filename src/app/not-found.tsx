import type { Metadata } from 'next';
import Link from 'next/link';
import { Home, ShoppingBasket } from 'lucide-react';
import { SearchBar } from '@/components/store-ui/SearchBar';
import { getTopCategories } from '@/lib/data/catalog';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default async function NotFound() {
  const categories = await getTopCategories();

  return (
    <div className="bg-hero-mesh">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-white text-[#1a663b] shadow-card">
          <ShoppingBasket className="h-10 w-10" aria-hidden />
        </span>
        <p className="mt-6 text-sm font-extrabold uppercase tracking-widest text-[#1a663b]">404 · Not found</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[#112a1d] sm:text-5xl">This aisle is empty</h1>
        <p className="mx-auto mt-4 max-w-md text-base text-[#5a7165]">
          The page or product you&apos;re looking for may have sold out, moved, or never existed. Try a search instead.
        </p>

        <SearchBar id="nf-search" placeholder="Search for mango, doi, rice…" className="mx-auto mt-8 max-w-xl" />

        {categories.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#5a7165]">Popular categories</h2>
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
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
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0f2c1d] px-6 text-sm font-bold text-white hover:bg-[#19442e]">
            <Home className="h-4 w-4" /> Back to home
          </Link>
          <Link href="/deals" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#f5b82e] px-6 text-sm font-bold text-[#3a2502] hover:bg-[#e5a91f]">
            See today&apos;s deals
          </Link>
        </div>
      </div>
    </div>
  );
}
