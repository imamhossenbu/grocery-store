'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2, RotateCcw } from 'lucide-react';
import { resumePayment } from '@/actions/orders';
import { useShop } from '@/context/ShopContext';
import type { OrderItem } from '@/types/store';

/** Re-opens the SSLCommerz payment page for a still-pending online order. */
export function CompletePaymentButton({ orderId, token, amountLabel }: { orderId: string; token: string | null; amountLabel: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await resumePayment(orderId, token);
            if (res.ok) window.location.assign(res.gatewayUrl);
            else setError(res.error);
          })
        }
        className="inline-flex items-center gap-2 rounded-full bg-emerald-gradient px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CreditCard className="h-4 w-4" aria-hidden />}
        {pending ? 'Opening payment page…' : `Complete payment · ${amountLabel}`}
      </button>
      {error && (
        <p role="alert" className="text-xs font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** Puts a cancelled order's items back in the basket and opens checkout (prices and stock are re-checked there). */
export function RetryCheckoutButton({ items }: { items: OrderItem[] }) {
  const { addToCart } = useShop();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        for (const i of items) {
          addToCart({ id: i.productId, name: i.name, unit: i.unit, price: i.price, image: i.image, stock: 99 }, i.qty, { silent: true });
        }
        router.push('/checkout');
      }}
      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-red-700 ring-1 ring-red-200 hover:bg-red-100 cursor-pointer"
    >
      <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Put items back in basket &amp; try again
    </button>
  );
}
