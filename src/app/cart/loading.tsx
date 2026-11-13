import { Skeleton } from '@/components/ui/Skeleton';
import { BreadcrumbSkeleton, CartSkeleton } from '@/components/store-ui/Skeletons';

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <BreadcrumbSkeleton width="w-14" />
      <Skeleton className="mt-3 h-9 w-56 sm:h-10" />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" rounded="full" />
      <div className="mt-6 sm:mt-8">
        <CartSkeleton />
      </div>
    </div>
  );
}
