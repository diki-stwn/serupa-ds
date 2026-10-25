"use client";
import * as React from "react";
import { cn, domId, elementRef, omit, setRef, useIsoLayoutEffect } from "../../internal/cn";
import { config } from "../../internal/config";
import { type Placement } from "../../internal/position";
import { typeahead, type Typed } from "../../internal/typeahead";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer";
import { type IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { component, named } from "../../internal/component";
import { isComposing } from "../../internal/ime";

/** The trigger element's props this component reads and adds to. */
type TriggerProps = React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>;

export interface MenuProps {
  /** The button that opens the menu: one element, such as a Button or IconButton. It gets aria-haspopup, aria-expanded and the keys. */
  trigger: React.ReactElement;
  /** MenuItem, MenuGroup and MenuSeparator. */
  children: React.ReactNode;
  /** Where the menu goes: 'bottom-start' (default), 'bottom-end', 'top-start', 'top-end', or any Tooltip placement. It flips when there's no room. */
  placement?: Placement;
  /** Open it yourself (controlled), with onOpenChange. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The menu's name for screen readers. Default: the trigger's text, by aria-labelledby. */
  'aria-label'?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface Ctx { close: (focusTrigger: boolean) => void }
const MenuContext = /* @__PURE__ */ React.createContext<Ctx | null>(null);
const ITEMS = '[role="menuitem"]';

/* Menu: a list of actions behind a button, following the WAI-ARIA menu button pattern. Enter, Space or ↓ on the
   button opens it on the first item (↑ on the last); ↑ ↓ move (wrapping), Home and End jump, typing goes to the
   next item starting with what was typed (internal/typeahead.ts), Enter or Space chooses, Escape closes, and focus
   goes back to the button. Tab, a click outside or choosing an item closes it. It sits in the top layer next to the button. */
/** A list of actions behind a button: MenuItem, MenuGroup and MenuSeparator inside. */
export const Menu = /* @__PURE__ */ named("Menu", function Menu(props: MenuProps): React.ReactElement {
  const id = domId("dk-menu", React.useId());
  const [inner, setInner] = React.useState(false);
  const controlled = props.open !== undefined;
  const open = controlled ? !!props.open : inner;
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const focusOn = React.useRef<"first" | "last" | null>(null);
  const typed = React.useRef<Typed>({ text: "", at: 0 });
  const ask = React.useRef(props.onOpenChange); ask.current = props.onOpenChange;
  const set = React.useCallback((v: boolean) => { if (!controlled) setInner(v); if (ask.current) ask.current(v); }, [controlled]);
  const close = React.useCallback((focusTrigger: boolean) => { set(false); if (focusTrigger && triggerRef.current) triggerRef.current.focus(); }, [set]);
  const ctx = React.useMemo(() => ({ close }), [close]);
  const items = () => menuRef.current ? Array.from(menuRef.current.querySelectorAll<HTMLElement>(ITEMS)) : [];

  // A press outside the menu and its button closes it (focus stays where the press put it).
  useAnchoredLayer(open, menuRef, triggerRef, { placement: props.placement, fallback: "bottom-start", offsetVar: "--dk-menu-offset", onOutside: () => close(false), inside: triggerRef });
  // On open, focus goes to the first item (or the last, opened with ↑).
  useIsoLayoutEffect(() => {
    const menu = menuRef.current;
    if (!open || !menu) return;
    const list = items();
    const target = focusOn.current === "last" ? list[list.length - 1] : list[0];
    focusOn.current = null;
    if (target) target.focus(); else menu.focus();
  }, [open]);

  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isComposing(e)) return;
    const list = items(), i = list.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => { e.preventDefault(); if (list.length) list[(n + list.length) % list.length].focus(); };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i < 0 ? list.length - 1 : i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (e.key === "Tab") close(false);
    else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const n = typeahead(typed.current, e.key, list.map((it) => (it.querySelector(".dk-menu__label") || it).textContent || ""), i);
      if (n >= 0) list[n].focus();
    }
  };

  const child = React.Children.only(props.trigger) as React.ReactElement<TriggerProps>;
  const cp = child.props;
  const childRef = elementRef<HTMLElement>(child);
  const trigger = React.cloneElement(child, {
    ref: (n: HTMLElement | null) => { triggerRef.current = n; if (childRef) setRef(childRef, n); },
    id: cp.id || id + "-button",
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-controls": open ? id : undefined,
    onClick: (e: React.MouseEvent<HTMLElement>) => { if (cp.onClick) cp.onClick(e); if (e.defaultPrevented) return; if (!open) focusOn.current = "first"; set(!open); },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (cp.onKeyDown) cp.onKeyDown(e);
      if (e.defaultPrevented) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); focusOn.current = e.key === "ArrowUp" ? "last" : "first"; set(true); }
    },
  });
  return (
    <MenuContext.Provider value={ctx}>
      {trigger}
      <div ref={menuRef} id={id} role="menu" tabIndex={-1} {...{ popover: "manual" }} hidden={!open || undefined}
        aria-label={props["aria-label"]} aria-labelledby={props["aria-label"] ? undefined : cp.id || (triggerRef.current && triggerRef.current.id) || id + "-button"}
        className={cn("dk-menu", props.className)} style={props.style} data-component="menu" data-state={open ? "open" : "closed"} onKeyDown={onMenuKey}>
        {open ? props.children : null}
      </div>
    </MenuContext.Provider>
  );
});

