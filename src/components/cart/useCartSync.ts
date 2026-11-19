'use client';

import { useEffect, useRef, useState } from 'react';
import { useShop } from '@/context/ShopContext';
import { refreshCart } from '@/actions/orders';
import { formatBDT } from '@/lib/format';
import { lineKey } from '@/lib/variants';

export interface CartNotice {
  id: string;
  kind: 'removed' | 'soldout' | 'reduced' | 'price-up' | 'price-down';
  text: string;
}

/**
 * Once the cart has loaded from localStorage, re-fetch live price and stock
 * for every line and replace the stored snapshots. Returns human-readable
 * notices for anything that changed since the shopper added it.
 */
export function useCartSync() {
  const { hydrated, cart, syncCart } = useShop();
  const [checking, setChecking] = useState(true);
  const [notices, setNotices] = useState<CartNotice[]>([]);
  const started = useRef(false);
  const cartRef = useRef(cart);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    if (!hydrated || started.current) return;
    started.current = true;
    const snapshot = cartRef.current;
    if (snapshot.length === 0) {
      Promise.resolve().then(() => setChecking(false));
      return;
    }

    // No cancellation: the ref guard means this runs once per mount (also under
    // StrictMode's double effect), and a late setState after unmount is harmless.
    refreshCart(snapshot.map((i) => ({ id: i.id, ...(i.variantId ? { variantId: i.variantId } : {}) })))
      .then((res) => {
        if (!res.ok) return;
        const byKey = new Map(res.products.map((p) => [lineKey(p), p]));
        const found: CartNotice[] = [];
        for (const item of snapshot) {
          const key = lineKey(item);
          const f = byKey.get(key);
          // A size line names its size, so two sizes of one product read apart.
          const label = (s: { name: string; unit: string; variantId?: string }) => (s.variantId ? `${s.name} (${s.unit})` : s.name);
          if (!f) {
            found.push({ id: key, kind: 'removed', text: `${label(item)} is no longer sold this way and was removed from your basket.` });
          } else if (f.stock <= 0) {
            found.push({ id: key, kind: 'soldout', text: `${label(f)} is out of stock and was removed from your basket.` });
          } else {
            if (f.stock < item.qty) {
              found.push({ id: key, kind: 'reduced', text: `Only ${f.stock} of ${label(f)} left — we reduced your quantity from ${item.qty} to ${f.stock}.` });
            }
            if (f.price !== item.price) {
              found.push({
                id: key,
                kind: f.price > item.price ? 'price-up' : 'price-down',
                text: `${label(f)} is now ${formatBDT(f.price)} (was ${formatBDT(item.price)}).`,
              });
            }
          }
        }
        syncCart(res.products);
        setNotices(found);
      })
      .catch(() => {
        /* keep the stored snapshot; the server re-prices at checkout anyway */
      })
      .finally(() => setChecking(false));
  }, [hydrated, syncCart]);

  return {
    checking: !hydrated || checking,
    notices,
    dismissNotices: () => setNotices([]),
  };
}
