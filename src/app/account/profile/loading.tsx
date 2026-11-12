import { ProfileHeader } from '@/components/account/dashboard/headers';
import { ProfileSkeleton } from '@/components/account/dashboard/skeletons';

export default function Loading() {
  return (
    <>
      <ProfileHeader />
      <ProfileSkeleton />
    </>
  );
}
