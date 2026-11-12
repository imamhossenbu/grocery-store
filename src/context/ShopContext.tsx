'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CartItem, Coupon, Product, ProductSnapshot } from '@/types/store';
import { deliveryFeeFor, discountFor } from '@/lib/pricing';

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
  total: number;
  coupon: Coupon | null;
  setCoupon: (c: Coupon | null) => void;
  addToCart: (p: Product | ProductSnapshot, qty?: number, opts?: { silent?: boolean }) => void;
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getQty: (productId: string) => number;
  /** Replace cart snapshots with fresh price/stock from the server. */
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

export function snapshot(p: Product | ProductSnapshot): ProductSnapshot {
  return { id: p.id, name: p.name, unit: p.unit, price: p.price, oldPrice: p.oldPrice, image: p.image, stock: p.stock };
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

export function ShopProvider({ children }: { children: React.ReactNode }) {
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
    (p: Product | ProductSnapshot, qty = 1, opts?: { silent?: boolean }) => {
      if (p.stock <= 0) {
        toast('Out of stock', `${p.name} is currently unavailable.`, 'error');
        return;
      }
      let capped = false;
      setCart((prev) => {
        const existing = prev.find((i) => i.id === p.id);
        const want = (existing?.qty ?? 0) + qty;
        const next = Math.min(want, p.stock, 99);
        capped = next < want;
        const item: CartItem = { ...snapshot(p), qty: next };
        return existing ? prev.map((i) => (i.id === p.id ? item : i)) : [...prev, item];
      });
      if (capped) toast('Stock limit reached', `Only ${p.stock} of ${p.name} available.`, 'info');
      else if (!opts?.silent) toast('Added to basket', `${p.name} · ${p.unit}`);
    },
    [toast]
  );

  const setQty = useCallback((productId: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== productId)
        : prev.map((i) => (i.id === productId ? { ...i, qty: Math.min(qty, Math.max(i.stock, 0), 99) } : i))
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => setCart((prev) => prev.filter((i) => i.id !== productId)), []);
  const clearCart = useCallback(() => { setCart([]); setCouponState(null); }, []);
  const getQty = useCallback((productId: string) => cart.find((i) => i.id === productId)?.qty ?? 0, [cart]);

  const syncCart = useCallback((fresh: ProductSnapshot[]) => {
    const byId = new Map(fresh.map((f) => [f.id, f]));
    setCart((prev) =>
      prev
        .filter((i) => byId.has(i.id))
        .map((i) => {
          const f = byId.get(i.id)!;
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
  const deliveryFee = deliveryFeeFor(subtotal);
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const value: ShopContextValue = {
    hydrated, cart, cartCount, subtotal, discount, deliveryFee, total,
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
