'use client';

import { AnimatePresence, motion } from 'motion/react';
import { BadgeCheck } from 'lucide-react';
import type { Review } from '@/types/store';
import { formatDate } from '@/lib/format';
import { Pagination, usePagedList } from '@/components/ui/Pagination';
import { Stars } from './Stars';

const PAGE_SIZE = 5;

/** Paginated review list (page kept in ?reviews=N, no navigation). */
export function ReviewList({ reviews }: { reviews: Review[] }) {
  const pager = usePagedList(reviews, { param: 'reviews', defaultSize: PAGE_SIZE, sizeOptions: [PAGE_SIZE], scrollTargetId: 'reviews-list' });

  return (
    <div id="reviews-list" className="scroll-mt-40 space-y-5">
      <AnimatePresence mode="wait" initial={false}>
        <motion.ul
          key={pager.page}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          className="divide-y divide-[#e6f0e9] rounded-2xl border border-[#dfece3] bg-white px-5 shadow-soft sm:px-6"
        >
          {pager.items.map((r) => (
            <li key={r.id} className="py-5">
              <article>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-gradient text-sm font-bold text-white" aria-hidden>
                      {r.authorName.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#112a1d]">{r.authorName}</p>
                      <p className="text-[13px] text-[#3f5649]">
                        <time dateTime={r.createdAt}>{formatDate(r.createdAt)}</time>
                      </p>
                    </div>
                  </div>
                  {r.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5ee] px-2.5 py-1 text-xs font-bold text-[#14522f]">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified purchase
                    </span>
                  )}
                </div>
                <Stars rating={r.rating} size="sm" className="mt-3" />
                <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-[#234835]">{r.comment}</p>
              </article>
            </li>
          ))}
        </motion.ul>
      </AnimatePresence>
      <Pagination {...pager.props} itemLabel="reviews" />
    </div>
  );
}
