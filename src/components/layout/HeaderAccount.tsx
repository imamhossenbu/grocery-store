'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { ChevronDown, Heart, LayoutDashboard, LogOut, MessageSquareText, Package, PackageSearch, User as UserIcon } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { signOut } from '@/actions/auth';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Skeleton } from '@/components/ui/Skeleton';

function displayName(user: User): string {
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  const name = (meta?.full_name || meta?.name || '').trim();
  return name || (user.email ?? '').split('@')[0] || 'My account';
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

/**
 * Header account control. The header is part of the static shell, so the
 * signed-in state is read in the browser from the Supabase session cookie
 * (display only — every private page and action re-checks on the server).
 */
export function HeaderAccount() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowser();
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return <Skeleton className="h-10 w-10 sm:w-28" rounded="full" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-10 items-center gap-2 rounded-full px-2.5 sm:px-3.5 text-sm font-semibold text-[#14522f] transition hover:bg-[#f0f7f2]"
        aria-label="Sign in"
      >
        <UserIcon className="h-5 w-5" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  const name = displayName(user);
  const firstName = name.split(/\s+/)[0];

  return (
    <DropdownMenu
      label={`Account menu for ${name}`}
      triggerClassName="inline-flex h-10 items-center gap-2 rounded-full border border-[#d3e5da] bg-white pl-1 pr-2 sm:pr-3 text-sm font-semibold text-[#112a1d] transition hover:border-[#1a663b] cursor-pointer"
      trigger={
        <>
          <span className="relative grid h-8 w-8 place-items-center rounded-full bg-emerald-gradient text-xs font-bold tracking-wide text-white">
            {initials(name)}
            <span aria-hidden className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#3ed481]" />
          </span>
          <span className="hidden max-w-[7rem] truncate sm:inline">{firstName}</span>
          <ChevronDown className="hidden h-4 w-4 text-[#3f5649] sm:block" />
        </>
      }
      items={[
        { type: 'label', label: user.email ?? name },
        { label: 'My account', href: '/account', icon: <LayoutDashboard /> },
        { label: 'My orders', href: '/account/orders', icon: <Package /> },
        { label: 'Wishlist', href: '/account/wishlist', icon: <Heart /> },
        { label: 'My reviews', href: '/account/reviews', icon: <MessageSquareText /> },
        { label: 'Track an order', href: '/track-order', icon: <PackageSearch /> },
        { type: 'separator' },
        {
          label: 'Sign out',
          icon: <LogOut />,
          tone: 'danger',
          onSelect: async () => {
            await supabaseBrowser().auth.signOut({ scope: 'local' });
            setUser(null);
            await signOut().catch(() => {});
            router.refresh();
          },
        },
      ]}
    />
  );
}
