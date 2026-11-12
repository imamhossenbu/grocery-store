import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { LinkIcon } from 'lucide-react';
import { AuthShell } from '@/components/account/AuthShell';
import { AuthFormSkeleton } from '@/components/store-ui/Skeletons';
import { NewPasswordForm } from '@/components/account/NewPasswordForm';
import { getViewer } from '@/lib/data/account';

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" subtitle="Pick something you don’t use on other websites.">
      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <ResetGate />
      </Suspense>
    </AuthShell>
  );
}

/** The recovery link signs the visitor in (via /auth/callback); without that session there is nothing to reset. */
async function ResetGate() {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <div className="space-y-5 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-700">
          <LinkIcon className="h-8 w-8" />
        </span>
        <h2 className="font-display text-2xl font-bold text-[#112a1d]">This reset link isn’t active</h2>
        <p className="text-sm leading-relaxed text-[#5a7165]">
          Reset links work once and expire after an hour. Open the newest email we sent you, or request a fresh link.
        </p>
        <Link href="/forgot-password" className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-gradient px-6 text-sm font-bold text-white shadow-glow">
          Request a new link
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <p className="rounded-2xl bg-[#f6faf7] px-4 py-3 text-sm text-[#445c50]">
        Setting a new password for <strong className="text-[#112a1d]">{viewer.email}</strong>
      </p>
      <NewPasswordForm mode="reset" />
    </div>
  );
}
