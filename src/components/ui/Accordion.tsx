'use client';

import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cx } from './overlay';

/**
 * Disclosure list (replaces <details>). Height animates with motion/react.
 *
 * ```tsx
 * <Accordion items={[{ id: 'a', title: 'Question?', content: 'Answer.' }]} defaultOpen={['a']} />
 * ```
 * `multiple` (default true) lets several panels stay open.
 */
export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

export function Accordion({ items, defaultOpen = [], multiple = true, className }: { items: AccordionItem[]; defaultOpen?: string[]; multiple?: boolean; className?: string }) {
  const base = useId();
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultOpen));
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(multiple ? prev : []);
      if (prev.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className={cx('divide-y divide-[#eef5f0]', className)}>
      {items.map((item) => {
        const isOpen = open.has(item.id);
        const btnId = `${base}-${item.id}-btn`;
        const panelId = `${base}-${item.id}-panel`;
        return (
          <div key={item.id}>
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center gap-3 rounded-xl py-3.5 text-left text-[15px] font-semibold leading-snug text-[#112a1d] transition-colors hover:text-[#1a663b] cursor-pointer"
              >
                <span className="flex-1">{item.title}</span>
                <ChevronDown aria-hidden className={cx('h-4 w-4 shrink-0 text-[#3f5649] transition-transform duration-200', isOpen && 'rotate-180')} />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-4 text-sm leading-relaxed text-[#3f5649]">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
