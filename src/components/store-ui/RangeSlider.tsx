'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cx } from '@/components/ui/overlay';

/**
 * Dual-thumb range slider (two role="slider" thumbs on one track).
 *
 * ```tsx
 * <RangeSlider min={0} max={1200} step={10} value={[lo, hi]}
 *   onValueChange={setRange} onValueCommit={apply} formatValue={formatBDT} label="Price" />
 * ```
 * - Pointer: press anywhere on the track to grab the nearest thumb, drag.
 * - Keyboard: ←/→/↑/↓ step, PageUp/PageDown ×10, Home/End to the bounds.
 * - `onValueCommit` fires once per gesture (pointer up / key press), so a
 *   listing only refetches when the shopper lets go.
 */
export interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  onValueCommit?: (value: [number, number]) => void;
  /** Used for aria-valuetext ("৳120"). */
  formatValue?: (n: number) => string;
  /** Accessible group label, e.g. "Price range". */
  label: string;
  disabled?: boolean;
  className?: string;
}

export function RangeSlider({ min, max, step = 1, value, onValueChange, onValueCommit, formatValue = String, label, disabled, className }: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<0 | 1 | null>(null);
  // Latest value, also updated synchronously inside gestures (several pointer
  // moves can arrive before the parent re-renders with the new value).
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const span = Math.max(1, max - min);
  const pct = (n: number) => ((Math.min(max, Math.max(min, n)) - min) / span) * 100;
  const snap = (n: number) => Math.min(max, Math.max(min, Math.round((n - min) / step) * step + min));

  const fromPointer = (clientX: number) => {
    const r = trackRef.current!.getBoundingClientRect();
    return snap(min + ((clientX - r.left) / r.width) * span);
  };

  const update = (thumb: 0 | 1, n: number) => {
    const [lo, hi] = latest.current;
    const next: [number, number] = thumb === 0 ? [Math.min(n, hi), hi] : [lo, Math.max(n, lo)];
    if (next[0] !== lo || next[1] !== hi) onValueChange(next);
    latest.current = next;
    return next;
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    const n = fromPointer(e.clientX);
    const [lo, hi] = latest.current;
    // Nearest thumb; when both sit on the same spot, pick by direction.
    const thumb: 0 | 1 = Math.abs(n - lo) < Math.abs(n - hi) ? 0 : Math.abs(n - lo) > Math.abs(n - hi) ? 1 : n < lo ? 0 : 1;
    setDrag(thumb);
    update(thumb, n);
    e.currentTarget.setPointerCapture(e.pointerId);
    (e.currentTarget.querySelectorAll<HTMLElement>('[role="slider"]')[thumb])?.focus({ preventScroll: true });
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag === null) return;
    update(drag, fromPointer(e.clientX));
  };

  const endDrag = () => {
    if (drag === null) return;
    setDrag(null);
    onValueCommit?.(latest.current);
  };

  const onKey = (thumb: 0 | 1) => (e: KeyboardEvent) => {
    const current = latest.current[thumb];
    const big = Math.max(step, Math.round(span / 10 / step) * step);
    let n: number | undefined;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') n = current + step;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') n = current - step;
    else if (e.key === 'PageUp') n = current + big;
    else if (e.key === 'PageDown') n = current - big;
    else if (e.key === 'Home') n = min;
    else if (e.key === 'End') n = max;
    if (n === undefined) return;
    e.preventDefault();
    onValueCommit?.(update(thumb, snap(n)));
  };

  const [lo, hi] = value;

  return (
    <div role="group" aria-label={label} className={cx('px-2.5 py-3', disabled && 'opacity-50', className)}>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cx('relative h-1.5 touch-none select-none rounded-full bg-[#dcebe2]', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
      >
        <div className="absolute inset-y-0 rounded-full bg-[#1a663b]" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        {([lo, hi] as const).map((v, i) => {
          const thumb = i as 0 | 1;
          return (
            <div
              key={i}
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-label={thumb === 0 ? 'Minimum price' : 'Maximum price'}
              aria-valuemin={thumb === 0 ? min : lo}
              aria-valuemax={thumb === 0 ? hi : max}
              aria-valuenow={v}
              aria-valuetext={formatValue(v)}
              aria-disabled={disabled || undefined}
              onKeyDown={onKey(thumb)}
              className={cx(
                'absolute top-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[#1a663b] bg-white shadow-md outline-none transition-[box-shadow,transform] duration-150',
                'hover:scale-110 focus-visible:ring-4 focus-visible:ring-[#1a663b]/25',
                drag === thumb && 'scale-110 ring-4 ring-[#1a663b]/20',
                // Keep the upper thumb reachable when both thumbs meet at the max.
                thumb === 0 && lo >= max - step ? 'z-20' : 'z-10'
              )}
              style={{ left: `${pct(v)}%` }}
            >
              <span aria-hidden className="h-2 w-2 rounded-full bg-[#1a663b]" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
