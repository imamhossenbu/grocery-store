'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Minus, Plus, ShoppingBasket, Trash2, Truck, X } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { formatBDT } from '@/lib/format';
import { FREE_DELIVERY_THRESHOLD } from '@/lib/pricing';

export function CartDrawer() {
  const { cartOpen, setCartOpen, cart, setQty, removeFromCart, subtotal, discount, deliveryFee, total, coupon } = useShop();

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCartOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;
  const remaining = FREE_DELIVERY_THRESHOLD - subtotal;
  const progress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Your basket">
      <div className="absolute inset-0 bg-[#071a10]/60 animate-fadeIn" onClick={() => setCartOpen(false)} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl animate-slideInRight">
        <div className="flex items-center justify-between border-b border-[#e6f0e9] px-5 py-4">
          <h2 className="font-display text-xl font-bold text-[#112a1d]">Your basket ({cart.reduce((s, i) => s + i.qty, 0)})</h2>
          <button onClick={() => setCartOpen(false)} aria-label="Close basket" className="grid place-items-center w-9 h-9 rounded-full hover:bg-[#f0f7f2] cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <span className="grid place-items-center w-16 h-16 rounded-2xl bg-[#e8f5ee] text-[#1a663b]"><ShoppingBasket className="w-8 h-8" /></span>
            <p className="mt-4 font-display text-xl font-bold text-[#112a1d]">Your basket is empty</p>
            <p className="mt-1 text-sm text-[#5a7165]">Add fresh produce and daily essentials to get started.</p>
            <Link href="/shop" onClick={() => setCartOpen(false)} className="mt-5 rounded-full bg-emerald-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow">Start shopping</Link>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 bg-[#f4f9f5] border-b border-[#e6f0e9]">
              <p className="flex items-center gap-2 text-xs font-semibold text-[#14522f]">
                <Truck className="w-4 h-4" />
                {remaining > 0 ? <>Add <strong>{formatBDT(remaining)}</strong> more for free delivery</> : 'You unlocked free delivery!'}
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-[#dcebe2] overflow-hidden"><div className="h-full bg-[#1a663b] transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
            <ul className="flex-1 overflow-y-auto divide-y divide-[#eef5f0] px-5">
              {cart.map((item) => (
                <li key={item.id} className="flex gap-3 py-4">
                  <Link href={`/product/${item.id}`} onClick={() => setCartOpen(false)} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt="" className="w-18 h-18 rounded-2xl object-cover bg-[#f0f7f2]" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <Link href={`/product/${item.id}`} onClick={() => setCartOpen(false)} className="text-sm font-bold text-[#112a1d] line-clamp-2 hover:text-[#1a663b]">{item.name}</Link>
                      <button onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`} className="text-[#9ab5a5] hover:text-red-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <p className="text-xs text-[#5a7165]">{item.unit} · {formatBDT(item.price)}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-[#cfe3d6]">
                        <button onClick={() => setQty(item.id, item.qty - 1)} aria-label="Decrease" className="grid place-items-center w-8 h-8 cursor-pointer hover:text-[#1a663b]"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="w-7 text-center text-sm font-bold">{item.qty}</span>
                        <button onClick={() => setQty(item.id, item.qty + 1)} disabled={item.qty >= item.stock} aria-label="Increase" className="grid place-items-center w-8 h-8 cursor-pointer hover:text-[#1a663b] disabled:opacity-30"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                      <span className="text-sm font-extrabold text-[#112a1d]">{formatBDT(item.price * item.qty)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-[#e6f0e9] p-5 space-y-2 text-sm">
              <Row label="Subtotal" value={formatBDT(subtotal)} />
              {discount > 0 && <Row label={`Coupon ${coupon?.code}`} value={`−${formatBDT(discount)}`} accent />}
              <Row label="Delivery" value={deliveryFee === 0 ? 'Free' : formatBDT(deliveryFee)} />
              <div className="flex justify-between border-t border-[#eef5f0] pt-2 text-base font-extrabold text-[#112a1d]"><span>Total</span><span>{formatBDT(total)}</span></div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link href="/cart" onClick={() => setCartOpen(false)} className="rounded-full border-2 border-[#cce2d4] py-2.5 text-center font-semibold text-[#112a1d] hover:border-[#1a663b]">View basket</Link>
                <Link href="/checkout" onClick={() => setCartOpen(false)} className="rounded-full bg-emerald-gradient py-2.5 text-center font-semibold text-white shadow-glow">Checkout</Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${accent ? 'text-[#1a663b] font-semibold' : 'text-[#445c50]'}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
