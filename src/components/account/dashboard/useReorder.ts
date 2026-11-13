'use client';

import { useCallback, useState } from 'react';
import { getCurrentProducts } from '@/actions/account';
import { useShop } from '@/context/ShopContext';
import type { OrderItem } from '@/types/store';

/**
 * Adds an order's items back to the basket at today's prices. Items that are
 * no longer sold or out of stock are skipped and reported in a toast;
 * quantities are capped at the stock left.
 */
export function useReorder() {
  const { addToCart, toast, setCartOpen } = useShop();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const reorder = useCallback(
    async (orderId: string, items: OrderItem[]) => {
      setPendingId(orderId);
      try {
        const products = await getCurrentProducts(items.map((i) => i.productId));
        const byId = new Map(products.map((p) => [p.id, p]));
        const added: string[] = [];
        const missing: string[] = [];
        for (const item of items) {
          const p = byId.get(item.productId);
          if (!p || p.stock <= 0) {
            missing.push(item.name);
            continue;
          }
          addToCart(p, Math.min(item.qty, p.stock), { silent: true });
          added.push(p.name);
        }
        if (added.length) {
          toast(
            `${added.length} item${added.length === 1 ? '' : 's'} added to your basket`,
            missing.length ? `Unavailable right now: ${missing.join(', ')}` : 'Prices updated to today’s rates.',
            missing.length ? 'info' : 'success'
          );
          setCartOpen(true);
        } else {
          toast('Nothing to reorder', missing.length ? `These items are unavailable right now: ${missing.join(', ')}` : undefined, 'error');
        }
      } catch {
        toast('Couldn’t reorder', 'Please check your connection and try again.', 'error');
      } finally {
        setPendingId(null);
      }
    },
    [addToCart, toast, setCartOpen]
  );

  return { reorder, pendingId };
}