export interface MenuItemProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> {
  /** Called when the item is chosen (click, Enter or Space). The menu then closes, unless you call event.preventDefault(). */
  onSelect?: (event: React.SyntheticEvent) => void;
  /** An icon before the label: an icon name or any element. */
  icon?: IconSource;
  /** A keyboard shortcut shown at the end, such as "⌘K" or "Ctrl+Shift+P". Only a hint: wire the shortcut yourself.
      It's also given to assistive tech as aria-keyshortcuts ("Meta+K"), worked out from it; pass aria-keyshortcuts
      to set that yourself. */
  shortcut?: string;
  /** Danger colors, for deleting. */
  destructive?: boolean;
  /** Still reachable with the keys, but can't be chosen (aria-disabled). */
  disabled?: boolean;
  /** Makes it a link (the configure({ link }) component, <a> by default). */
  href?: string;
  /** Makes it a link with this component, in place of the configure({ link }) one: a router's Link, with its own props (to). */
  as?: React.ElementType;
  target?: string;
  rel?: string;
}

const KEY_NAMES: Record<string, string> = { "⌘": "Meta", cmd: "Meta", command: "Meta", meta: "Meta", "⌥": "Alt", opt: "Alt", option: "Alt", alt: "Alt",
  "⇧": "Shift", shift: "Shift", "⌃": "Control", ctrl: "Control", control: "Control", "⏎": "Enter", "↵": "Enter", enter: "Enter", return: "Enter",
  "⌫": "Backspace", del: "Delete", delete: "Delete", esc: "Escape", "⎋": "Escape", tab: "Tab", space: "Space", "↑": "ArrowUp", "↓": "ArrowDown", "←": "ArrowLeft", "→": "ArrowRight" };
/** "⌘⇧K", "Ctrl+Shift+P" or "Alt F4" as aria-keyshortcuts wants it: "Meta+Shift+K", "Control+Shift+P", "Alt+F4". */
export function keyShortcuts(shortcut: string): string {
  const parts: string[] = [];
  for (const token of shortcut.trim().split(/\s*[+\s]\s*/).filter(Boolean)) {
    // Mac symbols are written together ("⌘⇧K"): split off each modifier symbol.
    let rest = token;
    while (rest.length > 1 && KEY_NAMES[rest[0]] && /[⌘⌥⇧⌃]/.test(rest[0])) { parts.push(KEY_NAMES[rest[0]]); rest = rest.slice(1); }
    const named = KEY_NAMES[rest] || KEY_NAMES[rest.toLowerCase()];
    parts.push(named || (rest.length === 1 ? rest.toUpperCase() : rest));
  }
  return parts.join("+");
}

