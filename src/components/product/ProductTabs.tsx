'use client';

import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TabPanel, Tabs } from '@/components/ui/Tabs';

export interface ProductTabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

/**
 * Product information tabs on the shared Tabs primitive (sliding underline,
 * arrow-key navigation). Every panel stays in the DOM — inactive ones are
 * `hidden` — so the description and delivery copy remain crawlable.
 */
export function ProductTabs({ tabs }: { tabs: ProductTabItem[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? '');
  const idBase = `pt${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div>
      <Tabs
        idBase={idBase}
        aria-label="Product information"
        variant="underline"
        value={active}
        onValueChange={setActive}
        items={tabs.map((t) => ({ value: t.id, label: t.label }))}
        className="text-[15px]"
      />
      <TabPanel idBase={idBase} value={active} className="pt-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {tabs.find((t) => t.id === active)?.content}
          </motion.div>
        </AnimatePresence>
      </TabPanel>
      {tabs
        .filter((t) => t.id !== active)
        .map((t) => (
          <div key={t.id} hidden>
            {t.content}
          </div>
        ))}
    </div>
  );
}
