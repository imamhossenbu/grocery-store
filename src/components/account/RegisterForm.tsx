'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signUp, type AuthFormState } from '@/actions/auth';
import { FieldFooter, FormAlert, PasswordField, SubmitButton, TextField } from './FormControls';
import { PasswordStrength } from './PasswordStrength';
import { OtpVerifyForm } from './OtpVerifyForm';
import { safeNext } from './safe-next';

const initial: AuthFormState = { ok: false, message: '' };

export function RegisterForm() {
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [state, action, pending] = useActionState(signUp, initial);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  // React resets the form after each submission; keep the controlled
  // password fields in step with that.
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    setPassword('');
    setConfirm('');
  }

  if (state.ok && state.needsConfirmation && state.values?.email) {
    return <OtpVerifyForm email={state.values.email} next={state.values.next ?? next} />;
  }

  const mismatch = confirm.length > 0 && confirm !== password;
  const loginHref = next === '/account' ? '/login' : `/login?next=${encodeURIComponent(next)}`;

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="next" value={next} />
        <TextField
          label="Full name"
          name="fullName"
          autoComplete="name"
          required
          maxLength={80}
          placeholder="e.g. Nusrat Jahan"
          defaultValue={state.values?.fullName}
          error={state.fieldErrors?.fullName}
        />
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
        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={state.fieldErrors?.password}
            aria-describedby="register-password-strength"
          />
          <PasswordStrength password={password} id="register-password-strength" />
        </div>
        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          placeholder="Type it again"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={state.fieldErrors?.confirmPassword ?? (mismatch ? 'Passwords don’t match yet.' : undefined)}
        />

        <div>
          <label className="flex items-start gap-3 text-sm text-[#445c50]">
            <input
              type="checkbox"
              name="terms"
              required
              aria-invalid={state.fieldErrors?.terms ? true : undefined}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#b9d8c5] accent-[#1a663b]"
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" className="font-semibold text-[#1a663b] hover:underline">terms of service</Link> and{' '}
              <Link href="/privacy" className="font-semibold text-[#1a663b] hover:underline">privacy policy</Link>.
            </span>
          </label>
          <FieldFooter error={state.fieldErrors?.terms} />
        </div>

        {state.message && <FormAlert ok={state.ok} message={state.message} />}

        <SubmitButton pending={pending} pendingLabel="Creating account…" className="w-full">
          Create account
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-[#5a7165]">
        Already have an account?{' '}
        <Link href={loginHref} className="font-bold text-[#1a663b] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
