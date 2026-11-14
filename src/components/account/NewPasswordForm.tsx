'use client';

import { useActionState, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { changePassword, resetPassword, type AuthFormState } from '@/actions/auth';
import { AuthNotice, FormAlert, PasswordField, SubmitButton } from './FormControls';
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
      <AuthNotice icon={<ShieldCheck />} title="Password updated" action={{ href: '/account', label: 'Go to my account', primary: true }}>
        {state.message}
      </AuthNotice>
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
