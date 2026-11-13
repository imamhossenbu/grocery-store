'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { popupMotion } from '@/components/ui/motion';
import { cx, preferredSide, useDismissableLayer } from '@/components/ui/overlay';
import { Skeleton } from '@/components/ui/Skeleton';
import { matches, type Place } from '@/lib/address/types';

/**
 * Searchable single-choice list for one level of the address tree.
 *
 * Like the UI kit's <Select> (same look, popupMotion, dismiss + keyboard
 * model) but tailored to place names: matches English, Bangla and old
 * spellings, shows the Bangla name next to the English one, supports group
 * headings (city corporation / upazilas), and shows skeleton rows while the
 * list is loading. The value is submitted through a hidden input.
 */
export interface ComboOption extends Place {
  group?: string;
  groupBn?: string;
  meta?: string;
}

interface Props {
  id: string;
  /** Hidden input name (form submission) and focus target for errors. */
  name: string;
  label: string;
  value: string;
  options: ComboOption[];
  onChange: (id: string) => void;
  placeholder: string;
  loading?: boolean;
  disabled?: boolean;
  /** Shown instead of the placeholder when disabled (e.g. "Choose a district first"). */
  disabledText?: string;
  invalid?: boolean;
  required?: boolean;
  /** Fallback label for a value that is not (yet) in `options`. */
  fallbackLabel?: string;
  icon?: ReactNode;
  'aria-describedby'?: string;
  onClose?: () => void;
}

