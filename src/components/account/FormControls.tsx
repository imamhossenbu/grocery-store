'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Field, Input, PasswordInput } from '@/components/ui/Field';

export const inputClass =
  'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-[#112a1d] placeholder-[#93a99c] shadow-sm transition focus:outline-none focus:ring-4 disabled:bg-[#f4f8f5] disabled:text-[#3f5649]';

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  label: string;
  name: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
}

/** Text input with label, hint and error — built on ui/Field + ui/Input. */
export function TextField({ label, name, error, hint, optional, className = '', id, required, 'aria-describedby': describedBy, ...props }: FieldProps) {
  return (
    <Field label={label} id={id} required={required} optional={optional} hint={hint} error={error} className={className}>
      {({ state, 'aria-describedby': d, ...p }) => (
        <Input name={name} required={required} state={state} aria-describedby={[d, describedBy].filter(Boolean).join(' ') || undefined} {...p} {...props} />
      )}
    </Field>
  );
}

/** Password input with show/hide — built on ui/Field + ui/PasswordInput. */
export function PasswordField({ label, name, error, hint, className = '', id, required, 'aria-describedby': describedBy, ...props }: Omit<FieldProps, 'type'>) {
  return (
    <Field label={label} id={id} required={required} hint={hint} error={error} className={className}>
      {({ state, 'aria-describedby': d, ...p }) => (
        <PasswordInput name={name} required={required} state={state} aria-describedby={[d, describedBy].filter(Boolean).join(' ') || undefined} {...p} {...props} />
      )}
    </Field>
  );
}

export function FieldLabel({ htmlFor, label, optional }: { htmlFor: string; label: string; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-center justify-between text-sm font-semibold text-[#234835]">
      <span>{label}</span>
      {optional && <span className="text-[13px] font-medium text-[#3f5649]">Optional</span>}
    </label>
  );
}

export function FieldFooter({ hint, hintId, error, errorId }: { hint?: ReactNode; hintId?: string; error?: string; errorId?: string }) {
  return (
    <>
      {error && (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-[13px] text-[#3f5649]">{hint}</p>
      )}
    </>
  );
}

export function FormAlert({ ok, message, className = '' }: { ok: boolean; message: string; className?: string }) {
  if (!message) return null;
  return (
    <div
      role={ok ? 'status' : 'alert'}
      className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm ${
        ok ? 'border-[#bce3cb] bg-[#effaf3] text-[#145732]' : 'border-red-200 bg-red-50 text-red-700'
      } ${className}`}
    >
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

/**
 * Centered result panel for the auth flows (link sent, password updated,
 * link expired). Same header layout as OtpVerifyForm.
 */
export function AuthNotice({
  icon,
  tone = 'success',
  title,
  children,
  note,
  action,
}: {
  icon: ReactNode;
  tone?: 'success' | 'warning';
  title: string;
  children: ReactNode;
  note?: ReactNode;
  action?: { href: string; label: string; primary?: boolean };
}) {
  return (
    <div className="space-y-6 text-center">
      <div>
        <span
          className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl [&>svg]:h-8 [&>svg]:w-8 ${
            tone === 'success' ? 'bg-[#e8f5ee] text-[#1a663b]' : 'bg-amber-50 text-amber-700'
          }`}
          aria-hidden
        >
          {icon}
        </span>
        <h2 className="mt-4 font-display text-2xl font-bold text-[#112a1d]">{title}</h2>
        <div role="status" className="mt-2 text-sm leading-relaxed text-[#3f5649]">{children}</div>
      </div>
      {note && <p className="rounded-2xl border border-[#dfece3] bg-[#f6faf7] p-4 text-sm text-[#3f5649]">{note}</p>}
      {action && (
        <Link
          href={action.href}
          className={
            action.primary
              ? 'inline-flex h-12 w-full items-center justify-center rounded-full bg-emerald-gradient px-6 text-sm font-bold text-white shadow-glow transition hover:brightness-105'
              : 'fb-press inline-flex h-11 items-center justify-center rounded-full border-2 border-[#cce2d4] bg-white px-5 text-sm font-bold text-[#14522f] transition hover:border-[#1a663b]'
          }
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function SubmitButton({ pending, children, pendingLabel, className = '' }: { pending: boolean; children: ReactNode; pendingLabel: string; className?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-gradient px-6 text-sm font-bold text-white shadow-glow transition hover:brightness-105 active:scale-[0.99] disabled:opacity-70 cursor-pointer disabled:cursor-wait ${className}`}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? pendingLabel : children}
    </button>
  );
}
