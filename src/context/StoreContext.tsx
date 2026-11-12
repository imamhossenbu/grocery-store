'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Category,
  Coupon,
  Order,
  OrderItem,
  Product,
  StoreDatabase,
} from '@/types/store';
import { INITIAL_STORE_DATA } from '@/lib/seed-data';

interface CartItem {
  productId: string;
  qty: number;
}

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'error';
}

interface StoreContextValue {
  loading: boolean;
  categories: Category[];
  products: Product[];
  coupons: Coupon[];
  orders: Order[];
  cart: CartItem[];
  cartLines: (OrderItem & { stock: number; lineTotal: number })[];
  cartCount: number;
  appliedCoupon: Coupon | null;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  getProductQty: (productId: string) => number;
  addToCart: (product: Product, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  applyCouponCode: (code: string) => { ok: boolean; message: string };
  removeCoupon: () => void;
  placeCashOnDeliveryOrder: (
    customer: Order['customer']
  ) => Promise<Order | null>;
  refreshStore: () => Promise<void>;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);
const CART_STORAGE_KEY = 'freshbasket_cart_v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<StoreDatabase>(INITIAL_STORE_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback(
    (title: string, description?: string, type: ToastMessage['type'] = 'success') => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, title, description, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshStore = useCallback(async () => {
    try {
      const res = await fetch('/api/store', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as StoreDatabase;
        if (data && Array.isArray(data.products)) {
          setDb(data);
        }
      }
    } catch (err) {
      console.error('Failed to refresh store from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStore();
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch {}
  }, [refreshStore]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const activeProducts = useMemo(
    () => db.products.filter((p) => p.active !== false),
    [db.products]
  );

  const cartLines = useMemo(() => {
    return cart
      .map((item) => {
        const product = db.products.find((p) => p.id === item.productId);
        if (!product || product.active === false) return null;
        return {
          productId: product.id,
          name: product.name,
          unit: product.unit,
          price: product.price,
          qty: item.qty,
          image: product.image,
          stock: product.stock,
          lineTotal: product.price * item.qty,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [cart, db.products]);

  const cartCount = useMemo(
    () => cartLines.reduce((sum, item) => sum + item.qty, 0),
    [cartLines]
  );

  const subtotal = useMemo(
    () => cartLines.reduce((sum, item) => sum + item.lineTotal, 0),
    [cartLines]
  );

  const discount = useMemo(() => {
    if (!appliedCoupon || subtotal < appliedCoupon.minSubtotal) return 0;
    if (appliedCoupon.discountType === 'fixed') {
      return Math.min(appliedCoupon.value, subtotal);
    }
    const raw = Math.round((subtotal * appliedCoupon.value) / 100);
    return appliedCoupon.maxDiscount
      ? Math.min(raw, appliedCoupon.maxDiscount)
      : raw;
  }, [appliedCoupon, subtotal]);

  const deliveryFee = useMemo(() => {
    if (subtotal <= 0 || subtotal >= 1000) return 0;
    return 60;
  }, [subtotal]);

  const total = useMemo(
    () => Math.max(0, subtotal - discount + deliveryFee),
    [subtotal, discount, deliveryFee]
  );

  const getProductQty = useCallback(
    (productId: string) =>
      cart.find((c) => c.productId === productId)?.qty ?? 0,
    [cart]
  );

  const addToCart = useCallback(
    (product: Product, qty = 1) => {
      if (product.stock <= 0) return;
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        const nextQty = Math.min((existing?.qty ?? 0) + qty, product.stock);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id ? { ...i, qty: nextQty } : i
          );
        }
        return [...prev, { productId: product.id, qty: nextQty }];
      });
      pushToast(
        `${product.name} added to basket`,
        `${product.unit} · ৳${product.price}`
      );
    },
    [pushToast]
  );

  const updateQty = useCallback((productId: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) =>
        i.productId === productId ? { ...i, qty } : i
      );
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCoupon(null);
  }, []);

  const applyCouponCode = useCallback(
    (code: string) => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) {
        return { ok: false, message: 'Please enter a coupon code.' };
      }
      const found = db.coupons.find(
        (c) => c.code.toUpperCase() === normalized && c.active
      );
      if (!found) {
        return {
          ok: false,
          message: 'Invalid or expired coupon code. Try WELCOME50 or FRESH10.',
        };
      }
      if (subtotal < found.minSubtotal) {
        return {
          ok: false,
          message: `Minimum order of ৳${found.minSubtotal} required for ${found.code}.`,
        };
      }
      setAppliedCoupon(found);
      pushToast(`Coupon ${found.code} applied!`, found.label, 'info');
      return { ok: true, message: `${found.code} applied: ${found.label}` };
    },
    [db.coupons, subtotal, pushToast]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const placeCashOnDeliveryOrder = useCallback(
    async (customer: Order['customer']): Promise<Order | null> => {
      if (cartLines.length === 0) return null;

      const payload = {
        customer,
        items: cartLines.map((l) => ({
          productId: l.productId,
          name: l.name,
          unit: l.unit,
          price: l.price,
          qty: l.qty,
          image: l.image,
        })),
        subtotal,
        discount,
        couponCode: appliedCoupon?.code,
        deliveryFee,
        total,
        paymentMethod: 'cod' as const,
      };

      const res = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PLACE_ORDER',
          payload,
        }),
      });

      if (!res.ok) {
        pushToast('Could not place order', 'Please try again.', 'error');
        return null;
      }

      const data = await res.json();
      if (data.db) setDb(data.db);
      clearCart();
      pushToast(
        `Order ${data.order.id} Confirmed!`,
        'Cash on Delivery order received.',
        'success'
      );
      return data.order as Order;
    },
    [cartLines, subtotal, discount, appliedCoupon, deliveryFee, total, clearCart, pushToast]
  );

  return (
    <StoreContext.Provider
      value={{
        loading,
        categories: db.categories,
        products: activeProducts,
        coupons: db.coupons.filter((c) => c.active),
        orders: db.orders,
        cart,
        cartLines,
        cartCount,
        appliedCoupon,
        subtotal,
        discount,
        deliveryFee,
        total,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        getProductQty,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        applyCouponCode,
        removeCoupon,
        placeCashOnDeliveryOrder,
        refreshStore,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