export function AddressCombobox({
  id,
  name,
  label,
  value,
  options,
  onChange,
  placeholder,
  loading,
  disabled,
  disabledText,
  invalid,
  required,
  fallbackLabel,
  icon,
  onClose,
  ...aria
}: Props) {
  const listId = `${id}-listbox`;
  const labelId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [side, setSide] = useState<'top' | 'bottom'>('bottom');
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const visible = useMemo(() => options.filter((o) => matches(o, query)), [options, query]);
  const selected = options.find((o) => o.id === value);

  const close = (refocus = true) => {
    setOpen(false);
    setQuery('');
    if (refocus) buttonRef.current?.focus();
    onClose?.();
  };
  useDismissableLayer(rootRef, open, () => close());

  const openList = () => {
    if (disabled) return;
    setSide(preferredSide(buttonRef.current, 360));
    setActive(Math.max(0, options.findIndex((o) => o.id === value)));
    setOpen(true);
  };

  useEffect(() => {
    if (open) searchRef.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, loading]);

  const choose = (opt: ComboOption | undefined) => {
    if (!opt) return;
    onChange(opt.id);
    close();
  };

  const onKey = (e: KeyboardEvent) => {
    const n = visible.length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (n) setActive((a) => (a + 1) % n);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (n) setActive((a) => (a - 1 + n) % n);
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(Math.max(0, n - 1));
        break;
      case 'PageDown':
        e.preventDefault();
        setActive((a) => Math.min(n - 1, a + 8));
        break;
      case 'PageUp':
        e.preventDefault();
        setActive((a) => Math.max(0, a - 8));
        break;
      case 'Enter':
        e.preventDefault();
        choose(visible[active]);
        break;
      case 'Tab':
        close(false);
        break;
    }
  };

  const shownText = selected ? selected.en : value && fallbackLabel ? fallbackLabel : null;

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={value} required={required} />
      <span id={labelId} className="sr-only">{label}</span>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        data-field={name}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-describedby={aria['aria-describedby']}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(e) => {
          if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
            e.preventDefault();
            openList();
          }
        }}
        className={cx(
          'flex min-h-12 w-full items-center gap-2.5 rounded-2xl border bg-white px-4 py-2.5 text-left text-[15px] text-[#112a1d] shadow-sm transition cursor-pointer focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:bg-[#f4f8f5] disabled:text-[#3f5649] disabled:shadow-none',
          invalid
            ? 'border-red-300 focus-visible:border-red-500 focus-visible:ring-4 focus-visible:ring-red-100'
            : open
              ? 'border-[#1a663b] ring-4 ring-[#1a663b]/10'
              : 'border-[#cfe0d6] hover:border-[#a9cdb7] focus-visible:border-[#1a663b] focus-visible:ring-4 focus-visible:ring-[#1a663b]/12'
        )}
      >
        {icon && <span aria-hidden className="shrink-0 text-[#1a663b] [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>}
        <span className="min-w-0 flex-1 truncate">
          {shownText ? (
            <>
              <span className="font-semibold">{shownText}</span>
              {selected && <span className="ml-1.5 text-[14px] text-[#3f5649]" lang="bn">· {selected.bn}</span>}
            </>
          ) : (
            <span className="text-[#6b8577]">{disabled && disabledText ? disabledText : placeholder}</span>
          )}
        </span>
        <ChevronDown aria-hidden className={cx('h-4 w-4 shrink-0 text-[#3f5649] transition-transform duration-200', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            {...popupMotion(side)}
            className={cx(
              'absolute left-0 z-[70] w-full min-w-[16rem] overflow-hidden rounded-2xl border border-[#dfece3] bg-white shadow-card',
              side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
            )}
          >
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
                  onKeyDown={onKey}
                  placeholder="Search in English or বাংলা…"
                  aria-label={`Search ${label}`}
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={!loading && visible[active] ? `${listId}-${active}` : undefined}
                  autoComplete="off"
                  spellCheck={false}
                  className="h-11 w-full rounded-xl border border-[#d3e5da] bg-[#f9fbf9] pl-9 pr-9 text-[15px] text-[#112a1d] placeholder:text-[#6b8577] outline-none focus:border-[#1a663b] focus:bg-white"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setQuery('');
                      searchRef.current?.focus();
                    }}
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[#3f5649] hover:bg-[#eef5f0] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
              </div>
            </div>
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-labelledby={labelId}
              aria-busy={loading || undefined}
              className="fb-scroll max-h-72 overflow-y-auto overscroll-contain p-1.5 outline-none"
            >
              {loading ? (
                Array.from({ length: 6 }, (_, i) => (
                  <li key={i} aria-hidden className="flex items-center justify-between gap-3 px-3 py-3">
                    <Skeleton className="h-3.5" style={{ width: `${40 + ((i * 17) % 35)}%` }} />
                    <Skeleton className="h-3.5 w-16" />
                  </li>
                ))
              ) : visible.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-[#3f5649]">
                  No match for “{query}”. Try the Bangla name or a shorter spelling.
                </li>
              ) : (
                visible.map((opt, i) => {
                  const isSelected = opt.id === value;
                  const showGroup = opt.group && (i === 0 || visible[i - 1].group !== opt.group);
                  return (
                    <Row key={opt.id} showGroup={!!showGroup} opt={opt}>
                      <li
                        id={`${listId}-${i}`}
                        data-index={i}
                        role="option"
                        aria-selected={isSelected}
                        onPointerMove={() => setActive(i)}
                        onClick={() => choose(opt)}
                        className={cx(
                          'flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] transition-colors',
                          i === active ? 'bg-[#eef7f1] text-[#0f2c1d]' : 'text-[#1d3a2b]',
                          isSelected && 'font-bold'
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-2">
                            <span className="truncate">{opt.en}</span>
                            <span lang="bn" className="text-[14px] font-normal text-[#3f5649]">{opt.bn}</span>
                          </span>
                          {opt.meta && <span className="block text-[13px] font-normal text-[#3f5649]">{opt.meta}</span>}
                        </span>
                        <Check aria-hidden className={cx('h-4 w-4 shrink-0 text-[#1a663b]', !isSelected && 'invisible')} />
                      </li>
                    </Row>
                  );
                })
              )}
            </ul>
            {!loading && options.length > 0 && (
              <p className="border-t border-[#eef5f0] px-3.5 py-2 text-[13px] text-[#3f5649]" aria-live="polite">
                {query ? `${visible.length} of ${options.length}` : `${options.length}`} {options.length === 1 ? 'place' : 'places'} · ↑↓ to move, Enter to choose
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ showGroup, opt, children }: { showGroup: boolean; opt: ComboOption; children: ReactNode }) {
  if (!showGroup) return children;
  return (
    <>
      <li role="presentation" className="sticky -top-1.5 z-10 -mx-1.5 bg-white/95 px-4.5 pb-1 pt-2.5 text-[12px] font-extrabold uppercase tracking-wider text-[#14522f] backdrop-blur">
        {opt.group}
        {opt.groupBn && <span lang="bn" className="ml-1.5 font-semibold normal-case tracking-normal text-[#3f5649]">{opt.groupBn}</span>}
      </li>
      {children}
    </>
  );
}
