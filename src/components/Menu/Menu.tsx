"use client";
import * as React from "react";
import { cn, domId, elementRef, omit, setRef, useIsoLayoutEffect } from "../../internal/cn";
import { oneElement, useTriggerRef } from "../../internal/trigger";
import { config } from "../../internal/config";
import type { Placement } from "../../internal/position";
import { typeahead, typing, type Typed } from "../../internal/typeahead";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer";
import { useExit } from "../../internal/useExit";
import { Icon, type IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { component } from "../../internal/component";
import { isComposing } from "../../internal/ime";
import * as icons from "../../material/builtin";
import type { OpenChangeDetails, OpenChangeReason } from "../../internal/openChange";
import { submenuIntent } from "../../internal/timing";
import { activeIn } from "../../internal/root";

/** The trigger element's props this component reads and adds to. */
type TriggerProps = React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>;

export interface MenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'role'> {
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
  /** Called when it asks to open or close, with why: { reason: 'trigger' | 'escape' | 'outside' | 'blur' (Tab) | 'select' (an item chosen) }. */
  onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
  /** The menu's name for screen readers. Default: the trigger's text, by aria-labelledby. */
  'aria-label'?: string;
  /** Classes on the menu panel. The other HTML attributes (id, data-*, aria-*) and the ref go on the panel too. */
  className?: string;
  /** Styles on the menu panel. */
  style?: React.CSSProperties;
}
const OWN_MENU = { trigger: 1, children: 1, "aria-label": 1, "aria-labelledby": 1, placement: 1, open: 1, defaultOpen: 1, onOpenChange: 1, className: 1, style: 1, onKeyDown: 1 } as const;

interface Ctx { close: (reason: OpenChangeReason, focusTrigger: boolean) => void; open: boolean; typed: React.RefObject<Typed> }
const MenuContext = /* @__PURE__ */ React.createContext<Ctx | null>(null);
const ITEMS = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
/** The items of one panel (the menu or a submenu), not those of the submenus inside it. */
const itemsOf = (panel: HTMLElement | null): HTMLElement[] => panel ? Array.from(panel.querySelectorAll<HTMLElement>(ITEMS)).filter((it) => it.closest('[role="menu"]') === panel) : [];

/* The keys inside an open menu (or a submenu's panel, whose keys bubble to the menu's element): ↑ ↓ move,
   wrapping, Home and End jump, typing goes to the next item starting with what was typed, Escape closes and puts
   focus back, Tab closes. Shared by Menu and ContextMenu. */
function menuKeys(menuRef: React.RefObject<HTMLDivElement | null>, typed: React.RefObject<Typed>, close: (reason: OpenChangeReason, focusBack: boolean) => void) {
  return (e: React.KeyboardEvent<HTMLDivElement>) => {
    // The arrows, Home and End with Alt, Ctrl or ⌘ are the browser's (L8E36).
    if (isComposing(e) || (e.altKey || e.ctrlKey || e.metaKey) && /^(Arr|Home|End)/.test(e.key)) return;
    const panel = e.target instanceof HTMLElement ? e.target.closest<HTMLElement>('[role="menu"]') : null;
    const list = itemsOf(panel || menuRef.current), i = list.indexOf(activeIn(e.currentTarget) as HTMLElement);   // its own root's focus, in a shadow root too (GR60)
    const go = (n: number) => { e.preventDefault(); if (list.length) list[(n + list.length) % list.length].focus(); };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i < 0 ? list.length - 1 : i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close("escape", true); }
    else if (e.key === "Tab") close("blur", false);
    // Space only while a word is being typed ("my files"); otherwise the item chose itself on it.
    else if (e.key.length === 1 && (/\S/.test(e.key) || typing(typed.current)) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Taken, so a page shortcut on the same letter (useShortcut("g")) doesn't also run: a menu is no text field (L8E42).
      e.preventDefault();
      const n = typeahead(typed.current, e.key, list.map((it) => (it.querySelector(".dk-menu__label") || it).textContent || ""), i);
      if (n >= 0) list[n].focus();
    }
  };
}

