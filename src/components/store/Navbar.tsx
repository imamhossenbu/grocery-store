'use client';

import React, { useState } from 'react';
import {
  Leaf,
  MapPin,
  Menu,
  PackageSearch,
  RefreshCw,
  Search,
  ShoppingBasket,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { formatBDT } from '@/lib/supabase-db';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenTracking: () => void;
  onScrollToSection: (id: string) => void;
}

export function Navbar({
  searchQuery,
  onSearchChange,
  onOpenTracking,
  onScrollToSection,
}: NavbarProps) {
  const { cartCount, total, setIsCartOpen, refreshStore } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await refreshStore();
    setTimeout(() => setSyncing(false), 500);
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Top Announcement Bar */}
      <div className="bg-[#0f2c1d] text-[#ecfdf5] text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#f5b82e]" />
            <span>
              Use code <strong className="text-[#f5b82e]">WELCOME50</strong> for ৳50 OFF on orders over ৳500 · Free Delivery over ৳1,000!
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-[#b9d8c5]">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#f5b82e]" />
              Same-Day Delivery Across Dhaka
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#f5b82e]" />
              100% Cash on Delivery Available
            </span>
          </div>
        </div>
      </div>

      {/* Main Glass Header */}
      <div className="border-b border-[#dfece3] bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="grid place-items-center w-11 h-11 rounded-2xl bg-emerald-gradient text-white shadow-glow group-hover:scale-105 transition-transform">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <span className="font-display text-2xl font-bold tracking-tight text-[#112a1d] block leading-none">
                Fresh<span className="text-[#1a663b]">Basket</span>
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5a7165]">
                Organic & Daily Grocery
              </span>
            </div>
          </button>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#5a7165] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  onScrollToSection('catalog-section');
                }}
                placeholder="Search Himsagar mango, Bogura doi, organic honey..."
                className="w-full rounded-full border border-[#cfe3d6] bg-[#f4f9f5] pl-11 pr-9 py-2.5 text-sm text-[#112a1d] placeholder-[#6c8577] focus:border-[#1a663b] focus:bg-white focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a7165] hover:text-[#112a1d] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-[#234835]">
            <button
              onClick={() => onScrollToSection('categories-section')}
              className="hover:text-[#1a663b] transition cursor-pointer"
            >
              Categories
            </button>
            <button
              onClick={() => onScrollToSection('catalog-section')}
              className="hover:text-[#1a663b] transition cursor-pointer"
            >
              All Groceries
            </button>
            <button
              onClick={() => onScrollToSection('deals-section')}
              className="hover:text-[#1a663b] transition cursor-pointer"
            >
              Organic Deals
            </button>
            <button
              onClick={onOpenTracking}
              className="inline-flex items-center gap-1.5 text-[#1a663b] hover:text-[#14522f] transition cursor-pointer"
            >
              <PackageSearch className="w-4 h-4" />
              Track Order
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSync}
              title="Sync live catalog with Supabase Cloud"
              className="grid place-items-center w-10 h-10 rounded-full border border-[#d5e6dc] bg-[#f4f9f5] text-[#1a663b] hover:bg-[#e5f3ea] transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onOpenTracking}
              className="lg:hidden grid place-items-center w-10 h-10 rounded-full border border-[#d5e6dc] bg-[#f4f9f5] text-[#1a663b] cursor-pointer"
              title="Track Order"
            >
              <PackageSearch className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-3 rounded-full bg-[#0f2c1d] hover:bg-[#18432d] text-white pl-4 pr-5 py-2.5 shadow-md transition cursor-pointer"
            >
              <div className="relative">
                <ShoppingBasket className="w-5 h-5 text-[#f5b82e]" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 min-w-[20px] h-5 rounded-full bg-[#f5b82e] text-[#3a2502] text-[11px] font-extrabold grid place-items-center px-1">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <span className="block text-[10px] uppercase tracking-wider text-[#b9d8c5]">
                  My Basket
                </span>
                <span className="font-extrabold text-xs">
                  {formatBDT(total)}
                </span>
              </div>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden grid place-items-center w-10 h-10 rounded-full border border-[#cfe3d6] text-[#112a1d] cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search & Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#dfece3] bg-white px-4 py-4 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-[#5a7165] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  onScrollToSection('catalog-section');
                }}
                placeholder="Search fresh fruits, milk, vegetables..."
                className="w-full rounded-full border border-[#cfe3d6] bg-[#f4f9f5] pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
              <button
                onClick={() => {
                  onScrollToSection('categories-section');
                  setMobileMenuOpen(false);
                }}
                className="rounded-xl bg-[#f0f7f2] p-3 text-left text-[#112a1d]"
              >
                Popular Categories
              </button>
              <button
                onClick={() => {
                  onScrollToSection('catalog-section');
                  setMobileMenuOpen(false);
                }}
                className="rounded-xl bg-[#f0f7f2] p-3 text-left text-[#112a1d]"
              >
                Shop All Products
              </button>
              <button
                onClick={() => {
                  onScrollToSection('deals-section');
                  setMobileMenuOpen(false);
                }}
                className="rounded-xl bg-[#f0f7f2] p-3 text-left text-[#112a1d]"
              >
                Organic Offers
              </button>
              <button
                onClick={() => {
                  onOpenTracking();
                  setMobileMenuOpen(false);
                }}
                className="rounded-xl bg-[#fef3c7] p-3 text-left text-[#78350f]"
              >
                Track COD Order
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

