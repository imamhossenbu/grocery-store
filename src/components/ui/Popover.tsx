'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { popupMotion } from './motion';
import { cx, preferredSide, useDismissableLayer, useFocusTrap } from './overlay';

/**
 * Click-to-open non-modal panel anchored to a trigger button (filters,
 * mini forms, info cards). Esc / outside click close it; focus moves into
 * the panel and returns to the trigger.
 *
 * ```tsx
 * <Popover label="Filters" trigger={<><SlidersHorizontal className="h-4 w-4" /> Filters</>}>
 *   {({ close }) => <FilterForm onDone={close} />}
 * </Popover>
 * ```
 */
export interface PopoverProps {
  trigger: ReactNode;
  /** Accessible name for the trigger / panel. */
  label: string;
  children: ReactNode | ((api: { close: () => void }) => ReactNode);
  align?: 'start' | 'end';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerClassName?: string;
  className?: string;
}

export function Popover({ trigger, label, children, align = 'start', open: controlled, onOpenChange, triggerClassName, className }: PopoverProps) {
  const id = useId();
  const [inner, setInner] = useState(false);
  const open = controlled ?? inner;
  const [side, setSide] = useState<'top' | 'bottom'>('bottom');
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    if (controlled === undefined) setInner(false);
    onOpenChange?.(false);
  };
  const toggle = () => {
    if (open) return close();
    setSide(preferredSide(buttonRef.current, 320));
    if (controlled === undefined) setInner(true);
    onOpenChange?.(true);
  };

  useDismissableLayer(rootRef, open, close);
  useFocusTrap(panelRef, open);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? `${id}-panel` : undefined}
        aria-haspopup="dialog"
        onClick={toggle}
        className={
          triggerClassName ??
          'inline-flex h-10 items-center gap-2 rounded-full border border-[#d3e5da] bg-white px-4 text-sm font-semibold text-[#234835] transition hover:border-[#1a663b] cursor-pointer'
        }
      >
        {trigger}
      </button>
      <AnimatePresence>
      {open && (
        <motion.div
          {...popupMotion(side)}
          ref={panelRef}
          id={`${id}-panel`}
          role="dialog"
          aria-label={label}
          tabIndex={-1}
          className={cx(
            'absolute z-[70] w-72 rounded-2xl border border-[#dfece3] bg-white p-4 shadow-card outline-none',
            align === 'end' ? 'right-0' : 'left-0',
            side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
            className
          )}
        >
          {typeof children === 'function' ? children({ close }) : children}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
