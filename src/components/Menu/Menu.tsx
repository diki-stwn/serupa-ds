"use client";
import * as React from "react";
import { cn, domId, elementRef, omit, setRef, useIsoLayoutEffect } from "../../internal/cn";
import { config } from "../../internal/config";
import { type Placement } from "../../internal/position";
import { typeahead, type Typed } from "../../internal/typeahead";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer";
import { Icon, type IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { component, named } from "../../internal/component";
import { isComposing } from "../../internal/ime";
import * as icons from "../../material/builtin";

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
  /** Open at first (uncontrolled), such as a menu a page returns to. Default: false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The menu's name for screen readers. Default: the trigger's text, by aria-labelledby. */
  'aria-label'?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface Ctx { close: (focusTrigger: boolean) => void }
const MenuContext = /* @__PURE__ */ React.createContext<Ctx | null>(null);
const ITEMS = '[role="menuitem"]';
/** The items of one panel (the menu or a submenu), not those of the submenus inside it. */
const itemsOf = (panel: HTMLElement | null): HTMLElement[] => panel ? Array.from(panel.querySelectorAll<HTMLElement>(ITEMS)).filter((it) => it.closest('[role="menu"]') === panel) : [];

/* Menu: a list of actions behind a button, following the WAI-ARIA menu button pattern. Enter, Space or ↓ on the
   button opens it on the first item (↑ on the last); ↑ ↓ move (wrapping), Home and End jump, typing goes to the
   next item starting with what was typed (internal/typeahead.ts), Enter or Space chooses, Escape closes, and focus
   goes back to the button. Tab, a click outside or choosing an item closes it. It sits in the top layer next to the button.
   A MenuSub's panel sits inside the menu's element, so the keys bubble here and work on the panel the focus is in. */
/** A list of actions behind a button: MenuItem, MenuGroup and MenuSeparator inside. */
export const Menu = /* @__PURE__ */ named("Menu", function Menu(props: MenuProps): React.ReactElement {
  const id = domId("dk-menu", React.useId());
  const [inner, setInner] = React.useState(!!props.defaultOpen);
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
  const items = () => itemsOf(menuRef.current);

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
    const panel = e.target instanceof HTMLElement ? e.target.closest<HTMLElement>('[role="menu"]') : null;
    const list = itemsOf(panel || menuRef.current), i = list.indexOf(document.activeElement as HTMLElement);
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
  "⌫": "Backspace", del: "Delete", delete: "Delete", esc: "Escape", "⎋": "Escape", tab: "Tab", space: "Space", "↑": "ArrowUp", "↓": "ArrowDown", "←": "ArrowLeft", "→": "ArrowRight", "+": "Plus", plus: "Plus" };
/** "⌘⇧K", "Ctrl+Shift+P", "Cmd-K" or "Alt F4" as aria-keyshortcuts wants it: "Meta+Shift+K", "Control+Shift+P",
    "Meta+K", "Alt+F4". A + or - key at the end stays a key ("Ctrl++" is "Control+Plus"), and "G then I" is two
    presses, space-separated: "G I". */
export function keyShortcuts(shortcut: string): string {
  return shortcut.trim().split(/\s+then\s+/i).map(chord).filter(Boolean).join(" ");
}
function chord(text: string): string {
  const parts: string[] = [];
  // A last + or - after a separator (or alone) is the key itself, not a separator.
  let last = "";
  const end = /(^|[+\-\s⌘⌥⇧⌃])([+-])$/.exec(text);
  if (end) { last = end[2]; text = text.slice(0, text.length - 1); }
  const tokens = text.split(/\s*[+-]\s*|\s+/).filter(Boolean);
  if (last) tokens.push(last);
  for (const token of tokens) {
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

export interface MenuSubProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** The item's label, which also names the submenu. */
  label: React.ReactNode;
  /** MenuItem, MenuGroup, MenuSeparator, and MenuSub again. */
  children: React.ReactNode;
  /** An icon before the label: an icon name or any element. */
  icon?: IconSource;
  /** Still reachable with the keys, but doesn't open (aria-disabled). */
  disabled?: boolean;
}

/* MenuSub: an item that opens a submenu at its end edge (to the right, or the left in rtl, flipping when there's
   no room). → (← in rtl), Enter or Space opens it on its first item, ← (→ in rtl) or Escape closes it and goes back
   to the item; ↑ ↓ Home End and letters work inside it alone. Hovering the item opens it after a moment, and the
   pointer can cross the items in between on its way: it closes a moment after the focus settles on another item
   of its menu. Choosing an item in it closes the whole menu. */
const SUB_DELAY = 150;
/** An item that opens a submenu of more items. */
export const MenuSub = /* @__PURE__ */ component<HTMLElement, MenuSubProps>("MenuSub", function MenuSub(props, ref) {
  const id = domId("dk-menu-sub", React.useId());
  const rest = omit(props, { label: 1, icon: 1, disabled: 1, className: 1, children: 1, onClick: 1, onKeyDown: 1, onPointerMove: 1, onPointerLeave: 1 });
  const [open, setOpen] = React.useState(false);
  const itemRef = React.useRef<HTMLElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const focusFirst = React.useRef(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hover = React.useRef(false);   // the pointer is on the item and it opens in a moment
  const stop = () => { clearTimeout(timer.current); hover.current = false; };
  const later = (fn: () => void) => { stop(); timer.current = setTimeout(fn, SUB_DELAY); };
  const rtl = () => !!itemRef.current && getComputedStyle(itemRef.current).direction === "rtl";
  const show = (focus: boolean) => {
    stop();
    if (props.disabled) return;
    if (open) { if (focus) { const first = itemsOf(panelRef.current)[0]; if (first) first.focus(); } return; }
    focusFirst.current = focus; setOpen(true);
  };
  const hide = (focusItem: boolean) => { stop(); setOpen(false); if (focusItem && itemRef.current) itemRef.current.focus(); };
  React.useEffect(() => stop, []);

  useAnchoredLayer(open, panelRef, itemRef, { placement: open && rtl() ? "left-start" : "right-start", fallback: "right-start", offsetVar: "--dk-menu-sub-offset" });
  useIsoLayoutEffect(() => {
    if (!open || !focusFirst.current) return;
    focusFirst.current = false;
    const first = itemsOf(panelRef.current)[0];
    if (first) first.focus(); else if (panelRef.current) panelRef.current.focus();
  }, [open]);
  // Focus settling on another item of this item's menu (by pointer or keys) closes it, after a moment.
  React.useEffect(() => {
    const item = itemRef.current, parent = item && item.closest<HTMLElement>('[role="menu"]');
    if (!open || !item || !parent) return;
    const onFocus = (e: FocusEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      clearTimeout(timer.current);
      if (t !== item && !(panelRef.current && panelRef.current.contains(t)) && parent.contains(t)) timer.current = setTimeout(() => { setOpen(false); }, SUB_DELAY);
    };
    document.addEventListener("focusin", onFocus);
    return () => { document.removeEventListener("focusin", onFocus); };
  }, [open]);

  const opens = (key: string) => key === "Enter" || key === " " || key === (rtl() ? "ArrowLeft" : "ArrowRight");
  const onPanelKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isComposing(e) || !(e.target instanceof HTMLElement) || e.target.closest('[role="menu"]') !== panelRef.current) return;
    if (e.key === "Escape" || e.key === (rtl() ? "ArrowRight" : "ArrowLeft")) { e.preventDefault(); e.stopPropagation(); hide(true); }
  };
  return (
    <>
      {React.createElement("div", Object.assign(rest, {
        ref: (n: HTMLElement | null) => { itemRef.current = n; setRef(ref, n); },
        role: "menuitem", tabIndex: -1, "aria-haspopup": "menu", "aria-expanded": open, "aria-controls": open ? id : undefined,
        "aria-disabled": props.disabled || undefined, "data-state": open ? "open" : "closed",
        className: cn("dk-menu__item", "dk-menu__item--sub", props.className),
        onClick: (e: React.MouseEvent<HTMLElement>) => { if (props.onClick) props.onClick(e); if (!e.defaultPrevented) show(true); },
        onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
          if (props.onKeyDown) props.onKeyDown(e);
          if (e.defaultPrevented || isComposing(e) || !opens(e.key)) return;
          e.preventDefault(); e.stopPropagation(); show(true);
        },
        onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
          if (props.onPointerMove) props.onPointerMove(e);
          if (document.activeElement !== e.currentTarget) e.currentTarget.focus();
          if (!open && !props.disabled && !hover.current) { later(() => { show(false); }); hover.current = true; }
        },
        onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { if (props.onPointerLeave) props.onPointerLeave(e); if (hover.current) stop(); },
      }),
        props.icon != null ? <span className="dk-menu__icon" aria-hidden="true">{asIcon(props.icon)}</span> : null,
        <span className="dk-menu__label" id={id + "-label"}>{props.label}</span>,
        <span className="dk-menu__chevron" aria-hidden="true"><Icon icon={icons.ChevronRight} className="dk-menu__ltr" /><Icon icon={icons.ChevronLeft} className="dk-menu__rtl" /></span>)}
      <div ref={panelRef} id={id} role="menu" tabIndex={-1} {...{ popover: "manual" }} hidden={!open || undefined} aria-labelledby={id + "-label"}
        className="dk-menu dk-menu--sub" data-component="menu" data-state={open ? "open" : "closed"} onKeyDown={onPanelKey}>
        {open ? props.children : null}
      </div>
    </>
  );
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
