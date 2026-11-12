import { MapPin, Sparkles, Truck } from 'lucide-react';
import { getCategories, getSearchIndex } from '@/lib/data/catalog';
import { FREE_DELIVERY_THRESHOLD } from '@/lib/pricing';
import { formatBDT } from '@/lib/format';
import { HeaderClient } from './HeaderClient';

export async function Header() {
  const [categories, index] = await Promise.all([getCategories(), getSearchIndex()]);
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="bg-[#0f2c1d] text-[#ecfdf5] text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 font-medium truncate">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#f5b82e]" />
            <span className="truncate">Free delivery over {formatBDT(FREE_DELIVERY_THRESHOLD)} · Use <strong className="text-[#f5b82e]">WELCOME50</strong> on your first order</span>
          </p>
          <div className="hidden md:flex items-center gap-5 text-[#b9d8c5] shrink-0">
            <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#f5b82e]" /> Same-day delivery in Dhaka</span>
            <span className="inline-flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-[#f5b82e]" /> Cash on delivery</span>
          </div>
        </div>
      </div>
      <HeaderClient
        categories={categories.map(({ id, name, image, productCount }) => ({ id, name, image, productCount }))}
        index={index}
      />
    </header>
  );
}
