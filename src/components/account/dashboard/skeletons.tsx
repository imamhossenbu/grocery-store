import type { ReactNode } from 'react';
import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/Skeleton';

/**
 * Layout-faithful skeletons for every dashboard section. Each mirrors the
 * grid, card sizes and row heights of the real content it stands in for.
 */

function Busy({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
    </div>
  );
}

export function OrderTileSkeleton() {
  return (
    <SkeletonCard className="p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-7 w-24" rounded="full" />
          </div>
          <Skeleton className="h-3.5 w-56 max-w-full" rounded="full" />
        </div>
        <div className="space-y-1.5 text-right">
          <Skeleton className="ml-auto h-3 w-10" rounded="full" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#f0f5f2] pt-4">
        <div className="flex -space-x-2.5">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-11 w-11 border-2 border-white sm:h-12 sm:w-12" rounded="xl" />)}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" rounded="full" />
          <Skeleton className="h-10 w-10" rounded="full" />
        </div>
      </div>
    </SkeletonCard>
  );
}

export function OrdersSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Busy label="Loading your orders" className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Skeleton className="h-11 w-[22rem] max-w-full" rounded="full" />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-10 sm:flex-1 xl:w-72" rounded="full" />
          <Skeleton className="h-10 w-full sm:w-44" rounded="full" />
        </div>
      </div>
      <Skeleton className="h-4 w-44" rounded="full" />
      <div className="space-y-3">
        {Array.from({ length: count }, (_, i) => <OrderTileSkeleton key={i} />)}
      </div>
    </Busy>
  );
}

export function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-20" rounded="full" />
            <Skeleton className="h-9 w-9" rounded="xl" />
          </div>
          <Skeleton className="mt-3 h-8 w-24" />
          <Skeleton className="mt-2 h-3 w-28 max-w-full" rounded="full" />
        </SkeletonCard>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <SkeletonCard className="p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-32" rounded="full" />
      </div>
      <Skeleton className="mt-2 h-3.5 w-56 max-w-full" rounded="full" />
      <div className="mt-5 flex h-[220px] items-end gap-[6%] border-b border-[#eef5f0] px-[6%] pb-0">
        {[45, 70, 30, 85, 55, 65].map((h, i) => (
          <Skeleton key={i} className="flex-1" rounded="md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </SkeletonCard>
  );
}

export function ProductStripSkeleton({ title = true }: { title?: boolean }) {
  return (
    <SkeletonCard className="p-5 sm:p-6">
      {title && <Skeleton className="mb-4 h-6 w-36" />}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="w-40 shrink-0 overflow-hidden rounded-2xl border border-[#eef5f0] sm:w-44">
            <Skeleton className="aspect-[4/3] w-full" rounded="sm" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-3.5 w-4/5" rounded="full" />
              <Skeleton className="h-3 w-1/2" rounded="full" />
              <Skeleton className="mt-2 h-9 w-full" rounded="full" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
}

export function OverviewSkeleton() {
  return (
    <Busy label="Loading your dashboard" className="space-y-5 lg:space-y-6">
      <div className="rounded-[2rem] bg-[#e3eee7] p-6 sm:p-8">
        <Skeleton className="h-3.5 w-28" rounded="full" />
        <Skeleton className="mt-3 h-9 w-72 max-w-full" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" rounded="full" />
        <div className="mt-6 flex flex-wrap gap-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-36" rounded="full" />)}
        </div>
      </div>
      <KpiSkeleton />
      <div className="grid gap-5 xl:grid-cols-3 lg:gap-6">
        <SkeletonCard className="p-5 sm:p-6 xl:col-span-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-4 h-24 w-full" rounded="2xl" />
          <div className="mt-5 grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="mx-auto h-10 w-10" rounded="full" />)}
          </div>
        </SkeletonCard>
        <SkeletonCard className="p-5 sm:p-6">
          <Skeleton className="h-6 w-32" />
          <SkeletonText lines={3} className="mt-4" />
          <Skeleton className="mt-5 h-10 w-full" rounded="full" />
        </SkeletonCard>
      </div>
      <div className="grid gap-5 xl:grid-cols-3 lg:gap-6">
        <div className="xl:col-span-2"><ChartSkeleton /></div>
        <SkeletonCard className="p-5 sm:p-6">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="mt-5 h-3 w-full" rounded="full" />
          <div className="mt-5 space-y-3">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-5 w-full" rounded="full" />)}
          </div>
        </SkeletonCard>
      </div>
      <ProductStripSkeleton />
    </Busy>
  );
}

