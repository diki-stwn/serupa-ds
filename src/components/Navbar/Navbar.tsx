"use client";
import * as React from "react";
import { cn, domId, oneOf, omit, setRef } from "../../internal/cn";
import { IconButton } from "../IconButton/IconButton";
import type { ContainerSize } from "../Container/Container";
import { component } from "../../internal/component";
import { isComposing } from "../../internal/ime";
import { flattenChildren } from "../../internal/children";
import { useSerupa } from "../../internal/provider";
import * as icons from "../../material/builtin";

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  /** The logo or product name on the left, usually a link home. */
  brand?: React.ReactNode;
  /** NavbarLinks: the main pages. Below 768px they fold into a menu button. */
  children?: React.ReactNode;
  /** Controls on the right: a search, a user menu, a sign-in button. */
  actions?: React.ReactNode;
  /** Keeps the bar at the top while the page scrolls. Default: false. */
  sticky?: boolean;
  /** The content's maximum width, like Container: 'md', 'lg', 'xl' (default), '2xl' or 'full'. */
  size?: ContainerSize;
  /** The links' nav name. Default: "Main". */
  "aria-label"?: string;
  /** The menu button's name on small screens. Default: "Menu". */
  menuLabel?: string;
}

export interface NavbarLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** The current page: shaded, with aria-current="page". Default: false. */
  active?: boolean;
  /** What renders the link: 'a' (default), or your router's link component. */
  as?: React.ElementType;
}

const NavbarContext = /* @__PURE__ */ React.createContext<{ close: () => void } | null>(null);

/* Navbar: the bar across the top of an app: brand, the main links and actions. Below 768px the links fold
   into a menu button that opens them in a panel under the bar (Escape or a link closes it). className and
   every other prop go to the <header>. */
/** The bar across the top: brand, main links and actions. On small screens the links fold into a menu button. */
export const Navbar = /* @__PURE__ */ component<HTMLElement, NavbarProps>("Navbar", function Navbar(props, ref) {
  const sds = useSerupa();
  const rest = omit(props, { brand: 1, children: 1, actions: 1, sticky: 1, size: 1, menuLabel: 1, className: 1, "aria-label": 1, onKeyDown: 1, onBlur: 1 });
  const [open, setOpen] = React.useState(false);
  const toggle = React.useRef<HTMLButtonElement>(null);
  const bar = React.useRef<HTMLElement | null>(null);
  const id = domId("dk-nav", React.useId());
  const size = oneOf(["prose", "md", "lg", "xl", "2xl", "full"] as const, props.size, "xl");
  const links = flattenChildren(props.children);
  const hasLinks = links.length > 0;
  const close = React.useCallback(() => setOpen(false), []);
  // closes when the screen grows past the breakpoint, so it isn't open the next time it shrinks
  React.useEffect(() => {
    if (!open || typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const on = () => { if (mq.matches) setOpen(false); };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [open]);
  // A press outside the bar (on the page under the open panel) closes it, as a Popover does. Focus stays where the press puts it.
  React.useEffect(() => {
    if (!open) return;
    const on = (e: PointerEvent) => { if (bar.current && e.target instanceof Node && !bar.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", on, true);
    return () => document.removeEventListener("pointerdown", on, true);
  }, [open]);
  function onKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (props.onKeyDown) props.onKeyDown(e);
    if (!e.defaultPrevented && e.key === "Escape" && open && !isComposing(e)) { e.preventDefault(); setOpen(false); if (toggle.current) toggle.current.focus(); }
  }
  // Focus leaving the header (Tab past the last link, or into the page) closes the menu, as a Popover does.
  function onBlur(e: React.FocusEvent<HTMLElement>) {
    if (props.onBlur) props.onBlur(e);
    if (open && e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) setOpen(false);
  }
  // While the small-screen menu is open, the links come after the menu button in the DOM, as they do on screen
  // (the panel opens under the bar), so Tab goes from the button into them. Closed, and on wide screens, they sit
  // between the brand and the actions.
  const nav = hasLinks ? (
    <nav id={id} aria-label={props["aria-label"] || sds.labels.mainNavigation} className="dk-navbar__nav">
      <ul className="dk-navbar__links">{links.map((c, i) => <li key={React.isValidElement(c) && c.key != null ? c.key : i}>{c}</li>)}</ul>
    </nav>
  ) : null;
  return (
    <NavbarContext.Provider value={{ close }}>
      <header {...rest} ref={(n) => { bar.current = n; setRef(ref, n); }} onKeyDown={onKeyDown} onBlur={onBlur} data-component="navbar" data-state={open ? "open" : "closed"} className={cn("dk-navbar", props.sticky && "dk-navbar--sticky", props.className)}>
        <div className={cn("dk-navbar__inner dk-container dk-container--padded", "dk-container--" + size)}>
          {props.brand != null ? <div className="dk-navbar__brand">{props.brand}</div> : null}
          {open ? null : nav}
          {props.actions != null ? <div className="dk-navbar__actions">{props.actions}</div> : null}
          {hasLinks ? (
            <IconButton ref={toggle} className="dk-navbar__toggle" icon={open ? icons.Close : icons.Menu} label={props.menuLabel || sds.labels.menu} noTitle
              aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} />
          ) : null}
          {open ? nav : null}
        </div>
      </header>
    </NavbarContext.Provider>
  );
});

/** A main page link in a Navbar. active marks the current page; following one closes the small-screen menu. */
export const NavbarLink = /* @__PURE__ */ component<HTMLAnchorElement, NavbarLinkProps>("NavbarLink", function NavbarLink(props, ref) {
  const ctx = React.useContext(NavbarContext);
  const rest = omit(props, { active: 1, as: 1, className: 1, onClick: 1 });
  return React.createElement(props.as || "a", Object.assign(rest, {
    ref: ref, "aria-current": props.active ? "page" : undefined,
    className: cn("dk-navbar__link", props.active && "dk-navbar__link--active", props.className),
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => { if (props.onClick) props.onClick(e); if (ctx) ctx.close(); },
  }));
});
