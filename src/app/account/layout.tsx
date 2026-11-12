import type { Metadata } from 'next';
import { Suspense, type ReactNode } from 'react';
import { AccountShell, COLLAPSE_SCRIPT } from '@/components/account/dashboard/AccountShell';
import { SummaryLoader } from '@/components/account/dashboard/SummaryLoader';
import { InlineScript } from '@/components/ui/InlineScript';

export const metadata: Metadata = {
  title: { default: 'My account', template: '%s · My account | FreshBasket' },
  robots: { index: false, follow: false },
};

/**
 * Dashboard shell for /account/**. The chrome is static (prerendered); the
 * user's name and live counts stream in via <SummaryLoader> behind Suspense.
 * Authorization happens in proxy.ts (redirect) and again in every page /
 * action (requireViewer / getCurrentUser), never here.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <InlineScript html={COLLAPSE_SCRIPT} />
      <AccountShell
        summarySlot={
          <Suspense fallback={null}>
            <SummaryLoader />
          </Suspense>
        }
      >
        {children}
      </AccountShell>
    </>
  );
}
