'use client';

import { useActionState, useState } from 'react';
import { submitReview, type ReviewFormState } from '@/actions/reviews';
import { Field, Textarea } from '@/components/ui/Field';
import { RatingInput } from '@/components/ui/RatingInput';
import { FormAlert, SubmitButton } from '@/components/account/FormControls';
import { REVIEW_MAX_LENGTH, REVIEW_MIN_LENGTH } from './review-limits';

interface Props {
  productId: string;
  existing?: { rating: number; comment: string } | null;
}

/** Star rating + review text with a live counter. Plain form + server action underneath. */
export function ReviewForm({ productId, existing }: Props) {
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(submitReview, { ok: false, message: '' });
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const short = comment.trim().length < REVIEW_MIN_LENGTH;

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="productId" value={productId} />

      <RatingInput name="rating" legend="Your rating" value={rating} onValueChange={setRating} error={state.fieldErrors?.rating} />

      <Field
        label="Your review"
        required
        error={state.fieldErrors?.comment}
        hint={short ? `At least ${REVIEW_MIN_LENGTH} characters.` : 'Thanks — that’s plenty of detail.'}
        counter={
          <span className={comment.length > REVIEW_MAX_LENGTH * 0.9 ? 'font-semibold text-amber-700' : undefined}>
            {comment.length}/{REVIEW_MAX_LENGTH}
          </span>
        }
      >
        {({ state: fieldState, ...p }) => (
          <Textarea
            name="comment"
            required
            minRows={4}
            minLength={REVIEW_MIN_LENGTH}
            maxLength={REVIEW_MAX_LENGTH}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was the freshness, taste and packaging?"
            state={fieldState}
            {...p}
          />
        )}
      </Field>

      {state.message && <FormAlert ok={state.ok} message={state.message} />}

      <SubmitButton pending={pending} pendingLabel={existing ? 'Updating…' : 'Submitting…'}>
        {existing ? 'Update review' : 'Submit review'}
      </SubmitButton>
    </form>
  );
}
