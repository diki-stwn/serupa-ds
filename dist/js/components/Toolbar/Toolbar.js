"use client";

// src/components/Toolbar/Toolbar.tsx
import * as React from "react";
import { cn, omit, setRef, useIsoLayoutEffect } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
var ITEMS = 'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [contenteditable="true"]';
var POPUP = '[popover], [role="menu"], [role="listbox"], [role="dialog"], [role="tooltip"], [role="toolbar"], [hidden], [inert]';
var itemsOf = (root, all) => Array.from(root.querySelectorAll(ITEMS)).filter(function(it) {
  if (!all && it.matches(":disabled")) return false;
  const p = it.parentElement && it.parentElement.closest(POPUP);
  return !p || p === root || !root.contains(p);
});
var shown = (e) => e.getClientRects().length > 0;
var typing = (e) => e.isContentEditable || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement || e instanceof HTMLInputElement && !/^(button|checkbox|radio|submit|reset|image|color|file|range)$/.test(e.type);
var Toolbar = /* @__PURE__ */ component("Toolbar", function Toolbar2(props, ref) {
  const rest = omit(props, { orientation: 1, className: 1, children: 1 });
  const vertical = props.orientation === "vertical";
  const root = React.useRef(null);
  const active = React.useRef(null);
  const sync = React.useCallback(function() {
    const r = root.current;
    if (!r) return;
    const items = itemsOf(r), seen = items.filter(shown);
    const pick = seen.length ? seen : items;
    if (!active.current || pick.indexOf(active.current) < 0) active.current = pick[0] || null;
    for (const it of itemsOf(r, true)) it.tabIndex = it === active.current ? 0 : -1;
  }, []);
  useIsoLayoutEffect(sync);
  React.useEffect(function() {
    const r = root.current;
    if (!r) return;
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(sync);
    const watch = function() {
      if (ro) {
        ro.disconnect();
        for (const it of itemsOf(r, true)) ro.observe(it);
      }
    };
    watch();
    const mo = typeof MutationObserver === "undefined" ? null : new MutationObserver(function() {
      watch();
      sync();
    });
    if (mo) mo.observe(r, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "hidden", "inert"] });
    return function() {
      if (mo) mo.disconnect();
      if (ro) ro.disconnect();
    };
  }, [sync]);
  const onFocus = function(e) {
    if (rest.onFocus) rest.onFocus(e);
    const r = root.current;
    if (r && e.target instanceof HTMLElement && e.target !== active.current && itemsOf(r).indexOf(e.target) >= 0) {
      active.current = e.target;
      sync();
    }
  };
  const onKeyDown = function(e) {
    if (rest.onKeyDown) rest.onKeyDown(e);
    const r = root.current, t = e.target;
    if (e.defaultPrevented || !r || !(t instanceof HTMLElement) || e.altKey || e.ctrlKey || e.metaKey) return;
    const items = itemsOf(r).filter(shown), i = items.indexOf(t);
    if (i < 0 || typing(t)) return;
    const rtl = getComputedStyle(r).direction === "rtl";
    let n;
    switch (e.key) {
      case "ArrowRight":
        if (vertical) return;
        n = i + (rtl ? -1 : 1);
        break;
      case "ArrowLeft":
        if (vertical) return;
        n = i + (rtl ? 1 : -1);
        break;
      case "ArrowDown":
        if (!vertical) return;
        n = i + 1;
        break;
      case "ArrowUp":
        if (!vertical) return;
        n = i - 1;
        break;
      case "Home":
        n = 0;
        break;
      case "End":
        n = items.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    const next = items[(n + items.length) % items.length];
    active.current = next;
    sync();
    next.focus();
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ...rest,
      ref: function(n) {
        root.current = n;
        setRef(ref, n);
      },
      role: "toolbar",
      "aria-orientation": vertical ? "vertical" : "horizontal",
      className: cn("dk-toolbar", vertical && "dk-toolbar--vertical", props.className),
      "data-component": "toolbar",
      "data-orientation": vertical ? "vertical" : "horizontal",
      onFocus,
      onKeyDown
    },
    props.children
  );
});
export {
  Toolbar
};
//# sourceMappingURL=Toolbar.js.map
