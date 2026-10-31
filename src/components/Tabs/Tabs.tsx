"use client";
import * as React from "react";
import { cn, domId, oneOf, omit, setRef, useIsoLayoutEffect } from "../../internal/cn";
import type { IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { component } from "../../internal/component";
import { warnOnce } from "../../internal/warn";
import { lastInputKeyboard, listenForInput } from "../../internal/lastInput";
import { activeIn } from "../../internal/root";

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
  /** 'horizontal' (default): the tabs in a row over the panels. 'vertical': a column beside them, with ↑ ↓ between tabs. */
  orientation?: 'horizontal' | 'vertical';
}

interface Ctx { base: string; value: string | null; select: (v: string) => void; manual: boolean; vertical: boolean; panels: Record<string, number>; register: (v: string, d: number) => void; stop: string | null; before: { current: (() => void) | null }; keyed: boolean }
const FROM = ["--dk-tabs-from-shift", "--dk-tabs-from-scale", "--dk-tabs-span-l", "--dk-tabs-span-r", "--dk-tabs-span-t", "--dk-tabs-span-b", "--dk-tabs-from-l", "--dk-tabs-from-r", "--dk-tabs-from-t", "--dk-tabs-from-b"];
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
   Arrow keys move between tabs (following the text direction; ↑ ↓ with orientation "vertical"), Home and End jump
   to the ends; with activation "auto" moving also selects. Only the selected tab is in the Tab order, and the selected panel follows it. */
/** Switches between panels in one place: Tabs > TabList > Tab, and a TabPanel for each tab. */
export const Tabs = /* @__PURE__ */ component<HTMLDivElement, TabsProps>("Tabs", function Tabs(props, ref) {
  const rest = omit(props, { value: 1, defaultValue: 1, onValueChange: 1, variant: 1, size: 1, activation: 1, orientation: 1, className: 1 });
  const vertical = props.orientation === "vertical";
  const base = domId("dk-tabs", React.useId());
  const controlled = props.value !== undefined;
  const [inner, setInner] = React.useState<string | null>(() => (props.defaultValue != null ? props.defaultValue : firstTab(props.children)));
  const value = controlled ? (props.value as string) : inner;
  const onChange = React.useRef(props.onValueChange); onChange.current = props.onValueChange;
  // TabList's hook to note where the line or fill is just before the selection changes, so a slide that is still
  // running turns back from where it has got to (EH1).
  const before = React.useRef<(() => void) | null>(null);
  // Picked from the keyboard (an arrow, Home, End), the line or fill is there at once rather than sliding (KW1).
  // Worked out whenever the value changes, not only when a tab picks it, so a controlled value set by a click
  // elsewhere (a Next button) slides even after an arrow picked the tab before (GR61).
  const [keyed, setKeyed] = React.useState(false);
  const [shown, setShown] = React.useState(value);
  if (shown !== value) { setShown(value); setKeyed(lastInputKeyboard()); }
  useIsoLayoutEffect(listenForInput, []);
  const select = React.useCallback((v: string) => { if (before.current) before.current(); if (!controlled) setInner(v); if (onChange.current) onChange.current(v); }, [controlled]);
  const variant = oneOf(["line", "pill"] as const, props.variant, "line");
  const size = oneOf(["sm", "md"] as const, props.size, "md");
  // Which values have a TabPanel, so a tab only points (aria-controls) at a panel that exists: a tab row can
  // drive content of its own (a filter, say) with no TabPanel at all.
  const [panels, setPanels] = React.useState<Record<string, number>>({});
  const register = React.useCallback((v: string, d: number) => setPanels((p) => Object.assign({}, p, { [v]: (p[v] || 0) + d })), []);
  // Controlled with a value no tab has (a stale link, data still loading): the first enabled tab takes the Tab stop,
  // so the tab list can still be reached from the keyboard.
  const [stop, setStop] = React.useState<string | null>(null);
  const ctx = React.useMemo(() => ({ base, value, select, manual: props.activation === "manual", vertical, panels, register, stop, before, keyed }), [base, value, select, props.activation, vertical, panels, register, stop, keyed]);
  // After each render: uncontrolled with no defaultValue, and the tabs out of firstTab's sight, the first enabled tab.
  // When the selected tab is removed (a closable tab), the nearest enabled one: the next, or else the previous. So a
  // tab is always selected and the tab list stays in the Tab order. Controlled Tabs leave it to you, with a warning.
  const self = React.useRef<HTMLDivElement | null>(null);
  const order = React.useRef<string[]>([]);
  const focusedIn = React.useRef(false);   // focus is in the Tabs, so a closed tab that had it hands it on
  // every render: tabs come and go with the children, which change in any render; it reads attributes, not layout.
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
      if (process.env.NODE_ENV !== "production" && value != null && before.includes(value)) warnOnce("tabs-removed", `Tabs: the selected tab "${value}" was removed, so no tab is selected. Set value to another tab when you remove it.`);
      else if (process.env.NODE_ENV !== "production" && value != null) warnOnce("tabs-value", `Tabs: value "${value}" matches no Tab, so no tab is selected. Set it to one of the Tabs' values.`);
      return;
    }
    const at = value != null ? before.indexOf(value) : -1;
    if (process.env.NODE_ENV !== "production" && at < 0 && value != null && !before.length) warnOnce("tabs-value", `Tabs: defaultValue "${value}" matches no Tab, so the first tab is selected. Set it to one of the Tabs' values.`);
    if (at < 0) { setInner(enabled[0]); return; }   // nothing chosen yet (or a defaultValue with no tab): no onValueChange
    const after = before.slice(at + 1).find((v) => enabled.includes(v)), prev = before.slice(0, at).reverse().find((v) => enabled.includes(v));
    const next = after ?? prev ?? enabled[0];
    select(next);
    // Focus was on the closed tab (its own close button, or a Delete key the app handles): it goes to the tab now
    // selected, not to the page. A removed element can still read as the active one until the browser next looks.
    const active = activeIn(self.current);
    if (focusedIn.current && (!active || active === document.body || !active.isConnected)) { const t = tabs.find((x) => x.dataset.value === next); if (t) t.focus(); }
  });
  return (
    <TabsContext.Provider value={ctx}>
      <div {...rest} ref={(n) => { self.current = n; if (typeof ref === "function") ref(n); else if (ref) ref.current = n; }}
        onFocus={(e) => { focusedIn.current = true; if (rest.onFocus) rest.onFocus(e); }}
        onBlur={(e) => { if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) focusedIn.current = false; if (rest.onBlur) rest.onBlur(e); }}
        className={cn("dk-tabs", "dk-tabs--" + variant, size === "sm" && "dk-tabs--sm", vertical && "dk-tabs--vertical", props.className)} data-component="tabs" data-variant={variant} data-orientation={vertical ? "vertical" : "horizontal"} />
    </TabsContext.Provider>
  );
});

