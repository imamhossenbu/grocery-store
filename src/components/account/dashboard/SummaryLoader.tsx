import { cookies } from 'next/headers';
import { getAccountSummary } from '@/lib/data/account';
import { SummaryBridge } from './summary';

/** Request-time: streams the sidebar identity + counts (render inside <Suspense>). */
export async function SummaryLoader() {
  await cookies();
  const s = await getAccountSummary().catch(() => null);
  if (!s) return null;
  return (
    <SummaryBridge
      summary={{
        name: s.displayName,
        email: s.viewer.email,
        memberSince: s.viewer.createdAt,
        lastSignInAt: s.viewer.lastSignInAt,
        totalOrders: s.totalOrders,
        activeOrders: s.activeOrders,
        awaitingReviews: s.awaitingReviews,
      }}
    />
  );
}
