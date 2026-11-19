'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CartItem, Coupon, Product, ProductSnapshot, ProductVariant } from '@/types/store';
import { lineKey, toSnapshot } from '@/lib/variants';
import { DEFAULT_DELIVERY, deliveryFeeFor, discountFor, type DeliverySettings } from '@/lib/pricing';

/**
 * Client-side shopping state: cart, wishlist, recently viewed, applied coupon,
 * cart drawer and toasts. Persisted in localStorage. Prices here are only for
 * display — the server re-prices every order in place_order().
 */

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}

interface ShopContextValue {
  hydrated: boolean;
  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  /** Delivery charges set in the admin panel (store_settings). */
  delivery: DeliverySettings;
  total: number;
  coupon: Coupon | null;
  setCoupon: (c: Coupon | null) => void;
  /**
   * `variant`: the chosen size of a product sold in sizes. Such a product
   * cannot be added without one (a basket line that already carries its
   * variantId counts). Returns whether anything was added.
   */
  addToCart: (p: Product | ProductSnapshot, qty?: number, opts?: { silent?: boolean; variant?: ProductVariant }) => boolean;
  /** `variantId` picks the line of one size; leave it out for a plain product. */
  setQty: (productId: string, qty: number, variantId?: string) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  clearCart: () => void;
  /** Quantity of one size, or without `variantId` of the product over all its lines. */
  getQty: (productId: string, variantId?: string) => number;
  /** Replace cart snapshots with fresh price/stock from the server (one per basket line). */
  syncCart: (fresh: ProductSnapshot[]) => void;
  wishlist: ProductSnapshot[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (p: Product | ProductSnapshot) => void;
  recentlyViewed: ProductSnapshot[];
  trackView: (p: Product) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  toasts: Toast[];
  toast: (title: string, description?: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);

const KEYS = {
  cart: 'fb_cart_v2',
  wishlist: 'fb_wishlist_v1',
  recent: 'fb_recent_v1',
  coupon: 'fb_coupon_v1',
};

export function snapshot(p: Product | ProductSnapshot, variant?: ProductVariant): ProductSnapshot {
  if ('category' in p) return toSnapshot(p, variant);
  return {
    id: p.id, name: p.name, unit: p.unit, price: p.price, oldPrice: p.oldPrice, image: p.image, stock: p.stock,
    ...(p.variantId ? { variantId: p.variantId } : {}),
    ...(p.hasVariants ? { hasVariants: true } : {}),
  };
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function ShopProvider({ children, delivery = DEFAULT_DELIVERY }: { children: React.ReactNode; delivery?: DeliverySettings }) {
  const [hydrated, setHydrated] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<ProductSnapshot[]>([]);
  const [recentlyViewed, setRecent] = useState<ProductSnapshot[]>([]);
  const [coupon, setCouponState] = useState<Coupon | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  useEffect(() => {
    // localStorage is only readable after mount; reading it during render
    // would make the server and client HTML differ (hydration mismatch).
    const storedCart = load<CartItem[]>(KEYS.cart, []);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCart(Array.isArray(storedCart) ? storedCart.filter((i) => i && i.id && i.qty > 0) : []);
    setWishlist(load<ProductSnapshot[]>(KEYS.wishlist, []));
    setRecent(load<ProductSnapshot[]>(KEYS.recent, []));
    setCouponState(load<Coupon | null>(KEYS.coupon, null));
    setHydrated(true);

    // Keep tabs in sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEYS.cart) setCart(load(KEYS.cart, []));
      if (e.key === KEYS.wishlist) setWishlist(load(KEYS.wishlist, []));
      if (e.key === KEYS.coupon) setCouponState(load(KEYS.coupon, null));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => { if (hydrated) save(KEYS.cart, cart); }, [cart, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.wishlist, wishlist); }, [wishlist, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.recent, recentlyViewed); }, [recentlyViewed, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.coupon, coupon); }, [coupon, hydrated]);

  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (title: string, description?: string, type: Toast['type'] = 'success') => {
      const id = `t${++toastSeq.current}`;
      setToasts((t) => [...t.slice(-3), { id, title, description, type }]);
      setTimeout(() => dismissToast(id), 3800);
    },
    [dismissToast]
  );

