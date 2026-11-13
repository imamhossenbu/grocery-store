import { OrdersSkeleton } from '@/components/account/dashboard/skeletons';
import { OrdersHeader } from '@/components/account/dashboard/headers';

export default function Loading() {
  return (
    <>
      <OrdersHeader />
      <OrdersSkeleton />
    </>
  );
}
