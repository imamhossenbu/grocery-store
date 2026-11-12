'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  CheckCircle2,
  PackageOpen,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { Order, Product } from '@/types/store';
import { useStore } from '@/context/StoreContext';
import { Navbar } from '@/components/store/Navbar';
import { HeroSection } from '@/components/store/HeroSection';
import { CategoryFilter } from '@/components/store/CategoryFilter';
import { ProductCard } from '@/components/store/ProductCard';
import { DealsSection } from '@/components/store/DealsSection';
import { WhyChooseUsSection } from '@/components/store/WhyChooseUsSection';
import { TestimonialsSection } from '@/components/store/TestimonialsSection';
import { Footer } from '@/components/store/Footer';
import { CartSlideOver } from '@/components/store/CartSlideOver';
import { CheckoutModal } from '@/components/store/CheckoutModal';
import { OrderSuccessModal } from '@/components/store/OrderSuccessModal';
import { OrderTrackingModal } from '@/components/store/OrderTrackingModal';
import { ProductQuickViewModal } from '@/components/store/ProductQuickViewModal';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function StorefrontHomePage() {
  const {
    loading,
    products,
    categories,
    isCheckoutOpen,
    setIsCheckoutOpen,
    applyCouponCode,
    toasts,
    dismissToast,
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'name'>('popular');

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string>('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          selectedCategory === 'all' || p.category === selectedCategory;
        const matchesQuery =
          !searchQuery.trim() ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleApplyPromo = (code: string) => {
    applyCouponCode(code);
    scrollToSection('catalog-section');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f9fbf9] text-[#112a1d]">
      {/* Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenTracking={() => {
          setTrackingOrderId('');
          setTrackingOpen(true);
        }}
        onScrollToSection={scrollToSection}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onShopClick={() => scrollToSection('catalog-section')}
          onDealsClick={() => scrollToSection('deals-section')}
        />

        {/* Categories Section */}
        <CategoryFilter
          categories={categories}
          products={products}
          selectedCategory={selectedCategory}
          onSelectCategory={(id) => {
            setSelectedCategory(id);
            scrollToSection('catalog-section');
          }}
        />

        {/* Product Catalog Grid Section */}
        <section id="catalog-section" className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-[#e2efe6]">
              <SectionHeader
                eyebrow={
                  selectedCategory === 'all'
                    ? 'Fresh Catalog'
                    : categories.find((c) => c.id === selectedCategory)?.name || 'Category'
                }
                title="Fresh Picks of the Day"
                subtitle="High-quality vegetables, fruits, dairy, and grocery priced in BDT."
              />

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#5a7165] flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="rounded-full border border-[#cfe3d6] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#112a1d] focus:border-[#1a663b] focus:outline-none cursor-pointer"
                >
                  <option value="popular">Most Popular &amp; Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Alphabetical (A - Z)</option>
                </select>
              </div>
            </div>

            {/* Active Filters Bar */}
            {(selectedCategory !== 'all' || searchQuery) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#5a7165]">Active Filters:</span>
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5ee] px-3 py-1 text-xs font-bold text-[#14522f]">
                    Category: {categories.find((c) => c.id === selectedCategory)?.name}
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="hover:text-red-600 cursor-pointer ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-3 py-1 text-xs font-bold text-[#78350f]">
                    Query: &quot;{searchQuery}&quot;
                    <button
                      onClick={() => setSearchQuery('')}
                      className="hover:text-red-600 cursor-pointer ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-[#1a663b] font-bold underline hover:text-[#112a1d] cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Grid or Skeleton or Empty State */}
            <div className="mt-8">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <EmptyState
                  icon={<PackageOpen className="w-8 h-8" />}
                  title="No groceries matched your search"
                  description="Try adjusting your keyword or reset your filter to view all fresh groceries."
                  actionLabel="Reset Filters"
                  onAction={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onQuickView={setQuickViewProduct}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Deals & Promo Section */}
        <DealsSection
          onShopCategory={(cat) => {
            setSelectedCategory(cat);
            scrollToSection('catalog-section');
          }}
          onApplyPromo={handleApplyPromo}
        />

        {/* Why Choose Us */}
        <WhyChooseUsSection />

        {/* Testimonials */}
        <TestimonialsSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals & Slide-overs */}
      <CartSlideOver />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(order) => {
          setPlacedOrder(order);
        }}
      />

      <OrderSuccessModal
        order={placedOrder}
        onClose={() => setPlacedOrder(null)}
        onTrackOrder={(orderId) => {
          setTrackingOrderId(orderId);
          setTrackingOpen(true);
        }}
      />

      <OrderTrackingModal
        isOpen={trackingOpen}
        onClose={() => setTrackingOpen(false)}
        initialOrderId={trackingOrderId}
      />

      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-[#0f2c1d] text-white p-4 shadow-2xl border border-[#1e4d33] animate-slideIn"
          >
            <CheckCircle2 className="w-5 h-5 text-[#f5b82e] shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-sm font-bold block">{t.title}</span>
              {t.description && (
                <span className="text-xs text-[#b9d8c5]">{t.description}</span>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-[#789d87] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
