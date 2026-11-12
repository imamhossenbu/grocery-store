import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getCategoryTree } from '@/lib/data/catalog';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'All categories',
  description: 'Browse every FreshBasket aisle and its sub-aisles: fruits, vegetables, dairy & eggs, organic food, daily grocery, fish & meat.',
  alternates: { canonical: '/category' },
};

const items = (n: number) => `${n} ${n === 1 ? 'item' : 'items'}`;

export default async function CategoriesPage() {
  const tree = await getCategoryTree();
  return (
    <div className="bg-hero-mesh">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: 'Categories' }]} />
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[#112a1d] sm:text-4xl">All categories</h1>
        <p className="mt-2 mb-8 max-w-2xl text-sm text-[#5a7165] sm:text-base">Pick an aisle — or jump straight to the shelf you need.</p>

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tree.map((c) => (
            <li key={c.id} className="flex flex-col overflow-hidden rounded-[1.75rem] border border-[#dfece3] bg-white shadow-soft">
              <Link href={`/category/${c.id}`} className="group relative block h-36 overflow-hidden bg-[#0f2c1d]">
                {c.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105" />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-[#0f2c1d] via-[#0f2c1d]/40 to-transparent" aria-hidden />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                  <span>
                    <span className="block font-display text-2xl font-bold leading-tight text-white">{c.name}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#b9f2cf]">{items(c.productCount)}</span>
                  </span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/95 text-[#1a663b] shadow-sm transition group-hover:bg-[#f5b82e] group-hover:text-[#3a2502]">
                    <ArrowRight className="h-4 w-4" aria-hidden />
                    <span className="sr-only">Shop {c.name}</span>
                  </span>
                </span>
              </Link>
              <div className="flex flex-1 flex-col p-4">
                {(c.description || c.blurb) && <p className="line-clamp-2 text-sm text-[#5a7165]">{c.description || c.blurb}</p>}
                {c.children.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2" aria-label={`${c.name} subcategories`}>
                    {c.children.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/category/${s.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe3d6] bg-[#f4f9f5] px-3 py-1.5 text-xs font-semibold text-[#234835] transition hover:border-[#1a663b] hover:bg-white"
                        >
                          {s.name}
                          <span className="text-[#7e9688]">{s.productCount}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
