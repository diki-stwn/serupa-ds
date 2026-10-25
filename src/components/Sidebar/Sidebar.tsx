"use client";
import * as React from "react";
import { cn, domId, omit } from "../../internal/cn";
import { Icon, type IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { Tooltip } from "../Tooltip/Tooltip";
import { config } from "../../internal/config";
import { Menu, MenuItem } from "../Menu/Menu";
import { component } from "../../internal/component";
import { flattenChildren } from "../../internal/children";
import { useSerupa } from "../../internal/provider";
import * as icons from "../../material/builtin";

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  /** SidebarSections, or SidebarItems directly. */
  children?: React.ReactNode;
  /** Above the items: a logo, a workspace switcher. */
  header?: React.ReactNode;
  /** Pinned to the bottom: settings, the signed-in user. */
  footer?: React.ReactNode;
  /** Narrows it to icons only (64px). Labels show as tooltips, and groups open their items in a menu. Default: false. */
  collapsed?: boolean;
  /** The nav's accessible name. Default: "Main". */
  "aria-label"?: string;
}

export interface SidebarSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** A small heading over the section's items. Hidden when the sidebar is collapsed. */
  title?: React.ReactNode;
  /** SidebarItems. */
  children?: React.ReactNode;
}

export interface SidebarItemProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  /** The item's text. */
  label: React.ReactNode;
  /** An icon before the label: a Material Symbols or custom name, or an element. Top-level items need one to show when collapsed. */
  icon?: IconSource;
  /** The current page: shaded, with aria-current="page". Default: false. */
  active?: boolean;
  /** Something at the end, such as a count Badge. Hidden when collapsed. */
  badge?: React.ReactNode;
  /** Nested SidebarItems: the item becomes a button that shows and hides them. */
  children?: React.ReactNode;
  /** With children: open at first. Default: open when one of them is active. */
  defaultOpen?: boolean;
  /** What renders the link: your router's link component. Default: the link set with configure({ link }), else 'a'. */
  as?: React.ElementType;
}

const SidebarContext = /* @__PURE__ */ React.createContext<{ collapsed: boolean; depth: number }>({ collapsed: false, depth: 0 });

function isSection(c: React.ReactNode): boolean {
  return React.isValidElement(c) && c.type === SidebarSection;
}

/* Sidebar: a vertical <nav> for an app's main pages: an optional header, sections of items (icons, labels,
   badges, nested groups), and a footer pinned to the bottom. collapsed narrows it to an icon rail. It takes
   its parent's height; className and every other prop go to the <nav>. */
/** A vertical nav for an app's pages: sections of items with icons, badges and nested groups; collapses to an icon rail. */
export const Sidebar = /* @__PURE__ */ component<HTMLElement, SidebarProps>("Sidebar", function Sidebar(props, ref) {
  const sds = useSerupa();
  const rest = omit(props, { header: 1, footer: 1, collapsed: 1, className: 1, children: 1, "aria-label": 1 });
  const collapsed = !!props.collapsed;
  // runs of loose items get their own list
  const body: React.ReactNode[] = [];
  let run: React.ReactNode[] = [];
  const flush = () => { if (run.length) { body.push(<ul key={"l" + body.length} className="dk-sidebar__list">{run}</ul>); run = []; } };
  flattenChildren(props.children).forEach((c) => { if (isSection(c)) { flush(); body.push(c); } else run.push(c); });
  flush();
  return (
    <SidebarContext.Provider value={{ collapsed, depth: 0 }}>
      <nav {...rest} aria-label={props["aria-label"] || sds.labels.mainNavigation} ref={ref} data-component="sidebar" data-collapsed={collapsed ? "" : undefined}
        className={cn("dk-sidebar", collapsed && "dk-sidebar--collapsed", props.className)}>
        {props.header != null ? <div className="dk-sidebar__header">{props.header}</div> : null}
        <div className="dk-sidebar__body">{body}</div>
        {props.footer != null ? <div className="dk-sidebar__footer">{props.footer}</div> : null}
      </nav>
    </SidebarContext.Provider>
  );
});

/** A group of items in a Sidebar, with an optional small heading. */
export const SidebarSection = /* @__PURE__ */ component<HTMLDivElement, SidebarSectionProps>("SidebarSection", function SidebarSection(props, ref) {
  const rest = omit(props, { title: 1, className: 1, children: 1 });
  const id = domId("dk-sbs", React.useId());
  const titled = props.title != null && props.title !== false && props.title !== "";
  return (
    <div {...rest} ref={ref} className={cn("dk-sidebar__section", props.className)}>
      {titled ? <div id={id} className="dk-sidebar__section-title">{props.title}</div> : null}
      <ul className="dk-sidebar__list" aria-labelledby={titled ? id : undefined}>{props.children}</ul>
    </div>
  );
});

