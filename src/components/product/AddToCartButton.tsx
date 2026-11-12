'use client';

import { Minus, Plus, ShoppingBasket } from 'lucide-react';
import type { Product, ProductSnapshot } from '@/types/store';
import { useShop } from '@/context/ShopContext';

interface Props {
  product: Product | ProductSnapshot;
  size?: 'sm' | 'lg';
  className?: string;
}

/** "Add to basket" that turns into a −/+ stepper once the item is in the cart. */
export function AddToCartButton({ product, size = 'sm', className = '' }: Props) {
  const { getQty, addToCart, setQty, hydrated } = useShop();
  const qty = hydrated ? getQty(product.id) : 0;
  const out = product.stock <= 0;
  const h = size === 'lg' ? 'h-12 text-sm' : 'h-10 text-xs sm:text-sm';

  if (qty > 0) {
    return (
      <div className={`flex items-center justify-between rounded-full bg-[#e8f5ee] border border-[#bce3cb] p-1 ${h} ${className}`}>
        <button
          type="button"
          onClick={() => setQty(product.id, qty - 1)}
          aria-label={`Remove one ${product.name}`}
          className="grid place-items-center aspect-square h-full rounded-full bg-white text-[#112a1d] hover:bg-[#1a663b] hover:text-white transition shadow-sm cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="font-extrabold text-[#14522f]" aria-live="polite">{qty} in basket</span>
        <button
          type="button"
          onClick={() => addToCart(product, 1)}
          disabled={qty >= product.stock}
          aria-label={`Add one more ${product.name}`}
          className="grid place-items-center aspect-square h-full rounded-full bg-[#1a663b] text-white hover:bg-[#14522f] disabled:opacity-40 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={out}
      onClick={() => addToCart(product, 1)}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed ${h} ${
        out ? 'bg-[#eef3f0] text-[#7e9688]' : 'bg-emerald-gradient text-white shadow-glow hover:brightness-105'
      } ${className}`}
    >
      <ShoppingBasket className="w-4 h-4" />
      {out ? 'Out of stock' : 'Add to basket'}
    </button>
  );
}