/* Menu: a list of actions behind a button, following the WAI-ARIA menu button pattern. Enter, Space or ↓ on the
   button opens it on the first item (↑ on the last); ↑ ↓ move (wrapping), Home and End jump, typing goes to the
   next item starting with what was typed (internal/typeahead.ts), Enter or Space chooses, Escape closes, and focus
   goes back to the button. Tab, a click outside or choosing an item closes it. It sits in the top layer next to the button.
   A MenuSub's panel sits inside the menu's element, so the keys bubble here and work on the panel the focus is in. */
/** A list of actions behind a button: MenuItem, MenuGroup and MenuSeparator inside. */
export const Menu = /* @__PURE__ */ component<HTMLDivElement, MenuProps>("Menu", function Menu(props, ref) {
  const own = domId("dk-menu", React.useId());
  const id = props.id || own;
  const [inner, setInner] = React.useState(!!props.defaultOpen);
  const controlled = props.open !== undefined;
  const open = controlled ? !!props.open : inner;
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const focusOn = React.useRef<"first" | "last" | null>(null);
  const pressed = React.useRef(0);
  const typed = React.useRef<Typed>({ text: "", at: 0 });
  const ask = React.useRef(props.onOpenChange); ask.current = props.onOpenChange;
  const set = React.useCallback((v: boolean, reason: OpenChangeReason) => { if (!controlled) setInner(v); if (ask.current) ask.current(v, { reason }); }, [controlled]);
  const close = React.useCallback((reason: OpenChangeReason, focusTrigger: boolean) => { set(false, reason); if (focusTrigger && triggerRef.current) triggerRef.current.focus(); }, [set]);
  const ctx = React.useMemo(() => ({ close, open, typed }), [close, open]);
  const items = () => itemsOf(menuRef.current);

  // A press outside the menu and its button closes it (focus stays where the press put it).
  // Its items stay, inert, while it fades out (DZ1); one open on arrival doesn't fade in.
  const exit = useExit(open, menuRef);
  useAnchoredLayer(open, menuRef, triggerRef, { placement: props.placement, fallback: "bottom-start", offsetVar: "--dk-menu-offset", onOutside: () => close("outside", false), inside: triggerRef });
  // On open, focus goes to the first item (or the last, opened with ↑).
  useIsoLayoutEffect(() => {
    const menu = menuRef.current;
    if (!open || !menu) return;
    const list = items();
    const target = focusOn.current === "last" ? list[list.length - 1] : list[0];
    focusOn.current = null;
    if (target) target.focus(); else menu.focus();
  }, [open]);

  const keys = menuKeys(menuRef, typed, close);
  const panelRef = React.useCallback((n: HTMLDivElement | null) => { menuRef.current = n; setRef(ref, n); }, [ref]);
  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>) => { if (props.onKeyDown) props.onKeyDown(e); if (!e.defaultPrevented) keys(e); };

  const child = oneElement<TriggerProps>(props.trigger, "Menu", "trigger");
  useTriggerRef(triggerRef, "Menu");
  const cp = child.props;
  const childRef = elementRef<HTMLElement>(child);
  const trigger = React.cloneElement(child, {
    ref: (n: HTMLElement | null) => { triggerRef.current = n; if (childRef) setRef(childRef, n); },
    id: cp.id || own + "-button",
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-controls": open ? id : undefined,
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (cp.onPointerDown) cp.onPointerDown(e);
      // A mouse opens it on the press (a touch or pen, the keys, and a trigger with its own onClick, which may stop
      // it, keep the click), so it can be dragged onto an item and let go there.
      if (e.defaultPrevented || cp.onClick || e.pointerType !== "mouse" || e.button !== 0 || e.currentTarget.matches(':disabled, [aria-disabled="true"]')) return;
      const at = pressed.current = e.timeStamp || 1;
      if (open) close("trigger", true);
      else { focusOn.current = "first"; set(true, "trigger"); }
      const up = (u: PointerEvent) => {
        document.removeEventListener("pointerup", up, true);
        document.removeEventListener("pointercancel", up, true);
        // The click that follows (on the button, or wherever the press and release meet) is this press's.
        setTimeout(() => { pressed.current = 0; });
        const item = !open && u.type === "pointerup" && u.timeStamp - at > 200 && u.target instanceof Element ? u.target.closest<HTMLElement>('[role^="menuitem"]') : null;
        if (item && menuRef.current && menuRef.current.contains(item)) item.click();
      };
      document.addEventListener("pointerup", up, true);
      document.addEventListener("pointercancel", up, true);
    },
    // Keeps the focus on the item the press put it on.
    onMouseDown: (e: React.MouseEvent<HTMLElement>) => { if (cp.onMouseDown) cp.onMouseDown(e); if (pressed.current) e.preventDefault(); },
    onClick: (e: React.MouseEvent<HTMLElement>) => { if (cp.onClick) cp.onClick(e); if (e.defaultPrevented || pressed.current) return; if (!open) focusOn.current = "first"; set(!open, "trigger"); },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (cp.onKeyDown) cp.onKeyDown(e);
      // With Alt, Ctrl or ⌘ the arrows are the browser's or the system's (⌘+↓ scrolls to the page's end): leave them (L8E36).
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); focusOn.current = e.key === "ArrowUp" ? "last" : "first"; set(true, "trigger"); }
    },
  });
  return (
    <MenuContext.Provider value={ctx}>
      {trigger}
      <div {...omit(props, OWN_MENU)} ref={panelRef} id={id} role="menu" tabIndex={-1} {...{ popover: "manual" }} hidden={!open || undefined}
        aria-label={props["aria-label"]} aria-labelledby={props["aria-label"] || props["aria-labelledby"] ? props["aria-labelledby"] : cp.id || (triggerRef.current && triggerRef.current.id) || own + "-button"}
        className={cn("dk-menu", props.className)} style={props.style} data-component="menu" data-state={open ? "open" : "closed"} data-instant={exit.instant ? "" : undefined}
        inert={!open || undefined} onKeyDown={onMenuKey}>
        {open || exit.leaving ? props.children : null}
      </div>
    </MenuContext.Provider>
  );
});

