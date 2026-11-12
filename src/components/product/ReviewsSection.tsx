import { Suspense } from 'react';
import { BadgeCheck, MessageSquareText } from 'lucide-react';
import type { Product, Review } from '@/types/store';
import { formatDate } from '@/lib/format';
import { Block } from '@/components/ui/Skeleton';
import { Stars } from './Stars';
import { ReviewFormGate } from './ReviewFormGate';

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
          <div className="rounded-3xl border border-[#dfece3] bg-white p-6 shadow-soft">
            {count > 0 ? (
              <>
                <div className="flex items-end gap-3">
                  <span className="font-display text-5xl font-bold text-[#112a1d]">{average.toFixed(1)}</span>
                  <div className="pb-1.5">
                    <Stars rating={average} size="md" />
                    <p className="mt-0.5 text-xs text-[#5a7165]">
                      Based on {count} {count === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </div>
                <ul className="mt-5 space-y-2" aria-label="Rating distribution">
                  {dist.map(({ star, n }) => {
                    const pct = sample ? Math.round((n / sample) * 100) : 0;
                    return (
                      <li key={star} className="flex items-center gap-3 text-xs">
                        <span className="w-10 shrink-0 font-semibold text-[#234835]">{star} star</span>
                        <span
                          className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#eef5f0]"
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${star} star reviews`}
                        >
                          <span className="block h-full rounded-full bg-[#f5b82e]" style={{ width: `${pct}%` }} />
                        </span>
                        <span className="w-9 shrink-0 text-right font-semibold text-[#5a7165]">{pct}%</span>
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

          <Suspense
            fallback={
              <div className="space-y-3 rounded-3xl border border-[#dfece3] bg-white p-6">
                <Block className="h-5 w-40" />
                <Block className="h-8 w-48" />
                <Block className="h-24 w-full" />
                <Block className="h-11 w-36 rounded-full" />
              </div>
            }
          >
            <ReviewFormGate productId={product.id} />
          </Suspense>
        </div>

        <div>
          {reviews.length > 0 ? (
            <ul className="divide-y divide-[#e6f0e9] rounded-3xl border border-[#dfece3] bg-white px-6 shadow-soft">
              {reviews.map((r) => (
                <li key={r.id} className="py-5">
                  <article>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-gradient text-sm font-bold text-white" aria-hidden>
                          {r.authorName.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-[#112a1d]">{r.authorName}</p>
                          <p className="text-xs text-[#7e9688]">
                            <time dateTime={r.createdAt}>{formatDate(r.createdAt)}</time>
                          </p>
                        </div>
                      </div>
                      {r.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5ee] px-2.5 py-1 text-[11px] font-bold text-[#14522f]">
                          <BadgeCheck className="h-3.5 w-3.5" /> Verified purchase
                        </span>
                      )}
                    </div>
                    <Stars rating={r.rating} size="sm" className="mt-3" />
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#234835]">{r.comment}</p>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid h-full min-h-48 place-items-center rounded-3xl border-2 border-dashed border-[#cfe3d6] bg-white/70 p-8 text-center">
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
