'use client';

import { useActionState } from 'react';
import { MailCheck } from 'lucide-react';
import { requestPasswordReset, type AuthFormState } from '@/actions/auth';
import { AuthNotice, FormAlert, SubmitButton, TextField } from './FormControls';

const initial: AuthFormState = { ok: false, message: '' };

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);

  if (state.ok) {
    return (
      <AuthNotice
        icon={<MailCheck />}
        title="Check your email"
        note="Didn’t get it? Check spam or promotions. The link works once and expires after an hour."
        action={{ href: '/login', label: 'Back to sign in' }}
      >
        {state.message}
      </AuthNotice>
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