export interface ContextMenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'role'> {
  /** The area the menu belongs to: one element, such as a Card, a table row or a canvas. A right-click (a long
      press on touch), Shift+F10 or the Menu key in it opens the menu. */
  target: React.ReactElement;
  /** MenuItem, MenuGroup, MenuSub and MenuSeparator. */
  children: React.ReactNode;
  /** The menu's name for screen readers ("File actions"). Required: there's no button to take it from. */
  'aria-label': string;
  /** Open it yourself (controlled), with onOpenChange. It opens where it was last asked for, or at the target. */
  open?: boolean;
  /** Called when it asks to open or close, with why: { reason: 'trigger' | 'escape' | 'outside' | 'blur' (Tab) | 'select' (an item chosen) }. */
  onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
  /** Leaves the browser's own menu in place: the target's right-click and keys do nothing. Default: false. */
  disabled?: boolean;
  /** Classes on the menu panel. The other HTML attributes (id, data-*, aria-*) and the ref go on the panel too. */
  className?: string;
  /** Styles on the menu panel. */
  style?: React.CSSProperties;
}
const OWN_CONTEXT = { target: 1, children: 1, "aria-label": 1, open: 1, onOpenChange: 1, disabled: 1, className: 1, style: 1, onKeyDown: 1 } as const;

