import type { ReactNode } from 'react';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

/**
 * Storefront skeletons. Each one mirrors the real layout it stands in for
 * (same containers, grids, card sizes and row heights) so nothing shifts when
 * content arrives. They use the shared `.fb-skeleton` shimmer (static under
 * prefers-reduced-motion). Server-safe: no hooks, no client code.
 */

/** Wrapper that announces a loading region once; children are decorative. */
export function LoadingRegion({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------- products */

/** Matches <ProductCard>: square image, unit + rating row, 2-line title, price row, button. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#e2efe6] bg-white shadow-soft">
      <Skeleton className="aspect-square w-full" rounded="sm" />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-14" rounded="full" />
          <Skeleton className="h-4 w-10" rounded="full" />
        </div>
        <div className="mt-2.5 min-h-[2.6em] space-y-1.5">
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        <div className="mt-auto pt-3">
          <div className="flex items-baseline justify-between">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3.5 w-12" rounded="full" />
          </div>
          <Skeleton className="mt-3 h-10 w-full" rounded="full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Matches <ProductRail>: snap row on small screens, 4-col grid from lg. */
export function ProductRailSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-hidden px-4 pb-3 sm:-mx-6 sm:gap-5 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:px-0 lg:pb-0">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-[46%] shrink-0 sm:w-[36%] md:w-[30%] lg:w-auto">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- headings */

export function BreadcrumbSkeleton({ width = 'w-40' }: { width?: string }) {
  return (
    <div className="flex h-[18px] items-center gap-2">
      <Skeleton className="h-3.5 w-10" rounded="full" />
      <Skeleton className={`h-3.5 ${width}`} rounded="full" />
    </div>
  );
}

/** Breadcrumb + h1 + intro, as used on /shop and /search. */
export function PageHeadingSkeleton({ withSearch = false }: { withSearch?: boolean }) {
  return (
    <div>
      <BreadcrumbSkeleton width="w-16" />
      <div className="mt-4 mb-8">
        <Skeleton className="h-9 w-72 max-w-full sm:h-10" />
        {withSearch ? (
          <Skeleton className="mt-5 h-14 w-full max-w-2xl" rounded="full" />
        ) : (
          <Skeleton className="mt-3 h-4 w-[28rem] max-w-full" rounded="full" />
        )}
      </div>
    </div>
  );
}

/** Home-style section header: eyebrow pill, title, subtitle, "view all". */
export function SectionHeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <Skeleton className="h-6 w-28" rounded="full" />
        <Skeleton className="mt-3 h-9 w-64 max-w-full sm:h-10" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" rounded="full" />
      </div>
      <Skeleton className="h-4 w-20" rounded="full" />
    </div>
  );
}

/* -------------------------------------------------------------- listing */

/** Matches the desktop filter sidebar (category tree, price, availability). */
export function FilterPanelSkeleton() {
  return (
    <div className="space-y-7">
      <div>
        <Skeleton className="h-4 w-20" rounded="full" />
        <div className="mt-3 space-y-1">
          {[78, 64, 70, 58, 74, 62, 68].map((w, i) => (
            <div key={i} className="flex h-9 items-center gap-2 px-1">
              <Skeleton className="h-4 w-4 shrink-0" rounded="md" />
              <Skeleton className="h-3.5" rounded="full" style={{ width: `${w}%` }} />
              <Skeleton className="ml-auto h-5 w-8 shrink-0" rounded="full" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-14" rounded="full" />
        <Skeleton className="mt-2 h-3.5 w-36" rounded="full" />
        <div className="mt-5 px-2">
          <Skeleton className="h-1.5 w-full" rounded="full" />
        </div>
        <div className="mt-5 flex gap-2">
          <Skeleton className="h-10 flex-1" rounded="xl" />
          <Skeleton className="h-10 flex-1" rounded="xl" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[24, 28, 26].map((w) => (
            <Skeleton key={w} className="h-8" rounded="full" style={{ width: `${w * 4}px` }} />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" rounded="full" />
        <Skeleton className="h-11 w-full" rounded="xl" />
        <Skeleton className="h-11 w-full" rounded="xl" />
      </div>
    </div>
  );
}

/** Toolbar (count + filters/sort) and grid — the right column of a listing. */
export function ResultsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-4 w-48" rounded="full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 lg:hidden" rounded="full" />
          <Skeleton className="h-10 w-48" rounded="full" />
        </div>
      </div>
      <div className="mt-6">
        <ProductGridSkeleton count={count} />
      </div>
    </div>
  );
}

/** Sidebar + results, same grid as <ProductListing>. */
export function ListingSkeleton({ count = 8, label = 'Loading products' }: { count?: number; label?: string }) {
  return (
    <LoadingRegion label={label} className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
      <div className="hidden lg:block">
        <div className="rounded-2xl border border-[#dfece3] bg-white p-4 shadow-soft">
          <FilterPanelSkeleton />
        </div>
      </div>
      <ResultsSkeleton count={count} />
    </LoadingRegion>
  );
}

/** Category banner + subcategory card row. */
export function CategoryHeroSkeleton() {
  return (
    <div>
      <BreadcrumbSkeleton />
      <div className="relative mt-4 overflow-hidden rounded-3xl bg-[#e3eee7]">
        <div className="px-6 py-10 sm:px-10 sm:py-14 lg:py-16">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-36" rounded="full" />
          </div>
          <Skeleton className="mt-3 h-10 w-64 max-w-full sm:h-12" />
          <Skeleton className="mt-4 h-4 w-96 max-w-full" rounded="full" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" rounded="full" />
        </div>
      </div>
      <div className="mt-6">
        <Skeleton className="h-3.5 w-24" rounded="full" />
        <div className="-mx-4 mt-3 flex gap-3 overflow-hidden px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="w-36 shrink-0 overflow-hidden rounded-2xl border border-[#e2efe6] bg-white sm:w-auto">
              <Skeleton className="aspect-[4/3] w-full" rounded="sm" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-12" rounded="full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- product */

export function ReviewListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-[#e6f0e9] rounded-2xl border border-[#dfece3] bg-white px-6 shadow-soft">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="py-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10" rounded="full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3.5 w-20" rounded="full" />
            </div>
          </div>
          <Skeleton className="mt-3 h-4 w-24" rounded="full" />
          <SkeletonText lines={2} className="mt-3" />
        </li>
      ))}
    </ul>
  );
}

export function ReviewsSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-64" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#dfece3] bg-white p-6 shadow-soft">
            <div className="flex items-end gap-3">
              <Skeleton className="h-12 w-20" />
              <div className="space-y-1.5 pb-1.5">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3.5 w-24" rounded="full" />
              </div>
            </div>
            <div className="mt-5 space-y-2.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-3" rounded="full" />
              ))}
            </div>
          </div>
          <ReviewFormSkeleton />
        </div>
        <ReviewListSkeleton />
      </div>
    </div>
  );
}

