"use client";

// src/components/Popover/Popover.tsx
import * as React from "react";
import { cn, domId, elementRef, setRef, useIsoLayoutEffect } from "../../internal/cn.js";
import { oneElement, useTriggerRef } from "../../internal/trigger.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import "../../internal/position.js";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer.js";
import { named } from "../../internal/component.js";
import { isComposing } from "../../internal/ime.js";
var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
var Popover = /* @__PURE__ */ named("Popover", function Popover2(props) {
  const nameRef = useNameCheck("Popover", NAME_HOW.title);
  const id = domId("dk-pop", React.useId());
  const [inner, setInner] = React.useState(!!props.defaultOpen);
  const controlled = props.open !== void 0;
  const open = controlled ? !!props.open : inner;
  const panelRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const ask = React.useRef(props.onOpenChange);
  ask.current = props.onOpenChange;
  const set = React.useCallback((v, reason) => {
    if (!controlled) setInner(v);
    if (ask.current) ask.current(v, { reason });
  }, [controlled]);
  const close = React.useCallback((reason, focusTrigger) => {
    set(false, reason);
    if (focusTrigger && triggerRef.current) triggerRef.current.focus();
  }, [set]);
  const focusFirst = props.initialFocus !== "panel";
  useAnchoredLayer(open, panelRef, triggerRef, { placement: props.placement, offsetVar: "--dk-popover-offset", onOutside: () => close("outside", false), inside: triggerRef });
  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const first = focusFirst ? panel.querySelector(FOCUSABLE) : null;
    (first || panel).focus();
  }, [open]);
  const onKeyDown = (e) => {
    if (e.key === "Escape" && !isComposing(e)) {
      e.preventDefault();
      e.stopPropagation();
      close("escape", true);
    }
  };
  const onBlur = (e) => {
    const to = e.relatedTarget;
    if (!to) return;
    if (panelRef.current && panelRef.current.contains(to)) return;
    if (triggerRef.current && triggerRef.current.contains(to)) return;
    close("blur", false);
  };
  const child = oneElement(props.trigger, "Popover", "trigger");
  useTriggerRef(triggerRef, "Popover");
  const cp = child.props;
  const childRef = elementRef(child);
  const trigger = React.cloneElement(child, {
    ref: (n) => {
      triggerRef.current = n;
      if (childRef) setRef(childRef, n);
    },
    "aria-haspopup": "dialog",
    "aria-expanded": open,
    "aria-controls": open ? id : void 0,
    onClick: (e) => {
      if (cp.onClick) cp.onClick(e);
      if (e.defaultPrevented) return;
      set(!open, "trigger");
    }
  });
  const titled = props.title != null && props.title !== false && props.title !== "";
  const H = "h" + ([2, 3, 4, 5, 6].indexOf(props.headingLevel) >= 0 ? props.headingLevel : 2);
  const content = typeof props.children === "function" ? props.children(() => close("close", true)) : props.children;
  return /* @__PURE__ */ React.createElement(React.Fragment, null, trigger, /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: (n) => {
        panelRef.current = n;
        if (!titled) nameRef(n);
      },
      id,
      role: "dialog",
      tabIndex: -1,
      ...{ popover: "manual" },
      hidden: !open || void 0,
      "aria-labelledby": titled ? id + "-title" : void 0,
      "aria-label": titled ? void 0 : props["aria-label"],
      className: cn("dk-popover", props.className),
      style: props.style,
      "data-component": "popover",
      "data-state": open ? "open" : "closed",
      onKeyDown,
      onBlur
    },
    open ? /* @__PURE__ */ React.createElement(React.Fragment, null, titled ? /* @__PURE__ */ React.createElement(H, { id: id + "-title", className: "dk-popover__title" }, props.title) : null, /* @__PURE__ */ React.createElement("div", { className: "dk-popover__body" }, content)) : null
  ));
});
export {
  Popover
};
//# sourceMappingURL=Popover.js.map
