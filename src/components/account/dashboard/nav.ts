import { Heart, LayoutDashboard, LifeBuoy, MapPinHouse, Package, ShieldCheck, Star, type LucideIcon } from 'lucide-react';

export type CountKey = 'activeOrders' | 'wishlist' | 'awaitingReviews';

export interface AccountNavItem {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
  count?: CountKey;
  /** Shown in the mobile bottom tab bar. */
  tab?: boolean;
}

export const NAV_GROUPS: { label: string; items: AccountNavItem[] }[] = [
  {
    label: 'Shopping',
    items: [
      { href: '/account', label: 'Overview', short: 'Home', icon: LayoutDashboard, tab: true },
      { href: '/account/orders', label: 'Orders', short: 'Orders', icon: Package, count: 'activeOrders', tab: true },
      { href: '/account/wishlist', label: 'Wishlist', short: 'Wishlist', icon: Heart, count: 'wishlist', tab: true },
      { href: '/account/reviews', label: 'Reviews', short: 'Reviews', icon: Star, count: 'awaitingReviews' },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/account/profile', label: 'Profile & address', short: 'Profile', icon: MapPinHouse, tab: true },
      { href: '/account/security', label: 'Security', short: 'Security', icon: ShieldCheck },
    ],
  },
  {
    label: 'Help',
    items: [{ href: '/account/support', label: 'Help & support', short: 'Support', icon: LifeBuoy }],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export function isActivePath(pathname: string, href: string) {
  return href === '/account' ? pathname === '/account' : pathname === href || pathname.startsWith(`${href}/`);
}

export const COUNT_LABEL: Record<CountKey, string> = {
  activeOrders: 'active',
  wishlist: 'saved',
  awaitingReviews: 'to review',
};
