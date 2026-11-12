import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { CalendarDays, CheckCircle2, KeyRound, Mail, MapPin, Package, Phone } from 'lucide-react';
import { ProfileForm } from '@/components/account/ProfileForm';
import { ProfileHeader } from '@/components/account/dashboard/headers';
import { Panel } from '@/components/account/dashboard/PageHeader';
import { ProfileSkeleton } from '@/components/account/dashboard/skeletons';
import { initialsOf } from '@/components/account/dashboard/initials';
import { getAccountSummary, getMyProfile, requireViewer } from '@/lib/data/account';
import { formatDate } from '@/lib/format';
import { Reveal } from '@/components/ui/motion';

export const metadata: Metadata = { title: 'Profile & address' };

export default function AccountProfilePage() {
  return (
    <>
      <ProfileHeader />
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </>
  );
}

async function ProfileContent() {
  const viewer = await requireViewer('/account/profile');
  const [result, summary] = await Promise.all([getMyProfile(), getAccountSummary().catch(() => null)]);
  const profile = result?.profile ?? { fullName: viewer.fullName, phone: '', address: '', area: '', city: 'Dhaka' };
  const name = profile.fullName || viewer.email.split('@')[0];
  const hasAddress = !!(profile.address && profile.area);

  return (
    <div className="fb-crossfade grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-[1fr_20rem]">
      <Reveal as="section" index={0} aria-label="Edit profile" className="rounded-3xl border border-[#dfece3] bg-white p-5 shadow-soft sm:p-8">
        {result && !result.available && (
          <p role="status" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Saved addresses are coming soon — we’re finishing our setup. You can update your name now; address details will be saved once it’s ready.
          </p>
        )}
        <ProfileForm profile={profile} email={viewer.email} />
      </Reveal>

      <aside className="space-y-5 lg:space-y-6" aria-label="Account summary">
        <Reveal as="div" index={1} className="overflow-hidden rounded-3xl border border-[#dfece3] bg-white shadow-soft">
          <div className="h-16 bg-forest-gradient" aria-hidden />
          <div className="-mt-10 px-5 pb-5 text-center sm:px-6">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-[#f5b82e] font-display text-2xl font-bold text-[#3a2502] shadow-card ring-4 ring-white">
              {initialsOf(name, viewer.email)}
            </span>
            <p className="mt-3 font-display text-lg font-bold text-[#112a1d]">{name}</p>
            <p className="flex items-center justify-center gap-1.5 truncate text-[13px] text-[#3f5649]"><Mail className="h-3.5 w-3.5" aria-hidden /> {viewer.email}</p>
            <dl className="mt-5 grid grid-cols-2 gap-2 text-left">
              <div className="rounded-2xl bg-[#f6faf7] p-3">
                <dt className="flex items-center gap-1 text-[13px] font-medium text-[#3f5649]"><CalendarDays className="h-3.5 w-3.5" aria-hidden /> Member</dt>
                <dd className="mt-1 text-sm font-bold tabular-nums text-[#112a1d]">{formatDate(viewer.createdAt)}</dd>
              </div>
              <div className="rounded-2xl bg-[#f6faf7] p-3">
                <dt className="flex items-center gap-1 text-[13px] font-medium text-[#3f5649]"><Package className="h-3.5 w-3.5" aria-hidden /> Orders</dt>
                <dd className="mt-1 text-sm font-bold text-[#112a1d]">{summary?.totalOrders ?? 0}</dd>
              </div>
            </dl>
          </div>
        </Reveal>

        <Panel title="Default address" icon={<MapPin />} index={2}>
          {hasAddress ? (
            <div className="text-sm">
              <p className="font-bold text-[#112a1d]">{profile.fullName}</p>
              <p className="mt-1 leading-relaxed text-[#445c50]">{profile.address}</p>
              <p className="text-[#445c50]">{profile.area}, {profile.city}</p>
              {profile.phone && <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-[#234835]"><Phone className="h-3.5 w-3.5" aria-hidden /> {profile.phone}</p>}
              <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#e3f5ea] px-2.5 py-1 text-xs font-bold text-[#145732]">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Used at checkout
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#3f5649]">No address saved yet. Fill in the form and checkout will be pre-filled for every order.</p>
          )}
        </Panel>

        <Reveal index={3}>
          <Link href="/account/security" className="fb-lift flex items-center gap-3 rounded-3xl border border-[#dfece3] bg-white p-4 shadow-soft">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e8f5ee] text-[#1a663b]"><KeyRound className="h-5 w-5" aria-hidden /></span>
          <span className="flex-1 text-sm">
            <span className="block font-bold text-[#112a1d]">Password & sign-in</span>
            <span className="text-[#3f5649]">Change password, sign out everywhere</span>
          </span>
        </Link>
        </Reveal>
      </aside>
    </div>
  );
}
