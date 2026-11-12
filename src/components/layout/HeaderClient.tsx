'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Heart, LayoutGrid, Leaf, Menu, PackageSearch, Search, ShoppingBasket, User, X } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { formatBDT } from '@/lib/format';
import { HeaderSearch, type SearchIndex } from './HeaderSearch';

interface Props {
  categories: { id: string; name: string; image: string; productCount: number }[];
  index: SearchIndex;
}

export function HeaderClient({ categories, index }: Props) {
  const { cartCount, total, setCartOpen, wishlist, hydrated } = useShop();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);

  return (
    <div className="border-b border-[#dfece3] bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center gap-3 sm:gap-6">
        <button onClick={() => setMenuOpen(true)} className="lg:hidden grid place-items-center w-10 h-10 -ml-2 rounded-full text-[#112a1d] hover:bg-[#f0f7f2] cursor-pointer" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="FreshBasket home">
          <span className="grid place-items-center w-10 h-10 rounded-2xl bg-emerald-gradient text-white shadow-glow"><Leaf className="w-5 h-5" /></span>
          <span className="hidden sm:block font-display text-2xl font-bold tracking-tight text-[#112a1d] leading-none">
            Fresh<span className="text-[#1a663b]">Basket</span>
          </span>
        </Link>

        <div className="hidden md:block flex-1 max-w-xl">
          <HeaderSearch index={index} />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button onClick={() => setSearchOpen((s) => !s)} className="md:hidden grid place-items-center w-10 h-10 rounded-full text-[#1a663b] hover:bg-[#f0f7f2] cursor-pointer" aria-label="Search">
            <Search className="w-5 h-5" />
          </button>
          <Link href="/track-order" className="hidden sm:grid place-items-center w-10 h-10 rounded-full text-[#1a663b] hover:bg-[#f0f7f2]" title="Track order" aria-label="Track order">
            <PackageSearch className="w-5 h-5" />
          </Link>
          <Link href="/wishlist" className="relative grid place-items-center w-10 h-10 rounded-full text-[#1a663b] hover:bg-[#f0f7f2]" title="Wishlist" aria-label={`Wishlist (${hydrated ? wishlist.length : 0})`}>
            <Heart className="w-5 h-5" />
            {hydrated && wishlist.length > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-extrabold grid place-items-center px-1">{wishlist.length}</span>
            )}
          </Link>
          <Link href="/account" className="grid place-items-center w-10 h-10 rounded-full text-[#1a663b] hover:bg-[#f0f7f2]" title="My account" aria-label="My account">
            <User className="w-5 h-5" />
          </Link>
          <button
            onClick={() => setCartOpen(true)}
            className="relative ml-1 inline-flex items-center gap-2.5 rounded-full bg-[#0f2c1d] hover:bg-[#18432d] text-white pl-3.5 pr-3.5 sm:pr-5 py-2.5 shadow-md transition cursor-pointer"
            aria-label={`Open basket, ${hydrated ? cartCount : 0} items`}
          >
            <span className="relative">
              <ShoppingBasket className="w-5 h-5 text-[#f5b82e]" />
              {hydrated && cartCount > 0 && (
                <span className="absolute -top-2 -right-2.5 min-w-[20px] h-5 rounded-full bg-[#f5b82e] text-[#3a2502] text-[11px] font-extrabold grid place-items-center px-1">{cartCount}</span>
              )}
            </span>
            <span className="hidden sm:block text-left leading-tight">
              <span className="block text-[10px] uppercase tracking-wider text-[#b9d8c5]">My basket</span>
              <span className="font-extrabold text-xs">{formatBDT(hydrated ? total : 0)}</span>
            </span>
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="md:hidden border-t border-[#dfece3] px-4 py-3">
          <HeaderSearch index={index} autoFocus onDone={() => setSearchOpen(false)} />
        </div>
      )}

      {/* Desktop category bar */}
      <nav className="hidden lg:block border-t border-[#eef5f0]" aria-label="Main">
        <div className="max-w-7xl mx-auto px-8 h-12 flex items-center gap-7 text-sm font-semibold text-[#234835]">
          <div className="relative" onMouseLeave={() => setCatsOpen(false)}>
            <button
              onClick={() => setCatsOpen((o) => !o)}
              onMouseEnter={() => setCatsOpen(true)}
              aria-expanded={catsOpen}
              className="inline-flex items-center gap-2 rounded-full bg-[#1a663b] text-white px-4 py-1.5 cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4" /> All categories <ChevronDown className="w-4 h-4" />
            </button>
            {catsOpen && (
              <div className="absolute left-0 top-full pt-2 z-50">
                <div className="w-[540px] grid grid-cols-2 gap-1 rounded-2xl border border-[#dfece3] bg-white p-2 shadow-card">
                  {categories.map((c) => (
                    <Link key={c.id} href={`/category/${c.id}`} onClick={() => setCatsOpen(false)} className="flex items-center gap-3 rounded-xl p-2 hover:bg-[#f4f9f5]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.image} alt="" className="w-11 h-11 rounded-xl object-cover" />
                      <span>
                        <span className="block text-sm font-bold text-[#112a1d]">{c.name}</span>
                        <span className="text-xs font-medium text-[#5a7165]">{c.productCount} items</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link href="/shop" className="hover:text-[#1a663b]">Shop all</Link>
          <Link href="/deals" className="hover:text-[#1a663b]">Deals &amp; offers</Link>
          {categories.slice(0, 4).map((c) => (
            <Link key={c.id} href={`/category/${c.id}`} className="hover:text-[#1a663b]">{c.name}</Link>
          ))}
          <Link href="/track-order" className="ml-auto inline-flex items-center gap-1.5 text-[#1a663b]"><PackageSearch className="w-4 h-4" /> Track order</Link>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-[#071a10]/60" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-display text-xl font-bold text-[#112a1d]">Fresh<span className="text-[#1a663b]">Basket</span></span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="grid place-items-center w-9 h-9 rounded-full hover:bg-[#f0f7f2] cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 text-sm font-semibold">
              {[
                ['/shop', 'Shop all'], ['/deals', 'Deals'], ['/track-order', 'Track order'], ['/wishlist', 'Wishlist'],
                ['/account', 'My account'], ['/account/orders', 'My orders'],
              ].map(([href, label]) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-xl bg-[#f0f7f2] p-3 text-[#112a1d]">{label}</Link>
              ))}
            </div>
            <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-widest text-[#5a7165]">Categories</p>
            <ul className="space-y-1">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/category/${c.id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-2 hover:bg-[#f4f9f5]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image} alt="" className="w-9 h-9 rounded-lg object-cover" />
                    <span className="flex-1 text-sm font-semibold text-[#112a1d]">{c.name}</span>
                    <span className="text-xs text-[#5a7165]">{c.productCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-[#eef5f0] pt-4 grid gap-1 text-sm text-[#445c50]">
              {[['/about', 'About us'], ['/faq', 'FAQ'], ['/contact', 'Contact'], ['/delivery', 'Delivery info']].map(([href, label]) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="py-1.5 hover:text-[#1a663b]">{label}</Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
