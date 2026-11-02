"use client";

// src/components/TreeView/TreeView.tsx
import * as React from "react";
import { cn, omit, setRef, useIsoLayoutEffect } from "../../internal/cn.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { component } from "../../internal/component.js";
import { isComposing } from "../../internal/ime.js";
import { typeahead, typing } from "../../internal/typeahead.js";
import { Icon } from "../Icon/Icon.js";
import { useServerStyles } from "../../internal/serverStyles.js";
import { asIcon } from "../Icon/asIcon.js";
import * as icons from "../../material/builtin.js";
var TreeContext = /* @__PURE__ */ React.createContext(null);
var textOf = (it) => it.textValue ?? (typeof it.label === "string" || typeof it.label === "number" ? String(it.label) : "");
var opens = (it) => it.children !== void 0;
var within = (item, id) => !!item.children && item.children.some((c) => c.id === id || within(c, id));
var TreeView = /* @__PURE__ */ component("TreeView", function TreeView2(props, ref) {
  const nameRef = useNameCheck("TreeView", NAME_HOW.label);
  const rest = omit(props, { items: 1, selectionMode: 1, value: 1, defaultValue: 1, onValueChange: 1, expanded: 1, defaultExpanded: 1, onExpandedChange: 1, className: 1, onKeyDown: 1 });
  const mode = props.selectionMode || "single";
  const multi = mode === "multiple";
  const [ownValue, setOwnValue] = React.useState(props.defaultValue || []);
  const value = props.value !== void 0 ? props.value : ownValue;
  const [ownOpen, setOwnOpen] = React.useState(props.defaultExpanded || []);
  const open = props.expanded !== void 0 ? props.expanded : ownOpen;
  const root = React.useRef(null);
  const styled = useServerStyles();
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
  const openSet = React.useMemo(() => new Set(open), [open]);
  const valueSet = React.useMemo(() => new Set(value), [value]);
  const firstPicked = rows.find((r) => valueSet.has(r.item.id));
  const tabStop = index(focusId) >= 0 ? focusId : firstPicked ? firstPicked.item.id : rows.length ? rows[0].item.id : null;
  useIsoLayoutEffect(function() {
    if (!moveFocus.current || !root.current) return;
    moveFocus.current = false;
    const el = focusId == null ? null : root.current.querySelector('[role=treeitem][data-id="' + CSS.escape(focusId) + '"]');
    if (el) el.focus();
  }, [focusId, rows]);
  const go = (id) => {
    moveFocus.current = true;
    setFocusId(id);
  };
  const focusedIn = React.useRef(false);
  const lastAt = React.useRef(-1);
  useIsoLayoutEffect(function() {
    const at = index(focusId);
    if (at >= 0) {
      lastAt.current = at;
      return;
    }
    const active = document.activeElement;
    const r = root.current;
    if (focusId == null || !rows.length || !r || !focusedIn.current || active && active !== document.body && active.isConnected && !r.contains(active)) return;
    const up = (list) => {
      for (const x of list) {
        if (x.id === focusId) return [];
        const p = x.children ? up(x.children) : null;
        if (p) return [x.id].concat(p);
      }
      return null;
    };
    const parents = up(props.items) || [];
    const parent = parents.reverse().find((p) => index(p) >= 0);
    go(parent != null ? parent : rows[Math.min(Math.max(lastAt.current, 0), rows.length - 1)].item.id);
  }, [rows, focusId]);
  const pick = (next) => {
    if (next.length === value.length && next.every((v) => valueSet.has(v))) return;
    if (props.value === void 0) setOwnValue(next);
    if (props.onValueChange) props.onValueChange(next);
  };
  const setOpen = (next) => {
    if (props.expanded === void 0) setOwnOpen(next);
    if (props.onExpandedChange) props.onExpandedChange(next);
  };
  const toggleOpen = (item) => {
    if (item.disabled || !opens(item)) return;
    const was = openSet.has(item.id);
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
      const inSpan = new Set(span);
      pick(value.filter((v) => !inSpan.has(v)).concat(span));
      return;
    }
    pick(valueSet.has(id) ? value.filter((v) => v !== id) : value.concat(id));
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
    const isOpen = openSet.has(item.id);
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
    else if (e.key === "Enter" || e.key === " " && !typing(typed.current)) {
      if (mode === "none") toggleOpen(item);
      else choose(item, multi && e.shiftKey);
    } else if (e.key === "*") {
      const shut = rows.filter((x) => x.parent === r.parent && opens(x.item) && !x.item.disabled && !openSet.has(x.item.id));
      if (shut.length) setOpen(open.concat(shut.map((x) => x.item.id)));
    } else if (multi && (e.ctrlKey || e.metaKey) && (/^[\x20-\x7e]$/.test(e.key) ? e.key.toLowerCase() === "a" : e.code === "KeyA")) pick(rows.filter((x) => !x.item.disabled).map((x) => x.item.id));
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) to = typeahead(typed.current, e.key, rows.map((x) => textOf(x.item)), i);
    else return;
    e.preventDefault();
    if (to >= 0 && to !== i) go(rows[to].item.id);
  };
  const store = React.useRef(null);
  if (!store.current) store.current = { open: openSet, value: valueSet, tab: tabStop, mode, listeners: /* @__PURE__ */ new Set() };
  const st = store.current;
  st.open = openSet;
  st.value = valueSet;
  st.tab = tabStop;
  st.mode = mode;
  useIsoLayoutEffect(function() {
    st.listeners.forEach((l) => l());
  }, [openSet, valueSet, tabStop, mode]);
  const api = React.useRef({ focus: () => {
  }, press: () => {
  }, toggle: () => {
  } });
  api.current = {
    focus: (id) => {
      if (focusId !== id) setFocusId(id);
    },
    press: (item, e) => {
      setFocusId(item.id);
      if (mode === "none") toggleOpen(item);
      else choose(item, multi && e.shiftKey);
    },
    toggle: (item) => {
      setFocusId(item.id);
      toggleOpen(item);
    }
  };
  const ctx = React.useMemo(() => ({ store: st, api }), [st]);
  return /* @__PURE__ */ React.createElement(
    "ul",
    {
      ...rest,
      ref: function(n) {
        root.current = n;
        nameRef(n);
        styled(n);
        setRef(ref, n);
      },
      role: "tree",
      "aria-multiselectable": multi || void 0,
      className: cn("dk-tree-view", props.className),
      "data-component": "tree-view",
      onKeyDown,
      onFocus: (e) => {
        focusedIn.current = true;
        if (rest.onFocus) rest.onFocus(e);
      },
      onBlur: (e) => {
        if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) focusedIn.current = false;
        if (rest.onBlur) rest.onBlur(e);
      }
    },
    /* @__PURE__ */ React.createElement(TreeContext.Provider, { value: ctx }, /* @__PURE__ */ React.createElement(Rows, { list: props.items, level: 1 }))
  );
});
var Rows = /* @__PURE__ */ React.memo(function Rows2(props) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, props.list.map((item, n) => /* @__PURE__ */ React.createElement(TreeRow, { key: item.id, item, level: props.level, pos: n + 1, size: props.list.length })));
});
var TreeRow = /* @__PURE__ */ React.memo(function TreeRow2(props) {
  const { store, api } = React.useContext(TreeContext);
  const { item, level } = props, id = item.id;
  const subscribe = React.useCallback((l) => {
    store.listeners.add(l);
    return () => {
      store.listeners.delete(l);
    };
  }, [store]);
  const snap = () => (store.open.has(id) ? "o" : "-") + (store.value.has(id) ? "p" : "-") + (store.tab === id ? "t" : "-") + store.mode;
  const key = React.useSyncExternalStore(subscribe, snap, snap);
  const canOpen = opens(item), isOpen = canOpen && key[0] === "o", picked = key[1] === "p", mode = key.slice(3);
  const icon = item.icon != null ? asIcon(item.icon) : null;
  return /* @__PURE__ */ React.createElement(
    "li",
    {
      role: "treeitem",
      "data-id": id,
      tabIndex: key[2] === "t" ? 0 : -1,
      "aria-level": level,
      "aria-posinset": props.pos,
      "aria-setsize": props.size,
      "aria-expanded": canOpen ? isOpen : void 0,
      "data-state": canOpen ? isOpen ? "open" : "closed" : void 0,
      "aria-selected": mode === "none" ? void 0 : mode === "multiple" ? picked : picked || void 0,
      "aria-disabled": item.disabled || void 0,
      className: cn("dk-tree-view__item", picked && "dk-tree-view__item--selected", item.disabled && "dk-tree-view__item--disabled"),
      onFocus: (e) => {
        if (e.target === e.currentTarget) api.current.focus(id);
      }
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "dk-tree-view__row",
        style: { "--dk-tree-level": level - 1 },
        onClick: (e) => api.current.press(item, e)
      },
      /* @__PURE__ */ React.createElement(
        "span",
        {
          className: "dk-tree-view__toggle",
          "aria-hidden": "true",
          onClick: canOpen ? (e) => {
            e.stopPropagation();
            api.current.toggle(item);
          } : void 0
        },
        canOpen ? /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronRight, mirror: false }) : null
      ),
      icon != null ? /* @__PURE__ */ React.createElement("span", { className: "dk-tree-view__icon", "aria-hidden": "true" }, icon) : null,
      /* @__PURE__ */ React.createElement("span", { className: "dk-tree-view__label" }, item.label)
    ),
    isOpen && item.children && item.children.length ? /* @__PURE__ */ React.createElement("ul", { role: "group", className: "dk-tree-view__group" }, /* @__PURE__ */ React.createElement(Rows, { list: item.children, level: level + 1 })) : null
  );
});
export {
  TreeView
};
//# sourceMappingURL=TreeView.js.map
