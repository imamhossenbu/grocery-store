import { Skeleton } from '@/components/ui/Skeleton';
import { BreadcrumbSkeleton, WishlistSkeleton } from '@/components/store-ui/Skeletons';

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <BreadcrumbSkeleton width="w-16" />
      <div>
        <Skeleton className="h-9 w-48 sm:h-10" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" rounded="full" />
      </div>
      <WishlistSkeleton />
    </div>
  );
}
