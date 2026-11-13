'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { requestPasswordReset, type AuthFormState } from '@/actions/auth';
import { FormAlert, SubmitButton, TextField } from './FormControls';

const initial: AuthFormState = { ok: false, message: '' };

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);

  if (state.ok) {
    return (
      <div className="space-y-5 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e8f5ee] text-[#1a663b]">
          <MailCheck className="h-8 w-8" />
        </span>
        <h2 className="font-display text-2xl font-bold text-[#112a1d]">Check your email</h2>
        <p role="status" className="text-sm leading-relaxed text-[#5a7165]">{state.message}</p>
        <p className="text-xs text-[#7e9688]">The link works once and expires after an hour.</p>
        <Link href="/login" className="inline-block text-sm font-bold text-[#1a663b] hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <TextField
        label="Email address"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      {state.message && <FormAlert ok={state.ok} message={state.message} />}
      <SubmitButton pending={pending} pendingLabel="Sending link…" className="w-full">
        Email me a reset link
      </SubmitButton>
    </form>
  );
}
