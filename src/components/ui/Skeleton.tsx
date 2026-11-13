import type { CSSProperties, ReactNode } from 'react';

/**
 * Loading placeholders with a soft brand shimmer (`.fb-skeleton` in
 * globals.css; static under prefers-reduced-motion). Build skeletons that
 * mirror the real layout — same grid, card sizes and row heights — so nothing
 * shifts when data arrives. Skeleton containers should carry
 * aria-hidden or sit inside an element with aria-busy + a label.
 *
 * ```tsx
 * <Skeleton className="h-6 w-40" />                  // text line
 * <Skeleton className="h-12 w-12" rounded="full" />  // avatar
 * <SkeletonText lines={3} />
 * <SkeletonCard className="h-40" />                  // white card frame
 * ```
 */
export function Skeleton({
  className = '',
  rounded = 'lg',
  style,
}: {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  style?: CSSProperties;
}) {
  const r = { sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', xl: 'rounded-xl', '2xl': 'rounded-2xl', '3xl': 'rounded-3xl', full: 'rounded-full' }[rounded];
  return <div aria-hidden="true" className={`fb-skeleton ${r} ${className}`} style={style} />;
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className="h-3.5" rounded="full" style={{ width: i === lines - 1 ? '62%' : `${92 - i * 6}%` }} />
      ))}
    </div>
  );
}

/** A white card frame (border + soft shadow) for skeleton content. */
export function SkeletonCard({ className = '', children }: { className?: string; children?: ReactNode }) {
  return (
    <div aria-hidden="true" className={`rounded-3xl border border-[#e2efe6] bg-white p-5 shadow-soft ${className}`}>
      {children}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col overflow-hidden rounded-[1.75rem] border border-[#e2efe6] bg-white shadow-soft">
      <Skeleton className="aspect-square w-full" rounded="sm" />
      <div className="space-y-2.5 p-4">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-14" rounded="full" />
          <Skeleton className="h-3 w-10" rounded="full" />
        </div>
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-3 h-10 w-full" rounded="full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

/** Legacy alias kept for existing call sites. */
export function Block({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`fb-skeleton ${/\brounded/.test(className) ? '' : 'rounded-2xl'} ${className}`} />;
}
