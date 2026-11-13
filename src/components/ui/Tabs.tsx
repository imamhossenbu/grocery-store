'use client';

import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cx } from './overlay';

/**
 * Tab list (WAI-ARIA tabs, roving tabindex, ←/→/Home/End). Pair it with
 * <TabPanel> — both take the same `idBase` so tabs and panel are linked.
 *
 * ```tsx
 * <Tabs idBase="orders" aria-label="Filter orders" value={tab} onValueChange={setTab}
 *   items={[{ value: 'all', label: 'All', count: 12 }, { value: 'active', label: 'Active' }]} />
 * <TabPanel idBase="orders" value={tab}>…</TabPanel>
 * ```
 * `variant`: 'pill' (segmented control) or 'underline'.
 * `activation`: 'auto' selects on arrow keys (default), 'manual' needs Enter/Space.
 */
export interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  idBase: string;
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  variant?: 'pill' | 'underline';
  activation?: 'auto' | 'manual';
  'aria-label': string;
  className?: string;
}

export function tabId(idBase: string, value: string) {
  return `${idBase}-tab-${value}`;
}

export function Tabs({ idBase, items, value, onValueChange, variant = 'pill', activation = 'auto', className, ...rest }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const enabled = items.filter((i) => !i.disabled);

  const focusTab = (v: string) => {
    listRef.current?.querySelector<HTMLElement>(`#${CSS.escape(tabId(idBase, v))}`)?.focus();
    if (activation === 'auto') onValueChange(v);
  };

  const onKey = (e: KeyboardEvent) => {
    const current = (document.activeElement as HTMLElement | null)?.dataset.value ?? value;
    const pos = enabled.findIndex((i) => i.value === current);
    let next: TabItem | undefined;
    if (e.key === 'ArrowRight') next = enabled[(pos + 1) % enabled.length];
    else if (e.key === 'ArrowLeft') next = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === 'Home') next = enabled[0];
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    if (next) {
      e.preventDefault();
      focusTab(next.value);
    }
  };

  const pill = variant === 'pill';

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={rest['aria-label']}
      onKeyDown={onKey}
      className={cx(
        'fb-scroll-x relative flex max-w-full overflow-x-auto',
        pill ? 'gap-1 rounded-full border border-[#dfece3] bg-white p-1 shadow-soft' : 'gap-6 border-b border-[#dfece3]',
        className
      )}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            id={tabId(idBase, item.value)}
            data-value={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idBase}-panel`}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onValueChange(item.value)}
            className={cx(
              'inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-bold transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40',
              pill
                ? cx('relative h-9 rounded-full px-4 transition-colors duration-200', selected ? 'text-white' : 'text-[#3f5649] hover:bg-[#f0f7f2] hover:text-[#112a1d]')
                : cx('relative pb-3 pt-1 transition-colors', selected ? 'text-[#112a1d]' : 'text-[#3f5649] hover:text-[#112a1d]')
            )}
          >
            {selected && (
              <motion.span
                layoutId={`${idBase}-tab-indicator`}
                aria-hidden
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                className={pill ? 'absolute inset-0 rounded-full bg-[#0f2c1d] shadow-md' : 'absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#1a663b]'}
              />
            )}
            {item.icon && <span aria-hidden className="relative [&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>}
            <span className="relative">{item.label}</span>
            {item.count !== undefined && (
              <span
                className={cx(
                  'relative min-w-[1.375rem] rounded-full px-1.5 py-0.5 text-center text-xs font-extrabold tabular-nums',
                  selected && pill ? 'bg-white/15 text-white' : 'bg-[#eef5f0] text-[#14522f]'
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ idBase, value, children, className }: { idBase: string; value: string; children: ReactNode; className?: string }) {
  return (
    <div role="tabpanel" id={`${idBase}-panel`} aria-labelledby={tabId(idBase, value)} tabIndex={0} className={cx('outline-none', className)}>
      {children}
    </div>
  );
}
