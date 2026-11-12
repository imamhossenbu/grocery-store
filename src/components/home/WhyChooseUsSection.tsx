import React from 'react';
import {
  Banknote,
  Clock,
  Headphones,
  Leaf,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';

const PERKS = [
  {
    icon: Leaf,
    title: 'Farm-Fresh Daily Sourcing',
    text: 'Procured before sunrise from partner farmers across Bogura, Rajshahi, and Sirajganj bathans.',
  },
  {
    icon: Truck,
    title: 'Fast Home Delivery',
    text: 'Choose convenient morning, afternoon, or evening slots across Dhaka.',
  },
  {
    icon: Banknote,
    title: '100% Cash on Delivery',
    text: 'Inspect your fresh groceries at your doorstep before paying physical cash or wallet.',
  },
  {
    icon: ShieldCheck,
    title: 'Freshness Guarantee',
    text: 'Unsatisfied with any produce? Instant replacement or credit with zero hassle.',
  },
  {
    icon: Clock,
    title: 'Fair Taka Pricing',
    text: 'Direct-from-farm supply chain cuts middlemen to give honest BDT prices.',
  },
  {
    icon: Headphones,
    title: 'Friendly Support',
    text: 'Assistance via phone and chat from 7:00 AM to 11:00 PM every single day.',
  },
];

export function WhyChooseUsSection() {
  return (
    <section className="py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] items-center gap-12">
          {/* Left: Image story */}
          <div className="relative">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-[2.5rem] shadow-card border border-[#dfece3] bg-[#eef7f2]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1200&q=80"
                alt="A farmer holding freshly harvested vegetables"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 right-6 rounded-2xl bg-forest-gradient p-5 text-white shadow-card max-w-xs">
              <span className="font-display text-3xl font-extrabold block">
                6+ Co-ops
              </span>
              <span className="text-xs text-[#b9d8c5]">
                Direct partner farm suppliers in North Bengal & coastal belts.
              </span>
            </div>
          </div>

          {/* Right: Grid of Perks */}
          <div>
            <SectionHeader
              eyebrow="Why Choose Us"
              title="Grocery Shopping Made Fresh and Simple"
              subtitle="By connecting local farmers directly with Dhaka households, we bring fresher kitchen produce at better prices."
              align="left"
            />

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PERKS.map((perk, idx) => {
                const Icon = perk.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#dfece3] bg-white p-5 shadow-soft transition hover:border-[#1a663b]/40 hover:shadow-card"
                  >
                    <div className="grid place-items-center w-11 h-11 rounded-xl bg-[#e8f5ee] text-[#1a663b]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="mt-3.5 text-sm font-bold text-[#112a1d]">
                      {perk.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#5a7165] leading-relaxed">
                      {perk.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

