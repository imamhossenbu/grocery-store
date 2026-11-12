'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-hero-mesh">
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600 shadow-soft">
          <AlertTriangle className="h-8 w-8" aria-hidden />
        </span>
        <h1 className="mt-6 font-display text-3xl font-bold text-[#112a1d] sm:text-4xl">Something went wrong</h1>
        <p className="mt-3 text-base text-[#5a7165]">
          We couldn&apos;t load this page right now. Your basket is safe — please try again in a moment.
        </p>
        {error.digest && <p className="mt-2 font-mono text-xs text-[#9ab5a5]">Reference: {error.digest}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-gradient px-6 text-sm font-bold text-white shadow-glow cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <Link href="/" className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-[#cce2d4] bg-white px-6 text-sm font-bold text-[#112a1d] hover:border-[#1a663b]">
            <Home className="h-4 w-4" /> Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
