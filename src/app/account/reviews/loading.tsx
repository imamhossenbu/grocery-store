import { ReviewsHeader } from '@/components/account/dashboard/headers';
import { ReviewsSkeleton } from '@/components/account/dashboard/skeletons';

export default function Loading() {
  return (
    <>
      <ReviewsHeader />
      <ReviewsSkeleton />
    </>
  );
}
