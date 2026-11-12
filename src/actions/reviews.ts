'use server';

import { updateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/supabase/server';
import { isMissingTableError, supabaseAdmin } from '@/lib/supabase/admin';
import { getProduct } from '@/lib/data/catalog';
import { REVIEW_MAX_LENGTH, REVIEW_MIN_LENGTH } from '@/components/product/review-limits';

export interface ReviewFormState {
  ok: boolean;
  message: string;
  fieldErrors?: { rating?: string; comment?: string };
}

/** "Nusrat Jahan" -> "Nusrat J." — enough to feel personal without publishing a full name. */
function publicName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'FreshBasket customer';
  const [firstName, ...rest] = parts;
  const last = rest.at(-1);
  return (last ? `${firstName} ${last[0].toUpperCase()}.` : firstName).slice(0, 60);
}

export async function submitReview(_prev: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return { ok: false, message: 'Please sign in to write a review.' };

  const productId = String(formData.get('productId') ?? '').trim();
  const rating = Number(formData.get('rating'));
  const comment = String(formData.get('comment') ?? '').replace(/\r\n/g, '\n').trim();

  const fieldErrors: ReviewFormState['fieldErrors'] = {};
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fieldErrors.rating = 'Choose a rating from 1 to 5 stars.';
  if (comment.length < REVIEW_MIN_LENGTH) fieldErrors.comment = `Tell us a little more — at least ${REVIEW_MIN_LENGTH} characters.`;
  else if (comment.length > REVIEW_MAX_LENGTH) fieldErrors.comment = `Please keep it under ${REVIEW_MAX_LENGTH} characters.`;
  if (fieldErrors.rating || fieldErrors.comment) return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors };

  const product = productId ? await getProduct(productId) : null;
  if (!product || !product.active) return { ok: false, message: 'This product is no longer available.' };

  const db = supabaseAdmin();

  // Display name: auth metadata, then saved profile, then the email's local part.
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  let fullName = String(meta.full_name ?? meta.name ?? '').trim();
  if (!fullName) {
    const { data: profile } = await db.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
    fullName = String(profile?.full_name ?? '').trim();
  }
  if (!fullName) fullName = (user.email ?? '').split('@')[0];

  // Verified purchase: any delivered order of this user containing the product.
  let verified = false;
  const { data: orders, error: ordersError } = await db
    .from('orders')
    .select('items')
    .eq('user_id', user.id)
    .eq('status', 'Delivered')
    .order('created_at', { ascending: false })
    .limit(200);
  if (!ordersError && orders) {
    verified = orders.some(
      (o) => Array.isArray(o.items) && (o.items as { productId?: string }[]).some((i) => i?.productId === product.id)
    );
  }

  const { error } = await db.from('reviews').upsert(
    {
      product_id: product.id,
      user_id: user.id,
      author_name: publicName(fullName),
      rating,
      comment,
      verified_purchase: verified,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'product_id,user_id' }
  );

  if (isMissingTableError(error)) {
    return { ok: false, message: 'Reviews are not open yet — our store is still being set up. Please check back soon.' };
  }
  if (error) {
    console.error('submitReview', error);
    return { ok: false, message: 'We could not save your review. Please try again in a moment.' };
  }

  updateTag('catalog');
  updateTag(`reviews:${product.id}`);
  return {
    ok: true,
    message: verified ? 'Thanks! Your verified review is now live.' : 'Thanks! Your review is now live.',
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface MyReviewFormState extends ReviewFormState {
  review?: { rating: number; comment: string };
}

/**
 * Edit one of the signed-in user's reviews from the account dashboard.
 * The row is matched by id AND the verified user id, so a forged id can
 * only ever touch the caller's own review.
 */
export async function updateMyReview(_prev: MyReviewFormState, formData: FormData): Promise<MyReviewFormState> {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return { ok: false, message: 'Your session has expired. Please sign in again.' };

  const reviewId = String(formData.get('reviewId') ?? '');
  const rating = Number(formData.get('rating'));
  const comment = String(formData.get('comment') ?? '').replace(/\r\n/g, '\n').trim();
  if (!UUID_RE.test(reviewId)) return { ok: false, message: 'This review could not be found.' };

  const fieldErrors: ReviewFormState['fieldErrors'] = {};
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fieldErrors.rating = 'Choose a rating from 1 to 5 stars.';
  if (comment.length < REVIEW_MIN_LENGTH) fieldErrors.comment = `Tell us a little more — at least ${REVIEW_MIN_LENGTH} characters.`;
  else if (comment.length > REVIEW_MAX_LENGTH) fieldErrors.comment = `Please keep it under ${REVIEW_MAX_LENGTH} characters.`;
  if (fieldErrors.rating || fieldErrors.comment) return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors };

  const { data, error } = await supabaseAdmin()
    .from('reviews')
    .update({ rating, comment })
    .eq('id', reviewId)
    .eq('user_id', user.id)
    .select('product_id')
    .maybeSingle();

  if (error) {
    console.error('updateMyReview', error);
    return { ok: false, message: 'We could not save your review. Please try again.' };
  }
  if (!data) return { ok: false, message: 'This review could not be found.' };

  updateTag('catalog');
  updateTag(`reviews:${data.product_id}`);
  return { ok: true, message: 'Review updated.', review: { rating, comment } };
}

/** Delete one of the signed-in user's reviews (scoped by the verified user id). */
export async function deleteMyReview(reviewId: string): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return { ok: false, message: 'Your session has expired. Please sign in again.' };
  if (typeof reviewId !== 'string' || !UUID_RE.test(reviewId)) return { ok: false, message: 'This review could not be found.' };

  const { data, error } = await supabaseAdmin()
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', user.id)
    .select('product_id')
    .maybeSingle();

  if (error) {
    console.error('deleteMyReview', error);
    return { ok: false, message: 'We could not delete your review. Please try again.' };
  }
  if (!data) return { ok: false, message: 'This review could not be found.' };

  updateTag('catalog');
  updateTag(`reviews:${data.product_id}`);
  return { ok: true, message: 'Review deleted.' };
}
