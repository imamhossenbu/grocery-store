'use client';

import { useEffect } from 'react';
import type { Product } from '@/types/store';
import { useShop } from '@/context/ShopContext';

/** Records the product in "recently viewed" once the shop state has loaded. */
export function TrackView({ product }: { product: Product }) {
  const { trackView, hydrated } = useShop();
  useEffect(() => {
    if (hydrated) trackView(product);
    // Only when the product (or hydration) changes, not on every product object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, product.id, trackView]);
  return null;
}
