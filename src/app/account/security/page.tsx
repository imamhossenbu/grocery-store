import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { CalendarDays, Clock, KeyRound, Mail, ShieldCheck, Smartphone } from 'lucide-react';
import { NewPasswordForm } from '@/components/account/NewPasswordForm';
import { SecurityHeader } from '@/components/account/dashboard/headers';
import { Panel } from '@/components/account/dashboard/PageHeader';
import { SessionActions } from '@/components/account/dashboard/SessionActions';
import { SecuritySkeleton } from '@/components/account/dashboard/skeletons';
import { requireViewer } from '@/lib/data/account';
import { formatDate, formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Security' };

export default function AccountSecurityPage() {
  return (
    <>
      <SecurityHeader />
      <Suspense fallback={<SecuritySkeleton />}>
        <SecurityContent />
      </Suspense>
    </>
  );
}

async function SecurityContent() {
  const viewer = await requireViewer('/account/security');
  const rows = [
    { icon: <Mail />, label: 'Sign-in email', value: viewer.email },
    { icon: <Clock />, label: 'Last sign-in', value: viewer.lastSignInAt ? formatDateTime(viewer.lastSignInAt) : 'Unknown' },
    { icon: <CalendarDays />, label: 'Member since', value: formatDate(viewer.createdAt) },
  ];

  return (
    <div className="fb-crossfade grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-[1fr_22rem]">
      <Panel title="Change password" icon={<KeyRound />} bodyClassName="sm:p-8 sm:pt-4">
        <p className="mb-6 text-sm leading-relaxed text-[#3f5649]">
          Enter your current password, then choose a new one. Forgotten it?{' '}
          <Link href="/forgot-password" className="font-semibold text-[#1a663b] underline-offset-2 hover:underline">Reset it by email</Link>.
        </p>
        <div className="max-w-md">
          <NewPasswordForm mode="change" />
        </div>
      </Panel>

      <div className="space-y-5 lg:space-y-6">
        <Panel title="Sign-in activity" icon={<ShieldCheck />} index={1}>
          <dl className="space-y-2">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-3 rounded-2xl bg-[#f6faf7] px-3.5 py-3">
                <span aria-hidden className="text-[#1a663b] [&>svg]:h-4 [&>svg]:w-4">{r.icon}</span>
                <div className="min-w-0">
                  <dt className="text-[13px] text-[#3f5649]">{r.label}</dt>
                  <dd className="truncate text-sm font-semibold tabular-nums text-[#112a1d]">{r.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Sessions" icon={<Smartphone />} index={2}>
          <p className="mb-4 text-sm leading-relaxed text-[#3f5649]">
            Lost a phone or used a shared computer? Sign out everywhere to end every session at once. Your basket and wishlist stay on this device.
          </p>
          <SessionActions />
        </Panel>
      </div>
    </div>
  );
}
