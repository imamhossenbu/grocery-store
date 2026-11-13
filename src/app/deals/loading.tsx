import { Skeleton } from '@/components/ui/Skeleton';
import { BreadcrumbSkeleton, LoadingRegion, ProductGridSkeleton } from '@/components/store-ui/Skeletons';

/** Mirrors /deals: breadcrumb, forest banner, coupon cards, deals grid. */
export default function Loading() {
  return (
    <div className="bg-hero-mesh">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <BreadcrumbSkeleton width="w-28" />
        <LoadingRegion label="Loading deals and offers">
          <Skeleton className="mt-4 h-64 w-full sm:h-72" rounded="3xl" />

          <div className="mt-12">
            <Skeleton className="h-8 w-52 sm:h-9" />
            <Skeleton className="mt-2 h-4 w-80 max-w-full" rounded="full" />
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-36 w-full" rounded="3xl" />
              ))}
            </div>
          </div>

          <div className="mt-14">
            <Skeleton className="h-8 w-64 max-w-full sm:h-9" />
            <div className="mt-6">
              <ProductGridSkeleton count={8} />
            </div>
          </div>
        </LoadingRegion>
      </div>
    </div>
  );
}
