import { WishlistHeader } from '@/components/account/dashboard/headers';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <>
      <WishlistHeader />
      <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading your wishlist">
        <Skeleton className="h-[4.75rem] w-full" rounded="3xl" />
        <ProductGridSkeleton count={4} />
      </div>
    </>
  );
}
