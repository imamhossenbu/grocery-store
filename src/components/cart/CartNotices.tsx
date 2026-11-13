'use client';

import { AlertTriangle, X } from 'lucide-react';
import type { CartNotice } from './useCartSync';

export function CartNotices({ notices, onDismiss }: { notices: CartNotice[]; onDismiss: () => void }) {
  if (notices.length === 0) return null;
  return (
    <div role="status" className="relative rounded-2xl border border-amber-200 bg-amber-50 p-4 pr-12 text-sm text-amber-900 animate-slideIn">
      <p className="flex items-center gap-2 font-bold">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        Your basket was updated with the latest prices and stock
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-[13px]">
        {notices.map((n, i) => (
          <li key={`${n.id}-${n.kind}-${i}`}>{n.text}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss basket updates"
        className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-amber-800 hover:bg-amber-100 cursor-pointer"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