export function ReviewsSkeleton() {
  return (
    <Busy label="Loading your reviews" className="space-y-6">
      <SkeletonCard className="p-5 sm:p-6">
        <Skeleton className="h-6 w-48" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3 rounded-2xl border border-[#eef5f0] p-3">
              <Skeleton className="h-16 w-16 shrink-0" rounded="xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-4/5" rounded="full" />
                <Skeleton className="h-3 w-1/2" rounded="full" />
                <Skeleton className="h-5 w-28" rounded="full" />
              </div>
            </div>
          ))}
        </div>
      </SkeletonCard>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} className="flex gap-4 p-4 sm:p-5">
            <Skeleton className="h-16 w-16 shrink-0" rounded="xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-28" rounded="full" />
              <SkeletonText lines={2} />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </Busy>
  );
}

export function ProfileSkeleton() {
  return (
    <Busy label="Loading your profile" className="grid gap-5 xl:grid-cols-[1fr_20rem] lg:gap-6">
      <SkeletonCard className="p-5 sm:p-8">
        <Skeleton className="h-6 w-44" />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-24" rounded="full" />
              <Skeleton className="h-12 w-full" rounded="2xl" />
            </div>
          ))}
          <div className="space-y-2 sm:col-span-2">
            <Skeleton className="h-3.5 w-16" rounded="full" />
            <Skeleton className="h-12 w-full" rounded="2xl" />
          </div>
        </div>
        <Skeleton className="mt-8 h-6 w-56" />
        <Skeleton className="mt-5 h-24 w-full" rounded="2xl" />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-12 w-full" rounded="2xl" />
          <Skeleton className="h-12 w-full" rounded="2xl" />
        </div>
        <Skeleton className="ml-auto mt-6 h-12 w-40" rounded="full" />
      </SkeletonCard>
      <div className="space-y-5">
        <SkeletonCard className="p-5 sm:p-6">
          <Skeleton className="mx-auto h-20 w-20" rounded="3xl" />
          <Skeleton className="mx-auto mt-3 h-5 w-32" />
          <Skeleton className="mx-auto mt-2 h-3.5 w-44" rounded="full" />
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Skeleton className="h-16" rounded="2xl" />
            <Skeleton className="h-16" rounded="2xl" />
          </div>
        </SkeletonCard>
        <SkeletonCard className="p-5 sm:p-6">
          <Skeleton className="h-5 w-40" />
          <SkeletonText lines={3} className="mt-4" />
        </SkeletonCard>
      </div>
    </Busy>
  );
}

export function SecuritySkeleton() {
  return (
    <Busy label="Loading security settings" className="grid gap-5 xl:grid-cols-[1fr_22rem] lg:gap-6">
      <SkeletonCard className="p-5 sm:p-8">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="mt-2 h-3.5 w-72 max-w-full" rounded="full" />
        <div className="mt-6 max-w-md space-y-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-28" rounded="full" />
              <Skeleton className="h-12 w-full" rounded="2xl" />
            </div>
          ))}
          <Skeleton className="h-12 w-44" rounded="full" />
        </div>
      </SkeletonCard>
      <div className="space-y-5">
        <SkeletonCard className="p-5 sm:p-6">
          <Skeleton className="h-5 w-36" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" rounded="2xl" />)}
          </div>
        </SkeletonCard>
        <SkeletonCard className="p-5 sm:p-6">
          <Skeleton className="h-5 w-32" />
          <SkeletonText lines={2} className="mt-3" />
          <Skeleton className="mt-4 h-11 w-full" rounded="full" />
          <Skeleton className="mt-2 h-11 w-full" rounded="full" />
        </SkeletonCard>
      </div>
    </Busy>
  );
}

export function SupportFormSkeleton() {
  return (
    <Busy label="Loading contact form">
      <SkeletonCard className="p-5 sm:p-8">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-3.5 w-64 max-w-full" rounded="full" />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-24" rounded="full" />
              <Skeleton className="h-12 w-full" rounded="2xl" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-5 h-12 w-full" rounded="2xl" />
        <Skeleton className="mt-5 h-36 w-full" rounded="2xl" />
        <Skeleton className="mt-5 h-12 w-40" rounded="full" />
      </SkeletonCard>
    </Busy>
  );
}
