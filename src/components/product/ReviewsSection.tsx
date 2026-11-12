import { Suspense } from 'react';
import { MessageSquareText } from 'lucide-react';
import type { Product, Review } from '@/types/store';
import { ReviewFormSkeleton } from '@/components/store-ui/Skeletons';
import { Stars } from './Stars';
import { ReviewFormGate } from './ReviewFormGate';
import { ReviewList } from './ReviewList';

export function reviewStats(product: Product, reviews: Review[]) {
  const count = Math.max(product.reviewCount ?? 0, reviews.length);
  const average = product.reviewCount
    ? product.rating
    : reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, n: reviews.filter((r) => r.rating === star).length }));
  return { count, average, dist };
}

export function ReviewsSection({ product, reviews }: { product: Product; reviews: Review[] }) {
  const { count, average, dist } = reviewStats(product, reviews);
  const sample = reviews.length;

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-40">
      <h2 id="reviews-heading" className="font-display text-3xl font-bold text-[#112a1d]">
        Customer reviews
      </h2>

      <div className="mt-6 grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#dfece3] bg-white p-6 shadow-soft">
            {count > 0 ? (
              <>
                <div className="flex items-end gap-3">
                  <span className="font-display text-5xl font-bold tabular-nums text-[#112a1d]">{average.toFixed(1)}</span>
                  <div className="pb-1.5">
                    <Stars rating={average} size="md" />
                    <p className="mt-0.5 text-[13px] text-[#3f5649]">
                      Based on {count} {count === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </div>
                <ul className="mt-5 space-y-2" aria-label="Rating distribution">
                  {dist.map(({ star, n }) => {
                    const pct = sample ? Math.round((n / sample) * 100) : 0;
                    return (
                      <li key={star} className="flex items-center gap-3 text-[13px]">
                        <span className="w-12 shrink-0 font-semibold text-[#234835]">{star} star</span>
                        <span
                          className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#eef5f0]"
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${star} star reviews`}
                        >
                          <span className="fb-grow-x block h-full origin-left rounded-full bg-[#f5b82e]" style={{ width: `${pct}%`, ['--fb-i' as string]: 5 - star }} />
                        </span>
                        <span className="w-10 shrink-0 text-right font-semibold tabular-nums text-[#3f5649]">{pct}%</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <div className="text-center">
                <MessageSquareText className="mx-auto h-8 w-8 text-[#9ab5a5]" aria-hidden />
                <p className="mt-2 font-display text-lg font-bold text-[#112a1d]">No reviews yet</p>
                <p className="mt-1 text-sm text-[#5a7165]">Be the first to tell others what you think.</p>
              </div>
            )}
          </div>

          <Suspense fallback={<ReviewFormSkeleton />}>
            <ReviewFormGate productId={product.id} />
          </Suspense>
        </div>

        <div>
          {reviews.length > 0 ? (
            <ReviewList reviews={reviews} />
          ) : (
            <div className="grid h-full min-h-48 place-items-center rounded-2xl border-2 border-dashed border-[#cfe3d6] bg-white/70 p-8 text-center">
              <p className="max-w-sm text-sm text-[#5a7165]">
                Reviews from shoppers appear here. Bought this before? Your honest feedback helps families across Dhaka shop with confidence.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