/* ContextMenu: a Menu opened from an area instead of a button, at the pointer on a right-click (or a long press,
   which browsers turn into contextmenu) or at the focused element on Shift+F10 or the Menu key. Its items, keys,
   top layer and closing are Menu's; when it closes after a choice or Escape, focus goes back to where it was. */
/** A Menu that opens at the pointer on a right-click, or at the focused element on Shift+F10 or the Menu key. */
export const ContextMenu = /* @__PURE__ */ component<HTMLDivElement, ContextMenuProps>("ContextMenu", function ContextMenu(props, ref) {
  const own = domId("dk-ctxmenu", React.useId());
  const id = props.id || own;
  const [inner, setInner] = React.useState(false);
  const controlled = props.open !== undefined;
  const open = controlled ? !!props.open : inner;
  const [at, setAt] = React.useState<{ x: number; y: number } | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const point = React.useRef<HTMLSpanElement | null>(null);
  const targetRef = React.useRef<HTMLElement | null>(null);
  const back = React.useRef<HTMLElement | null>(null);
  const typed = React.useRef<Typed>({ text: "", at: 0 });
  const ask = React.useRef(props.onOpenChange); ask.current = props.onOpenChange;
  const set = React.useCallback((v: boolean, reason: OpenChangeReason) => { if (!controlled) setInner(v); if (ask.current) ask.current(v, { reason }); }, [controlled]);
  const close = React.useCallback((reason: OpenChangeReason, focusBack: boolean) => {
    set(false, reason);
    const to = back.current || targetRef.current;
    if (focusBack && to) to.focus();
  }, [set]);
  const ctx = React.useMemo(() => ({ close, open, typed }), [close, open]);
  // Opened from outside (controlled) before any right-click: at the target's corner.
  const spot = at || (open && targetRef.current ? (() => { const r = targetRef.current.getBoundingClientRect(); return { x: r.left, y: r.top }; })() : null);

  // Its items stay, inert, while it fades out (DZ1); one open on arrival doesn't fade in.
  const exit = useExit(open, menuRef);
  useAnchoredLayer(open && !!spot, menuRef, point, { placement: "bottom-start", offsetVar: "--dk-menu-offset", onOutside: () => close("outside", false), watch: spot && spot.x + "," + spot.y });
  useIsoLayoutEffect(() => {
    const menu = menuRef.current;
    if (!open || !menu) return;
    const first = itemsOf(menu)[0];
    if (first) first.focus(); else menu.focus();
  }, [open, at]);

  const show = (x: number, y: number) => {
    const was = activeIn(targetRef.current);
    if (!open) back.current = was instanceof HTMLElement && was !== document.body ? was : null;
    setAt({ x: x, y: y });
    if (!open) set(true, "trigger");
  };
  // From the keyboard, at the focused element's lower start corner.
  const fromElement = (el: EventTarget) => { const r = (el instanceof Element ? el : targetRef.current || document.body).getBoundingClientRect(); show(r.left, r.bottom); };

  const keys = menuKeys(menuRef, typed, close);
  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>) => { if (props.onKeyDown) props.onKeyDown(e); if (!e.defaultPrevented) keys(e); };
  const panelRef = React.useCallback((n: HTMLDivElement | null) => { menuRef.current = n; setRef(ref, n); }, [ref]);

  const child = oneElement<TriggerProps>(props.target, "ContextMenu", "target");
  useTriggerRef(targetRef, "ContextMenu");
  const cp = child.props;
  const childRef = elementRef<HTMLElement>(child);
  const target = React.cloneElement(child, {
    ref: (n: HTMLElement | null) => { targetRef.current = n; if (childRef) setRef(childRef, n); },
    onContextMenu: (e: React.MouseEvent<HTMLElement>) => {
      if (cp.onContextMenu) cp.onContextMenu(e);
      if (e.defaultPrevented || props.disabled) return;
      e.preventDefault();
      // A contextmenu from the keyboard has no pointer position.
      if (e.clientX === 0 && e.clientY === 0) fromElement(e.target); else show(e.clientX, e.clientY);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (cp.onKeyDown) cp.onKeyDown(e);
      if (e.defaultPrevented || props.disabled) return;
      if ((e.key === "F10" && e.shiftKey) || e.key === "ContextMenu") { e.preventDefault(); fromElement(e.target); }
    },
  });
  return (
    <MenuContext.Provider value={ctx}>
      {target}
      <span ref={point} className="dk-menu__point" aria-hidden style={spot ? { left: spot.x + "px", top: spot.y + "px" } : undefined} />
      <div {...omit(props, OWN_CONTEXT)} ref={panelRef} id={id} role="menu" tabIndex={-1} {...{ popover: "manual" }} hidden={!open || undefined} aria-label={props["aria-label"]}
        className={cn("dk-menu", props.className)} style={props.style} data-component="menu" data-state={open ? "open" : "closed"} data-instant={exit.instant ? "" : undefined}
        inert={!open || undefined} onKeyDown={onMenuKey}>
        {open || exit.leaving ? props.children : null}
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
  /** Where the link opens, as on <a>; with "_blank", rel defaults to "noopener noreferrer". */
  target?: string;
  /** The link's relation to the page, as on <a>. */
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
    // onSelect may move focus itself (to the next row, after deleting this one): then it stays there (L8E21).
    const a = activeIn(e.currentTarget as Element);
    if (!e.defaultPrevented && ctx) ctx.close("select", !a || a === document.body || !!a.closest('[role="menu"]'));
  };
  const onClick = (e: React.MouseEvent<HTMLElement>) => { if (own.onClick) own.onClick(e); if (linked && !props.disabled) { if (props.onSelect) props.onSelect(e); if (ctx) ctx.close("select", false); return; } choose(e); };
  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (own.onKeyDown) own.onKeyDown(e);
    if (e.defaultPrevented) return;
    if (e.key === " " && ctx && typing(ctx.typed.current)) return;   // part of a typed word: the menu's typeahead takes it
    if (e.key === "Enter" || e.key === " ") {
      if (linked && !props.disabled) {
        // Enter follows a link by itself; Space doesn't, so it clicks the link as Enter would (L8E66).
        if (e.key === " ") { e.preventDefault(); e.currentTarget.click(); }
        return;
      }
      choose(e); e.preventDefault();
    }
  };
  const isLink = linked && !props.disabled;
  if (!isLink) delete rest.href;
  if (props.shortcut && rest["aria-keyshortcuts"] == null) rest["aria-keyshortcuts"] = keyShortcuts(props.shortcut);
  if (isLink && rest.target === "_blank" && rest.rel == null) rest.rel = "noopener noreferrer";
  // MenuCheckboxItem and MenuRadioItem pass their role and aria-checked: a check slot goes before the label.
  const checkable = !isLink && (rest.role === "menuitemcheckbox" || rest.role === "menuitemradio");
  return React.createElement(isLink ? props.as || config.link : "div", Object.assign(rest, {
    ref: ref, role: checkable ? rest.role : "menuitem", tabIndex: -1, "aria-disabled": props.disabled || undefined,
    className: cn("dk-menu__item", props.destructive && "dk-menu__item--destructive", props.className),
    onClick: onClick, onKeyDown: onKeyDown, onPointerMove: (e: React.PointerEvent<HTMLElement>) => { if (own.onPointerMove) own.onPointerMove(e); if (activeIn(e.currentTarget) !== e.currentTarget) e.currentTarget.focus(); },
  }),
    checkable ? <span className="dk-menu__check" aria-hidden="true"><Icon icon={icons.Check} /></span> : null,
    props.icon != null ? <span className="dk-menu__icon" aria-hidden="true">{asIcon(props.icon)}</span> : null,
    <span className="dk-menu__label">{props.children}</span>,
    // Shown, but not part of the item's name ("Copy", not "Copy command K"): aria-keyshortcuts says it.
    props.shortcut ? <kbd className="dk-menu__shortcut" aria-hidden="true">{props.shortcut}</kbd> : null);
});

