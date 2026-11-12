'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, RefreshCw, ShieldCheck, ShoppingBasket, Trash2 } from 'lucide-react';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { QuantityStepper } from '@/components/ui/Field';
import { useShop } from '@/context/ShopContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { CartSkeleton } from '@/components/store-ui/Skeletons';
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
  const confirm = useConfirm();

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

        <div className="overflow-hidden rounded-2xl border border-[#dfece3] bg-white shadow-soft">
          <div className="flex items-center justify-between gap-3 border-b border-[#eef5f0] px-4 py-3.5 sm:px-6">
            <h2 id="basket-items" className="text-sm font-extrabold text-[#112a1d]">
              {cartCount} item{cartCount === 1 ? '' : 's'}
              {checking && (
                <span className="ml-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#3f5649]" role="status">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin [animation-duration:1.6s] motion-reduce:animate-none" aria-hidden /> Checking latest prices…
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Empty your basket?',
                  description: `All ${cartCount} item${cartCount === 1 ? '' : 's'} will be removed. This can’t be undone.`,
                  confirmLabel: 'Empty basket',
                  cancelLabel: 'Keep items',
                  tone: 'danger',
                });
                if (ok) {
                  clearCart();
                  toast('Basket cleared', undefined, 'info');
                }
              }}
              className="rounded-full px-2.5 py-1.5 text-[13px] font-bold text-[#3f5649] transition hover:bg-red-50 hover:text-red-600 cursor-pointer"
            >
              Clear basket
            </button>
          </div>

          <ul className="divide-y divide-[#eef5f0]">
            <AnimatePresence initial={false}>
            {cart.map((item) => {
              const atMax = item.qty >= Math.min(item.stock, 99);
              const low = item.stock > 0 && item.stock <= LOW_STOCK;
              const saving = item.oldPrice && item.oldPrice > item.price ? (item.oldPrice - item.price) * item.qty : 0;
              return (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-3 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
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
                        <p className="mt-0.5 text-[13px] text-[#3f5649]">
                          {item.unit} · <span className="font-semibold text-[#1a663b]">{formatBDT(item.price)}</span>
                          {item.oldPrice && item.oldPrice > item.price ? (
                            <span className="ml-1 text-[#3f5649] line-through">{formatBDT(item.oldPrice)}</span>
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
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#3f5649] hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                      <div>
                        <QuantityStepper
                          size="sm"
                          label={`Quantity of ${item.name}`}
                          value={item.qty}
                          min={1}
                          max={Math.max(1, Math.min(item.stock, 99))}
                          onValueChange={(n) => setQty(item.id, n)}
                        />
                        {atMax && item.stock < 99 ? (
                          <p className="mt-1 text-[13px] font-semibold text-amber-700">Max available: {item.stock}</p>
                        ) : low ? (
                          <p className="mt-1 text-[13px] font-semibold text-amber-700">Only {item.stock} left</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-base font-extrabold text-[#112a1d] tabular-nums">{formatBDT(item.price * item.qty)}</p>
                        {saving > 0 && <p className="text-[13px] font-semibold text-[#1a663b]">You save {formatBDT(saving)}</p>}
                      </div>
                    </div>
                  </div>
                  </div>
                </motion.li>
              );
            })}
            </AnimatePresence>
          </ul>
        </div>

        <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-bold text-[#1a663b] hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Continue shopping
        </Link>
      </section>

      <aside aria-label="Order summary" className="space-y-4 lg:sticky lg:top-44">
        <FreeDeliveryProgress subtotal={subtotal} />
        <CouponBox coupons={coupons} />
        <div className="rounded-2xl border border-[#dfece3] bg-white p-5 shadow-card">
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
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[13px] text-[#3f5649]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#1a663b]" aria-hidden /> Cash on delivery · Final prices confirmed at checkout
          </p>
        </div>
      </aside>
    </div>
  );
}

export { CartSkeleton };
