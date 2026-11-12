'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useTransition } from 'react';

/**
 * Client glue for URL-driven listings: filter changes go through
 * router.replace (no scroll jump, no history spam) inside a transition so the
 * results can dim while the server renders the next page.
 */

interface ListingCtx {
  pending: boolean;
  navigate: (href: string) => void;
}

const Ctx = createContext<ListingCtx>({ pending: false, navigate: () => {} });

export function useListing() {
  return useContext(Ctx);
}

export function ListingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = useCallback(
    (href: string) => startTransition(() => router.replace(href, { scroll: false })),
    [router]
  );
  const value = useMemo(() => ({ pending, navigate }), [pending, navigate]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Results wrapper that dims while a filter change is loading. */
export function PendingArea({ children }: { children: React.ReactNode }) {
  const { pending } = useListing();
  return (
    <div aria-busy={pending} className={`transition-opacity duration-200 ${pending ? 'opacity-50 pointer-events-none' : ''}`}>
      {children}
    </div>
  );
}

/** A real link (works without JS / opens in new tab) that filters in place when clicked normally. */
export function FilterLink({
  href,
  children,
  className,
  onClick,
  ...rest
}: { href: string; children: React.ReactNode; className?: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const { navigate } = useListing();
  return (
    <Link
      {...rest}
      href={href}
      scroll={false}
      prefetch={false}
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </Link>
  );
}
