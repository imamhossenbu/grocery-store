'use client';

import React from 'react';
import { ArrowRight, Sparkles, Tag, Truck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DealsSectionProps {
  onShopCategory: (category: string) => void;
  onApplyPromo: (code: string) => void;
}

export function DealsSection({ onShopCategory, onApplyPromo }: DealsSectionProps) {
  return (
    <section id="deals-section" className="py-16 md:py-20 bg-[#f3f8f5] border-y border-[#dfece3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
          {/* Big Featured Promo Card */}
          <div className="relative flex min-h-[340px] overflow-hidden rounded-[2.5rem] bg-forest-gradient p-8 md:p-12 text-white shadow-card">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
              alt="Organic fruits and veggies promo"
              className="absolute inset-0 h-full w-full object-cover object-right opacity-30 mix-blend-overlay"
            />
            <div className="relative z-10 flex max-w-md flex-col justify-center space-y-4">
              <span className="w-fit rounded-full bg-[#f5b82e] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wide text-[#3a2502]">
                Organic Week Festival
              </span>
              <h3 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-[#ecfdf5]">
                Up to 15% OFF Pure Organic Foods
              </h3>
              <p className="text-sm text-[#b9d8c5] leading-relaxed">
                Raw Sundarbans honey, stone-ground mustard oil, Dheki-chata red rice, and chemical-free vegetables directly from certified grower collectives.
              </p>
              <div className="pt-2">
                <Button
                  variant="highlight"
                  size="md"
                  onClick={() => onShopCategory('organic')}
                >
                  <span>Shop Organic Aisle</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Two Mini Promo Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            {/* Promo 1: Voucher */}
            <div className="rounded-[2.5rem] border border-[#fde68a] bg-[#fffbeb] p-7 shadow-soft flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#b45309]">
                  <Tag className="w-3.5 h-3.5" />
                  First Order Offer
                </span>
                <h4 className="mt-2 font-display text-2xl font-bold text-[#112a1d]">
                  ৳50 OFF with <span className="font-mono text-[#b45309]">WELCOME50</span>
                </h4>
                <p className="mt-1 text-xs sm:text-sm text-[#5a7165]">
                  Valid on orders over ৳500. Applicable automatically or in your basket.
                </p>
              </div>
              <div className="mt-5">
                <button
                  onClick={() => onApplyPromo('WELCOME50')}
                  className="rounded-full bg-[#b45309] text-white px-4 py-2 text-xs font-bold hover:bg-[#92400e] transition cursor-pointer"
                >
                  Copy & Apply WELCOME50
                </button>
              </div>
            </div>

            {/* Promo 2: Free Delivery */}
            <div className="rounded-[2.5rem] bg-emerald-gradient p-7 text-white shadow-soft flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#d1fae5]">
                  <Truck className="w-3.5 h-3.5" />
                  Free Home Delivery
                </span>
                <h4 className="mt-2 font-display text-2xl font-bold">
                  Orders Over ৳1,000
                </h4>
                <p className="mt-1 text-xs sm:text-sm text-[#d1fae5]/80">
                  Flat ৳60 delivery for smaller baskets anywhere inside Dhaka.
                </p>
              </div>
              <div className="mt-5">
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#f5b82e]">
                  <Sparkles className="w-4 h-4" />
                  Cash on Delivery at Your Doorstep
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

