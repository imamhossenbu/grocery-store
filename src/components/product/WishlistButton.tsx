'use client';

import { Heart } from 'lucide-react';
import type { Product, ProductSnapshot } from '@/types/store';
import { useShop } from '@/context/ShopContext';

export function WishlistButton({ product, className = '' }: { product: Product | ProductSnapshot; className?: string }) {
  const { isWishlisted, toggleWishlist, hydrated } = useShop();
  const on = hydrated && isWishlisted(product.id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
      }}
      aria-pressed={on}
      aria-label={on ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      className={`grid place-items-center w-9 h-9 rounded-full bg-white/95 backdrop-blur shadow-md transition hover:scale-105 cursor-pointer ${
        on ? 'text-red-500' : 'text-[#234835] hover:text-red-500'
      } ${className}`}
    >
      <Heart className={`w-4 h-4 ${on ? 'fill-current' : ''}`} />
    </button>
  );
}
