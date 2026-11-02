"use client";

// src/components/Tabs/Tabs.tsx
import * as React from "react";
import { cn, domId, oneOf, omit, setRef, useIsoLayoutEffect } from "../../internal/cn.js";
import { asIcon } from "../Icon/asIcon.js";
import { component } from "../../internal/component.js";
import { warnOnce } from "../../internal/warn.js";
import { revealInvalid } from "../../internal/untilFound.js";
import { lastInputKeyboard, listenForInput } from "../../internal/lastInput.js";
import { activeIn } from "../../internal/root.js";
var FROM = ["--dk-tabs-from-shift", "--dk-tabs-from-scale", "--dk-tabs-span-l", "--dk-tabs-span-r", "--dk-tabs-span-t", "--dk-tabs-span-b", "--dk-tabs-from-l", "--dk-tabs-from-r", "--dk-tabs-from-t", "--dk-tabs-from-b"];
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
  const before = React.useRef(null);
  const [keyed, setKeyed] = React.useState(false);
  const [shown2, setShown] = React.useState(value);
  if (shown2 !== value) {
    setShown(value);
    setKeyed(lastInputKeyboard());
  }
  useIsoLayoutEffect(listenForInput, []);
  const current = React.useRef(value);
  current.current = value;
  const select = React.useCallback((v) => {
    if (v === current.current) return;
    if (before.current) before.current();
    if (!controlled) {
      current.current = v;
      setInner(v);
    }
    if (onChange.current) onChange.current(v);
  }, [controlled]);
  const variant = oneOf(["line", "pill"], props.variant, "line");
  const size = oneOf(["sm", "md"], props.size, "md");
  const [panels, setPanels] = React.useState({});
  const register = React.useCallback((v, d) => setPanels((p) => Object.assign({}, p, { [v]: (p[v] || 0) + d })), []);
  const [stop, setStop] = React.useState(null);
  const [hiddenStop, setHiddenStop] = React.useState(null);
  const tabStop = stop != null ? stop : hiddenStop;
  const ctx = React.useMemo(() => ({ base, value, select, manual: props.activation === "manual", vertical, panels, register, stop: tabStop, before, keyed }), [base, value, select, props.activation, vertical, panels, register, tabStop, keyed]);
  const self = React.useRef(null);
  const order = React.useRef([]);
  const focusedIn = React.useRef(false);
  useIsoLayoutEffect(() => {
    if (!self.current) return;
    const tabs = Array.from(self.current.querySelectorAll('[role="tab"]')).filter((t) => t.id.startsWith(base + "-tab-"));
    const all = tabs.map((t) => t.dataset.value), enabled = tabs.filter((t) => !t.hasAttribute("disabled")).map((t) => t.dataset.value);
    const before2 = order.current;
    order.current = all;
    const matched = value != null && all.includes(value);
    setStop(matched || !enabled.length ? null : enabled[0]);
    if (!enabled.length || matched) return;
    if (controlled) {
      if (process.env.NODE_ENV !== "production" && value != null && before2.includes(value)) warnOnce("tabs-removed", `Tabs: the selected tab "${value}" was removed, so no tab is selected. Set value to another tab when you remove it.`);
      else if (process.env.NODE_ENV !== "production" && value != null) warnOnce("tabs-value", `Tabs: value "${value}" matches no Tab, so no tab is selected. Set it to one of the Tabs' values.`);
      return;
    }
    const at = value != null ? before2.indexOf(value) : -1;
    if (process.env.NODE_ENV !== "production" && at < 0 && value != null && !before2.length) warnOnce("tabs-value", `Tabs: defaultValue "${value}" matches no Tab, so the first tab is selected. Set it to one of the Tabs' values.`);
    if (at < 0) {
      setInner(enabled[0]);
      return;
    }
    const after = before2.slice(at + 1).find((v) => enabled.includes(v)), prev = before2.slice(0, at).reverse().find((v) => enabled.includes(v));
    const next = after ?? prev ?? enabled[0];
    select(next);
    const active = activeIn(self.current);
    if (focusedIn.current && (!active || active === document.body || !active.isConnected)) {
      const t = tabs.find((x) => x.dataset.value === next);
      if (t) t.focus();
    }
  });
  React.useEffect(() => {
    const el = self.current;
    if (!el) return;
    const tabs = Array.from(el.querySelectorAll('[role="tab"]')).filter((t) => t.id.startsWith(base + "-tab-"));
    const check = () => {
      const sel = tabs.find((t) => t.getAttribute("aria-selected") === "true");
      const next = sel && !sel.getClientRects().length ? tabs.find((t) => !t.hasAttribute("disabled") && t.getClientRects().length > 0) : void 0;
      setHiddenStop(next ? next.dataset.value : null);
    };
    check();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(check);
    if (ro) {
      ro.observe(el);
      for (const t of tabs) ro.observe(t);
    }
    return () => {
      if (ro) ro.disconnect();
    };
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
      onFocus: (e) => {
        focusedIn.current = true;
        if (rest.onFocus) rest.onFocus(e);
      },
      onBlur: (e) => {
        if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) focusedIn.current = false;
        if (rest.onBlur) rest.onBlur(e);
      },
      className: cn("dk-tabs", "dk-tabs--" + variant, size === "sm" && "dk-tabs--sm", vertical && "dk-tabs--vertical", props.className),
      "data-component": "tabs",
      "data-variant": variant,
      "data-orientation": vertical ? "vertical" : "horizontal"
    }
  ));
});
var shown = (on) => {
  const nums = (v) => (v.match(/-?[\d.]+(?:e-?\d+)?/g) || []).map(Number);
  let x = on.offsetLeft, y = on.offsetTop, w = on.offsetWidth, h = on.offsetHeight;
  const line = getComputedStyle(on, "::after"), fill = getComputedStyle(on, "::before");
  if (line.translate && line.translate !== "none") {
    const [dx = 0, dy = 0] = nums(line.translate);
    x += dx;
    y += dy;
  }
  if (line.scale && line.scale !== "none") {
    const [sx = 1, sy = sx] = nums(line.scale);
    w *= sx;
    h *= sy;
  }
  if (/^inset\(/.test(fill.clipPath)) {
    const [t = 0, r = t, b = t, l = r] = nums(fill.clipPath.split(" round")[0]);
    const span = (k) => parseFloat(on.style.getPropertyValue("--dk-tabs-span-" + k)) || 0;
    const left = x - span("l") + l, top = y - span("t") + t;
    w = x + w + span("r") - r - left;
    h = y + h + span("b") - b - top;
    x = left;
    y = top;
  }
  return { x, y, w, h };
};
var TabList = /* @__PURE__ */ component("TabList", function TabList2(props, ref) {
  const ctx = useTabs("TabList");
  const list = React.useRef(null);
  const [fade, setFade] = React.useState({ before: false, after: false });
  const place = (now) => {
    const el = list.current;
    if (!el) return;
    const tabs = Array.from(el.querySelectorAll('[role="tab"]'));
    const on = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    const b = on && (now ? shown(on) : { x: on.offsetLeft, y: on.offsetTop, w: on.offsetWidth, h: on.offsetHeight });
    for (const t of tabs) {
      if (t === on) continue;
      if (!b || !t.offsetWidth || !t.offsetHeight) {
        for (const k of FROM) t.style.removeProperty(k);
        continue;
      }
      const dx = b.x - t.offsetLeft, dy = b.y - t.offsetTop, w = t.offsetWidth, h = t.offsetHeight;
      t.style.setProperty("--dk-tabs-from-shift", dx + "px " + dy + "px");
      t.style.setProperty("--dk-tabs-from-scale", b.w / w + " " + b.h / h);
      const l = Math.max(0, -dx), r = Math.max(0, dx + b.w - w), u = Math.max(0, -dy), d = Math.max(0, dy + b.h - h);
      const set = (k, n) => t.style.setProperty(k, n + "px");
      set("--dk-tabs-span-l", l);
      set("--dk-tabs-span-r", r);
      set("--dk-tabs-span-t", u);
      set("--dk-tabs-span-b", d);
      set("--dk-tabs-from-l", l + dx);
      set("--dk-tabs-from-r", w + r - dx - b.w);
      set("--dk-tabs-from-t", u + dy);
      set("--dk-tabs-from-b", h + d - dy - b.h);
    }
  };
  useIsoLayoutEffect(() => {
    ctx.before.current = () => place(true);
    return () => {
      ctx.before.current = null;
    };
  });
  const measure = React.useCallback(() => {
    const el = list.current;
    if (!el) return;
    place();
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
    const scrolled = () => {
      el.setAttribute("data-scrolled", "");
      measure();
    };
    el.addEventListener("scroll", scrolled, { passive: true });
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (ro) {
      ro.observe(el);
      Array.from(el.children).forEach((c) => ro.observe(c));
    }
    return () => {
      el.removeEventListener("scroll", scrolled);
      if (ro) ro.disconnect();
    };
  }, [measure]);
  const reveal = React.useCallback(() => {
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
  useIsoLayoutEffect(reveal, [reveal]);
  React.useEffect(() => {
    const fonts = typeof document !== "undefined" ? document.fonts : void 0;
    if (!fonts || fonts.status === "loaded") return;
    let live = true;
    fonts.ready.then(() => {
      if (live) reveal();
    }, () => {
    });
    return () => {
      live = false;
    };
  }, [reveal]);
  const onKeyDown = (e) => {
    if (props.onKeyDown) props.onKeyDown(e);
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const tabs = Array.from(e.currentTarget.querySelectorAll('[role="tab"]:not([disabled])')).filter((t) => t.getClientRects().length > 0);
    const i = tabs.indexOf(activeIn(e.currentTarget));
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
      "data-instant": selected && ctx.keyed ? "" : void 0,
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
    el.addEventListener("invalid", revealInvalid, true);
    return () => {
      el.removeEventListener("beforematch", onMatch);
      el.removeEventListener("invalid", revealInvalid, true);
    };
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
