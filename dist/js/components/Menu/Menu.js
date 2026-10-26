"use client";

// src/components/Menu/Menu.tsx
import * as React from "react";
import { cn, domId, elementRef, omit, setRef, useIsoLayoutEffect } from "../../internal/cn.js";
import { oneElement, useTriggerRef } from "../../internal/trigger.js";
import { config } from "../../internal/config.js";
import "../../internal/position.js";
import { typeahead } from "../../internal/typeahead.js";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer.js";
import { Icon } from "../Icon/Icon.js";
import { asIcon } from "../Icon/asIcon.js";
import { component, named } from "../../internal/component.js";
import { isComposing } from "../../internal/ime.js";
import * as icons from "../../material/builtin.js";
var MenuContext = /* @__PURE__ */ React.createContext(null);
var ITEMS = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
var itemsOf = (panel) => panel ? Array.from(panel.querySelectorAll(ITEMS)).filter((it) => it.closest('[role="menu"]') === panel) : [];
function menuKeys(menuRef, typed, close) {
  return (e) => {
    if (isComposing(e)) return;
    const panel = e.target instanceof HTMLElement ? e.target.closest('[role="menu"]') : null;
    const list = itemsOf(panel || menuRef.current), i = list.indexOf(document.activeElement);
    const go = (n) => {
      e.preventDefault();
      if (list.length) list[(n + list.length) % list.length].focus();
    };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i < 0 ? list.length - 1 : i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close("escape", true);
    } else if (e.key === "Tab") close("blur", false);
    else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const n = typeahead(typed.current, e.key, list.map((it) => (it.querySelector(".dk-menu__label") || it).textContent || ""), i);
      if (n >= 0) list[n].focus();
    }
  };
}
var Menu = /* @__PURE__ */ named("Menu", function Menu2(props) {
  const id = domId("dk-menu", React.useId());
  const [inner, setInner] = React.useState(!!props.defaultOpen);
  const controlled = props.open !== void 0;
  const open = controlled ? !!props.open : inner;
  const menuRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const focusOn = React.useRef(null);
  const typed = React.useRef({ text: "", at: 0 });
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
  const ctx = React.useMemo(() => ({ close }), [close]);
  const items = () => itemsOf(menuRef.current);
  useAnchoredLayer(open, menuRef, triggerRef, { placement: props.placement, fallback: "bottom-start", offsetVar: "--dk-menu-offset", onOutside: () => close("outside", false), inside: triggerRef });
  useIsoLayoutEffect(() => {
    const menu = menuRef.current;
    if (!open || !menu) return;
    const list = items();
    const target = focusOn.current === "last" ? list[list.length - 1] : list[0];
    focusOn.current = null;
    if (target) target.focus();
    else menu.focus();
  }, [open]);
  const onMenuKey = menuKeys(menuRef, typed, close);
  const child = oneElement(props.trigger, "Menu", "trigger");
  useTriggerRef(triggerRef, "Menu");
  const cp = child.props;
  const childRef = elementRef(child);
  const trigger = React.cloneElement(child, {
    ref: (n) => {
      triggerRef.current = n;
      if (childRef) setRef(childRef, n);
    },
    id: cp.id || id + "-button",
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-controls": open ? id : void 0,
    onClick: (e) => {
      if (cp.onClick) cp.onClick(e);
      if (e.defaultPrevented) return;
      if (!open) focusOn.current = "first";
      set(!open, "trigger");
    },
    onKeyDown: (e) => {
      if (cp.onKeyDown) cp.onKeyDown(e);
      if (e.defaultPrevented) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        focusOn.current = e.key === "ArrowUp" ? "last" : "first";
        set(true, "trigger");
      }
    }
  });
  return /* @__PURE__ */ React.createElement(MenuContext.Provider, { value: ctx }, trigger, /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: menuRef,
      id,
      role: "menu",
      tabIndex: -1,
      ...{ popover: "manual" },
      hidden: !open || void 0,
      "aria-label": props["aria-label"],
      "aria-labelledby": props["aria-label"] ? void 0 : cp.id || triggerRef.current && triggerRef.current.id || id + "-button",
      className: cn("dk-menu", props.className),
      style: props.style,
      "data-component": "menu",
      "data-state": open ? "open" : "closed",
      onKeyDown: onMenuKey
    },
    open ? props.children : null
  ));
});
var ContextMenu = /* @__PURE__ */ named("ContextMenu", function ContextMenu2(props) {
  const id = domId("dk-ctxmenu", React.useId());
  const [inner, setInner] = React.useState(false);
  const controlled = props.open !== void 0;
  const open = controlled ? !!props.open : inner;
  const [at, setAt] = React.useState(null);
  const menuRef = React.useRef(null);
  const point = React.useRef(null);
  const targetRef = React.useRef(null);
  const back = React.useRef(null);
  const typed = React.useRef({ text: "", at: 0 });
  const ask = React.useRef(props.onOpenChange);
  ask.current = props.onOpenChange;
  const set = React.useCallback((v, reason) => {
    if (!controlled) setInner(v);
    if (ask.current) ask.current(v, { reason });
  }, [controlled]);
  const close = React.useCallback((reason, focusBack) => {
    set(false, reason);
    const to = back.current || targetRef.current;
    if (focusBack && to) to.focus();
  }, [set]);
  const ctx = React.useMemo(() => ({ close }), [close]);
  const spot = at || (open && targetRef.current ? (() => {
    const r = targetRef.current.getBoundingClientRect();
    return { x: r.left, y: r.top };
  })() : null);
  useAnchoredLayer(open && !!spot, menuRef, point, { placement: "bottom-start", offsetVar: "--dk-menu-offset", onOutside: () => close("outside", false), watch: spot && spot.x + "," + spot.y });
  useIsoLayoutEffect(() => {
    const menu = menuRef.current;
    if (!open || !menu) return;
    const first = itemsOf(menu)[0];
    if (first) first.focus();
    else menu.focus();
  }, [open, at]);
  const show = (x, y) => {
    if (!open) back.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
    setAt({ x, y });
    if (!open) set(true, "trigger");
  };
  const fromElement = (el) => {
    const r = (el instanceof Element ? el : targetRef.current || document.body).getBoundingClientRect();
    show(r.left, r.bottom);
  };
  const child = oneElement(props.target, "ContextMenu", "target");
  useTriggerRef(targetRef, "ContextMenu");
  const cp = child.props;
  const childRef = elementRef(child);
  const target = React.cloneElement(child, {
    ref: (n) => {
      targetRef.current = n;
      if (childRef) setRef(childRef, n);
    },
    onContextMenu: (e) => {
      if (cp.onContextMenu) cp.onContextMenu(e);
      if (e.defaultPrevented || props.disabled) return;
      e.preventDefault();
      if (e.clientX === 0 && e.clientY === 0) fromElement(e.target);
      else show(e.clientX, e.clientY);
    },
    onKeyDown: (e) => {
      if (cp.onKeyDown) cp.onKeyDown(e);
      if (e.defaultPrevented || props.disabled) return;
      if (e.key === "F10" && e.shiftKey || e.key === "ContextMenu") {
        e.preventDefault();
        fromElement(e.target);
      }
    }
  });
  return /* @__PURE__ */ React.createElement(MenuContext.Provider, { value: ctx }, target, /* @__PURE__ */ React.createElement("span", { ref: point, className: "dk-menu__point", "aria-hidden": true, style: spot ? { left: spot.x + "px", top: spot.y + "px" } : void 0 }), /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: menuRef,
      id,
      role: "menu",
      tabIndex: -1,
      ...{ popover: "manual" },
      hidden: !open || void 0,
      "aria-label": props["aria-label"],
      className: cn("dk-menu", props.className),
      style: props.style,
      "data-component": "menu",
      "data-state": open ? "open" : "closed",
      onKeyDown: menuKeys(menuRef, typed, close)
    },
    open ? props.children : null
  ));
});
var KEY_NAMES = {
  "\u2318": "Meta",
  cmd: "Meta",
  command: "Meta",
  meta: "Meta",
  "\u2325": "Alt",
  opt: "Alt",
  option: "Alt",
  alt: "Alt",
  "\u21E7": "Shift",
  shift: "Shift",
  "\u2303": "Control",
  ctrl: "Control",
  control: "Control",
  "\u23CE": "Enter",
  "\u21B5": "Enter",
  enter: "Enter",
  return: "Enter",
  "\u232B": "Backspace",
  del: "Delete",
  delete: "Delete",
  esc: "Escape",
  "\u238B": "Escape",
  tab: "Tab",
  space: "Space",
  "\u2191": "ArrowUp",
  "\u2193": "ArrowDown",
  "\u2190": "ArrowLeft",
  "\u2192": "ArrowRight",
  "+": "Plus",
  plus: "Plus"
};
function keyShortcuts(shortcut) {
  return shortcut.trim().split(/\s+then\s+/i).map(chord).filter(Boolean).join(" ");
}
function chord(text) {
  const parts = [];
  let last = "";
  const end = /(^|[+\-\s⌘⌥⇧⌃])([+-])$/.exec(text);
  if (end) {
    last = end[2];
    text = text.slice(0, text.length - 1);
  }
  const tokens = text.split(/\s*[+-]\s*|\s+/).filter(Boolean);
  if (last) tokens.push(last);
  for (const token of tokens) {
    let rest = token;
    while (rest.length > 1 && KEY_NAMES[rest[0]] && /[⌘⌥⇧⌃]/.test(rest[0])) {
      parts.push(KEY_NAMES[rest[0]]);
      rest = rest.slice(1);
    }
    const named2 = KEY_NAMES[rest] || KEY_NAMES[rest.toLowerCase()];
    parts.push(named2 || (rest.length === 1 ? rest.toUpperCase() : rest));
  }
  return parts.join("+");
}
var MenuItem = /* @__PURE__ */ component("MenuItem", function MenuItem2(props, ref) {
  const ctx = React.useContext(MenuContext);
  const rest = omit(props, { onSelect: 1, icon: 1, shortcut: 1, destructive: 1, disabled: 1, className: 1, children: 1, onClick: 1, onKeyDown: 1, onPointerMove: 1, as: 1 });
  const own = { onClick: props.onClick, onKeyDown: props.onKeyDown, onPointerMove: props.onPointerMove };
  const linked = rest.href != null || props.as != null;
  const choose = (e) => {
    if (props.disabled) {
      e.preventDefault();
      return;
    }
    if (props.onSelect) props.onSelect(e);
    if (!e.defaultPrevented && ctx) ctx.close("select", true);
  };
  const onClick = (e) => {
    if (own.onClick) own.onClick(e);
    if (linked && !props.disabled) {
      if (props.onSelect) props.onSelect(e);
      if (ctx) ctx.close("select", false);
      return;
    }
    choose(e);
  };
  const onKeyDown = (e) => {
    if (own.onKeyDown) own.onKeyDown(e);
    if (e.defaultPrevented) return;
    if (e.key === "Enter" || e.key === " ") {
      if (linked && e.key === "Enter" && !props.disabled) return;
      choose(e);
      e.preventDefault();
    }
  };
  const isLink = linked && !props.disabled;
  if (!isLink) delete rest.href;
  if (props.shortcut && rest["aria-keyshortcuts"] == null) rest["aria-keyshortcuts"] = keyShortcuts(props.shortcut);
  if (isLink && rest.target === "_blank" && rest.rel == null) rest.rel = "noopener noreferrer";
  const checkable = !isLink && (rest.role === "menuitemcheckbox" || rest.role === "menuitemradio");
  return React.createElement(
    isLink ? props.as || config.link : "div",
    Object.assign(rest, {
      ref,
      role: checkable ? rest.role : "menuitem",
      tabIndex: -1,
      "aria-disabled": props.disabled || void 0,
      className: cn("dk-menu__item", props.destructive && "dk-menu__item--destructive", props.className),
      onClick,
      onKeyDown,
      onPointerMove: (e) => {
        if (own.onPointerMove) own.onPointerMove(e);
        if (document.activeElement !== e.currentTarget) e.currentTarget.focus();
      }
    }),
    checkable ? /* @__PURE__ */ React.createElement("span", { className: "dk-menu__check", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { icon: icons.Check })) : null,
    props.icon != null ? /* @__PURE__ */ React.createElement("span", { className: "dk-menu__icon", "aria-hidden": "true" }, asIcon(props.icon)) : null,
    /* @__PURE__ */ React.createElement("span", { className: "dk-menu__label" }, props.children),
    // Shown, but not part of the item's name ("Copy", not "Copy command K"): aria-keyshortcuts says it.
    props.shortcut ? /* @__PURE__ */ React.createElement("kbd", { className: "dk-menu__shortcut", "aria-hidden": "true" }, props.shortcut) : null
  );
});
var MenuCheckboxItem = /* @__PURE__ */ component("MenuCheckboxItem", function MenuCheckboxItem2(props, ref) {
  const rest = omit(props, { checked: 1, onCheckedChange: 1, onSelect: 1, icon: 1, shortcut: 1 });
  const onSelect = (e) => {
    if (props.onCheckedChange) props.onCheckedChange(!props.checked);
    if (props.onSelect) props.onSelect(e);
  };
  return /* @__PURE__ */ React.createElement(MenuItem, { ...rest, ref, icon: props.icon, shortcut: props.shortcut, ...{ role: "menuitemcheckbox", "aria-checked": !!props.checked }, onSelect });
});
var RadioContext = /* @__PURE__ */ React.createContext(null);
var MenuRadioGroup = /* @__PURE__ */ component("MenuRadioGroup", function MenuRadioGroup2(props, ref) {
  const rest = omit(props, { value: 1, onValueChange: 1 });
  const ask = React.useRef(props.onValueChange);
  ask.current = props.onValueChange;
  const ctx = React.useMemo(() => ({ value: props.value, choose: (v) => {
    if (ask.current) ask.current(v);
  } }), [props.value]);
  return /* @__PURE__ */ React.createElement(RadioContext.Provider, { value: ctx }, /* @__PURE__ */ React.createElement(MenuGroup, { ...rest, ref }));
});
var MenuRadioItem = /* @__PURE__ */ component("MenuRadioItem", function MenuRadioItem2(props, ref) {
  const group = React.useContext(RadioContext);
  const rest = omit(props, { value: 1, onSelect: 1, icon: 1, shortcut: 1 });
  const onSelect = (e) => {
    if (group) group.choose(props.value);
    if (props.onSelect) props.onSelect(e);
  };
  return /* @__PURE__ */ React.createElement(MenuItem, { ...rest, ref, icon: props.icon, shortcut: props.shortcut, ...{ role: "menuitemradio", "aria-checked": !!group && group.value === props.value }, onSelect });
});
var SUB_DELAY = 150;
var MenuSub = /* @__PURE__ */ component("MenuSub", function MenuSub2(props, ref) {
  const id = domId("dk-menu-sub", React.useId());
  const rest = omit(props, { label: 1, icon: 1, disabled: 1, className: 1, children: 1, onClick: 1, onKeyDown: 1, onPointerMove: 1, onPointerLeave: 1 });
  const [open, setOpen] = React.useState(false);
  const itemRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const focusFirst = React.useRef(false);
  const timer = React.useRef(void 0);
  const hover = React.useRef(false);
  const stop = () => {
    clearTimeout(timer.current);
    hover.current = false;
  };
  const later = (fn) => {
    stop();
    timer.current = setTimeout(fn, SUB_DELAY);
  };
  const rtl = () => !!itemRef.current && getComputedStyle(itemRef.current).direction === "rtl";
  const show = (focus) => {
    stop();
    if (props.disabled) return;
    if (open) {
      if (focus) {
        const first = itemsOf(panelRef.current)[0];
        if (first) first.focus();
      }
      return;
    }
    focusFirst.current = focus;
    setOpen(true);
  };
  const hide = (focusItem) => {
    stop();
    setOpen(false);
    if (focusItem && itemRef.current) itemRef.current.focus();
  };
  React.useEffect(() => stop, []);
  useAnchoredLayer(open, panelRef, itemRef, { placement: open && rtl() ? "left-start" : "right-start", fallback: "right-start", offsetVar: "--dk-menu-sub-offset" });
  useIsoLayoutEffect(() => {
    if (!open || !focusFirst.current) return;
    focusFirst.current = false;
    const first = itemsOf(panelRef.current)[0];
    if (first) first.focus();
    else if (panelRef.current) panelRef.current.focus();
  }, [open]);
  React.useEffect(() => {
    const item = itemRef.current, parent = item && item.closest('[role="menu"]');
    if (!open || !item || !parent) return;
    const onFocus = (e) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      clearTimeout(timer.current);
      if (t !== item && !(panelRef.current && panelRef.current.contains(t)) && parent.contains(t)) timer.current = setTimeout(() => {
        setOpen(false);
      }, SUB_DELAY);
    };
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("focusin", onFocus);
    };
  }, [open]);
  const opens = (key) => key === "Enter" || key === " " || key === (rtl() ? "ArrowLeft" : "ArrowRight");
  const onPanelKey = (e) => {
    if (isComposing(e) || !(e.target instanceof HTMLElement) || e.target.closest('[role="menu"]') !== panelRef.current) return;
    if (e.key === "Escape" || e.key === (rtl() ? "ArrowRight" : "ArrowLeft")) {
      e.preventDefault();
      e.stopPropagation();
      hide(true);
    }
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, React.createElement(
    "div",
    Object.assign(rest, {
      ref: (n) => {
        itemRef.current = n;
        setRef(ref, n);
      },
      role: "menuitem",
      tabIndex: -1,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      "aria-controls": open ? id : void 0,
      "aria-disabled": props.disabled || void 0,
      "data-state": open ? "open" : "closed",
      className: cn("dk-menu__item", "dk-menu__item--sub", props.className),
      onClick: (e) => {
        if (props.onClick) props.onClick(e);
        if (!e.defaultPrevented) show(true);
      },
      onKeyDown: (e) => {
        if (props.onKeyDown) props.onKeyDown(e);
        if (e.defaultPrevented || isComposing(e) || !opens(e.key)) return;
        e.preventDefault();
        e.stopPropagation();
        show(true);
      },
      onPointerMove: (e) => {
        if (props.onPointerMove) props.onPointerMove(e);
        if (document.activeElement !== e.currentTarget) e.currentTarget.focus();
        if (!open && !props.disabled && !hover.current) {
          later(() => {
            show(false);
          });
          hover.current = true;
        }
      },
      onPointerLeave: (e) => {
        if (props.onPointerLeave) props.onPointerLeave(e);
        if (hover.current) stop();
      }
    }),
    props.icon != null ? /* @__PURE__ */ React.createElement("span", { className: "dk-menu__icon", "aria-hidden": "true" }, asIcon(props.icon)) : null,
    /* @__PURE__ */ React.createElement("span", { className: "dk-menu__label", id: id + "-label" }, props.label),
    /* @__PURE__ */ React.createElement("span", { className: "dk-menu__chevron", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronRight, className: "dk-menu__ltr" }), /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronLeft, className: "dk-menu__rtl" }))
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: panelRef,
      id,
      role: "menu",
      tabIndex: -1,
      ...{ popover: "manual" },
      hidden: !open || void 0,
      "aria-labelledby": id + "-label",
      className: "dk-menu dk-menu--sub",
      "data-component": "menu",
      "data-state": open ? "open" : "closed",
      onKeyDown: onPanelKey
    },
    open ? props.children : null
  ));
});
var MenuGroup = /* @__PURE__ */ component("MenuGroup", function MenuGroup2(props, ref) {
  const rest = omit(props, { label: 1, className: 1, children: 1 });
  const id = domId("dk-mg", React.useId());
  return /* @__PURE__ */ React.createElement("div", { ...rest, ref, role: "group", "aria-labelledby": props.label != null ? id : void 0, className: cn("dk-menu__group", props.className) }, props.label != null ? /* @__PURE__ */ React.createElement("div", { className: "dk-menu__group-label", id, role: "presentation" }, props.label) : null, props.children);
});
var MenuSeparator = /* @__PURE__ */ component("MenuSeparator", function MenuSeparator2(props, ref) {
  return /* @__PURE__ */ React.createElement("div", { ...props, ref, role: "separator", className: cn("dk-menu__separator", props.className) });
});
export {
  ContextMenu,
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  keyShortcuts
};
//# sourceMappingURL=Menu.js.map
