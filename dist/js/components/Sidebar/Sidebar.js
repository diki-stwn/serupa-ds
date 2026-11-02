"use client";

// src/components/Sidebar/Sidebar.tsx
import * as React from "react";
import { cn, domId, omit, setRef, useIsoLayoutEffect } from "../../internal/cn.js";
import { useExit } from "../../internal/useExit.js";
import { Icon } from "../Icon/Icon.js";
import { asIcon } from "../Icon/asIcon.js";
import { Tooltip } from "../Tooltip/Tooltip.js";
import { config } from "../../internal/config.js";
import { Menu, MenuItem, MenuSub } from "../Menu/Menu.js";
import { component } from "../../internal/component.js";
import { activeIn } from "../../internal/root.js";
import { flattenChildren } from "../../internal/children.js";
import { useSettings } from "../../internal/provider.js";
import * as icons from "../../material/builtin.js";
var SidebarContext = /* @__PURE__ */ React.createContext({ collapsed: false, depth: 0 });
function isSection(c) {
  return React.isValidElement(c) && c.type === SidebarSection;
}
var Sidebar = /* @__PURE__ */ component("Sidebar", function Sidebar2(props, ref) {
  const sds = useSettings();
  const rest = omit(props, { header: 1, footer: 1, collapsed: 1, className: 1, children: 1, "aria-label": 1 });
  const collapsed = !!props.collapsed;
  const [shown, setShownNow] = React.useState(collapsed);
  const [slide, setSlide] = React.useState("");
  const nav = React.useRef(null);
  const keep = React.useRef(null);
  const setShown = React.useCallback((v) => {
    const n = nav.current, a = activeIn(n);
    let li = n && a && n.contains(a) ? a.closest(".dk-sidebar__li") : null;
    for (let up = li && li.parentElement ? li.parentElement.closest(".dk-sidebar__li") : null; up && n && n.contains(up); up = up.parentElement ? up.parentElement.closest(".dk-sidebar__li") : null) li = up;
    keep.current = li;
    setShownNow(v);
  }, []);
  useIsoLayoutEffect(() => {
    const li = keep.current, n = nav.current;
    keep.current = null;
    if (li && li.isConnected && n && !n.contains(activeIn(n))) {
      const to = li.querySelector("a[href], button");
      if (to) to.focus();
    }
  }, [shown]);
  const want = React.useRef(collapsed);
  const timer = React.useRef({});
  const settle = React.useCallback(() => {
    clearTimeout(timer.current.end);
    if (want.current) setShown(true);
    setSlide("");
  }, [setShown]);
  useIsoLayoutEffect(() => {
    if (want.current === collapsed) return;
    want.current = collapsed;
    const n = nav.current, t = timer.current;
    cancelAnimationFrame(t.raf);
    clearTimeout(t.end);
    const ms = n ? Math.max(...getComputedStyle(n).transitionDuration.split(",").map((d) => parseFloat(d) * (/ms/.test(d) ? 1 : 1e3))) : 0;
    if (!ms) {
      setShown(collapsed);
      setSlide("");
      return;
    }
    const from = slide === "" ? collapsed ? "full" : "rail" : null;
    if (!collapsed) setShown(false);
    const go = () => {
      setSlide(collapsed ? "rail" : "full");
      t.end = setTimeout(settle, ms + 100);
    };
    if (from) {
      setSlide(from);
      t.raf = requestAnimationFrame(() => {
        t.raf = requestAnimationFrame(go);
      });
    } else go();
  }, [collapsed]);
  React.useEffect(() => () => {
    cancelAnimationFrame(timer.current.raf);
    clearTimeout(timer.current.end);
  }, []);
  const onEnd = (e) => {
    if (e.target === e.currentTarget && e.propertyName === "clip-path" && slide === "rail" === want.current) settle();
  };
  const body = [];
  let run = [];
  const flush = () => {
    if (run.length) {
      body.push(/* @__PURE__ */ React.createElement("ul", { key: "l" + body.length, className: "dk-sidebar__list" }, run));
      run = [];
    }
  };
  flattenChildren(props.children).forEach((c) => {
    if (isSection(c)) {
      flush();
      body.push(c);
    } else run.push(c);
  });
  flush();
  return /* @__PURE__ */ React.createElement(SidebarContext.Provider, { value: { collapsed: shown, depth: 0 } }, /* @__PURE__ */ React.createElement(
    "nav",
    {
      ...rest,
      "aria-label": props["aria-label"] || sds.labels.mainNavigation,
      ref: (n) => {
        nav.current = n;
        setRef(ref, n);
      },
      "data-component": "sidebar",
      "data-collapsed": shown ? "" : void 0,
      "data-slide": slide || void 0,
      onTransitionEnd: (e) => {
        onEnd(e);
        if (props.onTransitionEnd) props.onTransitionEnd(e);
      },
      className: cn("dk-sidebar", shown && "dk-sidebar--collapsed", props.className)
    },
    props.header != null ? /* @__PURE__ */ React.createElement("div", { className: "dk-sidebar__header" }, props.header) : null,
    /* @__PURE__ */ React.createElement("div", { className: "dk-sidebar__body" }, body),
    props.footer != null ? /* @__PURE__ */ React.createElement("div", { className: "dk-sidebar__footer" }, props.footer) : null
  ));
});
var SidebarSection = /* @__PURE__ */ component("SidebarSection", function SidebarSection2(props, ref) {
  const rest = omit(props, { title: 1, className: 1, children: 1 });
  const id = domId("dk-sbs", React.useId());
  const titled = props.title != null && props.title !== false && props.title !== "";
  return /* @__PURE__ */ React.createElement("div", { ...rest, ref, className: cn("dk-sidebar__section", props.className) }, titled ? /* @__PURE__ */ React.createElement("div", { id, className: "dk-sidebar__section-title" }, props.title) : null, /* @__PURE__ */ React.createElement("ul", { className: "dk-sidebar__list", "aria-labelledby": titled ? id : void 0 }, props.children));
});
var ITEM_OWN = { label: 1, icon: 1, active: 1, badge: 1, children: 1, defaultOpen: 1, open: 1, onOpenChange: 1, as: 1, className: 1 };
var itemsOf = (children) => flattenChildren(children).filter(React.isValidElement);
var activeWithin = (k) => !!k.props.active || itemsOf(k.props.children).some(activeWithin);
function railItems(kids) {
  return kids.map((k, i) => {
    const key = k.key != null ? k.key : i, inner = itemsOf(k.props.children);
    const common = { icon: k.props.icon, "aria-current": activeWithin(k) ? "page" : void 0, className: cn("dk-sidebar__menu-item", k.props.className) };
    if (inner.length) return /* @__PURE__ */ React.createElement(MenuSub, { key, ...common, label: k.props.label }, railItems(inner));
    return /* @__PURE__ */ React.createElement(
      MenuItem,
      {
        key,
        ...omit(k.props, ITEM_OWN),
        onClick: void 0,
        as: k.props.as,
        ...common,
        onSelect: k.props.onClick
      },
      k.props.label
    );
  });
}
var SidebarItemBase = /* @__PURE__ */ component("SidebarItem", function SidebarItem(props, ref) {
  const ctx = React.useContext(SidebarContext);
  const rest = omit(props, ITEM_OWN);
  const kids = itemsOf(props.children);
  const group = kids.length > 0;
  const childActive = kids.some(activeWithin);
  const [own, setOwn] = React.useState(props.defaultOpen != null ? !!props.defaultOpen : childActive);
  const [wasActive, setWasActive] = React.useState(childActive);
  if (wasActive !== childActive) {
    setWasActive(childActive);
    if (childActive && !own && props.defaultOpen == null && props.open === void 0) setOwn(true);
  }
  const open = props.open !== void 0 ? !!props.open : own;
  const toggle = () => {
    if (props.open === void 0) setOwn(!open);
    if (props.onOpenChange) props.onOpenChange(!open, { reason: "trigger" });
  };
  const listId = domId("dk-sbi", React.useId());
  const nested = React.useRef(null);
  const exit = useExit(open, nested);
  const rail = ctx.collapsed && ctx.depth === 0;
  const dot = rail && props.badge != null && props.badge !== false;
  const badgeId = listId + "-badge";
  if (dot) rest["aria-describedby"] = cn(rest["aria-describedby"], badgeId);
  const inner = (chevron) => /* @__PURE__ */ React.createElement(React.Fragment, null, props.icon ? /* @__PURE__ */ React.createElement("span", { className: "dk-sidebar__icon" }, asIcon(props.icon), dot ? /* @__PURE__ */ React.createElement("span", { className: "dk-sidebar__dot", "aria-hidden": "true" }) : null) : null, /* @__PURE__ */ React.createElement("span", { className: "dk-sidebar__label" }, props.label), props.badge != null ? /* @__PURE__ */ React.createElement("span", { className: "dk-sidebar__badge", id: dot ? badgeId : void 0 }, props.badge) : null, chevron && !rail ? /* @__PURE__ */ React.createElement(Icon, { icon: icons.ExpandMore, className: "dk-sidebar__chevron" }) : null);
  const btnProps = omit(rest, { href: 1, target: 1, rel: 1, download: 1, hrefLang: 1, ping: 1, referrerPolicy: 1, type: 1, onClick: 1 });
  const cls = cn("dk-sidebar__item", ctx.depth > 0 && "dk-sidebar__item--nested", (props.active || group && childActive) && "dk-sidebar__item--active", props.className);
  if (group && rail) {
    return /* @__PURE__ */ React.createElement("li", { className: "dk-sidebar__li" }, /* @__PURE__ */ React.createElement(Menu, { placement: "right-start", trigger: props.label != null && props.label !== false && props.label !== "" ? /* @__PURE__ */ React.createElement(Tooltip, { content: props.label, placement: "right", role: "label" }, /* @__PURE__ */ React.createElement("button", { type: "button", ...btnProps, ref, className: cls }, inner(false))) : /* @__PURE__ */ React.createElement("button", { type: "button", ...btnProps, ref, className: cls }, inner(false)) }, railItems(kids)));
  }
  if (group) {
    return /* @__PURE__ */ React.createElement("li", { className: "dk-sidebar__li", "data-state": open ? "open" : "closed" }, /* @__PURE__ */ React.createElement("button", { type: "button", ...btnProps, ref, className: cls, "aria-expanded": open, "aria-controls": listId, onClick: (e) => {
      if (props.onClick) props.onClick(e);
      toggle();
    } }, inner(true)), /* @__PURE__ */ React.createElement(SidebarContext.Provider, { value: { collapsed: ctx.collapsed, depth: ctx.depth + 1 } }, /* @__PURE__ */ React.createElement("ul", { ref: nested, id: listId, className: "dk-sidebar__list dk-sidebar__list--nested", hidden: !open && !exit.leaving, inert: !open || void 0, "data-instant": exit.arrived || void 0 }, kids)));
  }
  const link = React.createElement(props.as || config.link, Object.assign(rest, { ref, className: cls, "aria-current": props.active ? "page" : void 0 }), inner(false));
  return /* @__PURE__ */ React.createElement("li", { className: "dk-sidebar__li" }, rail && props.label != null && props.label !== false && props.label !== "" ? /* @__PURE__ */ React.createElement(Tooltip, { content: props.label, placement: "right", role: "label" }, link) : link);
});
var SidebarItem2 = SidebarItemBase;
export {
  Sidebar,
  SidebarItem2 as SidebarItem,
  SidebarSection
};
//# sourceMappingURL=Sidebar.js.map
