'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
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
  const [digits, setDigits] = useState<string[]>(() => Array(LENGTH).fill(''));
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  // A failed attempt clears the boxes so the next try starts fresh.
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    if (!state.ok) setDigits(Array(LENGTH).fill(''));
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
    if (!pending) inputs.current[digits.findIndex((d) => !d)]?.focus();
    // Only refocus after a submission settles, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state]);

  const fill = (start: number, raw: string) => {
    const chars = raw.replace(/\D/g, '').slice(0, LENGTH - start).split('');
    if (!chars.length) return;
    const nextDigits = [...digits];
    chars.forEach((c, i) => (nextDigits[start + i] = c));
    setDigits(nextDigits);
    const focusAt = Math.min(start + chars.length, LENGTH - 1);
    inputs.current[focusAt]?.focus();
    if (nextDigits.every(Boolean)) {
      // Let React commit the hidden value before submitting.
      requestAnimationFrame(() => formRef.current?.requestSubmit());
    }
  };

  const code = digits.join('');
  const error = state.fieldErrors?.code;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e8f5ee] text-[#1a663b]">
          <MailCheck className="h-8 w-8" />
        </span>
        <h2 className="mt-4 font-display text-2xl font-bold text-[#112a1d]">Verify your email</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#5a7165]">
          {intro ?? 'Enter the 6-digit code we sent to'}{' '}
          <strong className="text-[#112a1d] break-all">{email}</strong>
        </p>
      </div>

      <form ref={formRef} action={action} className="space-y-5" noValidate>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="code" value={code} />

        <fieldset>
          <legend className="sr-only">Verification code</legend>
          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={d}
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                pattern="[0-9]*"
                maxLength={LENGTH}
                aria-label={`Digit ${i + 1} of ${LENGTH}`}
                aria-invalid={error ? true : undefined}
                disabled={pending}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) {
                    const nextDigits = [...digits];
                    nextDigits[i] = '';
                    setDigits(nextDigits);
                    return;
                  }
                  fill(i, v.slice(-LENGTH));
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  fill(0, e.clipboardData.getData('text'));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
                  if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus();
                  if (e.key === 'ArrowRight' && i < LENGTH - 1) inputs.current[i + 1]?.focus();
                }}
                onFocus={(e) => e.target.select()}
                className={`h-14 w-11 sm:h-16 sm:w-13 rounded-2xl border-2 bg-[#f6faf7] text-center font-display text-2xl font-bold text-[#112a1d] transition focus:bg-white focus:outline-none disabled:opacity-60 ${
                  error ? 'border-red-300 focus:border-red-500' : d ? 'border-[#1a663b]' : 'border-[#cfe3d6] focus:border-[#1a663b]'
                }`}
              />
            ))}
          </div>
        </fieldset>

        {state.message && !state.ok && <FormAlert ok={false} message={state.message} />}

        <SubmitButton pending={pending} pendingLabel="Verifying…" className="w-full">
          Verify &amp; continue
        </SubmitButton>
      </form>

      <form action={resendAction} className="rounded-2xl border border-[#dfece3] bg-[#f6faf7] p-4 text-center text-sm">
        <input type="hidden" name="email" value={email} />
        <p className="text-[#5a7165]">
          Didn’t get it? Check spam or promotions. The code expires in 10 minutes.
        </p>
        <button
          type="submit"
          disabled={resending || cooldown > 0}
          className="mt-3 rounded-full border-2 border-[#cce2d4] bg-white px-4 py-1.5 text-xs font-bold text-[#14522f] transition hover:border-[#1a663b] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {resending ? 'Sending…' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
        {resendState.message && (
          <p role="status" className={`mt-2 text-xs font-semibold ${resendState.ok ? 'text-[#1a663b]' : 'text-red-600'}`}>
            {resendState.message}
          </p>
        )}
      </form>
    </div>
  );
}
