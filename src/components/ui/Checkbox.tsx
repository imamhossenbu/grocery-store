'use client';

import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Check, Minus } from 'lucide-react';
import { cx } from './overlay';

/**
 * Brand checkbox. A real (visually hidden) <input type="checkbox"> keeps
 * native form submission, labels and keyboard; the box is drawn on top.
 *
 * ```tsx
 * <Checkbox name="newsletter" defaultChecked label="Email me deals" description="Max once a week." />
 * <Checkbox checked={all} indeterminate={some} onCheckedChange={setAll} label="Select all" />
 * ```
 */
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: ReactNode;
  description?: ReactNode;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({ label, description, indeterminate, onCheckedChange, onChange, className, id, disabled, ...props }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descId = description ? `${inputId}-desc` : undefined;
  return (
    <label htmlFor={inputId} className={cx('group inline-flex items-start gap-3', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer', className)}>
      <span className="relative mt-0.5 grid h-5 w-5 shrink-0 place-items-center">
        <input
          id={inputId}
          type="checkbox"
          disabled={disabled}
          aria-describedby={descId}
          aria-checked={indeterminate ? 'mixed' : undefined}
          onChange={(e) => {
            onChange?.(e);
            onCheckedChange?.(e.target.checked);
          }}
          className="peer absolute inset-0 m-0 cursor-[inherit] appearance-none rounded-md border-2 border-[#b9d3c3] bg-white transition checked:border-[#1a663b] checked:bg-[#1a663b] group-hover:border-[#1a663b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1a663b]/20"
          {...props}
        />
        {indeterminate ? (
          <Minus aria-hidden className="pointer-events-none relative h-3.5 w-3.5 text-[#1a663b] peer-checked:text-white" strokeWidth={3.5} />
        ) : (
          <Check aria-hidden className="pointer-events-none relative h-3.5 w-3.5 scale-50 text-white opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100" strokeWidth={3.5} />
        )}
      </span>
      {(label || description) && (
        <span className="min-w-0 text-sm">
          {label && <span className="block font-semibold text-[#112a1d]">{label}</span>}
          {description && <span id={descId} className="mt-0.5 block text-[#3f5649]">{description}</span>}
        </span>
      )}
    </label>
  );
}