type CheckableProps = Omit<MenuItemProps, 'href' | 'as' | 'target' | 'rel' | 'destructive' | 'role' | 'aria-checked'>;
export interface MenuCheckboxItemProps extends CheckableProps {
  /** Whether it's on. The menu's items unmount while it's closed, so the state lives with you: set it in onCheckedChange. */
  checked: boolean;
  /** Called with the new state when it's chosen (click, Enter or Space). */
  onCheckedChange?: (checked: boolean) => void;
}

/* MenuCheckboxItem: an on/off setting in a Menu (role menuitemcheckbox, aria-checked), with a check before the
   label while it's on. Choosing it asks for the other state and closes the menu, as MenuItem does; call
   event.preventDefault() in onSelect to keep the menu open. */
/** A setting in a Menu that's on or off, such as "Show grid". */
export const MenuCheckboxItem = /* @__PURE__ */ component<HTMLElement, MenuCheckboxItemProps>("MenuCheckboxItem", function MenuCheckboxItem(props, ref) {
  const rest = omit(props, { checked: 1, onCheckedChange: 1, onSelect: 1, icon: 1, shortcut: 1 });
  const onSelect = (e: React.SyntheticEvent) => { if (props.onCheckedChange) props.onCheckedChange(!props.checked); if (props.onSelect) props.onSelect(e); };
  return <MenuItem {...rest} ref={ref} icon={props.icon} shortcut={props.shortcut} {...{ role: "menuitemcheckbox", "aria-checked": !!props.checked }} onSelect={onSelect} />;
});

