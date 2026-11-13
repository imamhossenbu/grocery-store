import { Skeleton } from '@/components/ui/Skeleton';
import { BreadcrumbSkeleton, LoadingRegion } from '@/components/store-ui/Skeletons';

/** Mirrors /track-order: icon + heading, the lookup card, the help line. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <BreadcrumbSkeleton width="w-24" />
      <div className="mt-4 flex items-start gap-4">
        <Skeleton className="hidden h-14 w-14 shrink-0 sm:block" rounded="2xl" />
        <div className="flex-1">
          <Skeleton className="h-9 w-64 max-w-full sm:h-10" />
          <Skeleton className="mt-2 h-4 w-[28rem] max-w-full" rounded="full" />
        </div>
      </div>
      <LoadingRegion label="Loading order tracking" className="mt-6 sm:mt-8">
        <div className="rounded-3xl border border-[#e2efe6] bg-white p-6 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-28" rounded="full" />
                <Skeleton className="mt-2 h-12 w-full" rounded="xl" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-5 h-12 w-40" rounded="full" />
        </div>
      </LoadingRegion>
      <Skeleton className="mt-8 h-4 w-64 max-w-full" rounded="full" />
    </div>
  );
}
