'use client';

import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cx } from './overlay';

/**
 * Hover / focus tooltip. The child must be a single focusable element; it
 * receives aria-describedby pointing at the tooltip. Escape hides it.
 * Use it for supplementary text only — never for essential information.
 *
 * ```tsx
 * <Tooltip content="Collapse sidebar"><button aria-label="Collapse sidebar">…</button></Tooltip>
 * ```
 */
export interface TooltipProps {
  content: ReactNode;
  children: ReactElement<{ 'aria-describedby'?: string }>;
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay before showing on hover, ms (focus shows immediately). */
  delay?: number;
  /** Don't render the tooltip at all (e.g. when a visible label already says it). */
  disabled?: boolean;
  className?: string;
}

const SIDE = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
};

export function Tooltip({ content, children, side = 'top', delay = 250, disabled, className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (disabled || !isValidElement(children)) return children;

  const show = (wait: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), wait);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };

  const describedBy = [children.props['aria-describedby'], open ? id : undefined].filter(Boolean).join(' ') || undefined;

  return (
    <span
      className={cx('relative inline-flex', className)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && show(delay)}
      onPointerLeave={hide}
      onFocus={(e) => (e.target as HTMLElement).matches(':focus-visible') && show(0)}
      onBlur={hide}
    >
      {cloneElement(children, { 'aria-describedby': describedBy })}
      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.12 } }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            className={cx(
              'pointer-events-none absolute z-[75] w-max max-w-[16rem] rounded-xl bg-[#0f2c1d] px-3 py-1.5 text-[13px] font-semibold leading-snug text-white shadow-card',
              SIDE[side]
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
