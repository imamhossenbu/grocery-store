'use client';

import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';

export const inputClass =
  'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-[#112a1d] placeholder-[#93a99c] shadow-sm transition focus:outline-none focus:ring-4 disabled:bg-[#f4f8f5] disabled:text-[#7e9688]';

function stateClass(error?: string) {
  return error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
    : 'border-[#d3e5da] focus:border-[#1a663b] focus:ring-[#1a663b]/10';
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
}

export function TextField({ label, name, error, hint, optional, className = '', id, 'aria-describedby': describedBy, ...props }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? `${name}-${autoId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className={className}>
      <FieldLabel htmlFor={inputId} label={label} optional={optional} />
      <input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={[errorId, hintId, describedBy].filter(Boolean).join(' ') || undefined}
        className={`${inputClass} ${stateClass(error)}`}
        {...props}
      />
      <FieldFooter hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  );
}

export function PasswordField({ label, name, error, hint, className = '', id, 'aria-describedby': describedBy, ...props }: Omit<FieldProps, 'type'>) {
  const autoId = useId();
  const inputId = id ?? `${name}-${autoId}`;
  const [visible, setVisible] = useState(false);
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className={className}>
      <FieldLabel htmlFor={inputId} label={label} />
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId, describedBy].filter(Boolean).join(' ') || undefined}
          className={`${inputClass} ${stateClass(error)} pr-12`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-1.5 my-auto grid h-9 w-9 place-items-center rounded-full text-[#5a7165] transition hover:bg-[#f0f7f2] hover:text-[#1a663b] cursor-pointer"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <FieldFooter hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  );
}

export function FieldLabel({ htmlFor, label, optional }: { htmlFor: string; label: string; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-center justify-between text-sm font-semibold text-[#234835]">
      <span>{label}</span>
      {optional && <span className="text-xs font-medium text-[#7e9688]">Optional</span>}
    </label>
  );
}

export function FieldFooter({ hint, hintId, error, errorId }: { hint?: ReactNode; hintId?: string; error?: string; errorId?: string }) {
  return (
    <>
      {error && (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-[#5a7165]">{hint}</p>
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
