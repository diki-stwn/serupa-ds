"use client";

// src/components/VirtualList/VirtualList.tsx
import * as React from "react";
import { cn, oneOf, omit, setRef } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useVirtual } from "../../internal/virtual.js";
var VirtualList = /* @__PURE__ */ component("VirtualList", function VirtualList2(props, ref) {
  const rest = omit(props, { count: 1, renderItem: 1, itemKey: 1, estimatedItemHeight: 1, overscan: 1, variant: 1, divided: 1, as: 1, className: 1, style: 1, onFocus: 1, onBlur: 1 });
  const count = Math.max(0, Math.floor(props.count) || 0);
  const estimate = props.estimatedItemHeight && props.estimatedItemHeight > 0 ? props.estimatedItemHeight : 56;
  const r = useVirtual({ count, estimate, overscan: props.overscan != null && props.overscan >= 0 ? props.overscan : 4 });
  const [focused, setFocused] = React.useState(null);
  const variant = oneOf(["plain", "card"], props.variant, "plain");
  const { renderItem, itemKey } = props;
  const row = (i, out) => {
    const el = renderItem(i);
    const style = out ? { ...el.props.style, position: "absolute", insetInline: 0, top: r.offsetOf(i) } : el.props.style;
    return React.cloneElement(el, { key: itemKey ? itemKey(i) : i, "data-index": i, "aria-posinset": i + 1, "aria-setsize": count, style });
  };
  const rows = [];
  const keep = focused != null && focused < count && (focused < r.start || focused >= r.end) ? focused : null;
  if (keep != null && keep < r.start) rows.push(row(keep, true));
  for (let i = r.start; i < r.end; i++) rows.push(row(i, false));
  if (keep != null && keep >= r.end) rows.push(row(keep, true));
  const indexOf = (t, list) => {
    const li = t instanceof HTMLElement ? t.closest("[data-index]") : null;
    return li && li.parentElement === list ? Number(li.dataset.index) : null;
  };
  const attach = r.ref;
  const setNode = React.useCallback((n) => {
    attach(n);
    setRef(ref, n);
  }, [attach, ref]);
  return React.createElement(oneOf(["ul", "ol"], props.as, "ul"), Object.assign(rest, {
    ref: setNode,
    "data-component": "virtual-list",
    role: rest.role ?? "list",
    tabIndex: rest.tabIndex ?? 0,
    className: cn("dk-list", "dk-virtual-list", variant === "card" && "dk-list--card", props.divided !== false && "dk-list--divided", props.className),
    style: { ...props.style, "--dk-vl-before": r.before + "px", "--dk-vl-after": r.after + "px" },
    onFocus: (e) => {
      setFocused(indexOf(e.target, e.currentTarget));
      if (props.onFocus) props.onFocus(e);
    },
    onBlur: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setFocused(null);
      if (props.onBlur) props.onBlur(e);
    }
  }), rows);
});
export {
  VirtualList
};
//# sourceMappingURL=VirtualList.js.map
