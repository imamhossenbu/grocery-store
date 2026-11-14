'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { popupMotion } from './motion';
import { POPUP_Z, cx, preferredSide, useAnchoredPosition, useDismissableLayer, useIsClient } from './overlay';

/**
 * Menu button (WAI-ARIA "menu button" pattern).
 *
 * ```tsx
 * <DropdownMenu label="Order actions" trigger={<MoreHorizontal className="h-4 w-4" />}
 *   items={[
 *     { label: 'View details', href: '/order/1', icon: <Eye /> },
 *     { type: 'separator' },
 *     { label: 'Delete', onSelect: remove, tone: 'danger' },
 *   ]} />
 * ```
 * Keyboard: Enter/Space/↓ open on the first item, ↑ opens on the last;
 * ↑/↓/Home/End move; Enter activates; Esc closes and refocuses the trigger.
 */
export type DropdownItem =
  | {
      type?: 'item';
      label: string;
      icon?: ReactNode;
      /** Renders a Next <Link>. */
      href?: string;
      /** Open the href in a new tab (implies a plain <a>). */
      external?: boolean;
      onSelect?: () => void;
      disabled?: boolean;
      tone?: 'default' | 'danger';
      hint?: string;
    }
  | { type: 'separator' }
  | { type: 'label'; label: string };

export interface DropdownMenuProps {
  /** Contents of the trigger button. */
  trigger: ReactNode;
  /** Accessible name of the trigger (required when it only holds an icon). */
  label?: string;
  items: DropdownItem[];
  align?: 'start' | 'end';
  triggerClassName?: string;
  menuClassName?: string;
}

export function DropdownMenu({ trigger, label, items, align = 'end', triggerClassName, menuClassName }: DropdownMenuProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [side, setSide] = useState<'top' | 'bottom'>('bottom');
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const actionable = items
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => (it.type ?? 'item') === 'item' && !(it as { disabled?: boolean }).disabled)
    .map(({ i }) => i);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };
  useDismissableLayer(rootRef, open, () => close(), { ignore: [menuRef] });
  useAnchoredPosition(buttonRef, menuRef, open, { placement: side, align });
  const isClient = useIsClient();

  const openMenu = (at: 'first' | 'last') => {
    setSide(preferredSide(buttonRef.current, items.length * 44 + 16));
    setActive(at === 'first' ? (actionable[0] ?? 0) : (actionable.at(-1) ?? 0));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.focus({ preventScroll: true });
  }, [open, active]);

  const onMenuKey = (e: KeyboardEvent) => {
    const pos = actionable.indexOf(active);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(actionable[(pos + 1) % actionable.length]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(actionable[(pos - 1 + actionable.length) % actionable.length]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(actionable[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(actionable[actionable.length - 1]);
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  const itemClass = (danger: boolean, disabled?: boolean) =>
    cx(
      'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold outline-none transition-colors cursor-pointer',
      danger ? 'text-red-600 hover:bg-red-50 focus:bg-red-50' : 'text-[#234835] hover:bg-[#eef7f1] focus:bg-[#eef7f1]',
      disabled && 'pointer-events-none opacity-45'
    );

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        id={`${id}-trigger`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        aria-label={label}
        onClick={() => (open ? close() : openMenu('first'))}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            openMenu('first');
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            openMenu('last');
          }
        }}
        className={
          triggerClassName ??
          'inline-flex h-10 items-center gap-2 rounded-full border border-[#d3e5da] bg-white px-3.5 text-sm font-semibold text-[#234835] transition hover:border-[#1a663b] cursor-pointer'
        }
      >
        {trigger}
      </button>
      {isClient &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                {...popupMotion(side)}
                ref={menuRef}
                id={`${id}-menu`}
                role="menu"
                aria-labelledby={`${id}-trigger`}
                onKeyDown={onMenuKey}
                className={cx(
                  'fixed w-max min-w-[13rem] max-w-[min(20rem,90vw)] rounded-2xl border border-[#dfece3] bg-white p-1.5 shadow-card',
                  POPUP_Z,
                  menuClassName
                )}
              >
                {items.map((it, i) => {
                  if (it.type === 'separator') return <div key={i} role="separator" className="my-1 h-px bg-[#eef5f0]" />;
                  if (it.type === 'label')
                    return (
                      <div key={i} role="presentation" className="px-3 pb-1 pt-2 text-[13px] font-semibold text-[#3f5649]">
                        {it.label}
                      </div>
                    );
                  const danger = it.tone === 'danger';
                  const content = (
                    <>
                      {it.icon && <span aria-hidden className="grid h-4 w-4 shrink-0 place-items-center [&>svg]:h-4 [&>svg]:w-4">{it.icon}</span>}
                      <span className="flex-1">{it.label}</span>
                      {it.hint && <span className="text-[13px] text-[#3f5649]">{it.hint}</span>}
                    </>
                  );
                  const common = {
                    role: 'menuitem' as const,
                    tabIndex: -1,
                    'data-index': i,
                    'aria-disabled': it.disabled || undefined,
                    className: itemClass(danger, it.disabled),
                  };
                  if (it.href && !it.disabled) {
                    return it.external ? (
                      <a key={i} href={it.href} target="_blank" rel="noopener noreferrer" {...common} onClick={() => close(false)}>
                        {content}
                      </a>
                    ) : (
                      <Link key={i} href={it.href} {...common} onClick={() => close(false)}>
                        {content}
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={i}
                      type="button"
                      {...common}
                      disabled={it.disabled}
                      onClick={() => {
                        close();
                        it.onSelect?.();
                      }}
                    >
                      {content}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
