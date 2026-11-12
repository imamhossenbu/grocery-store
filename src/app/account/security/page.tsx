import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FormSkeleton } from '@/components/account/AuthShell';
import { NewPasswordForm } from '@/components/account/NewPasswordForm';
import { signOut } from '@/actions/auth';
import { requireViewer } from '@/lib/data/account';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Security' };

export default function AccountSecurityPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'My account', href: '/account' }, { label: 'Security' }]} />
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#112a1d] sm:text-4xl">Security</h1>
        <p className="mt-1 text-sm text-[#5a7165]">Change your password and manage how you’re signed in.</p>
      </div>

      <section aria-labelledby="change-password" className="rounded-[2rem] border border-[#dfece3] bg-white p-5 shadow-soft sm:p-8">
        <h2 id="change-password" className="font-display text-xl font-bold text-[#112a1d]">Change password</h2>
        <p className="mt-1 mb-6 text-sm text-[#5a7165]">
          Enter your current password, then choose a new one. Forgotten it?{' '}
          <Link href="/forgot-password" className="font-semibold text-[#1a663b] hover:underline">Reset it by email</Link>.
        </p>
        <Suspense fallback={<FormSkeleton fields={3} />}>
          <SecurityGate />
        </Suspense>
      </section>

      <section aria-labelledby="sessions" className="rounded-[2rem] border border-[#dfece3] bg-white p-5 shadow-soft sm:p-8">
        <h2 id="sessions" className="font-display text-xl font-bold text-[#112a1d]">Sign out</h2>
        <p className="mt-1 text-sm text-[#5a7165]">Using a shared or public device? Sign out when you’re done. Your basket and wishlist stay on this device.</p>
        <form action={signOut} className="mt-5">
          <button type="submit" className="inline-flex h-11 items-center rounded-full border-2 border-red-200 bg-white px-5 text-sm font-bold text-red-600 transition hover:bg-red-50 cursor-pointer">
            Sign out of this device
          </button>
        </form>
      </section>
    </div>
  );
}

async function SecurityGate() {
  const viewer = await requireViewer('/account/security');
  return (
    <div className="space-y-6">
      <p className="flex items-start gap-2.5 rounded-2xl bg-[#f6faf7] px-4 py-3 text-sm text-[#445c50]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1a663b]" />
        <span>
          Signed in as <strong className="text-[#112a1d]">{viewer.email}</strong>
          {viewer.lastSignInAt && <> · last sign-in {formatDateTime(viewer.lastSignInAt)}</>}
        </span>
      </p>
      <div className="max-w-md">
        <NewPasswordForm mode="change" />
      </div>
    </div>
  );
}
