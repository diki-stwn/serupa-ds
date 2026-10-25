"use client";

// src/components/Tabs/Tabs.tsx
import * as React from "react";
import { cn, domId, oneOf, omit, setRef, useIsoLayoutEffect } from "../../internal/cn.js";
import "../Icon/Icon.js";
import { asIcon } from "../Icon/asIcon.js";
import { component } from "../../internal/component.js";
import { warnOnce } from "../../internal/warn.js";
var TabsContext = /* @__PURE__ */ React.createContext(null);
var useTabs = (who) => {
  const c = React.useContext(TabsContext);
  if (!c) throw new Error("Serupa: " + who + " must be inside <Tabs>.");
  return c;
};
var safe = (v) => String(v).replace(/[^A-Za-z0-9_-]/g, "_");
function firstTab(children) {
  let found = null;
  React.Children.forEach(children, (c) => {
    if (found != null || !React.isValidElement(c)) return;
    const p = c.props;
    if (c.type === Tab) {
      if (!p.disabled && p.value != null) found = p.value;
      return;
    }
    found = firstTab(p.children);
  });
  return found;
}
var Tabs = /* @__PURE__ */ component("Tabs", function Tabs2(props, ref) {
  const rest = omit(props, { value: 1, defaultValue: 1, onValueChange: 1, variant: 1, size: 1, activation: 1, orientation: 1, className: 1 });
  const vertical = props.orientation === "vertical";
  const base = domId("dk-tabs", React.useId());
  const controlled = props.value !== void 0;
  const [inner, setInner] = React.useState(() => props.defaultValue != null ? props.defaultValue : firstTab(props.children));
  const value = controlled ? props.value : inner;
  const onChange = React.useRef(props.onValueChange);
  onChange.current = props.onValueChange;
  const select = React.useCallback((v) => {
    if (!controlled) setInner(v);
    if (onChange.current) onChange.current(v);
  }, [controlled]);
  const variant = oneOf(["line", "pill"], props.variant, "line");
  const size = oneOf(["sm", "md"], props.size, "md");
  const [panels, setPanels] = React.useState({});
  const register = React.useCallback((v, d) => setPanels((p) => Object.assign({}, p, { [v]: (p[v] || 0) + d })), []);
  const [stop, setStop] = React.useState(null);
  const ctx = React.useMemo(() => ({ base, value, select, manual: props.activation === "manual", vertical, panels, register, stop }), [base, value, select, props.activation, vertical, panels, register, stop]);
  const self = React.useRef(null);
  const order = React.useRef([]);
  useIsoLayoutEffect(() => {
    if (!self.current) return;
    const tabs = Array.from(self.current.querySelectorAll('[role="tab"]')).filter((t) => t.id.startsWith(base + "-tab-"));
    const all = tabs.map((t) => t.dataset.value), enabled = tabs.filter((t) => !t.hasAttribute("disabled")).map((t) => t.dataset.value);
    const before = order.current;
    order.current = all;
    const matched = value != null && all.includes(value);
    setStop(matched || !enabled.length ? null : enabled[0]);
    if (!enabled.length || matched) return;
    if (controlled) {
      if (value != null && before.includes(value)) warnOnce("tabs-removed", `Tabs: the selected tab "${value}" was removed, so no tab is selected. Set value to another tab when you remove it.`);
      else if (value != null) warnOnce("tabs-value", `Tabs: value "${value}" matches no Tab, so no tab is selected. Set it to one of the Tabs' values.`);
      return;
    }
    const at = value != null ? before.indexOf(value) : -1;
    if (at < 0 && value != null && !before.length) warnOnce("tabs-value", `Tabs: defaultValue "${value}" matches no Tab, so the first tab is selected. Set it to one of the Tabs' values.`);
    if (at < 0) {
      setInner(enabled[0]);
      return;
    }
    const after = before.slice(at + 1).find((v) => enabled.includes(v)), prev = before.slice(0, at).reverse().find((v) => enabled.includes(v));
    select(after ?? prev ?? enabled[0]);
  });
  return /* @__PURE__ */ React.createElement(TabsContext.Provider, { value: ctx }, /* @__PURE__ */ React.createElement(
    "div",
    {
      ...rest,
      ref: (n) => {
        self.current = n;
        if (typeof ref === "function") ref(n);
        else if (ref) ref.current = n;
      },
      className: cn("dk-tabs", "dk-tabs--" + variant, size === "sm" && "dk-tabs--sm", vertical && "dk-tabs--vertical", props.className),
      "data-component": "tabs",
      "data-variant": variant,
      "data-orientation": vertical ? "vertical" : "horizontal"
    }
  ));
});
var TabList = /* @__PURE__ */ component("TabList", function TabList2(props, ref) {
  const ctx = useTabs("TabList");
  const list = React.useRef(null);
  const [fade, setFade] = React.useState({ before: false, after: false });
  const measure = React.useCallback(() => {
    const el = list.current;
    if (!el) return;
    const v = ctx.vertical, max = v ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
    let at = v ? el.scrollTop : el.scrollLeft;
    if (!v && getComputedStyle(el).direction === "rtl") at = max + at;
    const next = { before: max > 1 && at > 1, after: max > 1 && at < max - 1 };
    setFade((f) => f.before === next.before && f.after === next.after ? f : next);
  }, [ctx.vertical]);
  useIsoLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (ro) {
      ro.observe(el);
      Array.from(el.children).forEach((c) => ro.observe(c));
    }
    return () => {
      el.removeEventListener("scroll", measure);
      if (ro) ro.disconnect();
    };
  }, [measure]);
  useIsoLayoutEffect(() => {
    const el = list.current;
    const tab = el && ctx.value != null ? el.querySelector('[role="tab"][aria-selected="true"]') : null;
    if (!el || !tab) return;
    const room = parseFloat(getComputedStyle(el).getPropertyValue("--dk-tabs-fade")) || 0;
    const box = el.getBoundingClientRect(), t = tab.getBoundingClientRect();
    if (ctx.vertical) {
      if (t.top < box.top + room) el.scrollTop -= box.top + room - t.top;
      else if (t.bottom > box.bottom - room) el.scrollTop += t.bottom - (box.bottom - room);
    } else if (t.left < box.left + room) el.scrollLeft -= box.left + room - t.left;
    else if (t.right > box.right - room) el.scrollLeft += t.right - (box.right - room);
    measure();
  }, [ctx.value, ctx.vertical, measure]);
  const onKeyDown = (e) => {
    if (props.onKeyDown) props.onKeyDown(e);
    if (e.defaultPrevented) return;
    const tabs = Array.from(e.currentTarget.querySelectorAll('[role="tab"]:not([disabled])'));
    const i = tabs.indexOf(document.activeElement);
    if (i < 0 || !tabs.length) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const fwd = ctx.vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight", back = ctx.vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
    let next = -1;
    if (e.key === fwd) next = (i + 1) % tabs.length;
    else if (e.key === back) next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    tabs[next].focus();
    if (!ctx.manual && tabs[next].dataset.value != null) ctx.select(tabs[next].dataset.value);
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ...props,
      ref: (n) => {
        list.current = n;
        setRef(ref, n);
      },
      role: "tablist",
      "aria-orientation": ctx.vertical ? "vertical" : "horizontal",
      className: cn("dk-tabs__list", props.className),
      "data-fade-before": fade.before ? "" : void 0,
      "data-fade-after": fade.after ? "" : void 0,
      onKeyDown
    }
  );
});
var Tab = /* @__PURE__ */ component("Tab", function Tab2(props, ref) {
  const ctx = useTabs("Tab");
  const rest = omit(props, { value: 1, icon: 1, className: 1, children: 1 });
  const selected = ctx.value === props.value;
  const id = ctx.base + "-tab-" + safe(props.value), panel = ctx.base + "-panel-" + safe(props.value);
  const onClick = (e) => {
    if (props.onClick) props.onClick(e);
    if (!e.defaultPrevented) ctx.select(props.value);
  };
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      role: "tab",
      id,
      "aria-controls": ctx.panels[props.value] ? panel : void 0,
      "aria-selected": selected,
      tabIndex: selected || ctx.stop === props.value ? 0 : -1,
      "data-value": props.value,
      "data-state": selected ? "active" : "inactive",
      className: cn("dk-tabs__tab", props.className),
      onClick
    },
    props.icon != null ? /* @__PURE__ */ React.createElement("span", { className: "dk-tabs__icon", "aria-hidden": "true" }, asIcon(props.icon)) : null,
    /* @__PURE__ */ React.createElement("span", { className: "dk-tabs__label" }, props.children)
  );
});
var TabPanel = /* @__PURE__ */ component("TabPanel", function TabPanel2(props, ref) {
  const ctx = useTabs("TabPanel");
  const rest = omit(props, { value: 1, keepMounted: 1, className: 1, children: 1 });
  const selected = ctx.value === props.value;
  const keep = props.keepMounted !== false;
  const register = ctx.register;
  useIsoLayoutEffect(() => {
    register(props.value, 1);
    return () => register(props.value, -1);
  }, [props.value, register]);
  const own = React.useRef(null);
  const pick = React.useRef(null);
  const tabOf = () => own.current && own.current.getRootNode().getElementById(ctx.base + "-tab-" + safe(props.value));
  pick.current = selected ? null : () => {
    const t = tabOf();
    if (t && !t.hasAttribute("disabled")) ctx.select(props.value);
  };
  useIsoLayoutEffect(() => {
    const el = own.current, t = tabOf();
    if (el && !selected && keep && t && !t.hasAttribute("disabled")) el.setAttribute("hidden", "until-found");
  });
  React.useEffect(() => {
    const el = own.current;
    if (!el) return;
    const onMatch = () => {
      if (pick.current) pick.current();
    };
    el.addEventListener("beforematch", onMatch);
    return () => el.removeEventListener("beforematch", onMatch);
  }, []);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      tabIndex: selected ? 0 : -1,
      ...rest,
      ref: (n) => {
        own.current = n;
        setRef(ref, n);
      },
      role: "tabpanel",
      id: ctx.base + "-panel-" + safe(props.value),
      "aria-labelledby": ctx.base + "-tab-" + safe(props.value),
      hidden: !selected,
      "data-state": selected ? "active" : "inactive",
      className: cn("dk-tabs__panel", props.className)
    },
    selected || keep ? props.children : null
  );
});
export {
  Tab,
  TabList,
  TabPanel,
  Tabs
};
//# sourceMappingURL=Tabs.js.map
