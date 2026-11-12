'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Heart, Loader2, ShoppingBasket, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { getWishlistProducts } from '@/actions/account';
import { formatBDT } from '@/lib/format';
import { discountPercent } from '@/lib/pricing';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import type { ProductSnapshot } from '@/types/store';

interface Row {
  saved: ProductSnapshot;
  current: ProductSnapshot;
  available: boolean;
}

export function WishlistView() {
  const { hydrated, wishlist, toggleWishlist, addToCart, getQty, toast } = useShop();
  const [fresh, setFresh] = useState<{ key: string; byId: Map<string, ProductSnapshot> } | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);

  const idsKey = useMemo(() => wishlist.map((w) => w.id).sort().join('|'), [wishlist]);

  // Re-read price and stock from the server whenever the set of saved ids changes.
  useEffect(() => {
    if (!hydrated || !idsKey) return;
    let cancelled = false;
    getWishlistProducts(idsKey.split('|'))
      .then((products) => {
        if (cancelled) return;
        const byId = new Map<string, ProductSnapshot>(
          products.map((p) => [p.id, { id: p.id, name: p.name, unit: p.unit, price: p.price, oldPrice: p.oldPrice, image: p.image, stock: p.stock }])
        );
        setFresh({ key: idsKey, byId });
        setRefreshFailed(false);
      })
      .catch(() => {
        if (!cancelled) setRefreshFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, idsKey]);

  const loaded = fresh !== null && fresh.key === idsKey;
  // Keep showing the previous result while a refresh for a changed list is in flight.
  const lookup = fresh?.byId;
  const rows: Row[] = wishlist.map((saved) => {
    const current = lookup?.get(saved.id);
    return {
      saved,
      current: current ?? saved,
      available: lookup ? !!current || !loaded : true,
    };
  });
  const addable = rows.filter((r) => r.available && r.current.stock > 0 && getQty(r.current.id) === 0);

  if (!hydrated) return <ProductGridSkeleton count={4} />;

  if (wishlist.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="h-8 w-8" />}
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it here. Saved items are kept on this device, with live prices and stock."
        actionLabel="Discover products"
        actionHref="/shop"
      />
    );
  }

  const addAll = () => {
    addable.forEach((r) => addToCart(r.current, 1, { silent: addable.length > 1 }));
    if (addable.length > 1) toast(`${addable.length} items added to your basket`, undefined, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#dfece3] bg-white p-4 shadow-soft">
        <p className="text-sm text-[#445c50]" aria-live="polite">
          <strong className="text-[#112a1d]">{wishlist.length}</strong> saved item{wishlist.length === 1 ? '' : 's'}
          {!loaded && !refreshFailed && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-[#7e9688]">
              <Loader2 className="h-3 w-3 animate-spin" /> checking prices
            </span>
          )}
          {refreshFailed && <span className="ml-2 text-xs text-amber-700">Couldn’t refresh prices — showing saved prices.</span>}
        </p>
        <button
          type="button"
          onClick={addAll}
          disabled={addable.length === 0}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-gradient px-5 text-sm font-bold text-white shadow-glow transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <ShoppingBasket className="h-4 w-4" />
          {addable.length > 0 ? `Add ${addable.length} in-stock item${addable.length === 1 ? '' : 's'} to basket` : 'All in-stock items are in your basket'}
        </button>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {rows.map((row) => (
          <li key={row.saved.id}>
            <WishlistCard
              row={row}
              inBasket={getQty(row.current.id)}
              onMove={() => {
                addToCart(row.current, 1);
                toggleWishlist(row.saved);
              }}
              onRemove={() => toggleWishlist(row.saved)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function WishlistCard({ row, inBasket, onMove, onRemove }: { row: Row; inBasket: number; onMove: () => void; onRemove: () => void }) {
  const { current: p, saved, available } = row;
  const out = !available || p.stock <= 0;
  const low = !out && p.stock <= 20;
  const pct = discountPercent(p.price, p.oldPrice);
  const delta = available ? p.price - saved.price : 0;
  const href = `/product/${encodeURIComponent(p.id)}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#dfece3] bg-white shadow-soft transition hover:border-[#1a663b]/40 hover:shadow-card">
      <Link href={href} className="relative block aspect-square overflow-hidden bg-[#f0f7f2]" aria-label={p.name} tabIndex={-1}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image} alt="" loading="lazy" className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${out ? 'opacity-60 grayscale-[40%]' : ''}`} />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {pct > 0 && <span className="rounded-full bg-[#f5b82e] px-2.5 py-1 text-[11px] font-extrabold text-[#3a2502] shadow-sm">-{pct}%</span>}
          {delta < 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#1a663b] shadow-sm">
              <TrendingDown className="h-3 w-3" /> {formatBDT(-delta)} cheaper
            </span>
          )}
          {delta > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-amber-700 shadow-sm">
              <TrendingUp className="h-3 w-3" /> Price up {formatBDT(delta)}
            </span>
          )}
        </div>
        {out && (
          <span className="absolute inset-x-3 bottom-3 rounded-full bg-[#0f2c1d]/85 px-3 py-1.5 text-center text-xs font-bold text-white">
            {available ? 'Out of stock' : 'No longer available'}
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${p.name} from wishlist`}
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#5a7165] shadow-md transition hover:scale-105 hover:text-red-600 cursor-pointer"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <div className="flex flex-1 flex-col p-4">
        <span className="self-start rounded-full bg-[#f0f7f2] px-2.5 py-0.5 text-xs font-semibold text-[#1a663b]">{p.unit}</span>
        <h3 className="mt-2.5 min-h-[2.6em] text-[15px] font-bold leading-snug text-[#112a1d] line-clamp-2">
          <Link href={href} className="hover:text-[#1a663b]">{p.name}</Link>
        </h3>
        <div className="mt-auto pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-[#1a663b]">{formatBDT(p.price)}</span>
              {pct > 0 && <span className="text-xs text-[#7e9688] line-through">{formatBDT(p.oldPrice!)}</span>}
            </div>
            <span className={`text-[11px] font-bold ${out ? 'text-red-600' : low ? 'text-amber-600' : 'text-emerald-700'}`}>
              {out ? 'Sold out' : low ? `Only ${p.stock} left` : 'In stock'}
            </span>
          </div>
          <button
            type="button"
            onClick={onMove}
            disabled={out}
            className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-xs font-semibold transition active:scale-[0.98] sm:text-sm cursor-pointer disabled:cursor-not-allowed ${
              out ? 'bg-[#eef3f0] text-[#7e9688]' : 'bg-emerald-gradient text-white shadow-glow hover:brightness-105'
            }`}
          >
            <ShoppingBasket className="h-4 w-4" />
            {out ? 'Unavailable' : 'Move to basket'}
          </button>
          {inBasket > 0 && !out && (
            <p className="mt-1.5 text-center text-[11px] font-semibold text-[#5a7165]">{inBasket} already in your basket</p>
          )}
        </div>
      </div>
    </article>
  );
}
