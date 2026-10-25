"use client";
import * as React from "react";
import { cn, domId, oneOf, omit, setRef, useIsoLayoutEffect } from "../../internal/cn";
import { type IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { component } from "../../internal/component";
import { warnOnce } from "../../internal/warn";

export type TabsVariant = 'line' | 'pill';

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** The selected tab's value (controlled). Use with onValueChange. */
  value?: string;
  /** The tab selected at first (uncontrolled). Default: the first tab that isn't disabled. */
  defaultValue?: string;
  /** Called with the new value when a tab is chosen. */
  onValueChange?: (value: string) => void;
  /** 'line' (default): a line under the selected tab. 'pill': the selected tab filled in primary. */
  variant?: TabsVariant;
  /** 'sm' (32px tabs) or 'md' (36px, default). */
  size?: 'sm' | 'md';
  /** 'auto' (default): arrow keys move and select at once. 'manual': arrow keys move, Enter or Space selects (for panels that are slow to show). */
  activation?: 'auto' | 'manual';
}

interface Ctx { base: string; value: string | null; select: (v: string) => void; manual: boolean; panels: Record<string, number>; register: (v: string, d: number) => void; stop: string | null }
const TabsContext = /* @__PURE__ */ React.createContext<Ctx | null>(null);
const useTabs = (who: string): Ctx => {
  const c = React.useContext(TabsContext);
  if (!c) throw new Error("Serupa: " + who + " must be inside <Tabs>.");
  return c;
};
const safe = (v: string) => String(v).replace(/[^A-Za-z0-9_-]/g, "_");
// The first enabled Tab's value, found in the children while rendering (so the server's HTML already has a
// selected tab and a visible panel). Tabs inside a component of your own aren't seen: the effect in Tabs
// picks the first one after mount then.
function firstTab(children: React.ReactNode): string | null {
  let found: string | null = null;
  React.Children.forEach(children, (c) => {
    if (found != null || !React.isValidElement(c)) return;
    const p = c.props as { value?: string; disabled?: boolean; children?: React.ReactNode };
    if (c.type === Tab) { if (!p.disabled && p.value != null) found = p.value; return; }
    found = firstTab(p.children);
  });
  return found;
}

/* Tabs: switches between panels in one place, following the WAI-ARIA tabs pattern. <Tabs> holds the state
   (value or defaultValue, onValueChange), <TabList> the row of <Tab value>, and each <TabPanel value> the content.
   Arrow keys move between tabs (following the text direction), Home and End jump to the ends; with activation
   "auto" moving also selects. Only the selected tab is in the Tab order, and the selected panel follows it. */
/** Switches between panels in one place: Tabs > TabList > Tab, and a TabPanel for each tab. */
export const Tabs = /* @__PURE__ */ component<HTMLDivElement, TabsProps>("Tabs", function Tabs(props, ref) {
  const rest = omit(props, { value: 1, defaultValue: 1, onValueChange: 1, variant: 1, size: 1, activation: 1, className: 1 });
  const base = domId("dk-tabs", React.useId());
  const controlled = props.value !== undefined;
  const [inner, setInner] = React.useState<string | null>(() => (props.defaultValue != null ? props.defaultValue : firstTab(props.children)));
  const value = controlled ? (props.value as string) : inner;
  const onChange = React.useRef(props.onValueChange); onChange.current = props.onValueChange;
  const select = React.useCallback((v: string) => { if (!controlled) setInner(v); if (onChange.current) onChange.current(v); }, [controlled]);
  const variant = oneOf(["line", "pill"] as const, props.variant, "line");
  const size = oneOf(["sm", "md"] as const, props.size, "md");
  // Which values have a TabPanel, so a tab only points (aria-controls) at a panel that exists: a tab row can
  // drive content of its own (a filter, say) with no TabPanel at all.
  const [panels, setPanels] = React.useState<Record<string, number>>({});
  const register = React.useCallback((v: string, d: number) => setPanels((p) => Object.assign({}, p, { [v]: (p[v] || 0) + d })), []);
  // Controlled with a value no tab has (a stale link, data still loading): the first enabled tab takes the Tab stop,
  // so the tab list can still be reached from the keyboard.
  const [stop, setStop] = React.useState<string | null>(null);
  const ctx = React.useMemo(() => ({ base, value, select, manual: props.activation === "manual", panels, register, stop }), [base, value, select, props.activation, panels, register, stop]);
  // After each render: uncontrolled with no defaultValue, and the tabs out of firstTab's sight, the first enabled tab.
  // When the selected tab is removed (a closable tab), the nearest enabled one: the next, or else the previous. So a
  // tab is always selected and the tab list stays in the Tab order. Controlled Tabs leave it to you, with a warning.
  const self = React.useRef<HTMLDivElement | null>(null);
  const order = React.useRef<string[]>([]);
  useIsoLayoutEffect(() => {
    if (!self.current) return;
    const tabs = Array.from(self.current.querySelectorAll<HTMLElement>('[role="tab"]')).filter((t) => t.id.startsWith(base + "-tab-"));
    const all = tabs.map((t) => t.dataset.value as string), enabled = tabs.filter((t) => !t.hasAttribute("disabled")).map((t) => t.dataset.value as string);
    const before = order.current;
    order.current = all;
    const matched = value != null && all.includes(value);
    setStop(matched || !enabled.length ? null : enabled[0]);
    if (!enabled.length || matched) return;
    if (controlled) {
      if (value != null && before.includes(value)) warnOnce("tabs-removed", `Tabs: the selected tab "${value}" was removed, so no tab is selected. Set value to another tab when you remove it.`);
      return;
    }
    const at = value != null ? before.indexOf(value) : -1;
    if (at < 0) { setInner(enabled[0]); return; }   // nothing chosen yet (or a defaultValue with no tab): no onValueChange
    const after = before.slice(at + 1).find((v) => enabled.includes(v)), prev = before.slice(0, at).reverse().find((v) => enabled.includes(v));
    select(after ?? prev ?? enabled[0]);
  });
  return (
    <TabsContext.Provider value={ctx}>
      <div {...rest} ref={(n) => { self.current = n; if (typeof ref === "function") ref(n); else if (ref) ref.current = n; }}
        className={cn("dk-tabs", "dk-tabs--" + variant, size === "sm" && "dk-tabs--sm", props.className)} data-component="tabs" data-variant={variant} />
    </TabsContext.Provider>
  );
});

