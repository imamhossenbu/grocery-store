import { SecurityHeader } from '@/components/account/dashboard/headers';
import { SecuritySkeleton } from '@/components/account/dashboard/skeletons';

export default function Loading() {
  return (
    <>
      <SecurityHeader />
      <SecuritySkeleton />
    </>
  );
}
