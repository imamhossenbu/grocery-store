'use client';

import React from 'react';
import { Category, Product } from '@/types/store';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface CategoryFilterProps {
  categories: Category[];
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export function CategoryFilter({
  categories,
  products,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const getCount = (categoryId: string) => {
    if (categoryId === 'all') return products.length;
    return products.filter((p) => p.category === categoryId).length;
  };

  return (
    <section id="categories-section" className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Popular Categories"
          title="Everything Your Kitchen Needs"
          subtitle="Explore fresh harvests and pantry essentials from local co-op growers."
          align="left"
        />

        {/* Visual Cards Grid */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = getCount(cat.id);

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(isSelected ? 'all' : cat.id)}
                className={`group flex flex-col items-center rounded-3xl border p-3.5 text-center transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
                  isSelected
                    ? 'border-[#1a663b] bg-[#e8f5ee] shadow-card ring-2 ring-[#1a663b]/30'
                    : 'border-[#dfece3] bg-white shadow-soft hover:border-[#1a663b]/40 hover:shadow-card'
                }`}
              >
                <div className="aspect-square w-full overflow-hidden rounded-2xl bg-[#f0f7f2]">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <h3 className="mt-3 text-xs sm:text-sm font-bold text-[#112a1d] line-clamp-1">
                  {cat.name}
                </h3>
                <span className="mt-0.5 text-[11px] text-[#5a7165]">
                  {count} items
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Pills Bar */}
        <div className="mt-8 flex flex-wrap items-center gap-2 pt-4 border-t border-[#e2efe6]">
          <button
            onClick={() => onSelectCategory('all')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#1a663b] text-white shadow-md'
                : 'bg-white text-[#234835] border border-[#cfe3d6] hover:bg-[#f0f7f2]'
            }`}
          >
            All Groceries ({products.length})
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#1a663b] text-white shadow-md'
                    : 'bg-white text-[#234835] border border-[#cfe3d6] hover:bg-[#f0f7f2]'
                }`}
              >
                {cat.name} ({getCount(cat.id)})
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
