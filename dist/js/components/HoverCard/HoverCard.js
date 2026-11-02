"use client";

// src/components/HoverCard/HoverCard.tsx
import * as React from "react";
import { cn, domId, elementRef, omit, setRef } from "../../internal/cn.js";
import { oneElement, useTriggerRef } from "../../internal/trigger.js";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer.js";
import { useExit } from "../../internal/useExit.js";
import { component } from "../../internal/component.js";
import { isComposing } from "../../internal/ime.js";
import { cardIntent, cardLeave } from "../../internal/timing.js";
var OWN = { trigger: 1, children: 1, placement: 1, openDelay: 1, closeDelay: 1, open: 1, defaultOpen: 1, onOpenChange: 1, disabled: 1, className: 1, style: 1, onBlur: 1, onFocus: 1, onPointerEnter: 1, onPointerLeave: 1 };
var HoverCard = /* @__PURE__ */ component("HoverCard", function HoverCard2(props, ref) {
  const own = domId("dk-hcard", React.useId());
  const id = props.id || own;
  const [inner, setInner] = React.useState(!!props.defaultOpen);
  const controlled = props.open !== void 0;
  const open = !props.disabled && (controlled ? !!props.open : inner);
  const cardRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const timer = React.useRef(void 0);
  const ask = React.useRef(props.onOpenChange);
  ask.current = props.onOpenChange;
  const openRef = React.useRef(open);
  openRef.current = open;
  const set = React.useCallback((v, reason) => {
    window.clearTimeout(timer.current);
    if (v === openRef.current) return;
    if (!controlled) setInner(v);
    if (ask.current) ask.current(v, { reason });
  }, [controlled]);
  const muted = React.useRef(false);
  const armed = React.useRef(null);
  const unarm = () => {
    if (armed.current) document.removeEventListener("keydown", armed.current, true);
    armed.current = null;
  };
  const later = (v, ms, reason) => {
    window.clearTimeout(timer.current);
    unarm();
    if (v && muted.current) return;
    timer.current = window.setTimeout(() => {
      unarm();
      set(v, reason);
    }, ms);
    if (!v || openRef.current) return;
    const esc = (e) => {
      if (e.key !== "Escape" || isComposing(e)) return;
      window.clearTimeout(timer.current);
      unarm();
      muted.current = true;
    };
    armed.current = esc;
    document.addEventListener("keydown", esc, true);
  };
  const unmute = () => {
    muted.current = false;
  };
  const stay = () => window.clearTimeout(timer.current);
  React.useEffect(() => () => {
    window.clearTimeout(timer.current);
    unarm();
  }, []);
  const openDelay = props.openDelay == null ? cardIntent : props.openDelay;
  const closeDelay = props.closeDelay == null ? cardLeave : props.closeDelay;
  const exit = useExit(open, cardRef);
  useAnchoredLayer(open, cardRef, triggerRef, { placement: props.placement, offsetVar: "--dk-hover-card-offset", watch: props.children, onOutside: () => set(false, "outside"), inside: triggerRef });
  React.useEffect(() => {
    if (!open) return;
    const esc = (e) => {
      if (e.key !== "Escape" || isComposing(e)) return;
      e.preventDefault();
      e.stopPropagation();
      const card = cardRef.current, back = !!card && card.contains(e.target);
      set(false, "escape");
      if (back && triggerRef.current) triggerRef.current.focus();
    };
    document.addEventListener("keydown", esc, true);
    return () => document.removeEventListener("keydown", esc, true);
  }, [open, set]);
  const within = (to) => !!to && (!!cardRef.current && cardRef.current.contains(to) || !!triggerRef.current && triggerRef.current.contains(to));
  const blurred = (e) => {
    if (!within(e.relatedTarget)) {
      unmute();
      later(false, closeDelay, "blur");
    }
  };
  const touch = (e) => "pointerType" in e && e.pointerType === "touch";
  const child = oneElement(props.trigger, "HoverCard", "trigger");
  useTriggerRef(triggerRef, "HoverCard");
  const cp = child.props;
  const childRef = elementRef(child);
  const chain = (name, fn) => (e) => {
    const f = cp[name];
    if (typeof f === "function") f(e);
    fn(e);
  };
  const trigger = React.cloneElement(child, {
    ref: (n) => {
      triggerRef.current = n;
      if (childRef) setRef(childRef, n);
    },
    // Pointer events, not mouse events: a tap sends a mouseenter and never a mouseleave. A touch pointer doesn't hover.
    onPointerEnter: chain("onPointerEnter", (e) => {
      if (touch(e)) return;
      if (openRef.current) stay();
      else later(true, openDelay, "hover");
    }),
    onPointerLeave: chain("onPointerLeave", (e) => {
      if (!touch(e)) {
        unmute();
        later(false, closeDelay, "hover");
      }
    }),
    // Keyboard focus only (focus-visible): a click on the link is on its way to the page it opens.
    onFocus: chain("onFocus", (e) => {
      const t = e.target;
      if (openRef.current) stay();
      else if (!t.matches || t.matches(":focus-visible")) later(true, openDelay, "focus");
    }),
    onBlur: chain("onBlur", blurred)
  });
  return /* @__PURE__ */ React.createElement(React.Fragment, null, trigger, /* @__PURE__ */ React.createElement(
    "div",
    {
      ...omit(props, OWN),
      ref: (n) => {
        cardRef.current = n;
        setRef(ref, n);
      },
      id,
      ...{ popover: "manual" },
      hidden: !open || void 0,
      className: cn("dk-hover-card", props.className),
      style: props.style,
      "data-component": "hover-card",
      "data-state": open ? "open" : "closed",
      "data-instant": exit.instant ? "" : void 0,
      inert: !open || void 0,
      onPointerEnter: (e) => {
        if (props.onPointerEnter) props.onPointerEnter(e);
        stay();
      },
      onPointerLeave: (e) => {
        if (props.onPointerLeave) props.onPointerLeave(e);
        if (!touch(e)) later(false, closeDelay, "hover");
      },
      onFocus: (e) => {
        if (props.onFocus) props.onFocus(e);
        stay();
      },
      onBlur: (e) => {
        if (props.onBlur) props.onBlur(e);
        blurred(e);
      }
    },
    open || exit.leaving ? props.children : null
  ));
});
export {
  HoverCard
};
//# sourceMappingURL=HoverCard.js.map
