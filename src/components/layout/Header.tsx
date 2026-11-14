import { Gift, MapPin, Truck } from 'lucide-react';
import { getCategoryTree, getSearchIndex } from '@/lib/data/catalog';
import type { CategoryNode } from '@/types/store';
import { freeDeliveryLine } from '@/lib/pricing';
import { getDeliverySettings } from '@/lib/data/settings';
import { HeaderClient, type HeaderCategory } from './HeaderClient';

export async function Header() {
  const [tree, index, delivery] = await Promise.all([getCategoryTree(), getSearchIndex(), getDeliverySettings()]);
  const freeLine = freeDeliveryLine(delivery);
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="bg-[#0f2c1d] text-[#ecfdf5] text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 font-medium truncate">
            <Gift className="w-3.5 h-3.5 shrink-0 text-[#f5b82e]" />
            <span className="truncate">{freeLine ? `${freeLine} · ` : ''}Use <strong className="text-[#f5b82e]">WELCOME50</strong> on your first order</span>
          </p>
          <div className="hidden md:flex items-center gap-5 text-[#b9d8c5] shrink-0">
            <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#f5b82e]" /> Same-day delivery in Dhaka</span>
            <span className="inline-flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-[#f5b82e]" /> Cash on delivery</span>
          </div>
        </div>
      </div>
      <HeaderClient
        categories={tree.map(toHeaderCategory)}
        index={index}
      />
    </header>
  );
}

function toHeaderCategory({ id, name, image, productCount, children }: CategoryNode): HeaderCategory {
  return { id, name, image, productCount, children: children.map(toHeaderCategory) };
}
