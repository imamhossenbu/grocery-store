import { Skeleton } from '@/components/ui/Skeleton';
import { BreadcrumbSkeleton } from '@/components/store-ui/Skeletons';
import { CheckoutSkeleton } from './CheckoutSkeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <BreadcrumbSkeleton width="w-36" />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Skeleton className="h-9 w-44 sm:h-10" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" rounded="full" />
        </div>
        <Skeleton className="h-8 w-72 max-w-full" rounded="full" />
      </div>
      <div className="mt-6 sm:mt-8">
        <CheckoutSkeleton />
      </div>
    </div>
  );
}
