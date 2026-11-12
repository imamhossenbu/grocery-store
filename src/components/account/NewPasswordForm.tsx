'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { changePassword, resetPassword, type AuthFormState } from '@/actions/auth';
import { FormAlert, PasswordField, SubmitButton } from './FormControls';
import { PasswordStrength } from './PasswordStrength';

const initial: AuthFormState = { ok: false, message: '' };

/**
 * New-password form used in two places:
 *  - mode="reset":  /reset-password, after following the recovery email link
 *  - mode="change": /account/security, requires the current password
 */
export function NewPasswordForm({ mode }: { mode: 'reset' | 'change' }) {
  const [state, action, pending] = useActionState(mode === 'reset' ? resetPassword : changePassword, initial);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    setPassword('');
    setConfirm('');
  }

  if (mode === 'reset' && state.ok) {
    return (
      <div className="space-y-5 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e8f5ee] text-[#1a663b]">
          <ShieldCheck className="h-8 w-8" />
        </span>
        <h2 className="font-display text-2xl font-bold text-[#112a1d]">Password updated</h2>
        <p role="status" className="text-sm text-[#5a7165]">{state.message}</p>
        <Link href="/account" className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-gradient px-6 text-sm font-bold text-white shadow-glow">
          Go to my account
        </Link>
      </div>
    );
  }

  const strengthId = `${mode}-password-strength`;
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <form action={action} className="space-y-5" noValidate>
      {mode === 'change' && (
        <PasswordField
          label="Current password"
          name="currentPassword"
          autoComplete="current-password"
          required
          error={state.fieldErrors?.currentPassword}
        />
      )}
      <div>
        <PasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={state.fieldErrors?.password}
          aria-describedby={strengthId}
        />
        <PasswordStrength password={password} id={strengthId} />
      </div>
      <PasswordField
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={state.fieldErrors?.confirmPassword ?? (mismatch ? 'Passwords don’t match yet.' : undefined)}
      />
      {state.message && <FormAlert ok={state.ok} message={state.message} />}
      <SubmitButton pending={pending} pendingLabel="Saving…" className={mode === 'reset' ? 'w-full' : 'w-full sm:w-auto'}>
        {mode === 'reset' ? 'Set new password' : 'Update password'}
      </SubmitButton>
    </form>
  );
}
