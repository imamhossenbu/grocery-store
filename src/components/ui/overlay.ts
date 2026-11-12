import * as React from 'react';
import type { RefObject } from 'react';

/**
 * Deliberately NOT a "use client" module so `cx` / `preferredSide` can be
 * imported by Server Components too (hooks are reached through the React
 * namespace for that reason). The hooks must only be called from Client
 * Components.
 *
 * Shared behaviour for overlays (Dialog, Drawer, Select, DropdownMenu,
 * Popover, Tooltip). Kept dependency-free so every primitive in this folder
 * behaves the same way:
 *
 *  - useDismissableLayer: Escape + outside pointer close only the *topmost*
 *    open layer (a ConfirmDialog over a Drawer closes first).
 *  - useFocusTrap: Tab / Shift+Tab cycle inside the container, focus moves in
 *    on open and is restored to the previously focused element on close.
 *  - useScrollLock: locks body scroll (ref-counted, compensates scrollbar).
 */

const FOCUSABLE =
  'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),iframe,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

export function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('inert') && el.getClientRects().length > 0 && !el.closest('[aria-hidden="true"]')
  );
}

const layerStack: symbol[] = [];

interface DismissOptions {
  /** Elements whose pointer-downs do not count as "outside" (e.g. the trigger). */
  ignore?: RefObject<HTMLElement | null>[];
  /** Close on outside pointer-down (default true). */
  outsidePress?: boolean;
}

/**
 * Calls onDismiss on Escape or a pointer-down outside `ref` while `active`,
 * but only when this layer is the topmost one.
 */
export function useDismissableLayer(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onDismiss: () => void,
  { ignore = [], outsidePress = true }: DismissOptions = {}
) {
  const dismissRef = React.useRef(onDismiss);
  const ignoreRef = React.useRef(ignore);
  React.useEffect(() => {
    dismissRef.current = onDismiss;
    ignoreRef.current = ignore;
  });

  React.useEffect(() => {
    if (!active) return;
    const id = Symbol('layer');
    layerStack.push(id);
    const isTop = () => layerStack[layerStack.length - 1] === id;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTop()) {
        e.stopPropagation();
        dismissRef.current();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!outsidePress || !isTop()) return;
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (ignoreRef.current.some((r) => r.current?.contains(target))) return;
      dismissRef.current();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      const i = layerStack.indexOf(id);
      if (i >= 0) layerStack.splice(i, 1);
    };
  }, [active, outsidePress, ref]);
}

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  { initialFocus, restoreFocus = true }: { initialFocus?: RefObject<HTMLElement | null>; restoreFocus?: boolean } = {}
) {
  React.useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current;
    if (!root) return;

    const first = initialFocus?.current ?? getFocusable(root)[0] ?? root;
    // Wait a frame so entering animations don't fight the focus.
    const raf = requestAnimationFrame(() => first.focus({ preventScroll: true }));

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = getFocusable(root);
      if (!items.length) {
        e.preventDefault();
        root.focus();
        return;
      }
      const head = items[0];
      const tail = items[items.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && (current === head || !root.contains(current))) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && (current === tail || !root.contains(current))) {
        e.preventDefault();
        head.focus();
      }
    };
    root.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener('keydown', onKey);
      if (restoreFocus && previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [active, ref, initialFocus, restoreFocus]);
}

let lockCount = 0;
let savedOverflow = '';
let savedPadding = '';

export function useScrollLock(active: boolean) {
  React.useEffect(() => {
    if (!active) return;
    const body = document.body;
    if (lockCount === 0) {
      const gap = window.innerWidth - document.documentElement.clientWidth;
      savedOverflow = body.style.overflow;
      savedPadding = body.style.paddingRight;
      body.style.overflow = 'hidden';
      if (gap > 0) body.style.paddingRight = `${gap}px`;
    }
    lockCount++;
    return () => {
      lockCount--;
      if (lockCount === 0) {
        body.style.overflow = savedOverflow;
        body.style.paddingRight = savedPadding;
      }
    };
  }, [active]);
}

/**
 * Chooses whether a popup anchored to `anchor` opens below or above it,
 * based on the room left in the viewport.
 */
export function preferredSide(anchor: HTMLElement | null, popupHeight = 280): 'bottom' | 'top' {
  if (!anchor) return 'bottom';
  const r = anchor.getBoundingClientRect();
  const below = window.innerHeight - r.bottom;
  return below < popupHeight && r.top > below ? 'top' : 'bottom';
}

/** Joins class names, skipping falsy values. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

