"use client";

// src/components/Navbar/Navbar.tsx
import * as React from "react";
import { cn, domId, oneOf, omit, setRef, useIsoLayoutEffect } from "../../internal/cn.js";
import { config } from "../../internal/config.js";
import { IconButton } from "../IconButton/IconButton.js";
import { component } from "../../internal/component.js";
import { isComposing } from "../../internal/ime.js";
import { flattenChildren } from "../../internal/children.js";
import { useSettings } from "../../internal/provider.js";
import * as icons from "../../material/builtin.js";
var NavbarContext = /* @__PURE__ */ React.createContext(null);
var Navbar = /* @__PURE__ */ component("Navbar", function Navbar2(props, ref) {
  const sds = useSettings();
  const rest = omit(props, { brand: 1, children: 1, actions: 1, sticky: 1, size: 1, menuLabel: 1, className: 1, "aria-label": 1, onKeyDown: 1, onBlur: 1 });
  const [open, setOpen] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const panel = React.useRef(null);
  const [was, setWas] = React.useState(open);
  if (was !== open) {
    setWas(open);
    setLeaving(!open);
  }
  const toggle = React.useRef(null);
  const bar = React.useRef(null);
  const id = domId("dk-nav", React.useId());
  const size = oneOf(["prose", "md", "lg", "xl", "2xl", "full"], props.size, "xl");
  const links = flattenChildren(props.children);
  const hasLinks = links.length > 0;
  const close = React.useCallback(() => setOpen(false), []);
  useIsoLayoutEffect(() => {
    const h = bar.current;
    if (!props.sticky || !h) return;
    const root = document.documentElement;
    const set = () => root.style.setProperty("--dk-navbar-offset", h.getBoundingClientRect().height + "px");
    set();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(set) : null;
    if (ro) ro.observe(h);
    let raf = 0;
    const onFocus = (e) => {
      const t = e.target;
      if (!(t instanceof Element) || h.contains(t) || t.closest("dialog, [popover]")) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const covered = h.getBoundingClientRect().bottom - t.getBoundingClientRect().top;
        if (covered > 0 && document.activeElement === t) window.scrollBy(0, -covered);
      });
    };
    document.addEventListener("focusin", onFocus);
    return () => {
      if (ro) ro.disconnect();
      cancelAnimationFrame(raf);
      document.removeEventListener("focusin", onFocus);
      root.style.removeProperty("--dk-navbar-offset");
    };
  }, [props.sticky]);
  React.useEffect(() => {
    if (!open || typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const on = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const on = (e) => {
      if (bar.current && e.target instanceof Node && !bar.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", on, true);
    return () => document.removeEventListener("pointerdown", on, true);
  }, [open]);
  function onKeyDown(e) {
    if (props.onKeyDown) props.onKeyDown(e);
    if (!e.defaultPrevented && e.key === "Escape" && open && !isComposing(e)) {
      e.preventDefault();
      setOpen(false);
      if (toggle.current) toggle.current.focus();
    }
  }
  function onBlur(e) {
    if (props.onBlur) props.onBlur(e);
    if (open && e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) setOpen(false);
  }
  useIsoLayoutEffect(() => {
    if (!leaving) return;
    const n = panel.current, s = n ? getComputedStyle(n) : null;
    const ms = s && s.display !== "none" ? Math.max(...s.transitionDuration.split(",").map((d) => parseFloat(d) * (d.trim().endsWith("ms") ? 1 : 1e3))) : 0;
    if (!(ms > 0)) {
      setLeaving(false);
      return;
    }
    const t = window.setTimeout(() => setLeaving(false), ms + 50);
    return () => window.clearTimeout(t);
  }, [leaving]);
  const nav = hasLinks ? /* @__PURE__ */ React.createElement(
    "nav",
    {
      ref: panel,
      id,
      "aria-label": props["aria-label"] || sds.labels.mainNavigation,
      className: cn("dk-navbar__nav", leaving && "dk-navbar__nav--leaving"),
      inert: leaving || void 0,
      onTransitionEnd: (e) => {
        if (e.target === e.currentTarget && e.propertyName === "opacity" && !open) setLeaving(false);
      }
    },
    /* @__PURE__ */ React.createElement("ul", { className: "dk-navbar__links" }, links.map((c, i) => /* @__PURE__ */ React.createElement("li", { key: React.isValidElement(c) && c.key != null ? c.key : i }, c)))
  ) : null;
  return /* @__PURE__ */ React.createElement(NavbarContext.Provider, { value: { close } }, /* @__PURE__ */ React.createElement("header", { ...rest, ref: (n) => {
    bar.current = n;
    setRef(ref, n);
  }, onKeyDown, onBlur, "data-component": "navbar", "data-state": open ? "open" : "closed", className: cn("dk-navbar", props.sticky && "dk-navbar--sticky", props.className) }, /* @__PURE__ */ React.createElement("div", { className: cn("dk-navbar__inner dk-container dk-container--padded", "dk-container--" + size) }, props.brand != null ? /* @__PURE__ */ React.createElement("div", { className: "dk-navbar__brand" }, typeof props.brand === "string" || typeof props.brand === "number" ? /* @__PURE__ */ React.createElement("span", null, props.brand) : props.brand) : null, open || leaving ? null : nav, props.actions != null ? /* @__PURE__ */ React.createElement("div", { className: "dk-navbar__actions" }, props.actions) : null, hasLinks ? /* @__PURE__ */ React.createElement(
    IconButton,
    {
      ref: toggle,
      className: "dk-navbar__toggle",
      icon: open ? icons.Close : icons.Menu,
      label: props.menuLabel || sds.labels.menu,
      hideTitle: true,
      "aria-expanded": open,
      "aria-controls": id,
      onClick: () => setOpen(!open)
    }
  ) : null, open || leaving ? nav : null)));
});
var NavbarLinkBase = /* @__PURE__ */ component("NavbarLink", function NavbarLink(props, ref) {
  const ctx = React.useContext(NavbarContext);
  const rest = omit(props, { active: 1, as: 1, className: 1, onClick: 1 });
  return React.createElement(props.as || config.link, Object.assign(rest, {
    ref,
    "aria-current": props.active ? "page" : void 0,
    className: cn("dk-navbar__link", props.active && "dk-navbar__link--active", props.className),
    onClick: (e) => {
      if (props.onClick) props.onClick(e);
      if (ctx) ctx.close();
    }
  }));
});
var NavbarLink2 = NavbarLinkBase;
export {
  Navbar,
  NavbarLink2 as NavbarLink
};
//# sourceMappingURL=Navbar.js.map
