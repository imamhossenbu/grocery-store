'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn, type AuthFormState } from '@/actions/auth';
import { FormAlert, PasswordField, SubmitButton, TextField } from './FormControls';
import { OtpVerifyForm } from './OtpVerifyForm';
import { safeNext } from './safe-next';

const LINK_ERRORS: Record<string, string> = {
  link_expired: 'That link has expired. Request a new one below or sign in if your account is already active.',
  link_invalid: 'That link is invalid or has already been used. Please sign in, or request a new link.',
};

const initial: AuthFormState = { ok: false, message: '' };

export function LoginForm() {
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const linkError = LINK_ERRORS[params.get('error') ?? ''];
  const [state, action, pending] = useActionState(signIn, initial);

  if (state.unconfirmedEmail) {
    return <OtpVerifyForm email={state.unconfirmedEmail} next={next} intro="Your email isn’t verified yet. Enter the 6-digit code we just sent to" />;
  }

  const registerHref = next === '/account' ? '/register' : `/register?next=${encodeURIComponent(next)}`;

  return (
    <div className="space-y-6">
      {linkError && !state.message && <FormAlert ok={false} message={linkError} />}
      {next.startsWith('/checkout') && !state.message && (
        <FormAlert ok message="Sign in to fill in your saved address and keep this order in your history." />
      )}

      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="next" value={next} />
        <TextField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="you@example.com"
          defaultValue={state.values?.email}
          error={state.fieldErrors?.email}
        />
        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="Your password"
            error={state.fieldErrors?.password}
          />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-xs font-semibold text-[#1a663b] hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        {state.message && <FormAlert ok={state.ok} message={state.message} />}

        <SubmitButton pending={pending} pendingLabel="Signing in…" className="w-full">
          Sign in
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-[#5a7165]">
        New to FreshBasket?{' '}
        <Link href={registerHref} className="font-bold text-[#1a663b] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
