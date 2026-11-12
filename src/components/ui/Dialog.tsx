'use client';

import { useId, useRef, useSyncExternalStore, type ReactNode, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DURATION, EASE } from './motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx, useDismissableLayer, useFocusTrap, useScrollLock } from './overlay';

/**
 * Accessible, animated modal surface. One component covers centred dialogs,
 * side drawers and bottom sheets.
 *
 * ```tsx
 * <Dialog open={open} onOpenChange={setOpen} title="Edit review" description="…">
 *   …content…
 *   <DialogFooter>…buttons…</DialogFooter>
 * </Dialog>
 * <Dialog open={menu} onOpenChange={setMenu} placement="left" title="Menu" hideTitle>…</Dialog>
 * ```
 *
 * - role="dialog" + aria-modal, labelled by `title`, described by `description`
 * - focus trap (focus moves in, Tab cycles, focus restored on close)
 * - Escape / backdrop click close (topmost layer only), body scroll lock
 * - enter + exit animations with motion/react (reduced motion via <MotionProvider>)
 */
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Visually hide the title (it is still the accessible name). */
  hideTitle?: boolean;
  /** 'center' (default) dialog, 'left' / 'right' drawer, 'bottom' sheet. */
  placement?: 'center' | 'left' | 'right' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Element to focus first (defaults to the first focusable element). */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Close when the backdrop is clicked (default true). */
  dismissible?: boolean;
  /** Show the × button (default true). */
  showClose?: boolean;
  /** role="alertdialog" for confirmations. */
  role?: 'dialog' | 'alertdialog';
  className?: string;
  children?: ReactNode;
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

const PANEL: Record<NonNullable<DialogProps['placement']>, string> = {
  center: 'relative m-auto w-full max-h-[calc(100dvh-2rem)] rounded-[1.75rem]',
  left: 'absolute inset-y-0 left-0 h-full w-[min(22rem,88vw)] rounded-r-[1.75rem]',
  right: 'absolute inset-y-0 right-0 h-full w-[min(26rem,92vw)] rounded-l-[1.75rem]',
  bottom: 'absolute inset-x-0 bottom-0 max-h-[88dvh] w-full rounded-t-[1.75rem]',
};

const PANEL_MOTION = {
  center: { initial: { opacity: 0, y: 14, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 8, scale: 0.98 } },
  left: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
  right: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
  bottom: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } },
};

const subscribeNothing = () => () => {};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  hideTitle,
  placement = 'center',
  size = 'md',
  initialFocus,
  dismissible = true,
  showClose = true,
  role = 'dialog',
  className,
  children,
}: DialogProps) {
  const isClient = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useDismissableLayer(panelRef, open, () => onOpenChange(false), { outsidePress: dismissible });
  useFocusTrap(panelRef, open, { initialFocus });
  useScrollLock(open);

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="dialog"
          className={cx('fixed inset-0 z-[80] flex', placement === 'center' ? 'p-4' : 'p-0')}
          initial={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          transition={{ duration: DURATION.slow }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-[#071a10]/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.base }}
          />
          <motion.div
            ref={panelRef}
            role={role}
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            {...PANEL_MOTION[placement]}
            transition={placement === 'center' ? { duration: DURATION.base, ease: EASE } : { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 }}
            className={cx(
              'flex flex-col overflow-hidden border border-[#dfece3] bg-white shadow-2xl outline-none',
              PANEL[placement],
              placement === 'center' && SIZES[size],
              className
            )}
          >
            <div className={cx('flex items-start gap-4 px-6 pt-6 pr-14', hideTitle && 'sr-only')}>
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="font-display text-xl font-bold text-[#112a1d] sm:text-2xl">{title}</h2>
                {description && <p id={descId} className="mt-1 text-sm leading-relaxed text-[#3f5649]">{description}</p>}
              </div>
            </div>
            {showClose && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="fb-press absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full text-[#3f5649] hover:bg-[#eef6f1] hover:text-[#112a1d] cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            )}
            <div className={cx('fb-scroll min-h-0 flex-1 overflow-y-auto px-6 pb-6', hideTitle ? 'pt-6' : 'pt-4')}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Right-aligned action row for the bottom of a Dialog. */
export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}>{children}</div>
  );
}

/** Drawer = Dialog anchored to a side. `side` defaults to 'right'. */
export function Drawer({ side = 'right', ...props }: Omit<DialogProps, 'placement'> & { side?: 'left' | 'right' | 'bottom' }) {
  return <Dialog {...props} placement={side} />;
}
