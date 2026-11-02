"use client";

// src/components/Tooltip/Tooltip.tsx
import * as React from "react";
import { cn, domId, elementRef, omit, setRef } from "../../internal/cn.js";
import { oneElement, useTriggerRef } from "../../internal/trigger.js";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer.js";
import { named } from "../../internal/component.js";
import { isComposing } from "../../internal/ime.js";
import { hoverIntent, hoverLeave, hoverWarm } from "../../internal/timing.js";
import { warnOnce } from "../../internal/warn.js";
var warm = { until: 0, owner: null, close: null };
function coolTooltips() {
  warm.until = 0;
}
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
  const shown = React.useRef(open);
  shown.current = open;
  const off = React.useRef(props.disabled);
  off.current = props.disabled;
  const set = React.useCallback((v, reason) => {
    window.clearTimeout(timer.current);
    if (v === shown.current || v && off.current) return;
    if (!controlled) {
      shown.current = v;
      setInner(v);
    }
    if (onOpenChange.current) onOpenChange.current(v, { reason });
  }, [controlled]);
  const armed = React.useRef(null);
  const unarm = () => {
    if (armed.current) document.removeEventListener("keydown", armed.current, true);
    armed.current = null;
  };
  const later = (v, ms) => {
    window.clearTimeout(timer.current);
    unarm();
    timer.current = window.setTimeout(() => {
      unarm();
      set(v, "hover");
    }, ms);
    if (!v || shown.current) return;
    const esc = (e) => {
      if (e.key === "Escape" && !isComposing(e)) {
        window.clearTimeout(timer.current);
        unarm();
      }
    };
    armed.current = esc;
    document.addEventListener("keydown", esc, true);
  };
  React.useEffect(() => () => {
    window.clearTimeout(timer.current);
    unarm();
  }, []);
  const self = React.useRef({});
  const [instant, setInstant] = React.useState(open);
  const [handed, setHanded] = React.useState(false);
  if (open && handed) setHanded(false);
  React.useEffect(() => {
    if (!open) return;
    const me = self.current;
    if (warm.close && warm.owner !== me) warm.close();
    warm.owner = me;
    warm.close = () => {
      setHanded(true);
      set(false, "hover");
    };
    return () => {
      if (warm.owner === me) {
        warm.owner = null;
        warm.close = null;
      }
      warm.until = Date.now() + hoverWarm;
    };
  }, [open, set]);
  useAnchoredLayer(open, tipRef, anchorRef, { placement: props.placement, fallback: "top", offsetVar: "--dk-tooltip-offset", watch: props.content, onOutside: () => set(false, "outside") });
  React.useEffect(() => {
    const tip = tipRef.current;
    if (process.env.NODE_ENV !== "production" && tip && tip.querySelector("a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]")) warnOnce("tooltip-interactive", "Tooltip: its content holds a link, button or field, and nobody can use it: focus leaving the element hides the tooltip, so the keyboard can't reach it, and touch screens never show it. Keep content to plain text; for anything people press, use a Popover.");
  }, [props.content]);
  React.useEffect(() => {
    if (!open) return;
    const esc = (e) => {
      if (e.key === "Escape" && !isComposing(e)) {
        e.preventDefault();
        e.stopPropagation();
        set(false, "escape");
      }
    };
    document.addEventListener("keydown", esc, true);
    return () => document.removeEventListener("keydown", esc, true);
  }, [open, set]);
  const child = oneElement(props.children, "Tooltip", "child");
  useTriggerRef(anchorRef, "Tooltip");
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
  const delay = props.delay == null ? hoverIntent : props.delay;
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
      if (!touch(e)) {
        const w = !!warm.owner || Date.now() < warm.until;
        setInstant(w);
        if (w) set(true, "hover");
        else later(true, delay);
      }
    }),
    onPointerLeave: chain("onPointerLeave", (e) => {
      if (!touch(e)) later(false, hoverLeave);
    }),
    onFocus: chain("onFocus", (e) => {
      const t = e.target;
      if (!t.matches || t.matches(":focus-visible")) {
        setInstant(!!warm.owner || Date.now() < warm.until);
        set(true, "focus");
      }
    }),
    onBlur: chain("onBlur", () => set(false, "blur")),
    onPointerDown: chain("onPointerDown", () => set(false, "trigger"))
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
      "data-warm": open && instant || !open && handed ? "" : void 0,
      onMouseEnter: () => window.clearTimeout(timer.current),
      onMouseLeave: () => later(false, hoverLeave)
    },
    props.content
  ));
});
export {
  Tooltip,
  coolTooltips
};
//# sourceMappingURL=Tooltip.js.map