  const addToCart = useCallback(
    (p: Product | ProductSnapshot, qty = 1, opts?: { silent?: boolean; variant?: ProductVariant }) => {
      const snap = snapshot(p, opts?.variant);
      if (snap.hasVariants && !snap.variantId) {
        toast('Choose a size first', `${snap.name} comes in several sizes. Open it to pick one.`, 'info');
        return false;
      }
      if (snap.stock <= 0) {
        toast('Out of stock', `${snap.name} (${snap.unit}) is currently unavailable.`, 'error');
        return false;
      }
      const key = lineKey(snap);
      let capped = false;
      setCart((prev) => {
        const existing = prev.find((i) => lineKey(i) === key);
        const want = (existing?.qty ?? 0) + qty;
        const next = Math.min(want, snap.stock, 99);
        capped = next < want;
        const item: CartItem = { ...snap, qty: next };
        return existing ? prev.map((i) => (lineKey(i) === key ? item : i)) : [...prev, item];
      });
      if (capped) toast('Stock limit reached', `Only ${snap.stock} of ${snap.name} available.`, 'info');
      else if (!opts?.silent) toast('Added to basket', `${snap.name} · ${snap.unit}`);
      return true;
    },
    [toast]
  );

  const setQty = useCallback((productId: string, qty: number, variantId?: string) => {
    const key = lineKey({ id: productId, variantId });
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => lineKey(i) !== key)
        : prev.map((i) => (lineKey(i) === key ? { ...i, qty: Math.min(qty, Math.max(i.stock, 0), 99) } : i))
    );
  }, []);

  const removeFromCart = useCallback((productId: string, variantId?: string) => {
    const key = lineKey({ id: productId, variantId });
    setCart((prev) => prev.filter((i) => lineKey(i) !== key));
  }, []);
  const clearCart = useCallback(() => { setCart([]); setCouponState(null); }, []);
  const getQty = useCallback(
    (productId: string, variantId?: string) =>
      cart.reduce((n, i) => (i.id === productId && (!variantId || i.variantId === variantId) ? n + i.qty : n), 0),
    [cart]
  );

  const syncCart = useCallback((fresh: ProductSnapshot[]) => {
    const byKey = new Map(fresh.map((f) => [lineKey(f), f]));
    setCart((prev) =>
      prev
        .filter((i) => byKey.has(lineKey(i)))
        .map((i) => {
          const f = byKey.get(lineKey(i))!;
          return { ...f, qty: Math.min(i.qty, Math.max(f.stock, 0)) };
        })
        .filter((i) => i.qty > 0)
    );
  }, []);

  const isWishlisted = useCallback((id: string) => wishlist.some((w) => w.id === id), [wishlist]);
  const toggleWishlist = useCallback(
    (p: Product | ProductSnapshot) => {
      const exists = wishlist.some((w) => w.id === p.id);
      setWishlist((prev) => (exists ? prev.filter((w) => w.id !== p.id) : [snapshot(p), ...prev].slice(0, 100)));
      toast(exists ? 'Removed from wishlist' : 'Saved to wishlist', p.name, 'info');
    },
    [wishlist, toast]
  );

  const trackView = useCallback((p: Product) => {
    setRecent((prev) => [snapshot(p), ...prev.filter((r) => r.id !== p.id)].slice(0, 12));
  }, []);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const discount = discountFor(coupon, subtotal);
  // The basket assumes Dhaka; checkout switches once a district is chosen.
  const deliveryFee = deliveryFeeFor(subtotal, delivery);
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const value: ShopContextValue = {
    hydrated, cart, cartCount, subtotal, discount, deliveryFee, delivery, total,
    coupon, setCoupon: setCouponState,
    addToCart, setQty, removeFromCart, clearCart, getQty, syncCart,
    wishlist, isWishlisted, toggleWishlist,
    recentlyViewed, trackView,
    cartOpen, setCartOpen,
    toasts, toast, dismissToast,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used inside <ShopProvider>');
  return ctx;
}
