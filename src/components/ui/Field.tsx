'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Minus, Plus, Search, Smartphone, X } from 'lucide-react';
import { cx } from './overlay';

/* ===========================================================================
 * The input system. Every text-like control in the app is built from these.
 *
 *   <Field label="Mobile number" required hint="…" error={err.phone}>
 *     {(p) => <PhoneInput name="phone" {...p} />}
 *   </Field>
 *
 * `Field` owns the label, required/optional mark, hint, error (with icon)
 * and an optional counter, and hands the control the ids + aria wiring via
 * a render prop. Controls (Input, Textarea, PasswordInput, PhoneInput,
 * SearchInput, QuantityStepper, OtpInput) also work on their own.
 * All of them are plain form elements underneath, so server actions with
 * useActionState and no-JS submits keep working.
 * ========================================================================= */

export type FieldState = 'default' | 'error' | 'success';

export interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  'aria-required'?: true;
  state: FieldState;
}

export interface FieldProps {
  label: ReactNode;
  /** Render prop receiving id / aria props / state for the control. */
  children: (control: FieldControlProps) => ReactNode;
  id?: string;
  required?: boolean;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  success?: string;
  /** e.g. `${value.length}/500` — shown at the right of the footer. */
  counter?: ReactNode;
  /** Visually hide the label (still announced). */
  hideLabel?: boolean;
  className?: string;
}

export function Field({ label, children, id, required, optional, hint, error, success, counter, hideLabel, className }: FieldProps) {
  const autoId = useId();
  const controlId = id ?? `f-${autoId}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const msgId = error || success ? `${controlId}-msg` : undefined;
  const state: FieldState = error ? 'error' : success ? 'success' : 'default';

  return (
    <div className={className}>
      <label htmlFor={controlId} className={cx('mb-1.5 flex items-center justify-between gap-2 text-sm font-semibold text-[#234835]', hideLabel && 'sr-only')}>
        <span>
          {label}
          {required && <span className="ml-0.5 text-red-600" aria-hidden>*</span>}
        </span>
        {optional && <span className="text-[13px] font-medium text-[#3f5649]">Optional</span>}
      </label>
      {children({
        id: controlId,
        'aria-describedby': [msgId, hintId].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
        state,
      })}
      <FieldMessage hint={hint} hintId={hintId} error={error} success={success} msgId={msgId} counter={counter} />
    </div>
  );
}

export function FieldMessage({ hint, hintId, error, success, msgId, counter }: { hint?: ReactNode; hintId?: string; error?: string; success?: string; msgId?: string; counter?: ReactNode }) {
  if (!hint && !error && !success && counter === undefined) return null;
  return (
    <div className="mt-1.5 flex items-start justify-between gap-3 text-[13px] leading-snug">
      <div className="min-w-0">
        {error ? (
          <p id={msgId} className="flex items-start gap-1.5 font-semibold text-red-700">
            <AlertCircle className="mt-px h-4 w-4 shrink-0" aria-hidden /> {error}
          </p>
        ) : success ? (
          <p id={msgId} className="flex items-start gap-1.5 font-semibold text-[#145732]">
            <CheckCircle2 className="mt-px h-4 w-4 shrink-0" aria-hidden /> {success}
          </p>
        ) : null}
        {hint && !error && <p id={hintId} className={cx('text-[#3f5649]', success && 'mt-0.5')}>{hint}</p>}
      </div>
      {counter !== undefined && <span className="shrink-0 tabular-nums text-[#3f5649]">{counter}</span>}
    </div>
  );
}

/* ---------------------------------------------------------------- styles */

const SIZES = { sm: 'h-10 text-sm', md: 'h-12 text-[15px]', lg: 'h-14 text-base' };

/** Shell classes shared by every boxed control (exported for custom controls). */
export function controlShell(state: FieldState = 'default', disabled?: boolean) {
  return cx(
    'flex w-full items-center rounded-2xl border bg-white shadow-sm transition-[border-color,box-shadow] duration-150',
    'focus-within:ring-4',
    state === 'error'
      ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-100'
      : state === 'success'
        ? 'border-[#7fc29a] focus-within:border-[#1a663b] focus-within:ring-[#1a663b]/12'
        : 'border-[#cfe0d6] hover:border-[#a9cdb7] focus-within:border-[#1a663b] focus-within:ring-[#1a663b]/12',
    disabled && 'pointer-events-none bg-[#f4f8f5] opacity-70'
  );
}

const bareInput =
  'h-full min-w-0 flex-1 bg-transparent text-[#112a1d] placeholder:text-[#7e9688] outline-none disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:appearance-none [&::-ms-clear]:hidden';

/* ----------------------------------------------------------------- Input */

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  state?: FieldState;
  size?: keyof typeof SIZES;
  /** Icon inside the box, left. */
  leadingIcon?: ReactNode;
  /** Icon or button inside the box, right. */
  trailing?: ReactNode;
  /** Static text before the value, e.g. "৳" or "+880". */
  prefix?: ReactNode;
  /** Static text after the value, e.g. "kg". */
  suffix?: ReactNode;
  className?: string;
  inputClassName?: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({ state = 'default', size = 'md', leadingIcon, trailing, prefix, suffix, className, inputClassName, disabled, ref, ...props }: InputProps) {
  const showState = state === 'success' && !trailing;
  return (
    <div className={cx(controlShell(state, disabled), SIZES[size], 'gap-2 px-3.5', className)}>
      {leadingIcon && <span aria-hidden className="shrink-0 text-[#3f5649] [&>svg]:h-[18px] [&>svg]:w-[18px]">{leadingIcon}</span>}
      {prefix && <span className="shrink-0 border-r border-[#e1ece5] pr-2.5 font-semibold text-[#3f5649]">{prefix}</span>}
      <input ref={ref} disabled={disabled} className={cx(bareInput, inputClassName)} {...props} />
      {suffix && <span className="shrink-0 font-semibold text-[#3f5649]">{suffix}</span>}
      {showState && <CheckCircle2 aria-hidden className="h-[18px] w-[18px] shrink-0 text-[#1a663b]" />}
      {state === 'error' && !trailing && <AlertCircle aria-hidden className="h-[18px] w-[18px] shrink-0 text-red-500" />}
      {trailing}
    </div>
  );
}

/* -------------------------------------------------------------- Textarea */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  state?: FieldState;
  /** Grow with content between minRows and maxRows. */
  autosize?: boolean;
  minRows?: number;
  maxRows?: number;
}

export function Textarea({ state = 'default', autosize = true, minRows = 3, maxRows = 12, className, onChange, value, defaultValue, ...props }: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = () => {
    const el = ref.current;
    if (!el || !autosize) return;
    el.style.height = 'auto';
    const line = parseFloat(getComputedStyle(el).lineHeight) || 22;
    const pad = 24;
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minRows * line + pad), maxRows * line + pad)}px`;
  };
  useLayoutEffect(resize);
  return (
    <div className={cx(controlShell(state, props.disabled), 'px-0', className)}>
      <textarea
        ref={ref}
        rows={minRows}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => {
          onChange?.(e);
          resize();
        }}
        className={cx('fb-scroll w-full resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed text-[#112a1d] placeholder:text-[#7e9688] outline-none', !autosize && 'resize-y')}
        {...props}
      />
    </div>
  );
}