/** The row of tabs. Give it an aria-label when the page doesn't already say what the tabs are for. */
export const TabList = /* @__PURE__ */ component<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>("TabList", function TabList(props, ref) {
  const ctx = useTabs("TabList");
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (props.onKeyDown) props.onKeyDown(e);
    if (e.defaultPrevented) return;
    const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'));
    const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0 || !tabs.length) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    let next = -1;
    if (e.key === "ArrowRight") next = (i + (rtl ? -1 : 1) + tabs.length) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i + (rtl ? 1 : -1) + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    tabs[next].focus();
    if (!ctx.manual && tabs[next].dataset.value != null) ctx.select(tabs[next].dataset.value as string);
  };
  return <div {...props} ref={ref} role="tablist" aria-orientation="horizontal" className={cn("dk-tabs__list", props.className)} onKeyDown={onKeyDown} />;
});

export interface TabProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  /** Ties the tab to the TabPanel with the same value. */
  value: string;
  /** An icon before the label: an icon name or any element. */
  icon?: IconSource;
}

/** One tab: a button that selects its panel. */
export const Tab = /* @__PURE__ */ component<HTMLButtonElement, TabProps>("Tab", function Tab(props, ref) {
  const ctx = useTabs("Tab");
  const rest = omit(props, { value: 1, icon: 1, className: 1, children: 1 });
  const selected = ctx.value === props.value;
  const id = ctx.base + "-tab-" + safe(props.value), panel = ctx.base + "-panel-" + safe(props.value);
  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => { if (props.onClick) props.onClick(e); if (!e.defaultPrevented) ctx.select(props.value); };
  return (
    <button {...rest} ref={ref} type="button" role="tab" id={id} aria-controls={ctx.panels[props.value] ? panel : undefined} aria-selected={selected} tabIndex={selected || ctx.stop === props.value ? 0 : -1}
      data-value={props.value} data-state={selected ? "active" : "inactive"} className={cn("dk-tabs__tab", props.className)} onClick={onClick}>
      {props.icon != null ? <span className="dk-tabs__icon" aria-hidden="true">{asIcon(props.icon)}</span> : null}
      <span className="dk-tabs__label">{props.children}</span>
    </button>
  );
});

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The value of the Tab that shows this panel. */
  value: string;
  /** Keeps the panel in the page while hidden (the default: hidden panels keep their state). false renders it only while selected. */
  keepMounted?: boolean;
}

/** The content for one tab, shown while its tab is selected. */
export const TabPanel = /* @__PURE__ */ component<HTMLDivElement, TabPanelProps>("TabPanel", function TabPanel(props, ref) {
  const ctx = useTabs("TabPanel");
  const rest = omit(props, { value: 1, keepMounted: 1, className: 1, children: 1 });
  const selected = ctx.value === props.value;
  const keep = props.keepMounted !== false;
  const register = ctx.register;
  useIsoLayoutEffect(() => { register(props.value, 1); return () => register(props.value, -1); }, [props.value, register]);
  // A kept panel of another tab is hidden="until-found", as Accordion's closed content is: hidden from everyone, but
  // the browser's find-in-page still searches it and, on a match, fires beforematch, which selects its tab. React
  // renders any hidden value as hidden="", so it's set here. A disabled tab's panel stays plainly hidden.
  const own = React.useRef<HTMLDivElement | null>(null);
  const pick = React.useRef<(() => void) | null>(null);
  const tabOf = () => own.current && (own.current.getRootNode() as Document | ShadowRoot).getElementById(ctx.base + "-tab-" + safe(props.value));
  pick.current = selected ? null : () => { const t = tabOf(); if (t && !t.hasAttribute("disabled")) ctx.select(props.value); };
  useIsoLayoutEffect(() => {
    const el = own.current, t = tabOf();
    if (el && !selected && keep && t && !t.hasAttribute("disabled")) el.setAttribute("hidden", "until-found");
  });
  React.useEffect(() => {
    const el = own.current;
    if (!el) return;
    const onMatch = () => { if (pick.current) pick.current(); };
    el.addEventListener("beforematch", onMatch);
    return () => el.removeEventListener("beforematch", onMatch);
  }, []);
  return (
    <div tabIndex={selected ? 0 : -1} {...rest} ref={(n) => { own.current = n; setRef(ref, n); }} role="tabpanel" id={ctx.base + "-panel-" + safe(props.value)} aria-labelledby={ctx.base + "-tab-" + safe(props.value)}
      hidden={!selected} data-state={selected ? "active" : "inactive"} className={cn("dk-tabs__panel", props.className)}>
      {selected || keep ? props.children : null}
    </div>
  );
});
