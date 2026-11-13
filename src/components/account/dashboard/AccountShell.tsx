'use client';

import { useState, useSyncExternalStore, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { signOut } from '@/actions/auth';
import { useShop } from '@/context/ShopContext';
import { Drawer } from '@/components/ui/Dialog';
import { Tooltip } from '@/components/ui/Tooltip';
import { Skeleton } from '@/components/ui/Skeleton';
import { cx } from '@/components/ui/overlay';
import { formatDate } from '@/lib/format';
import { COUNT_LABEL, NAV_GROUPS, NAV_ITEMS, isActivePath, type AccountNavItem, type CountKey } from './nav';
import { initialsOf, SummaryProvider, useDashboardSummary } from './summary';

export const COLLAPSE_KEY = 'fb_account_sidebar_collapsed';
const ATTR = 'data-acct-collapsed';

/** Inline (pre-paint) script that restores the collapsed sidebar without a flash. */
export const COLLAPSE_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(COLLAPSE_KEY)})==='1')document.documentElement.setAttribute('${ATTR}','')}catch(e){}`;

function subscribeCollapsed(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: [ATTR] });
  return () => mo.disconnect();
}
const readCollapsed = () => document.documentElement.hasAttribute(ATTR);
const noopSubscribe = () => () => {};

function setCollapsedPref(value: boolean) {
  document.documentElement.toggleAttribute(ATTR, value);
  try {
    localStorage.setItem(COLLAPSE_KEY, value ? '1' : '0');
  } catch {}
}

/**
 * App-like chrome for /account/**: sticky collapsible sidebar on desktop,
 * top bar + slide-in drawer + bottom tab bar on mobile.
 */
export function AccountShell({ children, summarySlot }: { children: ReactNode; summarySlot: ReactNode }) {
  return (
    <SummaryProvider>
      {summarySlot}
      <ShellFrame>{children}</ShellFrame>
    </SummaryProvider>
  );
}

function ShellFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPath, setDrawerPath] = useState(pathname);
  // Close the drawer after navigating.
  if (drawerPath !== pathname) {
    setDrawerPath(pathname);
    setDrawerOpen(false);
  }
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const current = NAV_ITEMS.find((i) => isActivePath(pathname, i.href));

  return (
    <div className="min-h-[70vh] bg-[#f4f8f5]">
      {/* Mobile top bar */}
      <div className="sticky top-16 z-30 border-b border-[#dfece3] bg-white/90 backdrop-blur-md sm:top-20 lg:hidden">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open account menu"
            aria-expanded={drawerOpen}
            className="-ml-1.5 grid h-10 w-10 place-items-center rounded-full text-[#112a1d] transition hover:bg-[#eef6f1] cursor-pointer"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium leading-tight text-[#3f5649]">My account</p>
            <p className="truncate text-sm font-extrabold text-[#112a1d]">{current?.label ?? 'Dashboard'}</p>
          </div>
          <MiniAvatar />
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:gap-8 lg:px-8 lg:pb-12 lg:pt-8">
        {/* Desktop sidebar */}
        <motion.aside
          aria-label="Account"
          initial={false}
          animate={hydrated ? { width: collapsed ? 84 : 272 } : undefined}
          transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          className="sticky top-[9.25rem] hidden h-[calc(100dvh-10.75rem)] max-h-[46rem] w-[17rem] shrink-0 self-start lg:block acct-collapsed:w-[5.25rem]"
        >
          <div className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#dfece3] bg-white shadow-soft">
            <IdentityCard compactWhenCollapsed />
            <nav aria-label="Account sections" className="fb-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3">
              <NavList pathname={pathname} collapsed={collapsed} />
            </nav>
            <div className="border-t border-[#eef5f0] p-3">
              <SignOutButton collapsed={collapsed} />
              <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right" disabled={!collapsed} className="w-full">
                <button
                  type="button"
                  onClick={() => setCollapsedPref(!collapsed)}
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  aria-pressed={collapsed}
                  className="mt-1 flex h-10 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-[#3f5649] transition hover:bg-[#f2f8f4] hover:text-[#112a1d] cursor-pointer acct-collapsed:justify-center acct-collapsed:px-0"
                >
                  <PanelLeftClose className="h-[18px] w-[18px] shrink-0 acct-collapsed:hidden" aria-hidden />
                  <PanelLeftOpen className="hidden h-[18px] w-[18px] shrink-0 acct-collapsed:block" aria-hidden />
                  <span className="acct-collapsed:sr-only">Collapse sidebar</span>
                </button>
              </Tooltip>
            </div>
          </div>
        </motion.aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>

      {/* Mobile drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} side="left" title="Account menu" hideTitle>
        <div className="-mx-3 space-y-2 pt-5">
          <IdentityCard />
          <nav aria-label="Account sections" className="px-3">
            <NavList pathname={pathname} collapsed={false} />
          </nav>
          <div className="border-t border-[#eef5f0] px-3 pt-3">
            <SignOutButton collapsed={false} />
          </div>
        </div>
      </Drawer>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Account quick navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dfece3] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {NAV_ITEMS.filter((i) => i.tab).map((item) => (
            <li key={item.href}>
              <TabLink item={item} active={isActivePath(pathname, item.href)} />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function useCount(key?: CountKey): number | null {
  const summary = useDashboardSummary();
  const { wishlist, hydrated } = useShop();
  if (!key) return null;
  if (key === 'wishlist') return hydrated ? wishlist.length : null;
  return summary ? summary[key] : null;
}

function NavList({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  return (
    <div className="space-y-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1.5 pt-1 text-[13px] font-semibold text-[#3f5649] in-[aside]:acct-collapsed:sr-only">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <NavLink item={item} active={isActivePath(pathname, item.href)} collapsed={collapsed} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function NavLink({ item, active, collapsed }: { item: AccountNavItem; active: boolean; collapsed: boolean }) {
  const count = useCount(item.count);
  const Icon = item.icon;
  const showCount = count !== null && count > 0;
  return (
    <Tooltip content={showCount ? `${item.label} · ${count} ${COUNT_LABEL[item.count!]}` : item.label} side="right" disabled={!collapsed} className="w-full">
      <Link
        href={item.href}
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? item.label + (showCount ? `, ${count} ${COUNT_LABEL[item.count!]}` : '') : undefined}
        className={cx(
          'group relative flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition',
          'in-[aside]:acct-collapsed:justify-center in-[aside]:acct-collapsed:px-0',
          active ? 'bg-[#0f2c1d] text-white shadow-md' : 'text-[#234835] hover:bg-[#f2f8f4] hover:text-[#112a1d]'
        )}
      >
        <Icon className={cx('h-[18px] w-[18px] shrink-0', active ? 'text-[#f5b82e]' : 'text-[#3f5649] group-hover:text-[#1a663b]')} aria-hidden />
        <span className="min-w-0 flex-1 truncate in-[aside]:acct-collapsed:sr-only">{item.label}</span>
        {showCount && (
          <span
            className={cx(
              'min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-xs font-extrabold tabular-nums',
              active ? 'bg-white/15 text-white' : 'bg-[#e8f5ee] text-[#14522f]',
              'in-[aside]:acct-collapsed:absolute in-[aside]:acct-collapsed:right-1 in-[aside]:acct-collapsed:top-0.5 in-[aside]:acct-collapsed:min-w-[1.125rem] in-[aside]:acct-collapsed:bg-[#f5b82e] in-[aside]:acct-collapsed:px-1 in-[aside]:acct-collapsed:py-0 in-[aside]:acct-collapsed:text-xs in-[aside]:acct-collapsed:text-[#3a2502]'
            )}
            aria-hidden={collapsed || undefined}
          >
            {count}
            <span className="sr-only"> {COUNT_LABEL[item.count!]}</span>
          </span>
        )}
      </Link>
    </Tooltip>
  );
}

function TabLink({ item, active }: { item: AccountNavItem; active: boolean }) {
  const count = useCount(item.count);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cx('relative flex h-16 flex-col items-center justify-center gap-1 text-[13px] font-semibold transition', active ? 'text-[#0f2c1d]' : 'text-[#3f5649]')}
    >
      <span className={cx('relative grid h-8 w-12 place-items-center rounded-full transition', active && 'bg-[#e3f3e9]')}>
        <Icon className={cx('h-5 w-5', active && 'text-[#1a663b]')} aria-hidden />
        {count !== null && count > 0 && (
          <span className="absolute -right-0.5 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#f5b82e] px-1 text-xs font-extrabold text-[#3a2502]">
            {count}
            <span className="sr-only"> {COUNT_LABEL[item.count!]}</span>
          </span>
        )}
      </span>
      {item.short}
    </Link>
  );
}

function SignOutButton({ collapsed }: { collapsed: boolean }) {
  return (
    <form action={signOut}>
      <Tooltip content="Sign out" side="right" disabled={!collapsed} className="w-full">
        <button
          type="submit"
          aria-label={collapsed ? 'Sign out' : undefined}
          className="flex h-10 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 cursor-pointer in-[aside]:acct-collapsed:justify-center in-[aside]:acct-collapsed:px-0"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
          <span className="in-[aside]:acct-collapsed:sr-only">Sign out</span>
        </button>
      </Tooltip>
    </form>
  );
}

function IdentityCard({ compactWhenCollapsed }: { compactWhenCollapsed?: boolean }) {
  const s = useDashboardSummary();
  const c = compactWhenCollapsed;
  return (
    <div className={cx('p-3', c && 'acct-collapsed:px-2')}>
      <div
        className={cx(
          'relative overflow-hidden rounded-[1.25rem] bg-forest-gradient p-4 text-white',
          c && 'acct-collapsed:bg-none acct-collapsed:p-0'
        )}
      >
        <div aria-hidden className={cx('pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#f5b82e]/20 blur-2xl', c && 'acct-collapsed:hidden')} />
        <div className={cx('relative flex items-center gap-3', c && 'acct-collapsed:justify-center')}>
          {s ? (
            <Link
              href="/account/profile"
              aria-label="Your profile"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#f5b82e] font-display text-lg font-bold text-[#3a2502] shadow-md ring-2 ring-white/20"
            >
              {initialsOf(s.name, s.email)}
            </Link>
          ) : (
            <Skeleton className="h-12 w-12 fb-skeleton-dark" rounded="2xl" />
          )}
          <div className={cx('min-w-0 flex-1', c && 'acct-collapsed:hidden')}>
            {s ? (
              <>
                <p className="truncate text-[15px] font-bold leading-snug">{s.name}</p>
                <p className="truncate text-[13px] text-[#cfe7d8]">{s.email}</p>
              </>
            ) : (
              <div className="space-y-2" aria-hidden>
                <Skeleton className="h-4 w-28 fb-skeleton-dark" rounded="full" />
                <Skeleton className="h-3 w-36 fb-skeleton-dark" rounded="full" />
              </div>
            )}
          </div>
        </div>
        <p className={cx('relative mt-3 h-5 text-[13px] font-medium text-[#b9e4c9]', c && 'acct-collapsed:hidden')}>
          {s ? `Member since ${formatDate(s.memberSince)}` : ''}
        </p>
      </div>
    </div>
  );
}

function MiniAvatar() {
  const s = useDashboardSummary();
  if (!s) return <Skeleton className="h-9 w-9" rounded="full" />;
  return (
    <Link
      href="/account/profile"
      aria-label={`Profile of ${s.name}`}
      className="grid h-9 w-9 place-items-center rounded-full bg-[#0f2c1d] text-xs font-bold text-[#f5b82e]"
    >
      {initialsOf(s.name, s.email)}
    </Link>
  );
}
