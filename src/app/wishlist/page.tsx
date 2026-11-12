import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { WishlistView } from '@/components/account/WishlistView';

export const metadata: Metadata = {
  title: 'My wishlist',
  description: 'Products you have saved on FreshBasket, with live prices and stock.',
  robots: { index: false },
};

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <Breadcrumbs items={[{ label: 'Wishlist' }]} />
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#112a1d] sm:text-4xl">My wishlist</h1>
        <p className="mt-1 text-sm text-[#5a7165]">Saved for later — prices and stock are checked live each time you visit.</p>
      </div>
      <WishlistView />
    </div>
  );
}
