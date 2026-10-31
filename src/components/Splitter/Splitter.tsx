"use client";
import * as React from "react";
import { announce } from "../../internal/announce";
import { cn, domId, useIsoLayoutEffect } from "../../internal/cn";
import { component } from "../../internal/component";
import { useSettings } from "../../internal/provider";
import { useServerStyles } from "../../internal/serverStyles";
import { useScrolls } from "../../internal/useScrolls";
import { warnOnce } from "../../internal/warn";
import { en as words } from "./labels";
import { clickAfterDrag } from "../../internal/timing";

export interface SplitterProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "defaultValue"> {
  /** The two panes, first and second. The handle between them resizes the first; the second takes the rest. */
  children: [React.ReactNode, React.ReactNode];
  /** "horizontal" (default): the panes side by side, the first at the start (left, or right in rtl). "vertical": stacked, the first on top. */
  direction?: "horizontal" | "vertical";
  /** The first pane's size in percent of the Splitter (controlled). Use with onSizeChange. */
  size?: number;
  /** The first pane's size at first, in percent (uncontrolled); 0 starts it collapsed when collapsible. Default: 50. */
  defaultSize?: number;
  /** Called with the first pane's new size in percent while it's dragged or moved with the keys. */
  onSizeChange?: (size: number) => void;
  /** The first pane's least and largest size, in percent. Default: 10 and 90. */
  min?: number;
  /** The first pane's largest size, in percent. Default: 90. */
  max?: number;
  /** How far an arrow key moves the handle, in percent. Default: 5. */
  step?: number;
  /** Enter on the handle (or a double-click) collapses the first pane to 0, and again brings it back. Default: false. */
  collapsible?: boolean;
  /** Keeps an uncontrolled size in localStorage under this key, so the layout comes back on the next visit. */
  storageKey?: string;
  /** The handle's accessible name: say what it resizes ("Sidebar"). Default: the resizePanes label, "Resize panes". */
  separatorLabel?: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const read = (key: string | undefined) => {
  if (!key) return null;
  try { const n = parseFloat(window.localStorage.getItem(key) || ""); return isFinite(n) ? n : null; } catch { return null; }
};
const save = (key: string | undefined, n: number) => {
  if (!key) return;
  try { window.localStorage.setItem(key, String(n)); } catch { /* private mode or full: the size just isn't kept */ }
};

/* Splitter: two panes with a handle between them that resizes the first, following the WAI-ARIA window splitter
   pattern. The handle is a focusable role="separator" with aria-valuenow (the first pane's size in percent),
   aria-valuemin, aria-valuemax and aria-controls (the first pane); the arrow keys along it move it by step, Home
   and End go to min and max, and with collapsible, Enter collapses the first pane and brings it back. A pointer
   drags it (captured, so it follows outside the handle). Sizes are percent, so the layout keeps its proportions as
   the Splitter resizes. A collapsed pane is hidden, so nothing in it can be reached by Tab. */
/** Two panes with a draggable, keyboard-operable handle between them: list and detail, sidebar and editor. */
export const Splitter = /* @__PURE__ */ component<HTMLDivElement, SplitterProps>("Splitter", function Splitter(props, ref) {
  const { children, direction: dirIn, size: sizeIn, defaultSize, onSizeChange, min: minIn, max: maxIn, step: stepIn, collapsible, storageKey, separatorLabel, className, ...rest } = props;
  const sds = useSettings(words);
  const styled = useServerStyles<HTMLDivElement>();   // the first pane's size, from server HTML under a strict CSP (GR12)
  const direction = dirIn === "vertical" ? "vertical" : "horizontal";
  const min = clamp(typeof minIn === "number" && isFinite(minIn) ? minIn : 10, 0, 100);
  const max = clamp(typeof maxIn === "number" && isFinite(maxIn) ? maxIn : 90, min, 100);
  const step = typeof stepIn === "number" && stepIn > 0 ? stepIn : 5;
  const fit = (n: number) => clamp(n, min, max);
  const controlled = sizeIn !== undefined;
  const [own, setOwn] = React.useState(() => (defaultSize === 0 && collapsible ? 0 : fit(typeof defaultSize === "number" && isFinite(defaultSize) ? defaultSize : 50)));
  // The saved size is read after mount (and when the key changes), so the server's HTML and the first render agree.
  const now = React.useRef({ controlled, collapsible, fit });
  now.current = { controlled, collapsible, fit };
  React.useEffect(() => {
    const n = read(storageKey), c = now.current;
    if (!c.controlled && n != null) setOwn(n === 0 && c.collapsible ? 0 : c.fit(n));
  }, [storageKey]);
  const size = controlled ? (sizeIn === 0 && collapsible ? 0 : fit(sizeIn)) : own;
  const restore = React.useRef(size || fit(50));   // what Enter brings a collapsed pane back to
  if (size > 0) restore.current = size;
  const root = React.useRef<HTMLDivElement | null>(null);
  const base = domId("dk-splitter", React.useId());
  const panes = React.Children.toArray(children);
  if (process.env.NODE_ENV !== "production" && panes.length !== 2) warnOnce("splitter-two", "Splitter: give it exactly two children, the two panes (it got " + panes.length + ").");

  const change = (n: number) => {
    setSlide(null);
    const next = Math.round(n * 100) / 100;
    if (next === size) return;
    if (!controlled) { setOwn(next); save(storageKey, next); }
    if (onSizeChange) onSizeChange(next);
  };
  const collapsed = size === 0;
  const rtl = (e: HTMLElement) => getComputedStyle(e).direction === "rtl";
  // Enter or a double-click slides the first pane out and back (GN3b). The layout changes at once; the handle and the
  // second pane start where they were and slide to where they are on translate, while the first pane's clip opens or
  // closes with them (a closing one stays over its old place, inert, until then), so every frame is the compositor's.
  // Not on mount, a drag or the keys' steps, and not when there's no transition to run (reduced motion).
  // Toggled again mid-way, it turns back from where the handle is (at: its offset along the axis then), not from the
  // end it was heading for (GR46).
  const [slide, setSlide] = React.useState<{ to: "open" | "closed"; px: number; at: number; run: boolean } | null>(null);
  const extent = (n: HTMLElement) => (direction === "horizontal" ? n.offsetWidth : n.offsetHeight);
  const offset = () => {
    const h = handle.current, t = h ? getComputedStyle(h).translate : "none";
    if (!h || !t || t === "none") return 0;
    const v = parseFloat(t.split(" ")[direction === "horizontal" ? 0 : 1] || "0") || 0;
    return direction === "horizontal" && rtl(h) ? -v : v;
  };
  const toggle = () => {
    if (!collapsible) return;
    const closing = size > 0, at = slide ? offset() : 0;
    change(closing ? 0 : restore.current);
    const moves = paneB && parseFloat(getComputedStyle(paneB).transitionDuration) > 0;
    setSlide(moves ? { to: closing ? "closed" : "open", px: closing && paneA ? extent(paneA) : 0, at, run: false } : null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // With Alt, Ctrl or ⌘ the keys are the browser's or the system's (Alt+← goes back a page): leave them (L8E28).
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const horizontal = direction === "horizontal";
    const back = horizontal ? (rtl(e.currentTarget) ? "ArrowRight" : "ArrowLeft") : "ArrowUp";
    const on = horizontal ? (rtl(e.currentTarget) ? "ArrowLeft" : "ArrowRight") : "ArrowDown";
    let to: number | null = null;
    if (e.key === back) to = collapsed ? 0 : fit(size - step);
    else if (e.key === on) to = collapsed ? min : fit(size + step);
    else if (e.key === "Home") to = min;
    else if (e.key === "End") to = max;
    else if (e.key === "Enter" && collapsible) { e.preventDefault(); toggle(); return; }
    else if (e.key === "Escape" && placing) { e.preventDefault(); e.stopPropagation(); setPlacing(false); return; }
    if (to == null) return;
    e.preventDefault();
    change(to);
  };
  // A drag sets the size from where the pointer is in the Splitter, kept between min and max.
  const drag = React.useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  // A press on the handle that doesn't drag it, then a press anywhere else in the Splitter, puts the handle there
  // (WCAG 2.5.7: a single pointer resizes without dragging). Pressing the handle again, Escape or leaving it cancels.
  const [placing, setPlacing] = React.useState(false);
  const handle = React.useRef<HTMLDivElement | null>(null);
  const at = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = root.current!.getBoundingClientRect();
    const share = direction === "horizontal" ? (rtl(root.current!) ? r.right - e.clientX : e.clientX - r.left) / (r.width || 1) : (e.clientY - r.top) / (r.height || 1);
    return fit(share * 100);
  };
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();   // no text selection while dragging; focus moves to the handle below
    e.currentTarget.focus();
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* a pointer that already ended */ }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved && Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) < 4) return;
    d.moved = true;
    setPlacing(false);
    change(at(e));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.moved || e.type === "pointercancel") return;
    if (!placing) announce(sds.labels.splitterPlace);
    setPlacing(!placing);
  };
  // The press that places the handle is the Splitter's: it doesn't reach what's under it, nor does its click.
  const onPlace = (e: React.PointerEvent<HTMLDivElement>) => {
    if (rest.onPointerDownCapture) rest.onPointerDownCapture(e);
    if (!placing || e.button !== 0 || (handle.current && handle.current.contains(e.target as Node))) return;
    e.preventDefault();
    e.stopPropagation();
    const swallow = (c: Event) => { c.preventDefault(); c.stopPropagation(); };
    window.addEventListener("click", swallow, { capture: true, once: true });
    setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), clickAfterDrag);
    setPlacing(false);
    change(at(e));
    if (handle.current) handle.current.focus();
  };

  const first = base + "-first";
  // A pane whose content is bigger than it takes Tab focus, so it can be scrolled from the keyboard when nothing in
  // it is focusable (as Dialog's and Drawer's bodies do).
  const [paneA, setPaneA] = React.useState<HTMLDivElement | null>(null);
  const [paneB, setPaneB] = React.useState<HTMLDivElement | null>(null);
  const scrollsA = useScrolls(paneA);
  const scrollsB = useScrolls(paneB);
  // A parent that collapses the first pane (size 0) while focus is in it hides what has focus: focus goes to the
  // handle, as with Enter on the handle, instead of dropping to the page (GN3). focusedIn notes it was there, for a
  // browser that has already moved focus to the body by the time this runs.
  const focusedIn = React.useRef(false);
  useIsoLayoutEffect(() => {
    if (!collapsed || !paneA || !handle.current) return;
    const active = document.activeElement;
    if (paneA.contains(active) || ((!active || active === document.body) && focusedIn.current)) handle.current.focus();
    focusedIn.current = false;
  }, [collapsed, paneA]);
  // every render: a slide waits for its size, then runs two frames on.
  useIsoLayoutEffect(() => {
    if (!slide || slide.run) return;
    if ((slide.to === "closed") !== collapsed) { setSlide(null); return; }   // a parent that didn't follow
    if (!slide.px) { if (paneA && extent(paneA)) setSlide({ ...slide, px: extent(paneA) }); else setSlide(null); return; }
    let f = requestAnimationFrame(() => { f = requestAnimationFrame(() => setSlide({ ...slide, run: true })); });
    return () => cancelAnimationFrame(f);
  });
  React.useEffect(() => {
    if (!slide || !slide.run || !paneB) return;
    const t = window.setTimeout(() => setSlide(null), Math.max(...getComputedStyle(paneB).transitionDuration.split(",").map((d) => parseFloat(d) * (d.trim().endsWith("ms") ? 1 : 1000))) + 100);
    return () => window.clearTimeout(t);
  }, [slide, paneB]);
  const sliding = slide && slide.px ? slide : null;
  const along = (v: number) => (direction === "horizontal" ? v + "px 0" : "0 " + v + "px");
  const back = sliding && root.current && direction === "horizontal" && rtl(root.current) ? -1 : 1;
  const clip = (x: string) => (direction === "vertical" ? "inset(0 0 " + x + " 0)" : back < 0 ? "inset(0 0 0 " + x + ")" : "inset(0 " + x + " 0 0)");
  // How far the handle is from where it's going, and how much of the first pane is hidden there: the whole pane from
  // rest, less when it turns back mid-way.
  const left = sliding ? Math.max(0, Math.min(2 * sliding.px, sliding.to === "open" ? sliding.px - sliding.at : sliding.px + sliding.at)) : 0;
  const slideStyle = sliding ? { "--dk-splitter-from": along((sliding.to === "open" ? -left : left) * back), "--dk-splitter-px": sliding.px + "px", "--dk-splitter-shut": clip("100%"),
    "--dk-splitter-clip-from": clip(Math.max(0, sliding.to === "open" ? left : sliding.px - left) + "px") } as React.CSSProperties : null;
  return (
    <div {...rest} style={slideStyle ? { ...rest.style, ...slideStyle } : rest.style} ref={(n) => { root.current = n; styled(n); if (typeof ref === "function") ref(n); else if (ref) ref.current = n; }}
      className={cn("dk-splitter", "dk-splitter--" + direction, className)} data-component="splitter" data-direction={direction}
      data-placing={placing || undefined} data-slide={sliding ? (sliding.run ? "run" : "start") : undefined} data-slide-to={sliding ? sliding.to : undefined} onPointerDownCapture={onPlace}>
      <div ref={setPaneA} id={first} tabIndex={scrollsA ? 0 : undefined} className="dk-splitter__pane dk-splitter__pane--first" style={{ flexBasis: size + "%" }} hidden={(collapsed && !(sliding && sliding.to === "closed")) || undefined} inert={(collapsed && !!sliding) || undefined}
        onFocus={() => { focusedIn.current = true; }} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget) && e.relatedTarget) focusedIn.current = false; }}>{panes[0]}</div>
      <div ref={handle} role="separator" tabIndex={0} className="dk-splitter__handle" aria-orientation={direction === "horizontal" ? "vertical" : "horizontal"}
        aria-valuenow={Math.round(size)} aria-valuemin={collapsible ? 0 : Math.round(min)} aria-valuemax={Math.round(max)} aria-controls={first}
        aria-label={separatorLabel || sds.labels.resizePanes} data-state={collapsed ? "collapsed" : undefined}
        onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
        onDoubleClick={toggle} onBlur={() => setPlacing(false)} />
      <div ref={setPaneB} tabIndex={scrollsB ? 0 : undefined} className="dk-splitter__pane dk-splitter__pane--second"
        onTransitionEnd={(e) => { if (e.target === e.currentTarget && e.propertyName === "translate" && slide && slide.run) setSlide(null); }}>{panes[1]}</div>
    </div>
  );
});
