'use client';

import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import { MotionConfig, motion, type Transition, type Variants } from 'motion/react';

/**
 * Shared Framer Motion (`motion/react`) setup for the UI kit.
 *
 * - <MotionProvider> (mounted in the root layout) sets reducedMotion="user",
 *   so every motion component honours prefers-reduced-motion.
 * - EASE / DURATION keep timings consistent (150–300 ms, ease-out).
 * - popupMotion: enter/exit for dropdowns, selects, popovers.
 * - <Reveal>: fade + slight rise on mount, staggered by `index`.
 */

export const EASE = [0.2, 0.8, 0.2, 1] as const;
export const DURATION = { fast: 0.14, base: 0.22, slow: 0.3 };

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user" transition={{ duration: DURATION.base, ease: EASE }}>{children}</MotionConfig>;
}

/** For popups anchored above (`top`) or below (`bottom`) their trigger. */
export function popupMotion(side: 'top' | 'bottom' = 'bottom') {
  const y = side === 'bottom' ? -6 : 6;
  return {
    initial: { opacity: 0, y, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: DURATION.fast, ease: EASE } },
    exit: { opacity: 0, y: y / 2, scale: 0.98, transition: { duration: 0.1, ease: 'easeIn' } },
    style: { transformOrigin: side === 'bottom' ? 'top' : 'bottom' },
  } as const;
}

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  shown: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE, delay: Math.min(i, 10) * 0.045 } }),
};

const TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
  ul: motion.ul,
  header: motion.header,
  aside: motion.aside,
} as const;

export interface RevealProps {
  as?: keyof typeof TAGS;
  /** Stagger position (0, 1, 2…): each step delays ~45 ms. */
  index?: number;
  className?: string;
  style?: CSSProperties;
  id?: string;
  children?: ReactNode;
  'aria-labelledby'?: string;
  'aria-label'?: string;
  role?: string;
}

/** Fade + rise on mount. Server components can render it as a wrapper. */
export const Reveal = forwardRef<HTMLElement, RevealProps>(function Reveal({ as = 'div', index = 0, ...rest }, ref) {
  const Tag = TAGS[as] as typeof motion.div;
  return <Tag ref={ref as React.Ref<HTMLDivElement>} variants={revealVariants} initial="hidden" animate="shown" custom={index} {...rest} />;
});

export type { Transition };
