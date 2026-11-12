'use client';

import { useActionState, useState } from 'react';
import { CheckCircle2, Loader2, Star } from 'lucide-react';
import { submitReview, type ReviewFormState } from '@/actions/reviews';
import { REVIEW_MAX_LENGTH, REVIEW_MIN_LENGTH } from './review-limits';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

interface Props {
  productId: string;
  existing?: { rating: number; comment: string } | null;
}

export function ReviewForm({ productId, existing }: Props) {
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(submitReview, { ok: false, message: '' });
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const shown = hover || rating;

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="productId" value={productId} />

      <fieldset>
        <legend className="text-sm font-bold text-[#112a1d]">Your rating</legend>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  checked={rating === n}
                  onChange={() => setRating(n)}
                  className="peer sr-only"
                  aria-label={`${n} star${n > 1 ? 's' : ''} — ${LABELS[n]}`}
                />
                <Star
                  aria-hidden
                  className={`h-8 w-8 rounded transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#1a663b] ${
                    n <= shown ? 'fill-[#f5b82e] text-[#f5b82e]' : 'text-[#cfd9d2]'
                  }`}
                />
              </label>
            ))}
          </div>
          <span className="text-sm font-semibold text-[#5a7165]" aria-hidden>
            {LABELS[shown]}
          </span>
        </div>
        {state.fieldErrors?.rating && <p className="mt-1 text-xs font-semibold text-red-600">{state.fieldErrors.rating}</p>}
      </fieldset>

      <div>
        <label htmlFor="review-comment" className="text-sm font-bold text-[#112a1d]">
          Your review
        </label>
        <textarea
          id="review-comment"
          name="comment"
          rows={4}
          required
          minLength={REVIEW_MIN_LENGTH}
          maxLength={REVIEW_MAX_LENGTH}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was the freshness, taste and packaging?"
          aria-invalid={Boolean(state.fieldErrors?.comment)}
          aria-describedby="review-comment-hint"
          className="mt-2 w-full resize-y rounded-2xl border border-[#cfe3d6] bg-white px-4 py-3 text-sm text-[#112a1d] outline-none transition focus:border-[#1a663b] focus:ring-2 focus:ring-[#1a663b]/20 aria-[invalid=true]:border-red-400"
        />
        <div id="review-comment-hint" className="mt-1 flex justify-between gap-2 text-xs">
          <span className={state.fieldErrors?.comment ? 'font-semibold text-red-600' : 'text-[#7e9688]'}>
            {state.fieldErrors?.comment ?? `At least ${REVIEW_MIN_LENGTH} characters.`}
          </span>
          <span className="text-[#7e9688]">
            {comment.length}/{REVIEW_MAX_LENGTH}
          </span>
        </div>
      </div>

      {state.message && (
        <p
          role={state.ok ? 'status' : 'alert'}
          className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${
            state.ok ? 'bg-[#e8f5ee] text-[#14522f]' : 'bg-red-50 text-red-700'
          }`}
        >
          {state.ok && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-gradient px-6 text-sm font-bold text-white shadow-glow transition hover:brightness-105 disabled:opacity-60 cursor-pointer"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {existing ? 'Update review' : 'Submit review'}
      </button>
    </form>
  );
}