interface RadioCtx { value: string | undefined; choose: (value: string) => void }
const RadioContext = /* @__PURE__ */ React.createContext<RadioCtx | null>(null);

export interface MenuRadioGroupProps extends Omit<MenuGroupProps, 'defaultValue' | 'onChange'> {
  /** The chosen item's value. The menu's items unmount while it's closed, so the state lives with you: set it in onValueChange. */
  value: string | undefined;
  /** Called with the item's value when one is chosen. */
  onValueChange?: (value: string) => void;
}

/* MenuRadioGroup: MenuRadioItems of which one is chosen (role menuitemradio, aria-checked), such as a sort order.
   It's a MenuGroup, so label gives it a heading that names it. */
/** A group of MenuRadioItems, one of them chosen. */
export const MenuRadioGroup = /* @__PURE__ */ component<HTMLDivElement, MenuRadioGroupProps>("MenuRadioGroup", function MenuRadioGroup(props, ref) {
  const rest = omit(props, { value: 1, onValueChange: 1 });
  const ask = React.useRef(props.onValueChange); ask.current = props.onValueChange;
  const ctx = React.useMemo<RadioCtx>(() => ({ value: props.value, choose: (v) => { if (ask.current) ask.current(v); } }), [props.value]);
  return <RadioContext.Provider value={ctx}><MenuGroup {...rest} ref={ref} /></RadioContext.Provider>;
});

export interface MenuRadioItemProps extends CheckableProps {
  /** The value MenuRadioGroup chooses with this item. */
  value: string;
}