export function ReviewFormSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-[#dfece3] bg-white p-6 shadow-soft">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-56" rounded="full" />
      <Skeleton className="mt-2 h-8 w-48" />
      <Skeleton className="h-28 w-full" rounded="2xl" />
      <Skeleton className="h-11 w-36" rounded="full" />
    </div>
  );
}

/** Gallery + purchase panel + perks, tabs card, reviews. */
export function ProductDetailSkeleton() {
  return (
    <div className="bg-hero-mesh">
      <LoadingRegion label="Loading product" className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <BreadcrumbSkeleton width="w-64" />
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col gap-3 lg:flex-row-reverse lg:gap-4">
            <Skeleton className="aspect-square w-full lg:flex-1" rounded="3xl" />
            <div className="flex gap-2.5 lg:w-20 lg:flex-col">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-16 sm:h-20 sm:w-20" rounded="2xl" />
              ))}
            </div>
          </div>
          <div>
            <div className="flex gap-1.5">
              <Skeleton className="h-7 w-24" rounded="full" />
              <Skeleton className="h-7 w-28" rounded="full" />
            </div>
            <Skeleton className="mt-3 h-10 w-4/5" />
            <Skeleton className="mt-3 h-5 w-56" rounded="full" />
            <div className="mt-6 rounded-2xl border border-[#dfece3] bg-white p-5 shadow-soft">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="mt-3 h-5 w-64" rounded="full" />
              <div className="mt-5 flex items-center gap-3">
                <Skeleton className="h-4 w-16" rounded="full" />
                <Skeleton className="h-11 w-32" rounded="full" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-12" rounded="full" />
                <Skeleton className="h-12" rounded="full" />
              </div>
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-10 w-36" rounded="full" />
                <Skeleton className="h-10 w-24" rounded="full" />
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 rounded-2xl border border-[#dfece3] bg-white/80 p-3.5">
                  <Skeleton className="h-9 w-9 shrink-0" rounded="xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3.5 w-3/5" rounded="full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-14 rounded-3xl border border-[#dfece3] bg-white p-5 shadow-soft sm:p-8">
          <div className="flex gap-6 border-b border-[#dfece3] pb-3">
            <Skeleton className="h-5 w-24" rounded="full" />
            <Skeleton className="h-5 w-20" rounded="full" />
            <Skeleton className="h-5 w-36" rounded="full" />
          </div>
          <SkeletonText lines={3} className="mt-6 max-w-3xl" />
          <Skeleton className="mt-5 h-28 w-full max-w-3xl" rounded="2xl" />
        </div>
        <div className="mt-14">
          <ReviewsSkeleton />
        </div>
      </LoadingRegion>
    </div>
  );
}

/* ----------------------------------------------------------------- cart */

