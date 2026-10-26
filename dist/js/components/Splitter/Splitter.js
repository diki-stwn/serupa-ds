"use client";

// src/components/Splitter/Splitter.tsx
import * as React from "react";
import { cn, domId } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useSerupa } from "../../internal/provider.js";
import { warnOnce } from "../../internal/warn.js";
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
  const sds = useSerupa();
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
    const next = Math.round(n * 100) / 100;
    if (next === size) return;
    if (!controlled) {
      setOwn(next);
      save(storageKey, next);
    }
    if (onSizeChange) onSizeChange(next);
  };
  const collapsed = size === 0;
  const toggle = () => {
    if (collapsible) change(size > 0 ? 0 : restore.current);
  };
  const rtl = (e) => getComputedStyle(e).direction === "rtl";
  const onKeyDown = (e) => {
    const horizontal = direction === "horizontal";
    const back = horizontal ? rtl(e.currentTarget) ? "ArrowRight" : "ArrowLeft" : "ArrowUp";
    const on = horizontal ? rtl(e.currentTarget) ? "ArrowLeft" : "ArrowRight" : "ArrowDown";
    let to = null;
    if (e.key === back) to = collapsed ? 0 : fit(size - step);
    else if (e.key === on) to = collapsed ? min : fit(size + step);
    else if (e.key === "Home") to = min;
    else if (e.key === "End") to = max;
    else if (e.key === "Enter" && collapsible) {
      e.preventDefault();
      toggle();
      return;
    }
    if (to == null) return;
    e.preventDefault();
    change(to);
  };
  const drag = React.useRef(null);
  const at = (e) => {
    const r = root.current.getBoundingClientRect();
    const share = direction === "horizontal" ? (rtl(root.current) ? r.right - e.clientX : e.clientX - r.left) / (r.width || 1) : (e.clientY - r.top) / (r.height || 1);
    return fit(share * 100);
  };
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.focus();
    if (typeof e.currentTarget.setPointerCapture === "function") e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId };
  };
  const onPointerMove = (e) => {
    if (drag.current && drag.current.id === e.pointerId) change(at(e));
  };
  const onPointerUp = (e) => {
    if (drag.current && drag.current.id === e.pointerId) drag.current = null;
  };
  const first = base + "-first";
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ...rest,
      ref: (n) => {
        root.current = n;
        if (typeof ref === "function") ref(n);
        else if (ref) ref.current = n;
      },
      className: cn("dk-splitter", "dk-splitter--" + direction, className),
      "data-component": "splitter",
      "data-direction": direction
    },
    /* @__PURE__ */ React.createElement("div", { id: first, className: "dk-splitter__pane dk-splitter__pane--first", style: { flexBasis: size + "%" }, hidden: collapsed || void 0 }, panes[0]),
    /* @__PURE__ */ React.createElement(
      "div",
      {
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
        onDoubleClick: toggle
      }
    ),
    /* @__PURE__ */ React.createElement("div", { className: "dk-splitter__pane dk-splitter__pane--second" }, panes[1])
  );
});
export {
  Splitter
};
//# sourceMappingURL=Splitter.js.map
