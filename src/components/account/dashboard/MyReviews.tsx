'use client';

import { useActionState, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Clock3, ExternalLink, MessageSquareQuote, MoreHorizontal, PencilLine, Star, Trash2 } from 'lucide-react';
import type { MyReview, ReviewQueueItem } from '@/lib/data/account';
import { deleteMyReview, updateMyReview, type MyReviewFormState } from '@/actions/reviews';
import { REVIEW_MAX_LENGTH, REVIEW_MIN_LENGTH } from '@/components/product/review-limits';
import { Stars } from '@/components/product/Stars';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Pagination, usePagedList } from '@/components/ui/Pagination';
import { Field, Textarea } from '@/components/ui/Field';
import { RatingInput } from '@/components/ui/RatingInput';
import { FormAlert, SubmitButton } from '@/components/account/FormControls';
import { useShop } from '@/context/ShopContext';
import { formatDate } from '@/lib/format';
import { Reveal } from '@/components/ui/motion';

export function ReviewQueue({ items }: { items: ReviewQueueItem[] }) {
  const pager = usePagedList(items, { param: 'awaiting', defaultSize: 6, sizeOptions: [6], scrollTargetId: 'awaiting-title' });
  if (!items.length) return null;
  return (
    <Reveal as="section" index={0} aria-labelledby="awaiting-title" className="scroll-mt-44 rounded-3xl border border-[#fde7a8] bg-gradient-to-br from-[#fffaf0] via-white to-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="awaiting-title" className="flex items-center gap-2.5 font-display text-lg font-bold text-[#112a1d] sm:text-xl">
            <span aria-hidden className="grid h-8 w-8 place-items-center rounded-xl bg-[#fdf0c4] text-[#8a5a00]"><Clock3 className="h-4 w-4" /></span>
            Awaiting your review
            <span className="rounded-full bg-[#f5b82e] px-2 py-0.5 text-xs font-extrabold text-[#3a2502]">{items.length}</span>
          </h2>
          <p className="mt-1 text-sm text-[#3f5649]">You bought these — a quick rating helps other shoppers (and us).</p>
        </div>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {pager.items.map(({ product, deliveredAt }, i) => {
          const href = `/product/${encodeURIComponent(product.id)}#reviews`;
          return (
            <Reveal as="li" index={Math.min(i, 8)} key={product.id} >
              <div className="fb-lift flex h-full gap-3 rounded-2xl border border-[#eef5f0] bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl bg-[#f0f7f2] object-cover" />
                <div className="min-w-0 flex-1">
                  <Link href={href} className="line-clamp-1 text-sm font-bold text-[#112a1d] hover:text-[#1a663b]">{product.name}</Link>
                  <p className="text-[13px] text-[#3f5649]">{product.unit} · delivered {formatDate(deliveredAt)}</p>
                  <div className="mt-1.5 flex items-center gap-0.5" role="group" aria-label={`Rate ${product.name}`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Link
                        key={n}
                        href={href}
                        aria-label={`Rate ${product.name} ${n} star${n > 1 ? 's' : ''}`}
                        className="group/star rounded p-0.5"
                      >
                        <Star aria-hidden className="h-5 w-5 text-[#d8cfae] transition group-hover/star:scale-110 group-hover/star:fill-[#f5b82e] group-hover/star:text-[#f5b82e]" />
                      </Link>
                    ))}
                    <Link href={href} className="ml-auto text-[13px] font-bold text-[#1a663b] hover:underline">Review</Link>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </ul>
      <Pagination {...pager.props} itemLabel="products" className="mt-4" />
    </Reveal>
  );
}

export function ReviewList({ reviews }: { reviews: MyReview[] }) {
  const [editing, setEditing] = useState<MyReview | null>(null);
  const [open, setOpen] = useState(false);
  const confirm = useConfirm();
  const router = useRouter();
  const { toast } = useShop();
  const [, startTransition] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);
  const pager = usePagedList(reviews, { param: 'page', sizeParam: 'size', defaultSize: 5, sizeOptions: [5, 10, 20], scrollTargetId: 'my-reviews-title' });

  const remove = async (r: MyReview) => {
    const ok = await confirm({
      title: 'Delete this review?',
      description: `Your review of ${r.product?.name ?? 'this product'} will be removed from the product page. You can write a new one later.`,
      confirmLabel: 'Delete review',
      tone: 'danger',
    });
    if (!ok) return;
    setRemoving(r.id);
    startTransition(async () => {
      const res = await deleteMyReview(r.id);
      toast(res.ok ? 'Review deleted' : 'Couldn’t delete review', res.ok ? undefined : res.message, res.ok ? 'success' : 'error');
      setRemoving(null);
      router.refresh();
    });
  };

  return (
    <section aria-labelledby="my-reviews-title" className="space-y-3">
      <h2 id="my-reviews-title" className="scroll-mt-44 font-display text-xl font-bold text-[#112a1d] sm:text-2xl">
        Your reviews <span className="text-base font-semibold text-[#3f5649]">({reviews.length})</span>
      </h2>
      {reviews.length === 0 ? (
        <div className="fb-crossfade flex flex-col items-center rounded-3xl border-2 border-dashed border-[#cfe3d6] bg-white/70 px-6 py-14 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e8f5ee] text-[#1a663b]"><MessageSquareQuote className="h-7 w-7" aria-hidden /></span>
          <p className="mt-4 font-display text-xl font-bold text-[#112a1d]">No reviews yet</p>
          <p className="mt-1 max-w-sm text-sm text-[#3f5649]">Reviews you write on product pages appear here, where you can edit or delete them.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {pager.items.map((r, i) => (
            <Reveal as="li" index={Math.min(i, 8)} key={r.id} >
              <article className={`fb-lift flex gap-4 rounded-3xl border border-[#dfece3] bg-white p-4 shadow-soft transition-opacity sm:p-5 ${removing === r.id ? 'opacity-50' : ''}`}>
                {r.product ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.product.image} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-2xl bg-[#f0f7f2] object-cover sm:h-20 sm:w-20" />
                ) : (
                  <span aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#f0f7f2] text-[#9ab5a5] sm:h-20 sm:w-20"><MessageSquareQuote className="h-6 w-6" /></span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-[#112a1d]">
                        {r.product ? (
                          <Link href={`/product/${encodeURIComponent(r.productId)}#reviews`} className="hover:text-[#1a663b]">{r.product.name}</Link>
                        ) : (
                          'Product no longer available'
                        )}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[#3f5649]">
                        <Stars rating={r.rating} size="sm" />
                        <span>{formatDate(r.createdAt)}</span>
                        {r.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#e3f5ea] px-2 py-0.5 font-bold text-[#145732]">
                            <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified purchase
                          </span>
                        )}
                        {!r.approved && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-800">Hidden by moderation</span>}
                      </div>
                    </div>
                    <DropdownMenu
                      label={`Actions for your review of ${r.product?.name ?? 'this product'}`}
                      trigger={<MoreHorizontal className="h-4 w-4" aria-hidden />}
                      triggerClassName="fb-press grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d3e5da] bg-white text-[#234835] hover:border-[#1a663b] cursor-pointer"
                      items={[
                        {
                          label: 'Edit review',
                          icon: <PencilLine />,
                          onSelect: () => {
                            setEditing(r);
                            setOpen(true);
                          },
                        },
                        ...(r.product ? [{ label: 'View product', icon: <ExternalLink />, href: `/product/${encodeURIComponent(r.productId)}#reviews` }] : []),
                        { type: 'separator' as const },
                        { label: 'Delete review', icon: <Trash2 />, tone: 'danger' as const, onSelect: () => remove(r) },
                      ]}
                    />
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#445c50]">{r.comment}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      )}
      <Pagination {...pager.props} itemLabel="reviews" className="pt-2" />

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Edit your review"
        description={editing?.product?.name}
      >
        {editing && (
          <EditReviewForm
            key={editing.id}
            review={editing}
            onDone={() => {
              setOpen(false);
              toast('Review updated', editing.product?.name);
              router.refresh();
            }}
            onCancel={() => setOpen(false)}
          />
        )}
      </Dialog>
    </section>
  );
}

function EditReviewForm({ review, onDone, onCancel }: { review: MyReview; onDone: () => void; onCancel: () => void }) {
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment);
  const [state, action, pending] = useActionState<MyReviewFormState, FormData>(async (prev, fd) => {
    const res = await updateMyReview(prev, fd);
    if (res.ok) onDone();
    return res;
  }, { ok: false, message: '' });
  const len = comment.trim().length;

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="reviewId" value={review.id} />
      <RatingInput name="rating" value={rating} onValueChange={setRating} error={state.fieldErrors?.rating} />
      <Field
        label="Your review"
        required
        error={state.fieldErrors?.comment}
        hint={`At least ${REVIEW_MIN_LENGTH} characters.`}
        counter={`${len}/${REVIEW_MAX_LENGTH}`}
      >
        {({ state: fieldState, ...p }) => (
          <Textarea
            name="comment"
            minRows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={REVIEW_MAX_LENGTH}
            state={fieldState}
            {...p}
          />
        )}
      </Field>
      {state.message && !state.ok && <FormAlert ok={false} message={state.message} />}
      <DialogFooter>
        <button type="button" onClick={onCancel} className="fb-press inline-flex h-12 items-center justify-center rounded-full border-2 border-[#cce2d4] bg-white px-5 text-sm font-semibold text-[#112a1d] hover:border-[#1a663b] cursor-pointer">
          Cancel
        </button>
        <SubmitButton pending={pending} pendingLabel="Saving…">Save changes</SubmitButton>
      </DialogFooter>
    </form>
  );
}
