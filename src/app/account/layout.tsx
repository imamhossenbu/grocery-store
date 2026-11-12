import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AccountNav } from '@/components/account/AccountNav';

export const metadata: Metadata = {
  title: { default: 'My account', template: '%s · My account | FreshBasket' },
  robots: { index: false, follow: false },
};

/**
 * Static shell for the account area: the navigation renders instantly and
 * each page streams its user-specific content behind its own <Suspense>.
 * Authorization happens in the pages (requireViewer), not here.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#f9fbf9]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[250px_1fr] lg:gap-8">
          <aside className="lg:sticky lg:top-40 lg:self-start">
            <AccountNav />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