/* --------------------------------------------------------- PasswordInput */

export function PasswordInput({ size = 'md', ...props }: Omit<InputProps, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      {...props}
      size={size}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="-mr-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#3f5649] transition hover:bg-[#f0f7f2] hover:text-[#1a663b] cursor-pointer"
        >
          {visible ? <EyeOff className="h-[18px] w-[18px]" aria-hidden /> : <Eye className="h-[18px] w-[18px]" aria-hidden />}
        </button>
      }
    />
  );
}

/* ------------------------------------------------------------ PhoneInput */

/** "01712345678" -> "01712-345678" (display only; the server normalises). */
function formatBdPhone(raw: string) {
  const d = raw.replace(/\D/g, '').replace(/^880/, '0').slice(0, 11);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Bangladeshi mobile number (01XXX-XXXXXX formatting, +880 accepted and folded to 0). */
export function PhoneInput({ defaultValue, value, onChange, ...props }: Omit<InputProps, 'type' | 'prefix'>) {
  const [inner, setInner] = useState(() => formatBdPhone(String(defaultValue ?? '')));
  const shown = value !== undefined ? formatBdPhone(String(value)) : inner;
  return (
    <Input
      {...props}
      type="tel"
      inputMode="tel"
      autoComplete={props.autoComplete ?? 'tel-national'}
      placeholder={props.placeholder ?? '01XXX-XXXXXX'}
      maxLength={14}
      leadingIcon={props.leadingIcon ?? <Smartphone />}
      value={shown}
      onChange={(e) => {
        const next = formatBdPhone(e.target.value);
        if (value === undefined) setInner(next);
        e.target.value = next;
        onChange?.(e);
      }}
      inputClassName="tabular-nums tracking-wide"
    />
  );
}

/* ----------------------------------------------------------- SearchInput */

export interface SearchInputProps extends Omit<InputProps, 'type' | 'onChange' | 'value' | 'defaultValue'> {
  value: string;
  /** Called on every keystroke. */
  onValueChange: (value: string) => void;
  /** Called after `debounce` ms of no typing (and immediately on clear). */
  onDebouncedChange?: (value: string) => void;
  debounce?: number;
}

export function SearchInput({ value, onValueChange, onDebouncedChange, debounce = 250, size = 'sm', className, ...props }: SearchInputProps) {
  const cb = useRef(onDebouncedChange);
  useEffect(() => {
    cb.current = onDebouncedChange;
  });
  useEffect(() => {
    const t = window.setTimeout(() => cb.current?.(value), debounce);
    return () => window.clearTimeout(t);
  }, [value, debounce]);

  return (
    <Input
      {...props}
      type="search"
      size={size}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && value) {
          e.preventDefault();
          onValueChange('');
        }
        props.onKeyDown?.(e);
      }}
      leadingIcon={<Search />}
      className={cx('rounded-full', className)}
      trailing={
        value ? (
          <button
            type="button"
            onClick={() => {
              onValueChange('');
              cb.current?.('');
            }}
            aria-label="Clear search"
            className="-mr-1.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#3f5649] transition hover:bg-[#eef6f1] cursor-pointer fb-anim-fade"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <span className="w-4" aria-hidden />
        )
      }
    />
  );
}

