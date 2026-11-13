'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ProductGridSkeleton } from '@/components/store-ui/Skeletons';

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

/**
 * Results wrapper. While a filter / sort / page change is rendering on the
 * server, the current results dim and a matching skeleton grid fades in on
 * top (same grid, same card size), so the area never goes blank or jumps.
 */
export function PendingArea({ children, skeletonCount = 8 }: { children: React.ReactNode; skeletonCount?: number }) {
  const { pending } = useListing();
  return (
    <div aria-busy={pending} className="relative">
      <div className={`transition-opacity duration-200 ${pending ? 'pointer-events-none opacity-25' : 'opacity-100'}`}>{children}</div>
      <AnimatePresence>
        {pending && (
          <motion.div
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.18, delay: 0.08 } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="pointer-events-none absolute inset-x-0 top-0 max-h-full overflow-hidden"
            aria-hidden="true"
          >
            <ProductGridSkeleton count={Math.max(2, Math.min(skeletonCount, 8))} />
          </motion.div>
        )}
      </AnimatePresence>
      <span className="sr-only" role="status">
        {pending ? 'Updating products…' : ''}
      </span>
    </div>
  );
}

/** Thin animated bar at the top of the results while the next page renders. */
export function PendingBar() {
  const { pending } = useListing();
  return (
    <div aria-hidden="true" className="relative h-0.5 overflow-hidden rounded-full">
      <AnimatePresence>
        {pending && (
          <motion.span
            key="bar"
            className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-[#1a663b]"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '300%', opacity: 1, transition: { x: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.15 } } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          />
        )}
      </AnimatePresence>
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
