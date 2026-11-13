import { SupportHeader } from '@/components/account/dashboard/headers';
import { SupportFormSkeleton } from '@/components/account/dashboard/skeletons';
import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <>
      <SupportHeader />
      <div className="space-y-5 lg:space-y-6" role="status" aria-busy="true" aria-label="Loading support">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="flex gap-3 p-4">
              <Skeleton className="h-11 w-11 shrink-0" rounded="2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20" rounded="full" />
                <Skeleton className="h-4 w-32" rounded="full" />
                <Skeleton className="h-3.5 w-24" rounded="full" />
              </div>
            </SkeletonCard>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-[1fr_24rem]">
          <SupportFormSkeleton />
          <SkeletonCard className="self-start p-5 sm:p-6">
            <Skeleton className="h-6 w-36" />
            <div className="mt-4 space-y-4">
              {[0, 1, 2, 3, 4].map((i) => <SkeletonText key={i} lines={1} />)}
            </div>
          </SkeletonCard>
        </div>
      </div>
    </>
  );
}
