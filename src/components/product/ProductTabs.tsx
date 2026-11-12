'use client';

import { useId, useRef, useState } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

/** Accessible tabs (WAI-ARIA pattern, arrow-key navigation). Panels are server-rendered content. */
export function ProductTabs({ tabs }: { tabs: TabItem[] }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const focus = (i: number) => {
    const n = (i + tabs.length) % tabs.length;
    setActive(n);
    refs.current[n]?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Product information"
        className="flex gap-1 overflow-x-auto border-b border-[#dfece3] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') focus(active + 1);
          else if (e.key === 'ArrowLeft') focus(active - 1);
          else if (e.key === 'Home') focus(0);
          else if (e.key === 'End') focus(tabs.length - 1);
          else return;
          e.preventDefault();
        }}
      >
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${t.id}`}
            aria-selected={i === active}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={`relative shrink-0 px-4 py-3 text-sm font-bold transition cursor-pointer ${
              i === active ? 'text-[#1a663b]' : 'text-[#5a7165] hover:text-[#112a1d]'
            }`}
          >
            {t.label}
            {i === active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[#1a663b]" />}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={i !== active}
          tabIndex={0}
          className="pt-6 outline-none focus-visible:ring-2 focus-visible:ring-[#1a663b]/30 rounded-xl"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
