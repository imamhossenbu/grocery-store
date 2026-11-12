'use client';

import { useId, useState } from 'react';
import { Star } from 'lucide-react';
import { cx } from './overlay';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/**
 * 1–5 star rating input built on hidden radio inputs (submits `name=<n>`,
 * arrow keys move between stars natively).
 *
 * ```tsx
 * <RatingInput name="rating" legend="Your rating" value={rating} onValueChange={setRating} error={err.rating} />
 * ```
 */
export function RatingInput({
  name,
  legend = 'Your rating',
  value,
  onValueChange,
  error,
  size = 'md',
}: {
  name: string;
  legend?: string;
  value: number;
  onValueChange: (v: number) => void;
  error?: string;
  size?: 'sm' | 'md';
}) {
  const id = useId();
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset aria-describedby={error ? `${id}-err` : undefined}>
      <legend className="text-sm font-bold text-[#112a1d]">{legend}</legend>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
              <input
                type="radio"
                name={name}
                value={n}
                checked={value === n}
                onChange={() => onValueChange(n)}
                className="peer sr-only"
                aria-label={`${n} star${n > 1 ? 's' : ''} — ${LABELS[n]}`}
              />
              <Star
                aria-hidden
                className={cx(
                  'rounded transition-transform duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-[#1a663b] peer-active:scale-90',
                  size === 'sm' ? 'h-6 w-6' : 'h-8 w-8',
                  n <= shown ? 'fill-[#f5b82e] text-[#f5b82e]' : 'text-[#cfd9d2]',
                  n === hover && 'scale-110'
                )}
              />
            </label>
          ))}
        </div>
        <span className="text-sm font-semibold text-[#3f5649]" aria-hidden>{LABELS[shown]}</span>
      </div>
      {error && <p id={`${id}-err`} className="mt-1 text-[13px] font-semibold text-red-600">{error}</p>}
    </fieldset>
  );
}
