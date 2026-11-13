import { Skeleton } from '@/components/ui/Skeleton';
import { BreadcrumbSkeleton, LoadingRegion } from '@/components/store-ui/Skeletons';

/** Mirrors /order/[id]: status banner, two detail cards, items card. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <BreadcrumbSkeleton width="w-28" />
      <LoadingRegion label="Loading order" className="mt-4">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" rounded="3xl" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full" rounded="3xl" />
            <Skeleton className="h-64 w-full" rounded="3xl" />
          </div>
          <Skeleton className="h-56 w-full" rounded="3xl" />
        </div>
      </LoadingRegion>
    </div>
  );
}