const ITEM_OWN = { label: 1, icon: 1, active: 1, badge: 1, children: 1, defaultOpen: 1, as: 1, className: 1 } as const;
type ItemElement = React.ReactElement<SidebarItemProps>;
const itemsOf = (children: React.ReactNode) => flattenChildren(children).filter(React.isValidElement) as ItemElement[];
/** The item is the current page, or one of its items is, at any depth: a group opens and shows active for a grandchild too. */
const activeWithin = (k: ItemElement): boolean => !!k.props.active || itemsOf(k.props.children).some(activeWithin);

/* A rail group's Menu trigger: a button that, like a rail link, shows its label as a tooltip on hover and focus.
   Menu hands its props (ref, id, aria-expanded, onClick, …) to this, and they go on to the button inside the Tooltip. */
function RailButton({ tip, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tip?: string; ref?: React.Ref<HTMLButtonElement> }) {
  const button = <button type="button" {...rest} />;
  return tip ? <Tooltip content={tip} placement="right" role="label">{button}</Tooltip> : button;
}

/* SidebarItem: a link (icon, label, badge), or with nested items a button with aria-expanded that shows and
   hides them. Collapsed: only the icon, with the label as a tooltip; a group opens its items in a Menu. The ref
   goes to the link or the group's button. */
/** An item in a Sidebar: a link, or a group of nested items. */
export const SidebarItem = /* @__PURE__ */ component<HTMLAnchorElement, SidebarItemProps>("SidebarItem", function SidebarItem(props, ref) {
  const ctx = React.useContext(SidebarContext);
  const rest = omit(props, ITEM_OWN);
  const kids = itemsOf(props.children);
  const group = kids.length > 0;
  const childActive = kids.some(activeWithin);
  const [open, setOpen] = React.useState(props.defaultOpen != null ? !!props.defaultOpen : childActive);
  const listId = domId("dk-sbi", React.useId());
  const rail = ctx.collapsed && ctx.depth === 0;
  const inner = (chevron: boolean) => <>
    {props.icon ? <span className="dk-sidebar__icon">{asIcon(props.icon)}</span> : null}
    <span className="dk-sidebar__label">{props.label}</span>
    {props.badge != null && !rail ? <span className="dk-sidebar__badge">{props.badge}</span> : null}
    {chevron && !rail ? <Icon icon={icons.ExpandMore} className="dk-sidebar__chevron" /> : null}
  </>;
  // An item with children is a button, not a link: its other attributes and handlers go to the button.
  const btnProps = omit(rest, { href: 1, target: 1, rel: 1, download: 1, hrefLang: 1, ping: 1, referrerPolicy: 1, type: 1, onClick: 1 }) as unknown as React.ButtonHTMLAttributes<HTMLButtonElement>;
  const cls = cn("dk-sidebar__item", ctx.depth > 0 && "dk-sidebar__item--nested", (props.active || (group && childActive)) && "dk-sidebar__item--active", props.className);

  if (group && rail) {
    return (
      <li className="dk-sidebar__li">
        <Menu placement="right-start" trigger={
          <RailButton {...btnProps} ref={ref as React.Ref<HTMLButtonElement>} className={cls} tip={typeof props.label === "string" ? props.label : undefined}>{inner(false)}</RailButton>
        }>
          {/* Each item keeps its link component (as), its other link attributes and the current page. */}
          {kids.map((k, i) => <MenuItem key={k.key != null ? k.key : i} {...omit(k.props, ITEM_OWN) as object} onClick={undefined}
            as={k.props.as} icon={k.props.icon} aria-current={activeWithin(k) ? "page" : undefined} className={cn("dk-sidebar__menu-item", k.props.className)}
            onSelect={k.props.onClick as ((e: React.SyntheticEvent) => void) | undefined}>{k.props.label}</MenuItem>)}
        </Menu>
      </li>
    );
  }
  if (group) {
    return (
      <li className="dk-sidebar__li" data-state={open ? "open" : "closed"}>
        <button type="button" {...btnProps} ref={ref as React.Ref<HTMLButtonElement>} className={cls} aria-expanded={open} aria-controls={listId} onClick={(e) => { if (props.onClick) props.onClick(e as unknown as React.MouseEvent<HTMLAnchorElement>); setOpen(!open); }}>{inner(true)}</button>
        <SidebarContext.Provider value={{ collapsed: ctx.collapsed, depth: ctx.depth + 1 }}>
          <ul id={listId} className="dk-sidebar__list dk-sidebar__list--nested" hidden={!open}>{kids}</ul>
        </SidebarContext.Provider>
      </li>
    );
  }
  const link = React.createElement(props.as || config.link, Object.assign(rest, { ref: ref, className: cls, "aria-current": props.active ? "page" : undefined }), inner(false));
  return (
    <li className="dk-sidebar__li">
      {rail && typeof props.label === "string" ? <Tooltip content={props.label} placement="right" role="label">{link}</Tooltip> : link}
    </li>
  );
});
