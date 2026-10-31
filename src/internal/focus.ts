import * as React from "react";
import { useIsoLayoutEffect } from "./cn";
import { activeIn } from "./root";

/* A control drawn inside a wrapper (Slider's thumbs, SegmentedControl's segments) keeps its ref on the wrapper, so
   ref.current.focus() would land nowhere: a form library that focuses the first invalid field after a failed submit
   (React Hook Form's shouldFocusError, Formik) would leave keyboard and screen reader users where they were. These
   point the wrapper's focus() and autoFocus at the control inside. */

/** Makes el.focus() focus what target() returns instead; nothing when it returns null (a disabled control, as a
 *  disabled input ignores focus()). Call it from the wrapper's ref callback, before handing the element on. */
export function delegateFocus(el: HTMLElement | null, target: () => HTMLElement | null | undefined): void {
  if (el) el.focus = (options?: FocusOptions) => { const t = target(); if (t) t.focus(options); };
}

/** A blur from the window or browser tab losing focus (people went to copy something from another app): the field is
 *  still document.activeElement and has focus again when they come back, so what they typed isn't finished (L8E26). */
export function windowBlur(e: React.FocusEvent): boolean {
  return activeIn(e.currentTarget) === e.currentTarget;
}

/** autoFocus for such a control: focuses target() once, after the first render. */
export function useAutoFocus(on: boolean | undefined, target: () => HTMLElement | null | undefined): void {
  const first = React.useRef({ on, target });
  first.current.target = target;
  React.useEffect(() => { if (first.current.on) first.current.target()?.focus(); }, []);
}

/** For a control that can disable itself when used (a next arrow that reaches the last page): call the returned
 *  function from its handler with the control and where focus should go instead. After the render, if the control
 *  held focus and is now disabled, gone, or focus fell to <body>, focus moves to that other control (as Carousel's
 *  arrows do), so a keyboard user isn't thrown back to the top of the page. */
export function useFocusHandover(): (from: HTMLElement, to: () => HTMLElement | null | undefined) => void {
  const pending = React.useRef<{ from: HTMLElement; to: () => HTMLElement | null | undefined } | null>(null);
  // every render: acts only after a handler asked, once the render it caused has disabled the control or not.
  useIsoLayoutEffect(() => {
    const p = pending.current;
    pending.current = null;
    if (!p) return;
    // In p.from's document or shadow root (GR60); a removed control reads the page's.
    const a = activeIn(p.from);
    const lost = a === p.from ? !p.from.isConnected || p.from.matches(':disabled, [aria-disabled="true"]') : !a || a === document.body;
    const t = lost ? p.to() : null;
    if (t && t !== p.from) t.focus();
  });
  return React.useCallback((from: HTMLElement, to: () => HTMLElement | null | undefined) => { if (activeIn(from) === from) pending.current = { from, to }; }, []);
}
