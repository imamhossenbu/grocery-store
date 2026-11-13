import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Category } from '@/types/store';

export function CategoryGrid({ categories }: { categories: (Category & { productCount: number })[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-6">
      {categories.map((c) => (
        <li key={c.id}>
          <Link
            href={`/category/${c.id}`}
            className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#dfece3] bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:border-[#1a663b]/40 hover:shadow-card"
          >
            <span className="relative block aspect-[4/3] overflow-hidden bg-[#f0f7f2]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-[#1a663b] opacity-0 shadow-sm transition group-hover:opacity-100">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </span>
            </span>
            <span className="flex flex-1 flex-col p-3.5">
              <span className="text-sm font-bold text-[#112a1d] group-hover:text-[#1a663b]">{c.name}</span>
              <span className="mt-0.5 line-clamp-2 text-xs text-[#5a7165]">{c.blurb}</span>
              <span className="mt-auto pt-2 text-[11px] font-bold uppercase tracking-wider text-[#1a663b]">
                {c.productCount} {c.productCount === 1 ? 'item' : 'items'}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