/* Where the selected tab's line or fill is now, as a tab-sized box in the list: the tab's own box at rest, or, mid-slide,
   where the slide has got to. The line: the tab's box moved by its translate and stretched by its scale (from its top
   left). The fill: the box its clip-path leaves showing, out of the span it covers (TabList sets the span). */
const shown = (on: HTMLElement) => {
  const nums = (v: string) => (v.match(/-?[\d.]+(?:e-?\d+)?/g) || []).map(Number);
  let x = on.offsetLeft, y = on.offsetTop, w = on.offsetWidth, h = on.offsetHeight;
  const line = getComputedStyle(on, "::after"), fill = getComputedStyle(on, "::before");
  if (line.translate && line.translate !== "none") { const [dx = 0, dy = 0] = nums(line.translate); x += dx; y += dy; }
  if (line.scale && line.scale !== "none") { const [sx = 1, sy = sx] = nums(line.scale); w *= sx; h *= sy; }
  if (/^inset\(/.test(fill.clipPath)) {
    const [t = 0, r = t, b = t, l = r] = nums(fill.clipPath.split(" round")[0]);
    const span = (k: string) => parseFloat(on.style.getPropertyValue("--dk-tabs-span-" + k)) || 0;
    const left = x - span("l") + l, top = y - span("t") + t;
    w = x + w + span("r") - r - left; h = y + h + span("b") - b - top; x = left; y = top;
  }
  return { x, y, w, h };
};

/* TabList: the row (or column) of tabs. When the tabs don't fit, it scrolls with no scrollbar; the edge with more
   tabs past it fades out, so it's plain there's more, and the selected tab is scrolled into view whenever it changes. */
export type TabListProps = React.HTMLAttributes<HTMLDivElement>;

/** The row of tabs. Give it an aria-label when the page doesn't already say what the tabs are for. */
export const TabList = /* @__PURE__ */ component<HTMLDivElement, TabListProps>("TabList", function TabList(props, ref) {
  const ctx = useTabs("TabList");
  const list = React.useRef<HTMLDivElement | null>(null);
  const [fade, setFade] = React.useState<{ before: boolean; after: boolean }>({ before: false, after: false });
  // Which ends have tabs past them: before is the left (or top) edge, after the right (or bottom). In RTL,
  // scrollLeft runs from 0 down to minus the overflow.
  // Each tab carries where the selected tab's line (or fill) is, from where it sits: when it's selected next, its own
  // line starts there and slides into place (Tabs.css, EG1). It's set ahead of time, on every tab, because a line
  // starts from the style its tab had just before it was selected. Refreshed on each change (reveal measures) and as the tabs resize.
  // With now, from where the line or fill is at this moment (shown) rather than from the selected tab's box: just
  // before the selection changes, so picking another tab mid-slide starts there (EH1).
  const place = (now?: boolean) => {
    const el = list.current;
    if (!el) return;
    const tabs = Array.from(el.querySelectorAll<HTMLElement>('[role="tab"]'));
    const on = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    const b = on && (now ? shown(on) : { x: on.offsetLeft, y: on.offsetTop, w: on.offsetWidth, h: on.offsetHeight });
    for (const t of tabs) {
      // The selected tab keeps the pill's span it was selected with (below), so its slide runs to the end.
      if (t === on) continue;
      if (!b || !t.offsetWidth || !t.offsetHeight) { for (const k of FROM) t.style.removeProperty(k); continue; }
      const dx = b.x - t.offsetLeft, dy = b.y - t.offsetTop, w = t.offsetWidth, h = t.offsetHeight;
      t.style.setProperty("--dk-tabs-from-shift", dx + "px " + dy + "px");
      t.style.setProperty("--dk-tabs-from-scale", b.w / w + " " + b.h / h);
      // The pill's fill (GO1) spans this tab and the selected one, cut to this tab; it starts cut to the selected one.
      const l = Math.max(0, -dx), r = Math.max(0, dx + b.w - w), u = Math.max(0, -dy), d = Math.max(0, dy + b.h - h);
      const set = (k: string, n: number) => t.style.setProperty(k, n + "px");
      set("--dk-tabs-span-l", l); set("--dk-tabs-span-r", r); set("--dk-tabs-span-t", u); set("--dk-tabs-span-b", d);
      set("--dk-tabs-from-l", l + dx); set("--dk-tabs-from-r", w + r - dx - b.w); set("--dk-tabs-from-t", u + dy); set("--dk-tabs-from-b", h + d - dy - b.h);
    }
  };
  // every render: place reads ctx and the list as they are now; it only swaps a function, so it costs nothing.
  useIsoLayoutEffect(() => { ctx.before.current = () => place(true); return () => { ctx.before.current = null; }; });
  const measure = React.useCallback(() => {
    const el = list.current;
    if (!el) return;
    place();
    const v = ctx.vertical, max = v ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
    let at = v ? el.scrollTop : el.scrollLeft;
    if (!v && getComputedStyle(el).direction === "rtl") at = max + at;
    const next = { before: max > 1 && at > 1, after: max > 1 && at < max - 1 };
    setFade((f) => (f.before === next.before && f.after === next.after ? f : next));
  }, [ctx.vertical]);
  useIsoLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (ro) { ro.observe(el); Array.from(el.children).forEach((c) => ro.observe(c)); }
    return () => { el.removeEventListener("scroll", measure); if (ro) ro.disconnect(); };
  }, [measure]);
  // The selected tab, scrolled into view inside the list only (the page doesn't move), with the fade's room to spare.
  const reveal = React.useCallback(() => {
    const el = list.current;
    const tab = el && ctx.value != null ? el.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]') : null;
    if (!el || !tab) return;
    const room = parseFloat(getComputedStyle(el).getPropertyValue("--dk-tabs-fade")) || 0;
    const box = el.getBoundingClientRect(), t = tab.getBoundingClientRect();
    if (ctx.vertical) {
      if (t.top < box.top + room) el.scrollTop -= box.top + room - t.top;
      else if (t.bottom > box.bottom - room) el.scrollTop += t.bottom - (box.bottom - room);
    } else if (t.left < box.left + room) el.scrollLeft -= box.left + room - t.left;
    else if (t.right > box.right - room) el.scrollLeft += t.right - (box.right - room);
    measure();
  }, [ctx.value, ctx.vertical, measure]);
  useIsoLayoutEffect(reveal, [reveal]);
  // Again once the web fonts have loaded: tabs drawn first in a fallback font change width when the real one
  // arrives, which can leave the selected tab part way past the end.
  React.useEffect(() => {
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    if (!fonts || fonts.status === "loaded") return;
    let live = true;
    fonts.ready.then(() => { if (live) reveal(); }, () => {});
    return () => { live = false; };
  }, [reveal]);
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (props.onKeyDown) props.onKeyDown(e);
    // With Alt, Ctrl or ⌘ the keys are the browser's or the system's (Alt+← goes back a page): leave them (L8E28).
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    // A tab hidden by CSS or the hidden attribute can't take focus: the keys skip it rather than select it out of
    // sight while focus stays put (L8E81).
    const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')).filter((t) => t.getClientRects().length > 0);
    const i = tabs.indexOf(activeIn(e.currentTarget) as HTMLButtonElement);
    if (i < 0 || !tabs.length) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const fwd = ctx.vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight", back = ctx.vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
    let next = -1;
    if (e.key === fwd) next = (i + 1) % tabs.length;
    else if (e.key === back) next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    tabs[next].focus();
    if (!ctx.manual && tabs[next].dataset.value != null) ctx.select(tabs[next].dataset.value as string);
  };
  return <div {...props} ref={(n) => { list.current = n; setRef(ref, n); }} role="tablist" aria-orientation={ctx.vertical ? "vertical" : "horizontal"}
    className={cn("dk-tabs__list", props.className)} data-fade-before={fade.before ? "" : undefined} data-fade-after={fade.after ? "" : undefined} onKeyDown={onKeyDown} />;
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
    <button {...rest} ref={ref} type="button" role="tab" id={id} aria-controls={ctx.panels[props.value] ? panel : undefined} aria-selected={selected} data-instant={selected && ctx.keyed ? "" : undefined} tabIndex={selected || ctx.stop === props.value ? 0 : -1}
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
  // every render: the panel's tab can be enabled or disabled in any render of the tab list; nothing is measured.
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
