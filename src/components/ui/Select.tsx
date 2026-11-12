'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { popupMotion } from './motion';
import { cx, preferredSide, useDismissableLayer } from './overlay';

/**
 * Brand-styled replacement for <select>: a button + listbox popup.
 *
 * ```tsx
 * <FieldLabel htmlFor="area" label="Area" />
 * <Select id="area" name="area" defaultValue={v.area} placeholder="Select your area"
 *         options={AREAS.map((a) => ({ value: a, label: a }))} invalid={!!err.area} />
 * ```
 *
 * - Works in plain <form>s: renders `<input type="hidden" name={name}>`.
 * - Controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`).
 * - Keyboard: ↑/↓/Home/End move, Enter/Space select, Esc/Tab close, type to jump.
 * - `searchable` (auto when there are more than 8 options) adds a filter box.
 * - Label it with a <label htmlFor={id}> or `aria-label` / `aria-labelledby`.
 */
export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  /** true / false, or 'auto' (default): searchable when options.length > 8. */
  searchable?: boolean | 'auto';
  size?: 'sm' | 'md';
  className?: string;
  /** Classes for the trigger button (overrides the default field look). */
  triggerClassName?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export function Select({
  options,
  value: controlled,
  defaultValue = '',
  onValueChange,
  name,
  id,
  placeholder = 'Select…',
  disabled,
  required,
  invalid,
  searchable = 'auto',
  size = 'md',
  className,
  triggerClassName,
  ...aria
}: SelectProps) {
  const autoId = useId();
  const buttonId = id ?? `select-${autoId}`;
  const listId = `${buttonId}-listbox`;
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const [side, setSide] = useState<'top' | 'bottom'>('bottom');
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef({ text: '', at: 0 });

  const canSearch = searchable === 'auto' ? options.length > 8 : searchable;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);
  const selected = options.find((o) => o.value === value);

  const close = (refocus = true) => {
    setOpen(false);
    setQuery('');
    if (refocus) buttonRef.current?.focus();
  };

  useDismissableLayer(rootRef, open, () => close());

  const openList = (toIndex?: number) => {
    if (disabled) return;
    const current = options.findIndex((o) => o.value === value);
    setSide(preferredSide(buttonRef.current, 300));
    setActive(toIndex ?? (current >= 0 ? current : options.findIndex((o) => !o.disabled)));
    setOpen(true);
  };

  // Move focus into the popup when it opens, keep the active option in view.
  useEffect(() => {
    if (!open) return;
    (canSearch ? searchRef.current : listRef.current)?.focus({ preventScroll: true });
  }, [open, canSearch]);
  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const choose = (opt: SelectOption | undefined) => {
    if (!opt || opt.disabled) return;
    if (controlled === undefined) setInner(opt.value);
    onValueChange?.(opt.value);
    close();
  };

  const move = (delta: number) => {
    if (!visible.length) return;
    let i = active;
    for (let n = 0; n < visible.length; n++) {
      i = (i + delta + visible.length) % visible.length;
      if (!visible[i].disabled) break;
    }
    setActive(i);
  };

  const onListKey = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        move(-1);
        break;
      case 'Home':
        e.preventDefault();
        setActive(visible.findIndex((o) => !o.disabled));
        break;
      case 'End':
        e.preventDefault();
        setActive(visible.length - 1 - [...visible].reverse().findIndex((o) => !o.disabled));
        break;
      case 'Enter':
        e.preventDefault();
        choose(visible[active]);
        break;
      case ' ':
        if (!canSearch) {
          e.preventDefault();
          choose(visible[active]);
        }
        break;
      case 'Tab':
        close(false);
        break;
      default:
        if (!canSearch && e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
          const now = Date.now();
          const t = typeahead.current;
          t.text = now - t.at > 600 ? e.key.toLowerCase() : t.text + e.key.toLowerCase();
          t.at = now;
          const hit = visible.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(t.text));
          if (hit >= 0) setActive(hit);
        }
    }
  };

  const onButtonKey = (e: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openList();
    }
  };

  const sm = size === 'sm';

  return (
    <div ref={rootRef} className={cx('relative', className)}>
      {name && <input type="hidden" name={name} value={value} required={required} />}
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={aria['aria-label']}
        aria-labelledby={aria['aria-labelledby']}
        aria-describedby={aria['aria-describedby']}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onButtonKey}
        className={
          triggerClassName ??
          cx(
            'flex w-full items-center gap-2 rounded-2xl border bg-white text-left text-[#112a1d] shadow-sm transition cursor-pointer disabled:cursor-not-allowed disabled:bg-[#f4f8f5] disabled:text-[#3f5649]',
            sm ? 'h-10 px-3.5 text-sm' : 'px-4 py-3 text-sm',
            invalid
              ? 'border-red-300 focus-visible:border-red-500 focus-visible:ring-4 focus-visible:ring-red-100'
              : open
                ? 'border-[#1a663b] ring-4 ring-[#1a663b]/10'
                : 'border-[#d3e5da] hover:border-[#a9cdb7] focus-visible:border-[#1a663b] focus-visible:ring-4 focus-visible:ring-[#1a663b]/10',
            'focus-visible:outline-none'
          )
        }
      >
        {selected?.icon && <span className="shrink-0 text-[#1a663b]">{selected.icon}</span>}
        <span className={cx('min-w-0 flex-1 truncate', !selected && 'text-[#93a99c]')}>{selected?.label ?? placeholder}</span>
        <ChevronDown aria-hidden className={cx('h-4 w-4 shrink-0 text-[#3f5649] transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
      {open && (
        <motion.div
          {...popupMotion(side)}
          className={cx(
            'absolute left-0 z-[70] w-full min-w-[12rem] overflow-hidden rounded-2xl border border-[#dfece3] bg-white shadow-card',
            side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
          )}
        >
          {canSearch && (
            <div className="border-b border-[#eef5f0] p-2">
              <div className="relative">
                <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3f5649]" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onListKey}
                  placeholder="Search…"
                  aria-label="Filter options"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={active >= 0 && visible[active] ? `${listId}-${active}` : undefined}
                  className="h-10 w-full rounded-xl border border-[#d3e5da] bg-[#f9fbf9] pl-9 pr-3 text-sm text-[#112a1d] placeholder-[#93a99c] outline-none focus:border-[#1a663b]"
                />
              </div>
            </div>
          )}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={canSearch ? -1 : 0}
            aria-labelledby={aria['aria-labelledby'] ?? buttonId}
            aria-activedescendant={!canSearch && active >= 0 && visible[active] ? `${listId}-${active}` : undefined}
            onKeyDown={canSearch ? undefined : onListKey}
            className="fb-scroll max-h-64 overflow-y-auto p-1.5 outline-none"
          >
            {visible.length === 0 && <li className="px-3 py-6 text-center text-sm text-[#3f5649]">No matches</li>}
            {visible.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  id={`${listId}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  onPointerMove={() => !opt.disabled && setActive(i)}
                  onClick={() => choose(opt)}
                  className={cx(
                    'flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors',
                    opt.disabled && 'cursor-not-allowed opacity-45',
                    i === active ? 'bg-[#eef7f1] text-[#0f2c1d]' : 'text-[#234835]',
                    isSelected && 'font-bold'
                  )}
                >
                  {opt.icon && <span className="shrink-0 text-[#1a663b]">{opt.icon}</span>}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{opt.label}</span>
                    {opt.description && <span className="block truncate text-[13px] font-normal text-[#3f5649]">{opt.description}</span>}
                  </span>
                  <Check aria-hidden className={cx('h-4 w-4 shrink-0 text-[#1a663b]', !isSelected && 'invisible')} />
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
