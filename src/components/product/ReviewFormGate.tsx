import Link from 'next/link';
import { cookies } from 'next/headers';
import { LogIn, PenLine } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ReviewForm } from './ReviewForm';

/**
 * Request-time part of the reviews section (reads auth cookies) — render it
 * inside <Suspense> so the rest of the product page stays static.
 */
export async function ReviewFormGate({ productId }: { productId: string }) {
  // Mark this subtree as request-time before any try/catch around the auth lookup.
  await cookies();
  const user = await getCurrentUser().catch(() => null);

  if (!user) {
    return (
      <div className="rounded-3xl border border-dashed border-[#cfe3d6] bg-white p-6 text-center">
        <PenLine className="mx-auto h-7 w-7 text-[#1a663b]" aria-hidden />
        <h3 className="mt-3 font-display text-lg font-bold text-[#112a1d]">Share your thoughts</h3>
        <p className="mt-1 text-sm text-[#5a7165]">Sign in to rate this product and help other shoppers.</p>
        <Link
          href={`/login?next=${encodeURIComponent(`/product/${productId}`)}`}
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-[#0f2c1d] px-5 text-sm font-semibold text-white transition hover:bg-[#19442e]"
        >
          <LogIn className="h-4 w-4" /> Sign in to review
        </Link>
      </div>
    );
  }

  let existing: { rating: number; comment: string } | null = null;
  try {
    const { data } = await supabaseAdmin()
      .from('reviews')
      .select('rating, comment')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) existing = { rating: Number(data.rating), comment: String(data.comment ?? '') };
  } catch {
    // Table missing or network trouble: show an empty form; the action reports problems.
  }

  return (
    <div className="rounded-3xl border border-[#dfece3] bg-white p-6 shadow-soft">
      <h3 className="font-display text-lg font-bold text-[#112a1d]">{existing ? 'Edit your review' : 'Write a review'}</h3>
      <p className="mt-1 mb-5 text-sm text-[#5a7165]">
        {existing ? 'You have already reviewed this product — update it any time.' : 'Your feedback helps us keep the quality high.'}
      </p>
      <ReviewForm productId={productId} existing={existing} />
    </div>
  );
}
