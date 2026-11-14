import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LinkIcon } from 'lucide-react';
import { AuthShell } from '@/components/account/AuthShell';
import { AuthNotice } from '@/components/account/FormControls';
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
      <AuthNotice
        icon={<LinkIcon />}
        tone="warning"
        title="This reset link isn’t active"
        action={{ href: '/forgot-password', label: 'Request a new link', primary: true }}
      >
        Reset links work once and expire after an hour. Open the newest email we sent you, or request a fresh link.
      </AuthNotice>
    );
  }
  return (
    <div className="space-y-5">
      <p className="rounded-2xl border border-[#dfece3] bg-[#f6faf7] px-4 py-3 text-sm text-[#3f5649]">
        Setting a new password for <strong className="text-[#112a1d]">{viewer.email}</strong>
      </p>
      <NewPasswordForm mode="reset" />
    </div>
  );
}
