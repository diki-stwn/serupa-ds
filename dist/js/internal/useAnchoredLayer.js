// src/internal/useAnchoredLayer.ts
import * as React from "react";
import { useIsoLayoutEffect } from "./cn.js";
import { markDismissal } from "./layers.js";
import { cssLength, hideLayer, placeLayer, showLayer } from "./position.js";
function useAnchoredLayer(open, layer, anchor, opts) {
  const { placement, fallback = "bottom", offsetVar, inside, matchWidth, watch } = opts;
  const outside = React.useRef(opts.onOutside), focusOutside = React.useRef(opts.onFocusOutside);
  useIsoLayoutEffect(() => {
    outside.current = opts.onOutside;
    focusOutside.current = opts.onFocusOutside;
  });
  useIsoLayoutEffect(() => {
    const p = layer.current, a = anchor.current;
    if (!p) return;
    if (!open || !a) {
      hideLayer(p);
      return;
    }
    showLayer(p);
    const update = () => {
      if (matchWidth) p.style.minWidth = a.offsetWidth + "px";
      placeLayer(p, a, placement, cssLength(p, offsetVar), fallback);
    };
    const scrolled = (e) => {
      if (!(e.target instanceof Node && p.contains(e.target))) update();
    };
    update();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
    if (ro) {
      ro.observe(p);
      ro.observe(a);
    }
    window.addEventListener("scroll", scrolled, true);
    window.addEventListener("resize", update);
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
    }
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("scroll", scrolled, true);
      window.removeEventListener("resize", update);
      if (vv) {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
      }
    };
  }, [open, layer, anchor, placement, fallback, offsetVar, matchWidth, watch]);
  React.useEffect(() => {
    if (!open) return;
    const within = (t, refs) => refs.some((r) => !!r && !!r.current && t instanceof Node && r.current.contains(t));
    let touch = false;
    const down = (e) => {
      touch = false;
      if (within(e.target, [layer, inside])) return;
      if (e.pointerType === "touch") touch = true;
      else if (outside.current) {
        markDismissal(e);
        outside.current();
      }
    };
    const cancel = () => {
      touch = false;
    };
    const click = (e) => {
      if (!touch) return;
      touch = false;
      if (!within(e.target, [layer, inside]) && outside.current) {
        markDismissal(e);
        outside.current();
      }
    };
    const focus = (e) => {
      if (focusOutside.current && !within(e.target, [layer, anchor, inside])) focusOutside.current();
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointercancel", cancel, true);
    document.addEventListener("click", click, true);
    document.addEventListener("focusin", focus, true);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointercancel", cancel, true);
      document.removeEventListener("click", click, true);
      document.removeEventListener("focusin", focus, true);
    };
  }, [open, layer, anchor, inside]);
}
export {
  useAnchoredLayer
};
//# sourceMappingURL=useAnchoredLayer.js.map
