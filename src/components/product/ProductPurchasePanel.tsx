'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Minus, Plus, Share2, ShoppingBasket, Zap } from 'lucide-react';
import type { Product } from '@/types/store';
import { useShop } from '@/context/ShopContext';

/** Quantity stepper, add to basket, buy now, wishlist and share for the product page. */
export function ProductPurchasePanel({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart, getQty, hydrated, isWishlisted, toggleWishlist, toast } = useShop();
  const [qty, setQty] = useState(1);
  const out = product.stock <= 0;
  const inCart = hydrated ? getQty(product.id) : 0;
  const maxQty = Math.max(0, Math.min(product.stock, 99) - inCart);
  const wished = hydrated && isWishlisted(product.id);
  const q = Math.max(1, Math.min(qty, Math.max(maxQty, 1)));

  const share = async () => {
    const url = window.location.href;
    const data = { title: product.name, text: `${product.name} (${product.unit}) on FreshBasket`, url };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied', 'Share it with friends and family.', 'info');
    } catch {
      toast('Could not copy link', url, 'error');
    }
  };

  return (
    <div className="space-y-4">
      {!out && (
        <div className="flex flex-wrap items-center gap-3">
          <span id="qty-label" className="text-sm font-semibold text-[#234835]">
            Quantity
          </span>
          <div role="group" aria-labelledby="qty-label" className="flex h-12 items-center rounded-full border border-[#cfe3d6] bg-white p-1">
            <button
              type="button"
              onClick={() => setQty(Math.max(1, q - 1))}
              disabled={q <= 1}
              aria-label="Decrease quantity"
              className="grid h-10 w-10 place-items-center rounded-full text-[#112a1d] transition hover:bg-[#e8f5ee] disabled:opacity-40 cursor-pointer"
            >
              <Minus className="h-4 w-4" />
            </button>
            <output aria-live="polite" className="w-10 text-center text-base font-extrabold text-[#112a1d]">
              {q}
            </output>
            <button
              type="button"
              onClick={() => setQty(Math.min(maxQty, q + 1))}
              disabled={q >= maxQty}
              aria-label="Increase quantity"
              className="grid h-10 w-10 place-items-center rounded-full text-[#112a1d] transition hover:bg-[#e8f5ee] disabled:opacity-40 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {inCart > 0 && <span className="text-xs font-semibold text-[#1a663b]">{inCart} already in your basket</span>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={out || maxQty <= 0}
          onClick={() => {
            addToCart(product, q);
            setQty(1);
          }}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm font-bold transition active:scale-[0.98] disabled:cursor-not-allowed cursor-pointer ${
            out || maxQty <= 0 ? 'bg-[#eef3f0] text-[#7e9688]' : 'bg-emerald-gradient text-white shadow-glow hover:brightness-105'
          }`}
        >
          <ShoppingBasket className="h-4.5 w-4.5" />
          {out ? 'Out of stock' : maxQty <= 0 ? 'Max quantity in basket' : 'Add to basket'}
        </button>
        <button
          type="button"
          disabled={out}
          onClick={() => {
            if (maxQty > 0) addToCart(product, q);
            router.push('/checkout');
          }}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#f5b82e] text-sm font-bold text-[#3a2502] shadow-md transition hover:bg-[#e5a91f] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <Zap className="h-4.5 w-4.5" /> Buy now
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-pressed={wished}
          className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition cursor-pointer ${
            wished ? 'border-red-200 bg-red-50 text-red-600' : 'border-[#cfe3d6] bg-white text-[#234835] hover:border-red-300 hover:text-red-500'
          }`}
        >
          <Heart className={`h-4 w-4 ${wished ? 'fill-current' : ''}`} />
          {wished ? 'Saved to wishlist' : 'Add to wishlist'}
        </button>
        <button
          type="button"
          onClick={share}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#cfe3d6] bg-white px-4 text-sm font-semibold text-[#234835] transition hover:border-[#1a663b] hover:text-[#1a663b] cursor-pointer"
        >
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>
    </div>
  );
}