export function CartLinesSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#dfece3] bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-[#eef5f0] px-4 py-3.5 sm:px-6">
        <Skeleton className="h-4 w-20" rounded="full" />
        <Skeleton className="h-4 w-24" rounded="full" />
      </div>
      <ul className="divide-y divide-[#eef5f0]">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex gap-3 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
            <Skeleton className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" rounded="2xl" />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3.5 w-32" rounded="full" />
                </div>
                <Skeleton className="h-9 w-9" rounded="full" />
              </div>
              <div className="mt-auto flex items-end justify-between pt-3">
                <Skeleton className="h-9 w-[7.5rem]" rounded="full" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <LoadingRegion label="Loading your basket" className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="space-y-4">
        <CartLinesSkeleton />
        <Skeleton className="h-5 w-40" rounded="full" />
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#dfece3] bg-white p-5 shadow-soft">
          <Skeleton className="h-4 w-3/4" rounded="full" />
          <Skeleton className="mt-3 h-2 w-full" rounded="full" />
        </div>
        <div className="rounded-2xl border border-[#dfece3] bg-white p-5 shadow-soft">
          <Skeleton className="h-4 w-24" rounded="full" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-11 flex-1" rounded="full" />
            <Skeleton className="h-11 w-20" rounded="full" />
          </div>
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-12 w-28" rounded="xl" />
            <Skeleton className="h-12 w-28" rounded="xl" />
          </div>
        </div>
        <div className="rounded-2xl border border-[#dfece3] bg-white p-5 shadow-soft">
          <Skeleton className="h-6 w-40" />
          <div className="mt-5 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" rounded="full" />
                <Skeleton className="h-4 w-16" rounded="full" />
              </div>
            ))}
            <div className="flex justify-between border-t border-[#eef5f0] pt-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <Skeleton className="mt-5 h-[52px] w-full" rounded="full" />
        </div>
      </div>
    </LoadingRegion>
  );
}

/* ----------------------------------------------------------------- home */

export function HomeSkeleton() {
  return (
    <LoadingRegion label="Loading FreshBasket">
      <section className="bg-hero-mesh">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:pb-24 lg:pt-20">
          <div>
            <Skeleton className="h-8 w-64" rounded="full" />
            <Skeleton className="mt-5 h-12 w-full max-w-lg sm:h-16" />
            <Skeleton className="mt-3 h-12 w-3/4 max-w-md sm:h-16" />
            <SkeletonText lines={2} className="mt-6 max-w-xl" />
            <Skeleton className="mt-8 h-14 w-full max-w-xl" rounded="full" />
            <div className="mt-4 flex gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-7 w-16" rounded="full" />
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <Skeleton className="h-12 w-40" rounded="full" />
              <Skeleton className="h-12 w-36" rounded="full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="row-span-2 min-h-64" rounded="3xl" />
            <Skeleton className="aspect-square" rounded="3xl" />
            <Skeleton className="aspect-square" rounded="3xl" />
          </div>
        </div>
      </section>
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeaderSkeleton />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-[#e2efe6] bg-white">
                <Skeleton className="aspect-[4/3] w-full" rounded="sm" />
                <div className="space-y-2 p-3.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3.5 w-full" rounded="full" />
                  <Skeleton className="h-3 w-12" rounded="full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-white/60 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeaderSkeleton />
          <div className="mt-8">
            <ProductRailSkeleton />
          </div>
        </div>
      </section>
    </LoadingRegion>
  );
}

/* ----------------------------------------------------------- info pages */

export function InfoPageSkeleton() {
  return (
    <LoadingRegion label="Loading page">
      <section className="border-b border-[#e3efe7] bg-hero-mesh">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 lg:px-8">
          <BreadcrumbSkeleton width="w-20" />
          <Skeleton className="mt-8 h-7 w-32" rounded="full" />
          <Skeleton className="mt-4 h-10 w-[32rem] max-w-full sm:h-12" />
          <SkeletonText lines={2} className="mt-5 max-w-2xl" />
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <div className="hidden space-y-2 lg:block">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-full" rounded="xl" />
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-7 w-48" />
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" rounded="2xl" />
            ))}
            <SkeletonText lines={4} className="pt-4" />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}

/* ----------------------------------------------------------------- auth */

/** Mirrors an auth form: label + 48px field per row, then the submit button. */
export function AuthFormSkeleton({ fields = 2, extra = false }: { fields?: number; extra?: boolean }) {
  return (
    <LoadingRegion label="Loading form" className="space-y-5">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i}>
          <Skeleton className="mb-1.5 h-4 w-28" rounded="full" />
          <Skeleton className="h-12 w-full" rounded="2xl" />
        </div>
      ))}
      {extra && (
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 shrink-0" rounded="md" />
          <Skeleton className="h-4 w-3/4" rounded="full" />
        </div>
      )}
      <Skeleton className="h-12 w-full" rounded="full" />
      <Skeleton className="mx-auto h-4 w-56" rounded="full" />
    </LoadingRegion>
  );
}

/* ------------------------------------------------------------- wishlist */

export function WishlistSkeleton() {
  return (
    <LoadingRegion label="Loading your wishlist">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" rounded="full" />
        <Skeleton className="h-10 w-36" rounded="full" />
      </div>
      <div className="mt-5">
        <ProductGridSkeleton count={4} />
      </div>
    </LoadingRegion>
  );
}
