'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, KeyRound, LayoutDashboard, LogOut, Package, UserRound } from 'lucide-react';
import { signOut } from '@/actions/auth';

const LINKS = [
  { href: '/account', label: 'Overview', icon: LayoutDashboard },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/profile', label: 'Profile & address', short: 'Profile', icon: UserRound },
  { href: '/account/security', label: 'Security', icon: KeyRound },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
];

function isActive(pathname: string, href: string) {
  return href === '/account' ? pathname === '/account' : pathname === href || pathname.startsWith(`${href}/`);
}

/** Sidebar on desktop, horizontally scrolling tabs on mobile. */
export function AccountNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav aria-label="Account">
      {/* Mobile tabs */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1 lg:hidden [scrollbar-width:none]">
        <ul className="flex min-w-max gap-2">
          {LINKS.map(({ href, label, short, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active ? 'bg-[#0f2c1d] text-white shadow-md' : 'border border-[#dfece3] bg-white text-[#234835] hover:border-[#1a663b]'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {short ?? label}
                </Link>
              </li>
            );
          })}
          <li>
            <form action={signOut}>
              <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </form>
          </li>
        </ul>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden rounded-3xl border border-[#dfece3] bg-white p-3 shadow-soft lg:block">
        <ul className="space-y-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active ? 'bg-[#e8f5ee] text-[#14522f]' : 'text-[#234835] hover:bg-[#f4f9f5]'
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${active ? 'text-[#1a663b]' : 'text-[#5a7165]'}`} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
        <form action={signOut} className="mt-2 border-t border-[#eef5f0] pt-2">
          <button type="submit" className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 cursor-pointer">
            <LogOut className="h-[18px] w-[18px]" /> Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
