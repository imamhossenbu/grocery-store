import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FormSkeleton } from '@/components/account/AuthShell';
import { ProfileForm } from '@/components/account/ProfileForm';
import { getMyProfile, requireViewer } from '@/lib/data/account';

export const metadata: Metadata = { title: 'Profile & address' };

export default function AccountProfilePage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'My account', href: '/account' }, { label: 'Profile & address' }]} />
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#112a1d] sm:text-4xl">Profile &amp; address</h1>
        <p className="mt-1 text-sm text-[#5a7165]">Keep your details current so every delivery finds you first time.</p>
      </div>
      <section className="rounded-[2rem] border border-[#dfece3] bg-white p-5 shadow-soft sm:p-8">
        <Suspense fallback={<FormSkeleton fields={5} />}>
          <ProfileLoader />
        </Suspense>
      </section>
    </div>
  );
}

async function ProfileLoader() {
  const viewer = await requireViewer('/account/profile');
  const result = await getMyProfile();
  const profile = result?.profile ?? { fullName: viewer.fullName, phone: '', address: '', area: '', city: 'Dhaka' };
  return (
    <div className="space-y-6">
      {result && !result.available && (
        <p role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Saved addresses are coming soon — we’re finishing our setup. You can update your name now; address details will be saved once it’s ready.
        </p>
      )}
      <ProfileForm profile={profile} email={viewer.email} />
    </div>
  );
}
