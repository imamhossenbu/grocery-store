import Link from 'next/link';
import { ArrowRight, Banknote, Clock, Leaf, ShieldCheck, Truck } from 'lucide-react';
import { SearchBar } from '@/components/store-ui/SearchBar';
import type { Category, Product } from '@/types/store';
import { formatBDT } from '@/lib/format';
import { FREE_DELIVERY_THRESHOLD, discountPercent } from '@/lib/pricing';
import { POPULAR_SEARCHES } from '@/lib/constants';

export function Hero({ categories, spotlight }: { categories: Category[]; spotlight?: Product }) {
  const tiles = categories.slice(0, 3);
  const pct = spotlight ? discountPercent(spotlight.price, spotlight.oldPrice) : 0;

  return (
    <section className="relative overflow-hidden bg-hero-mesh">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:pb-24 lg:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#c5e5d2] bg-white/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#165b34] shadow-sm backdrop-blur">
            <Leaf className="h-3.5 w-3.5" /> Same-day delivery across Dhaka
          </span>
          <h1 className="mt-5 font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight text-[#112a1d] sm:text-6xl lg:text-[4.25rem]">
            Farm-fresh groceries, <span className="relative whitespace-nowrap text-[#1a663b]">
              at your door
              <svg aria-hidden viewBox="0 0 300 20" className="absolute -bottom-2 left-0 h-3 w-full text-[#f5b82e]" preserveAspectRatio="none">
                <path d="M2 14 C 80 2, 220 2, 298 12" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>{' '}
            today.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[#40594b] sm:text-lg">
            Rajshahi mangoes, Padma ilish, Bogura doi and pantry staples — sourced before sunrise from partner farms and delivered in your
            chosen slot. Pay cash when it arrives.
          </p>

          <SearchBar id="hero-search" className="mt-8 max-w-xl" />
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="font-semibold text-[#5a7165]">Popular:</span>
            {POPULAR_SEARCHES.map((t) => (
              <Link
                key={t}
                href={`/search?q=${encodeURIComponent(t.toLowerCase())}`}
                className="rounded-full border border-[#dfece3] bg-white/80 px-3 py-1 font-semibold text-[#234835] transition hover:border-[#1a663b] hover:text-[#1a663b]"
              >
                {t}
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#0f2c1d] px-7 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#19442e]">
              Start shopping <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/deals" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#f5b82e] px-7 text-sm font-bold text-[#3a2502] shadow-md transition hover:-translate-y-0.5 hover:bg-[#e5a91f]">
              Today&apos;s deals
            </Link>
          </div>

          <ul className="mt-10 grid max-w-xl grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            {[
              { icon: Truck, text: `Free delivery over ${formatBDT(FREE_DELIVERY_THRESHOLD)}` },
              { icon: Banknote, text: 'Cash on delivery' },
              { icon: ShieldCheck, text: 'Freshness guarantee' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2 font-semibold text-[#234835]">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#1a663b] shadow-sm">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="grid grid-cols-2 gap-4">
            {tiles.map((c, i) => (
              <Link
                key={c.id}
                href={`/category/${c.id}`}
                className={`group relative overflow-hidden rounded-[2rem] border-4 border-white shadow-card ${
                  i === 0 ? 'row-span-2' : 'aspect-square'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image}
                  alt=""
                  fetchPriority={i === 0 ? 'high' : undefined}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0f2c1d]/85 to-transparent p-4 pt-10 text-sm font-bold text-white">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>

          <div className="absolute -left-3 top-8 hidden animate-float items-center gap-3 rounded-2xl bg-white/95 p-3 pr-5 shadow-card backdrop-blur sm:flex">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-gradient text-white">
              <Clock className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-extrabold text-[#112a1d]">Morning slot</span>
              <span className="block text-[13px] text-[#5a7165]">Delivered 8 – 11 AM</span>
            </span>
          </div>

          {spotlight && (
            <Link
              href={`/product/${spotlight.id}`}
              className="absolute -bottom-6 right-2 flex items-center gap-3 rounded-2xl bg-forest-gradient p-3 pr-5 text-white shadow-card transition hover:-translate-y-0.5 sm:right-6"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={spotlight.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <span>
                <span className="block text-xs font-bold uppercase tracking-widest text-[#f5b82e]">
                  {pct > 0 ? `Deal · ${pct}% off` : 'Customer favourite'}
                </span>
                <span className="block max-w-[11rem] truncate text-sm font-bold">{spotlight.name}</span>
                <span className="block text-[13px] text-[#b9d8c5]">
                  {formatBDT(spotlight.price)} {pct > 0 && <s className="opacity-70">{formatBDT(spotlight.oldPrice!)}</s>}
                </span>
              </span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