/** One choice in a MenuRadioGroup. */
export const MenuRadioItem = /* @__PURE__ */ component<HTMLElement, MenuRadioItemProps>("MenuRadioItem", function MenuRadioItem(props, ref) {
  const group = React.useContext(RadioContext);
  const rest = omit(props, { value: 1, onSelect: 1, icon: 1, shortcut: 1 });
  const onSelect = (e: React.SyntheticEvent) => { if (group) group.choose(props.value); if (props.onSelect) props.onSelect(e); };
  return <MenuItem {...rest} ref={ref} icon={props.icon} shortcut={props.shortcut} {...{ role: "menuitemradio", "aria-checked": !!group && group.value === props.value }} onSelect={onSelect} />;
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
/** An item that opens a submenu of more items. */
export const MenuSub = /* @__PURE__ */ component<HTMLElement, MenuSubProps>("MenuSub", function MenuSub(props, ref) {
  const id = domId("dk-menu-sub", React.useId());
  const rest = omit(props, { label: 1, icon: 1, disabled: 1, className: 1, children: 1, onClick: 1, onKeyDown: 1, onPointerMove: 1, onPointerLeave: 1 });
  const [own, setOpen] = React.useState(false);
  // Closed with its menu: a submenu open when its menu closes fades out with it rather than stay open inside it.
  const parent = React.useContext(MenuContext);
  const open = own && (!parent || parent.open);
  React.useEffect(() => { if (parent && !parent.open) setOpen(false); }, [parent]);
  const itemRef = React.useRef<HTMLElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const focusFirst = React.useRef(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hover = React.useRef(false);   // the pointer is on the item and it opens in a moment
  const stop = () => { clearTimeout(timer.current); hover.current = false; };
  const later = (fn: () => void) => { stop(); timer.current = setTimeout(fn, submenuIntent); };
  const rtl = () => !!itemRef.current && getComputedStyle(itemRef.current).direction === "rtl";
  const show = (focus: boolean) => {
    stop();
    if (props.disabled) return;
    if (open) { if (focus) { const first = itemsOf(panelRef.current)[0]; if (first) first.focus(); } return; }
    focusFirst.current = focus; setOpen(true);
  };
  const hide = (focusItem: boolean) => { stop(); setOpen(false); if (focusItem && itemRef.current) itemRef.current.focus(); };
  React.useEffect(() => stop, []);

  // Its items stay, inert, while it fades out (DZ1).
  const exit = useExit(open, panelRef);
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
      if (t !== item && !(panelRef.current && panelRef.current.contains(t)) && parent.contains(t)) timer.current = setTimeout(() => { setOpen(false); }, submenuIntent);
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
          if (e.defaultPrevented || isComposing(e) || !opens(e.key) || (e.key === " " && parent && typing(parent.typed.current))) return;
          e.preventDefault(); e.stopPropagation(); show(true);
        },
        onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
          if (props.onPointerMove) props.onPointerMove(e);
          if (activeIn(e.currentTarget) !== e.currentTarget) e.currentTarget.focus();
          if (!open && !props.disabled && !hover.current) { later(() => { show(false); }); hover.current = true; }
        },
        onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { if (props.onPointerLeave) props.onPointerLeave(e); if (hover.current) stop(); },
      }),
        props.icon != null ? <span className="dk-menu__icon" aria-hidden="true">{asIcon(props.icon)}</span> : null,
        <span className="dk-menu__label" id={id + "-label"}>{props.label}</span>,
        <span className="dk-menu__chevron" aria-hidden="true"><Icon icon={icons.ChevronRight} /></span>)}
      <div ref={panelRef} id={id} role="menu" tabIndex={-1} {...{ popover: "manual" }} hidden={!open || undefined} data-instant={exit.instant ? "" : undefined} aria-labelledby={id + "-label"}
        className="dk-menu dk-menu--sub" data-component="menu" data-state={open ? "open" : "closed"} inert={!open || undefined} onKeyDown={onPanelKey}>
        {open || exit.leaving ? props.children : null}
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

export type MenuSeparatorProps = React.HTMLAttributes<HTMLDivElement>;

/** A line between groups of items. */
export const MenuSeparator = /* @__PURE__ */ component<HTMLDivElement, MenuSeparatorProps>("MenuSeparator", function MenuSeparator(props, ref) {
  return <div {...props} ref={ref} role="separator" className={cn("dk-menu__separator", props.className)} />;
});
