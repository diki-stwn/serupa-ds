import * as React from "react";
import { useIsoLayoutEffect } from "./cn";
import { markDismissal } from "./layers";
import { cssLength, hideLayer, isRtl, placeLayer, showLayer, type Placement } from "./position";

type Ref = React.RefObject<HTMLElement | null>;

export interface AnchoredLayerOptions {
  /** Where the layer goes; an unknown or missing value becomes `fallback`. */
  placement?: Placement;
  /** The placement when `placement` is missing (default "bottom"). */
  fallback?: Placement;
  /** The custom property holding the gap between anchor and layer, such as "--dk-menu-offset". */
  offsetVar: string;
  /** Called on a press outside the layer and `inside`, and when the <dialog> it sits in closes. On touch it waits
      for the tap's click, so a finger that starts a scroll outside doesn't close the layer. */
  onOutside?: () => void;
  /** Called when focus moves to an element outside the layer, the anchor and `inside` (Tab past the layer). */
  onFocusOutside?: () => void;
  /** An element a press on doesn't count as outside, such as the button that opens the layer. */
  inside?: Ref;
  /** Keeps the layer at least as wide as the anchor, as a list under its field. */
  matchWidth?: boolean;
  /** A value that changes the layer's size when it changes (a tooltip's text): it is placed again. */
  watch?: unknown;
}

/** Shows `layer` in the top layer next to `anchor` while open, following scrolls, resizes and size changes;
    a press outside the layer (and `inside`) calls onOutside, as does the <dialog> it sits in closing, and focus
    moving outside them and the anchor calls onFocusOutside. Focus is the caller's: do it in a layout effect
    declared after this hook, which runs once the layer is shown and placed. */
export function useAnchoredLayer(open: boolean, layer: Ref, anchor: Ref, opts: AnchoredLayerOptions): void {
  const { placement, fallback = "bottom", offsetVar, inside, matchWidth, watch } = opts;
  const outside = React.useRef(opts.onOutside), focusOutside = React.useRef(opts.onFocusOutside);
  // every render: keeps the latest callbacks, so the listeners below needn't be added again when they change.
  useIsoLayoutEffect(() => { outside.current = opts.onOutside; focusOutside.current = opts.onFocusOutside; });
  useIsoLayoutEffect(() => {
    const p = layer.current, a = anchor.current;
    if (!p) return;
    if (!open || !a) { hideLayer(p); return; }
    // A first guess at the side before it shows: showing resolves the layer's first style, which is when an entry
    // from @starting-style keyed on data-side (Tooltip's slide) is fixed. placeLayer corrects it on a flip.
    if (!p.dataset.side) p.dataset.side = (placement || fallback || "bottom").split("-")[0];
    showLayer(p);
    // The gap and the page's direction are style reads: once, and again only when sizes change (a density or
    // theme switch), not on every scroll.
    let offset = 0, rtl = false;
    const measure = () => { offset = cssLength(p, offsetVar); rtl = isRtl(); };
    const update = () => {
      if (matchWidth) p.style.minWidth = a.offsetWidth + "px";
      placeLayer(p, a, placement, offset, fallback, rtl);
    };
    const resized = () => { measure(); update(); };
    // Scrolling inside the layer doesn't move it.
    const scrolled = (e: Event) => { if (!(e.target instanceof Node && p.contains(e.target))) update(); };
    resized();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(resized) : null;
    if (ro) { ro.observe(p); ro.observe(a); }
    window.addEventListener("scroll", scrolled, true); window.addEventListener("resize", resized);
    // A phone's keyboard opening, or pinch-zoom, moves the visual viewport without a window resize or scroll.
    const vv = window.visualViewport;
    if (vv) { vv.addEventListener("resize", resized); vv.addEventListener("scroll", update); }
    return () => {
      if (ro) ro.disconnect(); window.removeEventListener("scroll", scrolled, true); window.removeEventListener("resize", resized);
      if (vv) { vv.removeEventListener("resize", resized); vv.removeEventListener("scroll", update); }
    };
  }, [open, layer, anchor, placement, fallback, offsetVar, matchWidth, watch]);
  React.useEffect(() => {
    if (!open) return;
    const within = (t: EventTarget | null, refs: Array<Ref | undefined>) => refs.some((r) => !!r && !!r.current && t instanceof Node && r.current.contains(t));
    // A touch outside waits for its click: a finger that drags (a scroll) gets pointercancel and no click.
    let touch = false;
    const down = (e: PointerEvent) => {
      touch = false;
      if (within(e.target, [layer, inside])) return;
      if (e.pointerType === "touch") touch = true;
      else if (outside.current) { markDismissal(e); outside.current(); }
    };
    const cancel = () => { touch = false; };
    const click = (e: MouseEvent) => {
      if (!touch) return;
      touch = false;
      if (!within(e.target, [layer, inside]) && outside.current) { markDismissal(e); outside.current(); }
    };
    const focus = (e: FocusEvent) => { if (focusOutside.current && !within(e.target, [layer, anchor, inside])) focusOutside.current(); };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointercancel", cancel, true);
    document.addEventListener("click", click, true);
    document.addEventListener("focusin", focus, true);
    // The <dialog> or Drawer it sits in closing (a close() from code, a form's method="dialog") hides it with them,
    // but it stayed open and was back, open, the next time they opened (L8E104).
    const box = layer.current && layer.current.parentElement && layer.current.parentElement.closest("dialog");
    const shut = () => { if (outside.current) outside.current(); };
    if (box) box.addEventListener("close", shut);
    return () => {
      if (box) box.removeEventListener("close", shut);
      document.removeEventListener("pointerdown", down, true); document.removeEventListener("pointercancel", cancel, true);
      document.removeEventListener("click", click, true); document.removeEventListener("focusin", focus, true);
    };
  }, [open, layer, anchor, inside]);
}
