import { AccountPageHeader } from './PageHeader';

/** Static page headers, shared by each page and its loading.tsx (no shift). */

export function OverviewHeader() {
  return <AccountPageHeader title="Dashboard" description="Your orders, spending and favourites at a glance." />;
}

export function OrdersHeader() {
  return (
    <AccountPageHeader
      crumb="Orders"
      title="My orders"
      description="Track deliveries, reorder favourites, print invoices and pay pending online orders."
    />
  );
}

export function WishlistHeader() {
  return <AccountPageHeader crumb="Wishlist" title="Wishlist" description="Saved for later — prices and stock are checked live each time you visit." />;
}

export function ReviewsHeader() {
  return <AccountPageHeader crumb="Reviews" title="Reviews" description="Rate what you bought and manage the reviews you’ve written." />;
}

export function ProfileHeader() {
  return <AccountPageHeader crumb="Profile & address" title="Profile & address" description="Keep your details current so every delivery finds you first time." />;
}

export function SecurityHeader() {
  return <AccountPageHeader crumb="Security" title="Security" description="Change your password and manage where you’re signed in." />;
}

export function SupportHeader() {
  return <AccountPageHeader crumb="Help & support" title="Help & support" description="We reply within a few hours, 7 AM – 11 PM every day." />;
}
