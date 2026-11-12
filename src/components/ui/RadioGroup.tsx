'use client';

import { useId, useState, type ReactNode } from 'react';
import { cx } from './overlay';

/**
 * Radio group built on real (hidden) radio inputs, so forms submit normally
 * and arrow keys work natively. Two looks:
 *  - variant="card": selectable cards (payment method, delivery slot…)
 *  - variant="list": compact rows with a custom dot
 *
 * ```tsx
 * <RadioGroup name="payment" legend="Payment method" defaultValue="cod" variant="card" columns={2}
 *   options={[{ value: 'cod', label: 'Cash on delivery', description: 'Pay the rider', icon: <Banknote/> }]} />
 * ```
 */
export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  legend?: ReactNode;
  /** Hide the legend visually (kept for screen readers). */
  hideLegend?: boolean;
  variant?: 'card' | 'list';
  columns?: 1 | 2 | 3;
  required?: boolean;
  invalid?: boolean;
  className?: string;
}

const COLS = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' };

export function RadioGroup({
  name,
  options,
  value: controlled,
  defaultValue,
  onValueChange,
  legend,
  hideLegend,
  variant = 'card',
  columns = 1,
  required,
  invalid,
  className,
}: RadioGroupProps) {
  const id = useId();
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;

  return (
    <fieldset className={className} aria-invalid={invalid || undefined}>
      {legend && <legend className={cx('mb-2 text-sm font-semibold text-[#234835]', hideLegend && 'sr-only')}>{legend}</legend>}
      <div className={cx('grid gap-2.5', COLS[columns])}>
        {options.map((opt) => {
          const optId = `${id}-${opt.value}`;
          const checked = value === opt.value;
          return (
            <label
              key={opt.value}
              htmlFor={optId}
              className={cx(
                'group relative flex items-start gap-3 transition',
                opt.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                variant === 'card' &&
                  cx(
                    'rounded-2xl border-2 bg-white p-4 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#1a663b]/15',
                    checked ? 'border-[#1a663b] bg-[#f3faf6] shadow-soft' : invalid ? 'border-red-200' : 'border-[#dfece3] hover:border-[#a9cdb7]'
                  ),
                variant === 'list' && 'rounded-xl px-1 py-1.5'
              )}
            >
              <input
                id={optId}
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                disabled={opt.disabled}
                required={required}
                onChange={() => {
                  if (controlled === undefined) setInner(opt.value);
                  onValueChange?.(opt.value);
                }}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={cx(
                  'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition',
                  checked ? 'border-[#1a663b]' : 'border-[#b9d3c3] group-hover:border-[#1a663b]',
                  variant === 'list' && 'peer-focus-visible:ring-4 peer-focus-visible:ring-[#1a663b]/20'
                )}
              >
                <span className={cx('h-2.5 w-2.5 rounded-full bg-[#1a663b] transition', checked ? 'scale-100' : 'scale-0')} />
              </span>
              {opt.icon && <span aria-hidden className="mt-0.5 shrink-0 text-[#1a663b] [&>svg]:h-5 [&>svg]:w-5">{opt.icon}</span>}
              <span className="min-w-0 text-sm">
                <span className="block font-bold text-[#112a1d]">{opt.label}</span>
                {opt.description && <span className="mt-0.5 block text-[#3f5649]">{opt.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
