'use client';

import React from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Leaf,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeroSectionProps {
  onShopClick: () => void;
  onDealsClick: () => void;
}

export function HeroSection({ onShopClick, onDealsClick }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-hero-mesh py-12 md:py-20 border-b border-[#dfece3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] items-center gap-12">
          {/* Left Column: Headlines & CTAs */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c4e4d1] bg-white/90 px-4 py-1.5 text-xs font-bold text-[#145732] shadow-sm backdrop-blur">
              <Sparkles className="w-3.5 h-3.5 text-[#f5b82e] fill-[#f5b82e]" />
              <span>Bangladesh&apos;s Trusted Fresh Grocery Partner</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#112a1d] leading-[1.1]">
              Freshness Delivered to{' '}
              <span className="italic text-[#1a663b] underline decoration-[#f5b82e] decoration-wavy decoration-2">
                Your Doorstep
              </span>
            </h1>

            <p className="max-w-xl text-base sm:text-lg text-[#445c50] leading-relaxed">
              Order fresh fruits, crisp vegetables, farm cow milk, Bogura doi, and organic daily essentials straight from local co-op growers in Bangladesh. Priced fairly in Taka and delivered with 100% Cash on Delivery.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={onShopClick}
                className="group"
              >
                <span>Shop Farm Fresh</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="lg" onClick={onDealsClick}>
                View Organic Deals
              </Button>
            </div>

            {/* Quick Stats Grid */}
            <div className="pt-6 border-t border-[#d8e8dd] grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#112a1d] block">
                  20+
                </span>
                <span className="text-xs font-semibold text-[#5a7165]">
                  Farm Produce
                </span>
              </div>
              <div>
                <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#112a1d] block">
                  6
                </span>
                <span className="text-xs font-semibold text-[#5a7165]">
                  Fresh Aisles
                </span>
              </div>
              <div>
                <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#112a1d] block">
                  7AM–11PM
                </span>
                <span className="text-xs font-semibold text-[#5a7165]">
                  Daily Delivery
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual with Floaters */}
          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2.5rem] border-4 border-white shadow-card bg-[#e6f2eb]">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
                alt="Basket of fresh organic vegetables and fruits"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f2c1d]/40 via-transparent to-transparent" />
            </div>

            {/* Floating Badge 1 - Bottom Left */}
            <div className="absolute -bottom-5 -left-3 sm:-left-6 flex items-center gap-3 rounded-2xl bg-white p-3.5 pr-6 shadow-card border border-[#dfece3] animate-float">
              <div className="grid place-items-center w-11 h-11 rounded-xl bg-[#e8f5ee] text-[#1a663b]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#112a1d] block">
                  Same-Day Slots
                </span>
                <span className="text-[11px] text-[#5a7165]">
                  Inside Dhaka City
                </span>
              </div>
            </div>

            {/* Floating Badge 2 - Top Right */}
            <div
              className="absolute -top-4 right-3 sm:-right-4 flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-card border border-[#dfece3] animate-float"
              style={{ animationDelay: '2s' }}
            >
              <div className="grid place-items-center w-8 h-8 rounded-full bg-[#1a663b] text-white">
                <BadgeCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#112a1d]">
                100% Fresh Guarantee
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
