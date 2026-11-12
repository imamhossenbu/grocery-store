import { Skeleton } from '@/components/ui/Skeleton';
import { BreadcrumbSkeleton, LoadingRegion } from '@/components/store-ui/Skeletons';

export default function Loading() {
  return (
    <div className="bg-hero-mesh">
      <LoadingRegion label="Loading categories" className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <BreadcrumbSkeleton width="w-28" />
        <Skeleton className="mt-4 h-9 w-56 sm:h-10" />
        <Skeleton className="mt-3 mb-8 h-4 w-80 max-w-full" rounded="full" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-[#e2efe6] bg-white shadow-soft">
              <Skeleton className="h-36 w-full" rounded="sm" />
              <div className="p-4">
                <Skeleton className="h-4 w-11/12" rounded="full" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {[20, 24, 18].map((w) => (
                    <Skeleton key={w} className="h-8" rounded="full" style={{ width: `${w * 4}px` }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </LoadingRegion>
    </div>
  );
}
