'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Dialog, DialogFooter } from './Dialog';
import { cx } from './overlay';

/**
 * Promise-based replacement for window.confirm().
 *
 * Mount <ConfirmProvider> once (the root layout does), then:
 * ```tsx
 * const confirm = useConfirm();
 * if (await confirm({ title: 'Delete review?', description: '…', confirmLabel: 'Delete', tone: 'danger' })) { … }
 * ```
 * Resolves true on confirm, false on cancel / Escape / backdrop.
 */
export interface ConfirmOptions {
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' paints the confirm button red. */
  tone?: 'default' | 'danger';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ options: ConfirmOptions; open: boolean } | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    resolver.current?.(false);
    setState({ options, open: true });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setState((s) => (s ? { ...s, open: false } : s));
  };

  const o = state?.options;
  const danger = o?.tone === 'danger';

  return (
    <ConfirmContext value={confirm}>
      {children}
      <Dialog
        open={!!state?.open}
        onOpenChange={(open) => !open && settle(false)}
        title={o?.title ?? ''}
        description={o?.description}
        role="alertdialog"
        size="sm"
        showClose={false}
        initialFocus={cancelRef}
      >
        <DialogFooter className="mt-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => settle(false)}
            className="inline-flex h-11 items-center justify-center rounded-full border-2 border-[#cce2d4] bg-white px-5 text-sm font-semibold text-[#112a1d] transition hover:border-[#1a663b] hover:bg-[#f0f7f2] cursor-pointer"
          >
            {o?.cancelLabel ?? 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => settle(true)}
            className={cx(
              'inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-bold text-white transition cursor-pointer',
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-gradient shadow-glow hover:brightness-105'
            )}
          >
            {o?.confirmLabel ?? 'Confirm'}
          </button>
        </DialogFooter>
      </Dialog>
    </ConfirmContext>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}
