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
 *  - useAnchoredPosition: fixed positioning for popups portalled to <body>.
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

const subscribeNothing = () => () => {};

/** false during server render and hydration, true afterwards (safe gate for portals). */
export function useIsClient(): boolean {
  return React.useSyncExternalStore(subscribeNothing, () => true, () => false);
}

/** Popups are portalled to <body>, above dialogs (z-80) and sheets. */
export const POPUP_Z = 'z-[90]';

const VIEWPORT_GAP = 8;

export interface AnchorOptions {
  placement: 'top' | 'bottom' | 'left' | 'right';
  /** Cross-axis alignment for top/bottom; left/right are always centred. */
  align?: 'start' | 'center' | 'end';
  offset?: number;
  /** Give the popup the anchor's width (selects). */
  matchWidth?: boolean;
}

/**
 * Keeps a portalled, position:fixed popup attached to its anchor while
 * `active`, following scroll (in any container) and resize. Because the popup
 * lives in <body>, no `overflow-hidden` ancestor can clip it.
 *
 * Centred placements rely on the popup's own translate classes
 * (-translate-x-1/2 for top/bottom, -translate-y-1/2 for left/right).
 */
export function useAnchoredPosition(
  anchorRef: RefObject<HTMLElement | null>,
  popupRef: RefObject<HTMLElement | null>,
  active: boolean,
  { placement, align = 'start', offset = 8, matchWidth = false }: AnchorOptions
) {
  React.useLayoutEffect(() => {
    if (!active) return;
    let raf = 0;

    const place = () => {
      const anchor = anchorRef.current;
      const popup = popupRef.current;
      if (!anchor || !popup) return;
      const r = anchor.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const s = popup.style;
      s.position = 'fixed';
      s.top = s.bottom = s.left = s.right = '';
      if (matchWidth) s.width = `${r.width}px`;

      if (placement === 'top' || placement === 'bottom') {
        if (placement === 'bottom') s.top = `${r.bottom + offset}px`;
        else s.bottom = `${vh - r.top + offset}px`;
        if (align === 'center') {
          s.left = `${r.left + r.width / 2}px`;
          return;
        }
        // Start/end: align to the anchor edge, then keep the popup on screen.
        const width = popup.offsetWidth;
        let left = align === 'end' ? r.right - width : r.left;
        left = Math.min(left, vw - VIEWPORT_GAP - width);
        s.left = `${Math.max(VIEWPORT_GAP, left)}px`;
      } else {
        s.top = `${r.top + r.height / 2}px`;
        if (placement === 'left') s.right = `${vw - r.left + offset}px`;
        else s.left = `${r.right + offset}px`;
      }
    };

    place();
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(place);
    };
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    };
  }, [active, anchorRef, popupRef, placement, align, offset, matchWidth]);
}

/** Joins class names, skipping falsy values. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

