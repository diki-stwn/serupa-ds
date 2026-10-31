"use client";
import * as React from "react";
import { cn, omit, setRef, useIsoLayoutEffect } from "../../internal/cn";
import { component } from "../../internal/component";

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 'horizontal' (a wrapping row, default; Left and Right move focus) or 'vertical' (a column; Up and Down). */
  orientation?: 'horizontal' | 'vertical';
  /** What the controls are for ("Text formatting"); needed when a page has more than one toolbar. */
  "aria-label"?: string;
  /** Buttons, IconButtons, ToggleButtons, ButtonGroups, Menus, Selects and Dividers, at any depth. */
  children?: React.ReactNode;
}

// What counts as one of the toolbar's controls: anything focusable that isn't disabled, hidden, inside a popup of
// its own (a Menu's items, a Popover's content) or inside a toolbar nested in this one.
const ITEMS = 'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [contenteditable="true"]';
const POPUP = '[popover], [role="menu"], [role="listbox"], [role="dialog"], [role="tooltip"], [role="toolbar"], [hidden], [inert]';
const itemsOf = (root: HTMLElement, all?: boolean): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>(ITEMS)).filter(function (it) {
  if (!all && it.matches(":disabled")) return false;
  const p = it.parentElement && it.parentElement.closest(POPUP);
  return !p || p === root || !root.contains(p);
});
// Laid out: a control hidden by CSS (display: none, often a responsive overflow) can't take focus, so the arrows
// skip it and it never holds the Tab stop, which left the toolbar out of the Tab order (L8E77).
const shown = (e: HTMLElement) => e.getClientRects().length > 0;
// A text field uses the arrows, Home and End itself, so there they edit the text rather than leave the field.
const typing = (e: HTMLElement) => e.isContentEditable || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement
  || (e instanceof HTMLInputElement && !/^(button|checkbox|radio|submit|reset|image|color|file|range)$/.test(e.type));

/* Toolbar: a role="toolbar" around a set of controls, with one Tab stop for all of them (the WAI-ARIA toolbar
   pattern). The arrow keys move focus between the controls (Left and Right in a row, mirrored right to left; Up
   and Down in a column), Home and End go to the first and last, and they wrap. Tab leaves it, and coming back
   lands on the control used last. Disabled controls are skipped. In a text field the keys stay the field's. */
/** A set of controls with one Tab stop, where the arrow keys move between them. */
export const Toolbar = /* @__PURE__ */ component<HTMLDivElement, ToolbarProps>("Toolbar", function Toolbar(props, ref) {
  const rest = omit(props, { orientation: 1, className: 1, children: 1 });
  const vertical = props.orientation === "vertical";
  const root = React.useRef<HTMLDivElement | null>(null);
  const active = React.useRef<HTMLElement | null>(null);
  // One control has tabIndex 0 (the one used last, or else the first) and the rest -1, disabled ones too, so one
  // that turns enabled doesn't add a second Tab stop.
  const sync = React.useCallback(function () {
    const r = root.current;
    if (!r) return;
    const items = itemsOf(r), seen = items.filter(shown);
    // While the whole toolbar is hidden nothing is laid out: keep to the order, so it has a Tab stop when it shows.
    const pick = seen.length ? seen : items;
    if (!active.current || pick.indexOf(active.current) < 0) active.current = pick[0] || null;
    for (const it of itemsOf(r, true)) it.tabIndex = it === active.current ? 0 : -1;
  }, []);
  useIsoLayoutEffect(sync);   // every render: new children may bring new controls, which need their tabIndex
  // Controls added, removed, disabled or hidden later (a Menu's trigger rendering, a button turning disabled).
  React.useEffect(function () {
    const r = root.current;
    if (!r || typeof MutationObserver === "undefined") return;
    const mo = new MutationObserver(sync);
    mo.observe(r, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "hidden", "inert"] });
    return function () { mo.disconnect(); };
  }, [sync]);

  const onFocus = function (e: React.FocusEvent<HTMLDivElement>) {
    if (rest.onFocus) rest.onFocus(e);
    const r = root.current;
    if (r && e.target instanceof HTMLElement && e.target !== active.current && itemsOf(r).indexOf(e.target) >= 0) { active.current = e.target; sync(); }
  };
  // Your onKeyDown runs first, so preventDefault() in it keeps the toolbar from moving focus on that key.
  const onKeyDown = function (e: React.KeyboardEvent<HTMLDivElement>) {
    if (rest.onKeyDown) rest.onKeyDown(e);
    const r = root.current, t = e.target;
    if (e.defaultPrevented || !r || !(t instanceof HTMLElement) || e.altKey || e.ctrlKey || e.metaKey) return;
    const items = itemsOf(r).filter(shown), i = items.indexOf(t);
    if (i < 0 || typing(t)) return;
    const rtl = getComputedStyle(r).direction === "rtl";
    let n: number;
    switch (e.key) {
      case "ArrowRight": if (vertical) return; n = i + (rtl ? -1 : 1); break;
      case "ArrowLeft": if (vertical) return; n = i + (rtl ? 1 : -1); break;
      case "ArrowDown": if (!vertical) return; n = i + 1; break;
      case "ArrowUp": if (!vertical) return; n = i - 1; break;
      case "Home": n = 0; break;
      case "End": n = items.length - 1; break;
      default: return;
    }
    e.preventDefault();
    const next = items[(n + items.length) % items.length];
    active.current = next;
    sync();
    next.focus();
  };
  return (
    <div {...rest} ref={function (n) { root.current = n; setRef(ref, n); }} role="toolbar" aria-orientation={vertical ? "vertical" : "horizontal"}
      className={cn("dk-toolbar", vertical && "dk-toolbar--vertical", props.className)} data-component="toolbar" data-orientation={vertical ? "vertical" : "horizontal"}
      onFocus={onFocus} onKeyDown={onKeyDown}>
      {props.children}
    </div>
  );
});
