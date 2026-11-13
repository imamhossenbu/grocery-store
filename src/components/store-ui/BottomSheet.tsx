'use client';

import { useId, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react';
import { X } from 'lucide-react';
import { DURATION } from '@/components/ui/motion';
import { cx, useDismissableLayer, useFocusTrap, useScrollLock } from '@/components/ui/overlay';

/**
 * Mobile bottom sheet: backdrop fade + spring slide-up, drag the handle (or
 * header) down to close, sticky footer for the primary action. Shares the
 * focus-trap / Escape / scroll-lock behaviour of the ui/ Dialog.
 *
 * ```tsx
 * <BottomSheet open={open} onOpenChange={setOpen} title="Filter products"
 *   footer={<Button className="w-full">Show 42 products</Button>}>
 *   …
 * </BottomSheet>
 * ```
 */
export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Small action at the right of the header (e.g. "Clear all"). */
  headerAction?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

const subscribeNothing = () => () => {};

export function BottomSheet({ open, onOpenChange, title, headerAction, footer, children, className }: BottomSheetProps) {
  const isClient = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const drag = useDragControls();

  useDismissableLayer(panelRef, open, () => onOpenChange(false));
  useFocusTrap(panelRef, open);
  useScrollLock(open);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onOpenChange(false);
  };

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="sheet" className="fixed inset-0 z-[80]" initial={{ opacity: 1 }} exit={{ opacity: 1 }} transition={{ duration: DURATION.slow }}>
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
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40, mass: 0.9 }}
            drag="y"
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
            className={cx(
              'absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-[#dfece3] bg-white shadow-2xl outline-none',
              className
            )}
          >
            <div className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing" onPointerDown={(e) => drag.start(e)}>
              <div className="flex justify-center pt-2.5 pb-1" aria-hidden>
                <span className="h-1.5 w-10 rounded-full bg-[#cfe0d6]" />
              </div>
              <div className="flex items-center gap-3 border-b border-[#eef5f0] px-5 pb-3.5 pt-1.5">
                <h2 id={titleId} className="flex-1 font-display text-xl font-bold text-[#112a1d]">{title}</h2>
                {headerAction && <div onPointerDown={(e) => e.stopPropagation()}>{headerAction}</div>}
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Close"
                  className="fb-press -mr-1.5 grid h-10 w-10 place-items-center rounded-full text-[#3f5649] hover:bg-[#eef6f1] hover:text-[#112a1d] cursor-pointer"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>
            <div className="fb-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
            {footer && <div className="shrink-0 border-t border-[#eef5f0] bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
