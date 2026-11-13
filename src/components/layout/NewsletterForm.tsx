'use client';

import { useActionState } from 'react';
import { subscribeNewsletter, type FormState } from '@/actions/forms';

export function NewsletterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeNewsletter, { ok: false, message: '' });
  return (
    <form action={action} className="w-full">
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">Email address</label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="flex-1 min-w-0 rounded-full border border-[#1b5034] bg-[#123824] px-5 py-3 text-sm text-white placeholder-[#789d87] focus:border-[#3ed481] focus:outline-none"
        />
        <button disabled={pending} className="rounded-full bg-[#f5b82e] px-5 py-3 text-sm font-bold text-[#3a2502] hover:bg-[#e5a91f] disabled:opacity-60 cursor-pointer">
          {pending ? 'Joining…' : 'Subscribe'}
        </button>
      </div>
      {state.message && (
        <p role="status" className={`mt-2 text-xs ${state.ok ? 'text-[#3ed481]' : 'text-red-300'}`}>{state.message}</p>
      )}
    </form>
  );
}
