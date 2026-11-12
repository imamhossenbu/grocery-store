'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ShoppingBasket, Trash2, Truck } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { formatBDT } from '@/lib/format';
import { FREE_DELIVERY_THRESHOLD } from '@/lib/pricing';
import { Drawer } from '@/components/ui/Dialog';
import { QuantityStepper } from '@/components/ui/Field';

/** Slide-over basket (ui Drawer: focus trap, Esc, backdrop fade, spring slide). Lines animate in and out. */
export function CartDrawer() {
  const { cartOpen, setCartOpen, cart, setQty, removeFromCart, subtotal, discount, deliveryFee, total, coupon } = useShop();
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const remaining = FREE_DELIVERY_THRESHOLD - subtotal;
  const progress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);
  const close = () => setCartOpen(false);

  return (
    <Drawer open={cartOpen} onOpenChange={setCartOpen} side="right" title={<>Your basket <span className="tabular-nums text-[#3f5649]">({count})</span></>}>
      {cart.length === 0 ? (
        <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#e8f5ee] text-[#1a663b]">
            <ShoppingBasket className="h-8 w-8" aria-hidden />
          </span>
          <p className="mt-4 font-display text-xl font-bold text-[#112a1d]">Your basket is empty</p>
          <p className="mt-1 text-sm text-[#3f5649]">Add fresh produce and daily essentials to get started.</p>
          <Link href="/shop" onClick={close} className="fb-press mt-5 rounded-full bg-emerald-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="-mx-6 -mb-6 flex min-h-full flex-col">
          <div className="mx-6 rounded-xl bg-[#f4f9f5] px-4 py-3">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-[#14522f]">
              <Truck className="h-4 w-4 shrink-0" aria-hidden />
              {remaining > 0 ? (
                <span>
                  Add <strong className="tabular-nums">{formatBDT(remaining)}</strong> more for free delivery
                </span>
              ) : (
                'You unlocked free delivery!'
              )}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#dcebe2]">
              <motion.div className="h-full rounded-full bg-[#1a663b]" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>

          <ul className="flex-1 px-6">
            <AnimatePresence initial={false}>
              {cart.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40, height: 0, transition: { duration: 0.2 } }}
                  className="overflow-hidden border-b border-[#eef5f0] last:border-0"
                >
                  <div className="flex gap-3 py-4">
                    <Link href={`/product/${item.id}`} onClick={close} className="shrink-0" tabIndex={-1} aria-hidden>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt="" className="h-18 w-18 rounded-xl bg-[#f0f7f2] object-cover" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <Link href={`/product/${item.id}`} onClick={close} className="line-clamp-2 text-sm font-bold text-[#112a1d] hover:text-[#1a663b]">
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="fb-press -mr-1.5 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#3f5649] hover:bg-red-50 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                      <p className="text-[13px] text-[#3f5649]">
                        {item.unit} · <span className="tabular-nums">{formatBDT(item.price)}</span>
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <QuantityStepper
                          size="sm"
                          label={`Quantity of ${item.name}`}
                          value={item.qty}
                          min={1}
                          max={Math.max(1, Math.min(item.stock, 99))}
                          onValueChange={(n) => setQty(item.id, n)}
                        />
                        <span className="text-sm font-extrabold tabular-nums text-[#112a1d]">{formatBDT(item.price * item.qty)}</span>
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="sticky bottom-0 space-y-2 border-t border-[#e6f0e9] bg-white px-6 pb-6 pt-4 text-sm">
            <Row label="Subtotal" value={formatBDT(subtotal)} />
            {discount > 0 && <Row label={`Coupon ${coupon?.code}`} value={`−${formatBDT(discount)}`} accent />}
            <Row label="Delivery" value={deliveryFee === 0 ? 'Free' : formatBDT(deliveryFee)} />
            <div className="flex justify-between border-t border-[#eef5f0] pt-2 text-base font-extrabold text-[#112a1d]">
              <span>Total</span>
              <span className="tabular-nums">{formatBDT(total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link href="/cart" onClick={close} className="fb-press rounded-full border-2 border-[#cce2d4] py-2.5 text-center font-semibold text-[#112a1d] hover:border-[#1a663b]">
                View basket
              </Link>
              <Link href="/checkout" onClick={close} className="fb-press rounded-full bg-emerald-gradient py-2.5 text-center font-semibold text-white shadow-glow">
                Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${accent ? 'font-semibold text-[#1a663b]' : 'text-[#3f5649]'}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
