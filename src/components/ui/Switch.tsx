'use client';

import { useId, useState, type ReactNode } from 'react';
import { cx } from './overlay';

/**
 * On/off switch (role="switch"). With `name` it also submits "on"/"" in forms.
 *
 * ```tsx
 * <Switch label="Compact sidebar" checked={collapsed} onCheckedChange={setCollapsed} />
 * ```
 */
export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  name?: string;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'md';
  id?: string;
  className?: string;
  'aria-label'?: string;
}

export function Switch({ checked: controlled, defaultChecked = false, onCheckedChange, name, label, description, disabled, size = 'md', id, className, ...rest }: SwitchProps) {
  const autoId = useId();
  const switchId = id ?? autoId;
  const [inner, setInner] = useState(defaultChecked);
  const checked = controlled ?? inner;
  const sm = size === 'sm';

  const toggle = () => {
    if (disabled) return;
    if (controlled === undefined) setInner(!checked);
    onCheckedChange?.(!checked);
  };

  return (
    <div className={cx('flex items-start gap-3', className)}>
      {name && <input type="hidden" name={name} value={checked ? 'on' : ''} />}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={rest['aria-label']}
        aria-describedby={description ? `${switchId}-desc` : undefined}
        disabled={disabled}
        onClick={toggle}
        className={cx(
          'relative shrink-0 rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1a663b]/20',
          sm ? 'h-5 w-9' : 'h-6 w-11',
          checked ? 'bg-[#1a663b]' : 'bg-[#cfdfd5]'
        )}
      >
        <span
          aria-hidden
          className={cx(
            'absolute left-0.5 top-0.5 rounded-full bg-white shadow-md transition-transform',
            sm ? 'h-4 w-4' : 'h-5 w-5',
            checked && (sm ? 'translate-x-4' : 'translate-x-5')
          )}
        />
      </button>
      {(label || description) && (
        <div className="min-w-0 text-sm">
          {label && (
            <label htmlFor={switchId} className="block font-semibold text-[#112a1d] cursor-pointer">
              {label}
            </label>
          )}
          {description && <p id={`${switchId}-desc`} className="mt-0.5 text-[#3f5649]">{description}</p>}
        </div>
      )}
    </div>
  );
}
