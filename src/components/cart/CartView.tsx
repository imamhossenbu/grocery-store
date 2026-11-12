'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Loader2, Minus, Plus, ShieldCheck, ShoppingBasket, Trash2 } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Block } from '@/components/ui/Skeleton';
import { formatBDT } from '@/lib/format';
import type { Coupon } from '@/types/store';
import { useCartSync } from './useCartSync';
import { CartNotices } from './CartNotices';
import { CouponBox } from './CouponBox';
import { FreeDeliveryProgress, TotalsRows } from './OrderTotals';

const LOW_STOCK = 10;

export function CartView({ coupons }: { coupons: Coupon[] }) {
  const { hydrated, cart, cartCount, setQty, removeFromCart, clearCart, subtotal, discount, deliveryFee, total, coupon, toast } = useShop();
  const { checking, notices, dismissNotices } = useCartSync();

  if (!hydrated) return <CartSkeleton />;

  if (cart.length === 0) {
    return (
      <div className="space-y-4">
        <CartNotices notices={notices} onDismiss={dismissNotices} />
        <EmptyState
          icon={<ShoppingBasket className="h-8 w-8" />}
          title="Your basket is empty"
          description="Fresh fruits, vegetables, fish and daily essentials are a few taps away — delivered across Dhaka, cash on delivery."
          actionLabel="Start shopping"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <section aria-labelledby="basket-items" className="space-y-4">
        <CartNotices notices={notices} onDismiss={dismissNotices} />

        <div className="overflow-hidden rounded-3xl border border-[#dfece3] bg-white shadow-soft">
          <div className="flex items-center justify-between gap-3 border-b border-[#eef5f0] px-4 py-3.5 sm:px-6">
            <h2 id="basket-items" className="text-sm font-extrabold text-[#112a1d]">
              {cartCount} item{cartCount === 1 ? '' : 's'}
              {checking && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-[#5a7165]">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Checking latest prices…
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Remove all items from your basket?')) {
                  clearCart();
                  toast('Basket cleared', undefined, 'info');
                }
              }}
              className="text-xs font-bold text-[#5a7165] hover:text-red-600 cursor-pointer"
            >
              Clear basket
            </button>
          </div>

          <ul className="divide-y divide-[#eef5f0]">
            {cart.map((item) => {
              const atMax = item.qty >= Math.min(item.stock, 99);
              const low = item.stock > 0 && item.stock <= LOW_STOCK;
              const saving = item.oldPrice && item.oldPrice > item.price ? (item.oldPrice - item.price) * item.qty : 0;
              return (
                <li key={item.id} className="flex gap-3 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
                  <Link href={`/product/${item.id}`} className="shrink-0" tabIndex={-1} aria-hidden>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt="" className="h-20 w-20 rounded-2xl bg-[#f0f7f2] object-cover sm:h-24 sm:w-24" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/product/${item.id}`} className="line-clamp-2 text-[15px] font-bold leading-snug text-[#112a1d] hover:text-[#1a663b]">
                          {item.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-[#5a7165]">
                          {item.unit} · <span className="font-semibold text-[#1a663b]">{formatBDT(item.price)}</span>
                          {item.oldPrice && item.oldPrice > item.price ? (
                            <span className="ml-1 text-[#8aa595] line-through">{formatBDT(item.oldPrice)}</span>
                          ) : null}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          removeFromCart(item.id);
                          toast('Removed from basket', item.name, 'info');
                        }}
                        aria-label={`Remove ${item.name} from basket`}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#9ab5a5] hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                      <div>
                        <div className="inline-flex items-center rounded-full border border-[#cfe3d6] bg-white" role="group" aria-label={`Quantity of ${item.name}`}>
                          <button
                            type="button"
                            onClick={() => setQty(item.id, item.qty - 1)}
                            aria-label={item.qty === 1 ? `Remove ${item.name}` : `Decrease quantity of ${item.name}`}
                            className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#f0f7f2] hover:text-[#1a663b] cursor-pointer"
                          >
                            {item.qty === 1 ? <Trash2 className="h-3.5 w-3.5" aria-hidden /> : <Minus className="h-3.5 w-3.5" aria-hidden />}
                          </button>
                          <span className="w-8 text-center text-sm font-extrabold tabular-nums" aria-live="polite">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(item.id, item.qty + 1)}
                            disabled={atMax}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#f0f7f2] hover:text-[#1a663b] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                        {atMax && item.stock < 99 ? (
                          <p className="mt-1 text-[11px] font-bold text-amber-700">Max available: {item.stock}</p>
                        ) : low ? (
                          <p className="mt-1 text-[11px] font-bold text-amber-700">Only {item.stock} left</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-base font-extrabold text-[#112a1d] tabular-nums">{formatBDT(item.price * item.qty)}</p>
                        {saving > 0 && <p className="text-[11px] font-bold text-[#1a663b]">You save {formatBDT(saving)}</p>}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-bold text-[#1a663b] hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Continue shopping
        </Link>
      </section>

      <aside aria-label="Order summary" className="space-y-4 lg:sticky lg:top-44">
        <FreeDeliveryProgress subtotal={subtotal} />
        <CouponBox coupons={coupons} />
        <div className="rounded-3xl border border-[#dfece3] bg-white p-5 shadow-card">
          <h2 className="font-display text-xl font-bold text-[#112a1d]">Order summary</h2>
          <div className="mt-4">
            <TotalsRows subtotal={subtotal} discount={discount} couponCode={coupon?.code} deliveryFee={deliveryFee} total={total} itemCount={cartCount} />
          </div>
          <Link
            href="/checkout"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-gradient px-6 py-3.5 text-base font-bold text-white shadow-glow transition hover:-translate-y-0.5 hover:brightness-105"
          >
            Proceed to checkout <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#5a7165]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#1a663b]" aria-hidden /> Cash on delivery · Final prices confirmed at checkout
          </p>
        </div>
      </aside>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]" aria-busy="true" aria-label="Loading your basket">
      <div className="space-y-3 rounded-3xl border border-[#dfece3] bg-white p-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4">
            <Block className="h-20 w-20 shrink-0" />
            <div className="flex-1 space-y-2">
              <Block className="h-4 w-2/3" />
              <Block className="h-3 w-1/3" />
              <Block className="h-8 w-28 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <Block className="h-20" />
        <Block className="h-32" />
        <Block className="h-56" />
      </div>
    </div>
  );
}
