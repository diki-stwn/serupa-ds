"use client";

// src/components/Tooltip/Tooltip.tsx
import * as React from "react";
import { cn, domId, elementRef, omit, setRef } from "../../internal/cn.js";
import "../../internal/position.js";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer.js";
import { named } from "../../internal/component.js";
import { isComposing } from "../../internal/ime.js";
var OWN = { content: 1, children: 1, placement: 1, delay: 1, role: 1, open: 1, defaultOpen: 1, onOpenChange: 1, disabled: 1, className: 1, style: 1, ref: 1 };
var Tooltip = /* @__PURE__ */ named("Tooltip", function Tooltip2(props) {
  const id = domId("dk-tip", React.useId());
  const [inner, setInner] = React.useState(!!props.defaultOpen);
  const controlled = props.open !== void 0;
  const open = !props.disabled && (controlled ? !!props.open : inner);
  const tipRef = React.useRef(null);
  const anchorRef = React.useRef(null);
  const timer = React.useRef(void 0);
  const onOpenChange = React.useRef(props.onOpenChange);
  onOpenChange.current = props.onOpenChange;
  const set = React.useCallback((v) => {
    window.clearTimeout(timer.current);
    if (!controlled) setInner(v);
    if (onOpenChange.current) onOpenChange.current(v);
  }, [controlled]);
  const later = (v, ms) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => set(v), ms);
  };
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  useAnchoredLayer(open, tipRef, anchorRef, { placement: props.placement, fallback: "top", offsetVar: "--dk-tooltip-offset", watch: props.content, onOutside: () => set(false) });
  React.useEffect(() => {
    if (!open) return;
    const esc = (e) => {
      if (e.key === "Escape" && !isComposing(e)) {
        e.preventDefault();
        e.stopPropagation();
        set(false);
      }
    };
    document.addEventListener("keydown", esc, true);
    return () => document.removeEventListener("keydown", esc, true);
  }, [open, set]);
  const child = React.Children.only(props.children);
  const passed = omit(props, OWN);
  const fwd = {};
  for (const k in passed) {
    const own = child.props[k], add = passed[k];
    fwd[k] = typeof own === "function" && typeof add === "function" ? (e) => {
      own(e);
      add(e);
    } : k === "id" && own ? own : (k === "aria-describedby" || k === "aria-labelledby") && typeof own === "string" && typeof add === "string" ? own + " " + add : add;
  }
  const cp = { ...child.props, ...fwd };
  const passedRef = props.ref;
  const delay = props.delay == null ? 400 : props.delay;
  const touch = (e) => "pointerType" in e && e.pointerType === "touch";
  const chain = (name, fn) => (e) => {
    const own = cp[name];
    if (typeof own === "function") own(e);
    fn(e);
  };
  const childRef = elementRef(child);
  const aria = props.role === "label" ? "aria-labelledby" : "aria-describedby";
  const merged = [cp[aria], id].filter(Boolean).join(" ");
  const trigger = React.cloneElement(child, {
    ...fwd,
    ref: (n) => {
      anchorRef.current = n;
      if (childRef) setRef(childRef, n);
      if (passedRef) setRef(passedRef, n);
    },
    [aria]: merged,
    // Pointer events, not mouse events: a tap sends a mouseenter after its pointerdown and never a mouseleave, so the
    // tooltip opened 400ms after a tap and stayed. A touch pointer doesn't hover; focus still shows it from the keyboard.
    onPointerEnter: chain("onPointerEnter", (e) => {
      if (!touch(e)) later(true, delay);
    }),
    onPointerLeave: chain("onPointerLeave", (e) => {
      if (!touch(e)) later(false, 100);
    }),
    onFocus: chain("onFocus", (e) => {
      const t = e.target;
      if (!t.matches || t.matches(":focus-visible")) set(true);
    }),
    onBlur: chain("onBlur", () => set(false)),
    onPointerDown: chain("onPointerDown", () => set(false))
  });
  return /* @__PURE__ */ React.createElement(React.Fragment, null, trigger, /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: tipRef,
      id,
      role: "tooltip",
      ...{ popover: "manual" },
      hidden: !open || void 0,
      className: cn("dk-tooltip", props.className),
      style: props.style,
      "data-component": "tooltip",
      "data-state": open ? "open" : "closed",
      onMouseEnter: () => window.clearTimeout(timer.current),
      onMouseLeave: () => later(false, 100)
    },
    props.content
  ));
});
export {
  Tooltip
};
//# sourceMappingURL=Tooltip.js.map
