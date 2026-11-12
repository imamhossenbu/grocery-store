'use client';

import { useLayoutEffect, useRef } from 'react';
import { animate } from 'motion/react';

/**
 * Number that counts up from 0 once it mounts. The server renders the final
 * value (so no-JS and screen readers get the real number immediately); the
 * animation only rewrites the visible text and is skipped under
 * prefers-reduced-motion.
 *
 * ```tsx
 * <CountUp value={1240} format="bdt" />   // ৳1,240
 * <CountUp value={12} />
 * ```
 */
const FORMATS = {
  number: (n: number) => Math.round(n).toLocaleString('en-IN'),
  bdt: (n: number) => `৳${Math.round(n).toLocaleString('en-IN')}`,
};

export function CountUp({ value, format = 'number', duration = 800, className }: { value: number; format?: keyof typeof FORMATS; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = FORMATS[format];

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || value <= 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.textContent = fmt(0);
    const controls = animate(0, value, {
      duration: duration / 1000,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => {
        el.textContent = fmt(v);
      },
    });
    return () => {
      controls.stop();
      el.textContent = fmt(value);
    };
  }, [value, duration, fmt]);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        {fmt(value)}
      </span>
      <span className="sr-only">{fmt(value)}</span>
    </span>
  );
}
