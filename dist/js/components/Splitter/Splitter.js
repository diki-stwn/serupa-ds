"use client";

// src/components/Splitter/Splitter.tsx
import * as React from "react";
import { announce } from "../../internal/announce.js";
import { cn, domId, useIsoLayoutEffect } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useSettings } from "../../internal/provider.js";
import { useServerStyles } from "../../internal/serverStyles.js";
import { useScrolls } from "../../internal/useScrolls.js";
import { warnOnce } from "../../internal/warn.js";
import { en as words } from "./labels.js";
var clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
var read = (key) => {
  if (!key) return null;
  try {
    const n = parseFloat(window.localStorage.getItem(key) || "");
    return isFinite(n) ? n : null;
  } catch {
    return null;
  }
};
var save = (key, n) => {
  if (!key) return;
  try {
    window.localStorage.setItem(key, String(n));
  } catch {
  }
};
var Splitter = /* @__PURE__ */ component("Splitter", function Splitter2(props, ref) {
  const { children, direction: dirIn, size: sizeIn, defaultSize, onSizeChange, min: minIn, max: maxIn, step: stepIn, collapsible, storageKey, separatorLabel, className, ...rest } = props;
  const sds = useSettings(words);
  const styled = useServerStyles();
  const direction = dirIn === "vertical" ? "vertical" : "horizontal";
  const min = clamp(typeof minIn === "number" && isFinite(minIn) ? minIn : 10, 0, 100);
  const max = clamp(typeof maxIn === "number" && isFinite(maxIn) ? maxIn : 90, min, 100);
  const step = typeof stepIn === "number" && stepIn > 0 ? stepIn : 5;
  const fit = (n) => clamp(n, min, max);
  const controlled = sizeIn !== void 0;
  const [own, setOwn] = React.useState(() => defaultSize === 0 && collapsible ? 0 : fit(typeof defaultSize === "number" && isFinite(defaultSize) ? defaultSize : 50));
  const now = React.useRef({ controlled, collapsible, fit });
  now.current = { controlled, collapsible, fit };
  React.useEffect(() => {
    const n = read(storageKey), c = now.current;
    if (!c.controlled && n != null) setOwn(n === 0 && c.collapsible ? 0 : c.fit(n));
  }, [storageKey]);
  const size = controlled ? sizeIn === 0 && collapsible ? 0 : fit(sizeIn) : own;
  const restore = React.useRef(size || fit(50));
  if (size > 0) restore.current = size;
  const root = React.useRef(null);
  const base = domId("dk-splitter", React.useId());
  const panes = React.Children.toArray(children);
  if (process.env.NODE_ENV !== "production" && panes.length !== 2) warnOnce("splitter-two", "Splitter: give it exactly two children, the two panes (it got " + panes.length + ").");
  const change = (n) => {
    setSlide(null);
    const next = Math.round(n * 100) / 100;
    if (next === size) return;
    if (!controlled) {
      setOwn(next);
      save(storageKey, next);
    }
    if (onSizeChange) onSizeChange(next);
  };
  const collapsed = size === 0;
  const rtl = (e) => getComputedStyle(e).direction === "rtl";
  const [slide, setSlide] = React.useState(null);
  const extent = (n) => direction === "horizontal" ? n.offsetWidth : n.offsetHeight;
  const toggle = () => {
    if (!collapsible) return;
    const closing = size > 0;
    change(closing ? 0 : restore.current);
    const moves = paneB && parseFloat(getComputedStyle(paneB).transitionDuration) > 0;
    setSlide(moves ? { to: closing ? "closed" : "open", px: closing && paneA ? extent(paneA) : 0, run: false } : null);
  };
  const onKeyDown = (e) => {
    const horizontal = direction === "horizontal";
    const back2 = horizontal ? rtl(e.currentTarget) ? "ArrowRight" : "ArrowLeft" : "ArrowUp";
    const on = horizontal ? rtl(e.currentTarget) ? "ArrowLeft" : "ArrowRight" : "ArrowDown";
    let to = null;
    if (e.key === back2) to = collapsed ? 0 : fit(size - step);
    else if (e.key === on) to = collapsed ? min : fit(size + step);
    else if (e.key === "Home") to = min;
    else if (e.key === "End") to = max;
    else if (e.key === "Enter" && collapsible) {
      e.preventDefault();
      toggle();
      return;
    } else if (e.key === "Escape" && placing) {
      e.preventDefault();
      e.stopPropagation();
      setPlacing(false);
      return;
    }
    if (to == null) return;
    e.preventDefault();
    change(to);
  };
  const drag = React.useRef(null);
  const [placing, setPlacing] = React.useState(false);
  const handle = React.useRef(null);
  const at = (e) => {
    const r = root.current.getBoundingClientRect();
    const share = direction === "horizontal" ? (rtl(root.current) ? r.right - e.clientX : e.clientX - r.left) / (r.width || 1) : (e.clientY - r.top) / (r.height || 1);
    return fit(share * 100);
  };
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.focus();
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
    }
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved && Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) < 4) return;
    d.moved = true;
    setPlacing(false);
    change(at(e));
  };
  const onPointerUp = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.moved || e.type === "pointercancel") return;
    if (!placing) announce(sds.labels.splitterPlace);
    setPlacing(!placing);
  };
  const onPlace = (e) => {
    if (rest.onPointerDownCapture) rest.onPointerDownCapture(e);
    if (!placing || e.button !== 0 || handle.current && handle.current.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    const swallow = (c) => {
      c.preventDefault();
      c.stopPropagation();
    };
    window.addEventListener("click", swallow, { capture: true, once: true });
    setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 500);
    setPlacing(false);
    change(at(e));
    if (handle.current) handle.current.focus();
  };
  const first = base + "-first";
  const [paneA, setPaneA] = React.useState(null);
  const [paneB, setPaneB] = React.useState(null);
  const scrollsA = useScrolls(paneA);
  const scrollsB = useScrolls(paneB);
  const focusedIn = React.useRef(false);
  useIsoLayoutEffect(() => {
    if (!collapsed || !paneA || !handle.current) return;
    const active = document.activeElement;
    if (paneA.contains(active) || (!active || active === document.body) && focusedIn.current) handle.current.focus();
    focusedIn.current = false;
  }, [collapsed, paneA]);
  useIsoLayoutEffect(() => {
    if (!slide || slide.run) return;
    if (slide.to === "closed" !== collapsed) {
      setSlide(null);
      return;
    }
    if (!slide.px) {
      if (paneA && extent(paneA)) setSlide({ ...slide, px: extent(paneA) });
      else setSlide(null);
      return;
    }
    let f = requestAnimationFrame(() => {
      f = requestAnimationFrame(() => setSlide({ ...slide, run: true }));
    });
    return () => cancelAnimationFrame(f);
  });
  React.useEffect(() => {
    if (!slide || !slide.run || !paneB) return;
    const t = window.setTimeout(() => setSlide(null), Math.max(...getComputedStyle(paneB).transitionDuration.split(",").map((d) => parseFloat(d) * (d.trim().endsWith("ms") ? 1 : 1e3))) + 100);
    return () => window.clearTimeout(t);
  }, [slide, paneB]);
  const sliding = slide && slide.px ? slide : null;
  const along = (v) => direction === "horizontal" ? v + "px 0" : "0 " + v + "px";
  const back = sliding && root.current && direction === "horizontal" && rtl(root.current) ? -1 : 1;
  const shut = direction === "vertical" ? "inset(0 0 100% 0)" : back < 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)";
  const slideStyle = sliding ? { "--dk-splitter-from": along((sliding.to === "open" ? -sliding.px : sliding.px) * back), "--dk-splitter-px": sliding.px + "px", "--dk-splitter-shut": shut } : null;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ...rest,
      style: slideStyle ? { ...rest.style, ...slideStyle } : rest.style,
      ref: (n) => {
        root.current = n;
        styled(n);
        if (typeof ref === "function") ref(n);
        else if (ref) ref.current = n;
      },
      className: cn("dk-splitter", "dk-splitter--" + direction, className),
      "data-component": "splitter",
      "data-direction": direction,
      "data-placing": placing || void 0,
      "data-slide": sliding ? sliding.run ? "run" : "start" : void 0,
      "data-slide-to": sliding ? sliding.to : void 0,
      onPointerDownCapture: onPlace
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: setPaneA,
        id: first,
        tabIndex: scrollsA ? 0 : void 0,
        className: "dk-splitter__pane dk-splitter__pane--first",
        style: { flexBasis: size + "%" },
        hidden: collapsed && !(sliding && sliding.to === "closed") || void 0,
        inert: collapsed && !!sliding || void 0,
        onFocus: () => {
          focusedIn.current = true;
        },
        onBlur: (e) => {
          if (!e.currentTarget.contains(e.relatedTarget) && e.relatedTarget) focusedIn.current = false;
        }
      },
      panes[0]
    ),
    /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: handle,
        role: "separator",
        tabIndex: 0,
        className: "dk-splitter__handle",
        "aria-orientation": direction === "horizontal" ? "vertical" : "horizontal",
        "aria-valuenow": Math.round(size),
        "aria-valuemin": collapsible ? 0 : Math.round(min),
        "aria-valuemax": Math.round(max),
        "aria-controls": first,
        "aria-label": separatorLabel || sds.labels.resizePanes,
        "data-state": collapsed ? "collapsed" : void 0,
        onKeyDown,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel: onPointerUp,
        onDoubleClick: toggle,
        onBlur: () => setPlacing(false)
      }
    ),
    /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: setPaneB,
        tabIndex: scrollsB ? 0 : void 0,
        className: "dk-splitter__pane dk-splitter__pane--second",
        onTransitionEnd: (e) => {
          if (e.target === e.currentTarget && e.propertyName === "translate" && slide && slide.run) setSlide(null);
        }
      },
      panes[1]
    )
  );
});
export {
  Splitter
};
//# sourceMappingURL=Splitter.js.map
