import type { Product } from '@/types/store';
import { ProductCard } from './ProductCard';

/**
 * Horizontal, snap-scrolling row of product cards on small screens; a
 * regular 4-column grid from `lg` up.
 */
export function ProductRail({ products, label, priorityCount = 0 }: { products: Product[]; label: string; priorityCount?: number }) {
  return (
    <div
      role="list"
      aria-label={label}
      className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:-mx-6 sm:gap-5 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
    >
      {products.map((p, i) => (
        <div role="listitem" key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[36%] md:w-[30%] lg:w-auto">
          <ProductCard product={p} priority={i < priorityCount} />
        </div>
      ))}
    </div>
  );
}
