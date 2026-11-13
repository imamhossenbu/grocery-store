'use client';

import { motion } from 'motion/react';

/** Horizontal stacked bar (2px gaps) whose segments draw in left-to-right. */
export function SegmentBar({ segments, label }: { segments: { key: string; value: number; color: string }[]; label: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-[#eef5f0]" role="img" aria-label={label}>
      {segments.map((s, i) => (
        <motion.span
          key={s.key}
          className="h-full first:rounded-l-full last:rounded-r-full"
          style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color, transformOrigin: 'left' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 + i * 0.08 }}
        />
      ))}
    </div>
  );
}
