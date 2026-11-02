"use client";

// src/components/Accordion/Accordion.tsx
import * as React from "react";
import { cn, domId, oneOf, omit } from "../../internal/cn.js";
import { Icon } from "../Icon/Icon.js";
import { component } from "../../internal/component.js";
import { flattenChildren } from "../../internal/children.js";
import * as icons from "../../material/builtin.js";
import { useSettings } from "../../internal/provider.js";
import { warnOnce } from "../../internal/warn.js";
import { revealInvalid } from "../../internal/untilFound.js";
import { buttonClass } from "../Button/buttonClass.js";
import { en as words } from "./labels.js";
var toMs = (t) => (parseFloat(t) || 0) * (t.trim().endsWith("ms") ? 1 : 1e3);
var AccordionContext = /* @__PURE__ */ React.createContext(null);
var Accordion = /* @__PURE__ */ component("Accordion", function Accordion2(props, ref) {
  const rest = omit(props, { type: 1, value: 1, defaultValue: 1, onValueChange: 1, collapsible: 1, variant: 1, headingLevel: 1, showExpandAll: 1, className: 1, children: 1, onKeyDown: 1 });
  const labels = useSettings(words).labels;
  const single = props.type !== "multiple";
  const controlled = props.value !== void 0;
  const [inner, setInner] = React.useState(() => (props.defaultValue || []).slice(0, single ? 1 : void 0));
  const open = controlled ? props.value : inner;
  if (process.env.NODE_ENV !== "production" && single && controlled && open.length > 1) warnOnce("accordion-single-value", `Accordion: value has ${open.length} items with type="single", so ${open.length} items show open; pass one value, or type="multiple".`);
  const collapsible = props.collapsible !== false;
  const onChange = React.useRef(props.onValueChange);
  onChange.current = props.onValueChange;
  const change = React.useCallback((next) => {
    if (!controlled) setInner(next);
    if (onChange.current) onChange.current(next);
  }, [controlled]);
  const toggle = React.useCallback((v) => {
    const isOpen = open.indexOf(v) >= 0;
    let next;
    if (single) next = isOpen ? collapsible ? [] : open : [v];
    else next = isOpen ? open.filter((x) => x !== v) : open.concat(v);
    if (next !== open) change(next);
  }, [open, single, collapsible, change]);
  const level = [2, 3, 4, 5, 6].indexOf(props.headingLevel) >= 0 ? props.headingLevel : 3;
  const variant = oneOf(["plain", "card"], props.variant, "plain");
  function onKeyDown(e) {
    if (props.onKeyDown) props.onKeyDown(e);
    const t = e.target;
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !t.classList.contains("dk-accordion__trigger") || t.closest(".dk-accordion") !== e.currentTarget) return;
    const all2 = Array.from(e.currentTarget.querySelectorAll(".dk-accordion__trigger")).filter((b) => b.closest(".dk-accordion") === e.currentTarget && !b.disabled && b.getClientRects().length > 0);
    const i = all2.indexOf(t);
    const to = e.key === "ArrowDown" ? all2[(i + 1) % all2.length] : e.key === "ArrowUp" ? all2[(i - 1 + all2.length) % all2.length] : e.key === "Home" ? all2[0] : e.key === "End" ? all2[all2.length - 1] : null;
    if (to) {
      e.preventDefault();
      to.focus();
    }
  }
  let n = 0;
  const items = flattenChildren(props.children).map((c) => React.isValidElement(c) ? React.cloneElement(c, { "data-index": String(n++) }) : c);
  const many = !single && items.filter(React.isValidElement).length > 6;
  let all = null;
  if (props.showExpandAll && !single) {
    const values = items.flatMap((c) => {
      if (!React.isValidElement(c)) return [];
      const p = c.props;
      return p.disabled ? [] : [p.value != null ? p.value : String(p["data-index"])];
    });
    const allOpen = values.length > 0 && values.every((v) => open.indexOf(v) >= 0);
    const onAll = () => change(allOpen ? open.filter((v) => values.indexOf(v) < 0) : open.concat(values.filter((v) => open.indexOf(v) < 0)));
    all = /* @__PURE__ */ React.createElement("div", { className: "dk-accordion__toolbar" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: buttonClass({ variant: "link", size: "sm", className: "dk-accordion__all" }), onClick: onAll, disabled: !values.length }, allOpen ? labels.collapseAll : labels.expandAll));
  }
  return /* @__PURE__ */ React.createElement(AccordionContext.Provider, { value: { open, toggle, level, collapsible, single, many } }, /* @__PURE__ */ React.createElement("div", { ...rest, ref, onKeyDown, "data-component": "accordion", className: cn("dk-accordion", variant === "card" && "dk-accordion--card", props.className) }, all, items));
});
var AccordionItem = /* @__PURE__ */ component("AccordionItem", function AccordionItem2(props, ref) {
  const ctx = React.useContext(AccordionContext);
  const rest = omit(props, { value: 1, title: 1, disabled: 1, keepMounted: 1, className: 1, children: 1 });
  const index = String(rest["data-index"] || "0");
  delete rest["data-index"];
  const value = props.value != null ? props.value : index;
  const open = !!ctx && ctx.open.indexOf(value) >= 0;
  const id = domId("dk-acc", React.useId());
  const locked = !!ctx && open && ctx.single && !ctx.collapsible;
  const H = "h" + (ctx ? ctx.level : 3);
  const [startsClosed] = React.useState(!open);
  const content = React.useRef(null);
  const toggle = React.useRef(null);
  toggle.current = ctx && !open && !props.disabled ? () => ctx.toggle(value) : null;
  const findable = !props.disabled;
  const keep = props.keepMounted !== false;
  const [mounted, setMounted] = React.useState(open || keep);
  if ((open || keep) && !mounted) setMounted(true);
  React.useLayoutEffect(function() {
    const el = content.current, panel = el && el.closest(".dk-accordion__panel");
    if (!el || !panel) return;
    if (open || !findable && keep) {
      el.removeAttribute("hidden");
      return;
    }
    const style = getComputedStyle(panel);
    const delays = style.transitionDelay.split(",");
    const ms = Math.max(0, ...style.transitionDuration.split(",").map((d, i) => toMs(d) + toMs(delays[i] || "0")));
    const hold = (on) => {
      panel.style.contentVisibility = on ? "visible" : "";
    };
    const hide = () => {
      hold(false);
      if (grow.current) grow.current.cancel();
      if (findable) el.setAttribute("hidden", "until-found");
      if (!keep) setMounted(false);
    };
    if (ms) hold(true);
    if (!ms || !el.isConnected || panel.getBoundingClientRect().height === 0) {
      hide();
      return;
    }
    const t = setTimeout(hide, ms);
    return () => {
      clearTimeout(t);
      hold(false);
    };
  }, [open, findable, keep]);
  const grow = React.useRef(null);
  const was = React.useRef(open);
  React.useLayoutEffect(function() {
    const panel = content.current && content.current.closest(".dk-accordion__panel");
    if (!panel || was.current === open) return;
    was.current = open;
    const from = grow.current ? panel.getBoundingClientRect().height : open ? 0 : panel.offsetHeight;
    if (grow.current) {
      grow.current.cancel();
      grow.current = null;
    }
    const fade = typeof panel.getAnimations === "function" ? panel.getAnimations().find((a) => a.transitionProperty === "opacity") : null;
    const timing = fade && fade.effect ? fade.effect.getTiming() : null;
    if (!timing || !timing.duration || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const to = open ? panel.offsetHeight : 0;
    if (from === to) return;
    const easing = open ? timing.easing : getComputedStyle(panel).getPropertyValue("--ease-move").trim() || timing.easing;
    grow.current = panel.animate({ height: [from + "px", to + "px"] }, { duration: timing.duration, easing, fill: open ? "none" : "forwards" });
    grow.current.id = "dk-accordion-height";
    if (open) grow.current.onfinish = () => {
      grow.current = null;
    };
  }, [open]);
  React.useEffect(() => () => {
    if (grow.current) grow.current.cancel();
  }, []);
  React.useEffect(function() {
    const el = content.current;
    if (!el) return;
    const onMatch = () => {
      if (toggle.current) toggle.current();
    };
    el.addEventListener("beforematch", onMatch);
    el.addEventListener("invalid", revealInvalid, true);
    return () => {
      el.removeEventListener("beforematch", onMatch);
      el.removeEventListener("invalid", revealInvalid, true);
    };
  }, []);
  return /* @__PURE__ */ React.createElement("div", { ...rest, ref, "data-state": open ? "open" : "closed", className: cn("dk-accordion__item", open && "dk-accordion__item--open", props.disabled && "dk-accordion__item--disabled", props.className) }, /* @__PURE__ */ React.createElement(H, { className: "dk-accordion__heading" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      id: id + "-t",
      className: "dk-accordion__trigger",
      "aria-expanded": open,
      "aria-controls": id + "-p",
      disabled: props.disabled,
      "aria-disabled": locked ? true : void 0,
      onClick: () => {
        if (ctx && !locked) ctx.toggle(value);
      }
    },
    /* @__PURE__ */ React.createElement("span", { className: "dk-accordion__title" }, props.title),
    /* @__PURE__ */ React.createElement(Icon, { icon: icons.ExpandMore, className: "dk-accordion__icon" })
  )), /* @__PURE__ */ React.createElement("div", { id: id + "-p", role: open && !(ctx && ctx.many) ? "region" : void 0, "aria-labelledby": id + "-t", className: "dk-accordion__panel" }, /* @__PURE__ */ React.createElement("div", { className: "dk-accordion__clip" }, /* @__PURE__ */ React.createElement("div", { ref: content, className: "dk-accordion__content", hidden: startsClosed || void 0 }, mounted ? props.children : null))));
});
export {
  Accordion,
  AccordionItem
};
//# sourceMappingURL=Accordion.js.map