/** One action in a Menu. */
export const MenuItem = /* @__PURE__ */ component<HTMLElement, MenuItemProps>("MenuItem", function MenuItem(props, ref) {
  const ctx = React.useContext(MenuContext);
  const rest = omit(props, { onSelect: 1, icon: 1, shortcut: 1, destructive: 1, disabled: 1, className: 1, children: 1, onClick: 1, onKeyDown: 1, onPointerMove: 1, as: 1 });
  const own = { onClick: props.onClick, onKeyDown: props.onKeyDown, onPointerMove: props.onPointerMove };
  const linked = rest.href != null || props.as != null;   // a link component of its own may take its address another way (to)
  const choose = (e: React.SyntheticEvent) => {
    if (props.disabled) { e.preventDefault(); return; }
    if (props.onSelect) props.onSelect(e);
    if (!e.defaultPrevented && ctx) ctx.close(true);
  };
  const onClick = (e: React.MouseEvent<HTMLElement>) => { if (own.onClick) own.onClick(e); if (linked && !props.disabled) { if (props.onSelect) props.onSelect(e); if (ctx) ctx.close(false); return; } choose(e); };
  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (own.onKeyDown) own.onKeyDown(e);
    if (e.defaultPrevented) return;
    if (e.key === "Enter" || e.key === " ") { if (linked && e.key === "Enter" && !props.disabled) return; choose(e); e.preventDefault(); }
  };
  const isLink = linked && !props.disabled;
  if (!isLink) delete rest.href;
  if (props.shortcut && rest["aria-keyshortcuts"] == null) rest["aria-keyshortcuts"] = keyShortcuts(props.shortcut);
  if (isLink && rest.target === "_blank" && rest.rel == null) rest.rel = "noopener noreferrer";
  return React.createElement(isLink ? props.as || config.link : "div", Object.assign(rest, {
    ref: ref, role: "menuitem", tabIndex: -1, "aria-disabled": props.disabled || undefined,
    className: cn("dk-menu__item", props.destructive && "dk-menu__item--destructive", props.className),
    onClick: onClick, onKeyDown: onKeyDown, onPointerMove: (e: React.PointerEvent<HTMLElement>) => { if (own.onPointerMove) own.onPointerMove(e); if (document.activeElement !== e.currentTarget) e.currentTarget.focus(); },
  }),
    props.icon != null ? <span className="dk-menu__icon" aria-hidden="true">{asIcon(props.icon)}</span> : null,
    <span className="dk-menu__label">{props.children}</span>,
    // Shown, but not part of the item's name ("Copy", not "Copy command K"): aria-keyshortcuts says it.
    props.shortcut ? <kbd className="dk-menu__shortcut" aria-hidden="true">{props.shortcut}</kbd> : null);
});

export interface MenuGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** A small heading over the group, which also names it. */
  label?: React.ReactNode;
}

/** Items that belong together, with an optional heading. */
export const MenuGroup = /* @__PURE__ */ component<HTMLDivElement, MenuGroupProps>("MenuGroup", function MenuGroup(props, ref) {
  const rest = omit(props, { label: 1, className: 1, children: 1 });
  const id = domId("dk-mg", React.useId());
  return (
    <div {...rest} ref={ref} role="group" aria-labelledby={props.label != null ? id : undefined} className={cn("dk-menu__group", props.className)}>
      {props.label != null ? <div className="dk-menu__group-label" id={id} role="presentation">{props.label}</div> : null}
      {props.children}
    </div>
  );
});

/** A line between groups of items. */
export const MenuSeparator = /* @__PURE__ */ component<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>("MenuSeparator", function MenuSeparator(props, ref) {
  return <div {...props} ref={ref} role="separator" className={cn("dk-menu__separator", props.className)} />;
});
