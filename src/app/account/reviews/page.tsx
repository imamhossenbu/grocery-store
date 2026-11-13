import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MessageSquareQuote } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReviewsHeader } from '@/components/account/dashboard/headers';
import { ReviewList, ReviewQueue } from '@/components/account/dashboard/MyReviews';
import { ReviewsSkeleton } from '@/components/account/dashboard/skeletons';
import { getMyReviews, getReviewQueue, requireViewer } from '@/lib/data/account';

export const metadata: Metadata = { title: 'Reviews' };

export default function AccountReviewsPage() {
  return (
    <>
      <ReviewsHeader />
      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsContent />
      </Suspense>
    </>
  );
}

async function ReviewsContent() {
  await requireViewer('/account/reviews');
  const [mine, queue] = await Promise.all([getMyReviews(), getReviewQueue()]);

  if (mine && !mine.available) {
    return (
      <EmptyState
        icon={<MessageSquareQuote className="h-8 w-8" />}
        title="Reviews aren’t open yet"
        description="We’re finishing our store setup. Check back soon to rate the products you’ve bought."
      />
    );
  }

  return (
    <div className="fb-crossfade space-y-6">
      <ReviewQueue items={queue} />
      <ReviewList reviews={mine?.reviews ?? []} />
    </div>
  );
}
