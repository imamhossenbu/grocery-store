import type { Metadata } from 'next';
import { WishlistView } from '@/components/account/WishlistView';
import { WishlistHeader } from '@/components/account/dashboard/headers';

export const metadata: Metadata = { title: 'Wishlist' };

/** Wishlist inside the dashboard (the list lives in localStorage; /wishlist stays for guests). */
export default function AccountWishlistPage() {
  return (
    <>
      <WishlistHeader />
      <div className="fb-crossfade">
        <WishlistView />
      </div>
    </>
  );
}