/* ------------------------------------------------------- QuantityStepper */

export interface QuantityStepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Accessible name, e.g. "Quantity of Mango". */
  label: string;
  name?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** −/+ stepper with an editable number (role="spinbutton" semantics via input type=number). */
export function QuantityStepper({ value, onValueChange, min = 0, max = 99, label, name, size = 'md', className }: QuantityStepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? Math.round(n) : min));
  const h = size === 'sm' ? 'h-9' : 'h-11';
  const btn = 'fb-press grid aspect-square h-full place-items-center rounded-full bg-white text-[#112a1d] shadow-sm transition hover:bg-[#1a663b] hover:text-white disabled:pointer-events-none disabled:opacity-40 cursor-pointer';
  return (
    <div className={cx('inline-flex items-center gap-1 rounded-full border border-[#cfe0d6] bg-[#f0f7f2] p-1', h, className)} role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onValueChange(clamp(value - 1))} disabled={value <= min} aria-label="Decrease">
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <input
        type="number"
        name={name}
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        aria-label={label}
        onChange={(e) => onValueChange(clamp(Number(e.target.value)))}
        className="h-full w-10 bg-transparent text-center text-[15px] font-bold tabular-nums text-[#112a1d] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button type="button" className={btn} onClick={() => onValueChange(clamp(value + 1))} disabled={value >= max} aria-label="Increase">
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------- OtpInput */

export interface OtpInputProps {
  length?: number;
  value: string;
  onValueChange: (value: string) => void;
  /** Called once all digits are filled. */
  onComplete?: (value: string) => void;
  /** Submits the joined code under this name. */
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  'aria-label'?: string;
}

/** Segmented one-time-code input: paste-aware, arrow keys, backspace to previous box. */
export function OtpInput({ length = 6, value, onValueChange, onComplete, name, disabled, invalid, autoFocus, ...rest }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const set = (next: string, focus: number) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onValueChange(clean);
    refs.current[Math.min(focus, length - 1)]?.focus();
    if (clean.length === length) onComplete?.(clean);
  };

  return (
    <div role="group" aria-label={rest['aria-label'] ?? `${length}-digit code`} className="flex gap-2 sm:gap-2.5">
      {name && <input type="hidden" name={name} value={value} />}
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          autoFocus={autoFocus && i === 0}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          value={d}
          maxLength={length}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const typed = e.target.value.replace(/\D/g, '');
            if (!typed) return;
            const merged = (value.slice(0, i) + typed + value.slice(i + typed.length)).slice(0, length);
            set(merged, i + typed.length);
          }}
          onPaste={(e: ClipboardEvent<HTMLInputElement>) => {
            e.preventDefault();
            set(e.clipboardData.getData('text'), length - 1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              e.preventDefault();
              if (d) set(value.slice(0, i) + value.slice(i + 1), i);
              else if (i > 0) set(value.slice(0, i - 1) + value.slice(i), i - 1);
            } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
            else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
          }}
          className={cx(
            'h-14 w-11 rounded-2xl border-2 bg-white text-center text-xl font-bold tabular-nums text-[#112a1d] shadow-sm outline-none transition sm:w-12',
            invalid ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' : d ? 'border-[#7fc29a]' : 'border-[#cfe0d6]',
            !invalid && 'focus:border-[#1a663b] focus:ring-4 focus:ring-[#1a663b]/12',
            disabled && 'opacity-60'
          )}
        />
      ))}
    </div>
  );
}
