"use client";

// src/components/TreeView/TreeView.tsx
import * as React from "react";
import { cn, omit, setRef, useIsoLayoutEffect } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { isComposing } from "../../internal/ime.js";
import { typeahead } from "../../internal/typeahead.js";
import { Icon } from "../Icon/Icon.js";
import { asIcon } from "../Icon/asIcon.js";
import * as icons from "../../material/builtin.js";
var textOf = (it) => it.textValue ?? (typeof it.label === "string" || typeof it.label === "number" ? String(it.label) : "");
var opens = (it) => it.children !== void 0;
var within = (item, id) => !!item.children && item.children.some((c) => c.id === id || within(c, id));
var TreeView = /* @__PURE__ */ component("TreeView", function TreeView2(props, ref) {
  const rest = omit(props, { items: 1, selectionMode: 1, value: 1, defaultValue: 1, onValueChange: 1, expanded: 1, defaultExpanded: 1, onExpandedChange: 1, className: 1, onKeyDown: 1 });
  const mode = props.selectionMode || "single";
  const multi = mode === "multiple";
  const [ownValue, setOwnValue] = React.useState(props.defaultValue || []);
  const value = props.value !== void 0 ? props.value : ownValue;
  const [ownOpen, setOwnOpen] = React.useState(props.defaultExpanded || []);
  const open = props.expanded !== void 0 ? props.expanded : ownOpen;
  const root = React.useRef(null);
  const typed = React.useRef({ text: "", at: 0 });
  const anchor = React.useRef(null);
  const [focusId, setFocusId] = React.useState(null);
  const moveFocus = React.useRef(false);
  const rows = React.useMemo(() => {
    const out = [];
    const isOpen = new Set(open);
    const walk = (list, level, parent) => list.forEach((item) => {
      out.push({ item, level, parent });
      if (item.children && isOpen.has(item.id)) walk(item.children, level + 1, item.id);
    });
    walk(props.items, 1, null);
    return out;
  }, [props.items, open]);
  const index = (id) => id == null ? -1 : rows.findIndex((r) => r.item.id === id);
  const firstPicked = rows.find((r) => value.indexOf(r.item.id) >= 0);
  const tabStop = index(focusId) >= 0 ? focusId : firstPicked ? firstPicked.item.id : rows.length ? rows[0].item.id : null;
  useIsoLayoutEffect(function() {
    if (!moveFocus.current || !root.current) return;
    moveFocus.current = false;
    const el = Array.from(root.current.querySelectorAll("[role=treeitem]")).find((e) => e.dataset.id === focusId);
    if (el) el.focus();
  }, [focusId, rows]);
  const go = (id) => {
    moveFocus.current = true;
    setFocusId(id);
  };
  const pick = (next) => {
    if (props.value === void 0) setOwnValue(next);
    if (props.onValueChange) props.onValueChange(next);
  };
  const setOpen = (next) => {
    if (props.expanded === void 0) setOwnOpen(next);
    if (props.onExpandedChange) props.onExpandedChange(next);
  };
  const toggleOpen = (item) => {
    if (item.disabled || !opens(item)) return;
    const was = open.indexOf(item.id) >= 0;
    setOpen(was ? open.filter((x) => x !== item.id) : open.concat(item.id));
    if (was && focusId && within(item, focusId)) go(item.id);
  };
  const choose = (item, range = false) => {
    if (item.disabled || mode === "none") return;
    const id = item.id;
    if (!multi) {
      if (value.length !== 1 || value[0] !== id) pick([id]);
      anchor.current = id;
      return;
    }
    const a = index(anchor.current);
    if (range && a >= 0) {
      const b = index(id);
      const span = rows.slice(Math.min(a, b), Math.max(a, b) + 1).filter((x) => !x.item.disabled).map((x) => x.item.id);
      pick(value.filter((v) => span.indexOf(v) < 0).concat(span));
      return;
    }
    pick(value.indexOf(id) >= 0 ? value.filter((v) => v !== id) : value.concat(id));
    anchor.current = id;
  };
  const onKeyDown = function(e) {
    if (props.onKeyDown) props.onKeyDown(e);
    const t = e.target instanceof HTMLElement ? e.target.closest("[role=treeitem]") : null;
    if (e.defaultPrevented || !t || !root.current || e.altKey || isComposing(e)) return;
    const i = index(t.dataset.id || null);
    if (i < 0) return;
    const r = rows[i], item = r.item;
    const rtl = getComputedStyle(root.current).direction === "rtl";
    const isOpen = open.indexOf(item.id) >= 0;
    let to = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      to = Math.min(rows.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)));
      if (multi && e.shiftKey && to !== i) choose(rows[to].item);
    } else if (e.key === (rtl ? "ArrowLeft" : "ArrowRight")) {
      if (opens(item) && !isOpen) toggleOpen(item);
      else if (isOpen && item.children && item.children.length) to = i + 1;
    } else if (e.key === (rtl ? "ArrowRight" : "ArrowLeft")) {
      if (isOpen && !item.disabled) toggleOpen(item);
      else if (r.parent != null) to = index(r.parent);
    } else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = rows.length - 1;
    else if (e.key === "Enter" || e.key === " ") {
      if (mode === "none") toggleOpen(item);
      else choose(item, multi && e.shiftKey);
    } else if (e.key === "*") {
      const shut = rows.filter((x) => x.parent === r.parent && opens(x.item) && !x.item.disabled && open.indexOf(x.item.id) < 0);
      if (shut.length) setOpen(open.concat(shut.map((x) => x.item.id)));
    } else if (multi && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") pick(rows.filter((x) => !x.item.disabled).map((x) => x.item.id));
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) to = typeahead(typed.current, e.key, rows.map((x) => textOf(x.item)), i);
    else return;
    e.preventDefault();
    if (to >= 0 && to !== i) go(rows[to].item.id);
  };
  const render = (list, level) => list.map((item, n) => {
    const isOpen = opens(item) && open.indexOf(item.id) >= 0;
    const picked = value.indexOf(item.id) >= 0;
    const icon = item.icon != null ? asIcon(item.icon) : null;
    return /* @__PURE__ */ React.createElement(
      "li",
      {
        key: item.id,
        role: "treeitem",
        "data-id": item.id,
        tabIndex: item.id === tabStop ? 0 : -1,
        "aria-level": level,
        "aria-posinset": n + 1,
        "aria-setsize": list.length,
        "aria-expanded": opens(item) ? isOpen : void 0,
        "aria-selected": mode === "none" ? void 0 : multi ? picked : picked || void 0,
        "aria-disabled": item.disabled || void 0,
        className: cn("dk-tree-view__item", picked && "dk-tree-view__item--selected", item.disabled && "dk-tree-view__item--disabled"),
        onFocus: (e) => {
          if (e.target === e.currentTarget && focusId !== item.id) setFocusId(item.id);
        }
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "dk-tree-view__row",
          style: { "--dk-tree-level": level - 1 },
          onClick: (e) => {
            setFocusId(item.id);
            if (mode === "none") toggleOpen(item);
            else choose(item, multi && e.shiftKey);
          }
        },
        /* @__PURE__ */ React.createElement(
          "span",
          {
            className: "dk-tree-view__toggle",
            "aria-hidden": "true",
            onClick: opens(item) ? (e) => {
              e.stopPropagation();
              setFocusId(item.id);
              toggleOpen(item);
            } : void 0
          },
          opens(item) ? /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronRight }) : null
        ),
        icon != null ? /* @__PURE__ */ React.createElement("span", { className: "dk-tree-view__icon", "aria-hidden": "true" }, icon) : null,
        /* @__PURE__ */ React.createElement("span", { className: "dk-tree-view__label" }, item.label)
      ),
      isOpen && item.children && item.children.length ? /* @__PURE__ */ React.createElement("ul", { role: "group", className: "dk-tree-view__group" }, render(item.children, level + 1)) : null
    );
  });
  return /* @__PURE__ */ React.createElement(
    "ul",
    {
      ...rest,
      ref: function(n) {
        root.current = n;
        setRef(ref, n);
      },
      role: "tree",
      "aria-multiselectable": multi || void 0,
      className: cn("dk-tree-view", props.className),
      "data-component": "tree-view",
      onKeyDown
    },
    render(props.items, 1)
  );
});
export {
  TreeView
};
//# sourceMappingURL=TreeView.js.map
