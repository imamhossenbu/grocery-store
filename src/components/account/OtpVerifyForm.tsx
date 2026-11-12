'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { OtpInput } from '@/components/ui/Field';
import { MailCheck } from 'lucide-react';
import { resendConfirmation, verifyEmailOtp, type AuthFormState } from '@/actions/auth';
import { FormAlert, SubmitButton } from './FormControls';

const LENGTH = 6;
const RESEND_COOLDOWN = 60;
const initial: AuthFormState = { ok: false, message: '' };

/**
 * Six single-digit boxes for the email verification code. Supports paste,
 * auto-advance, backspace to previous box, and submits on the last digit.
 */
export function OtpVerifyForm({ email, next, intro }: { email: string; next: string; intro?: string }) {
  const [state, action, pending] = useActionState(verifyEmailOtp, initial);
  const [resendState, resendAction, resending] = useActionState(resendConfirmation, initial);
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const boxesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // A failed attempt clears the boxes so the next try starts fresh.
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    if (!state.ok) setCode('');
  }
  // A successful resend restarts the cooldown.
  const [seenResend, setSeenResend] = useState(resendState);
  if (seenResend !== resendState) {
    setSeenResend(resendState);
    if (resendState.ok) setCooldown(RESEND_COOLDOWN);
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    // After a failed attempt, put the caret back in the first empty box.
    if (!pending) boxesRef.current?.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])')[0]?.focus();
  }, [pending, state]);

  const error = state.fieldErrors?.code;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e8f5ee] text-[#1a663b]">
          <MailCheck className="h-8 w-8" />
        </span>
        <h2 className="mt-4 font-display text-2xl font-bold text-[#112a1d]">Verify your email</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#3f5649]">
          {intro ?? 'Enter the 6-digit code we sent to'}{' '}
          <strong className="text-[#112a1d] break-all">{email}</strong>
        </p>
      </div>

      <form ref={formRef} action={action} className="space-y-5" noValidate>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />

        <fieldset>
          <legend className="sr-only">Verification code</legend>
          <div ref={boxesRef} className="flex justify-center">
            <OtpInput
              length={LENGTH}
              name="code"
              value={code}
              onValueChange={setCode}
              // Let React commit the hidden value before submitting.
              onComplete={() => requestAnimationFrame(() => formRef.current?.requestSubmit())}
              disabled={pending}
              invalid={Boolean(error)}
              aria-label="6-digit verification code"
            />
          </div>
          {error && <p className="mt-2 text-center text-[13px] font-semibold text-red-700">{error}</p>}
        </fieldset>

        {state.message && !state.ok && <FormAlert ok={false} message={state.message} />}

        <SubmitButton pending={pending} pendingLabel="Verifying…" className="w-full">
          Verify &amp; continue
        </SubmitButton>
      </form>

      <form action={resendAction} className="rounded-2xl border border-[#dfece3] bg-[#f6faf7] p-4 text-center text-sm">
        <input type="hidden" name="email" value={email} />
        <p className="text-[#3f5649]">
          Didn’t get it? Check spam or promotions. The code expires in 10 minutes.
        </p>
        <button
          type="submit"
          disabled={resending || cooldown > 0}
          className="fb-press mt-3 rounded-full border-2 border-[#cce2d4] bg-white px-4 py-2 text-[13px] font-bold tabular-nums text-[#14522f] transition hover:border-[#1a663b] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {resending ? 'Sending…' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
        {resendState.message && (
          <p role="status" className={`mt-2 text-[13px] font-semibold ${resendState.ok ? 'text-[#1a663b]' : 'text-red-600'}`}>
            {resendState.message}
          </p>
        )}
      </form>
    </div>
  );
}
