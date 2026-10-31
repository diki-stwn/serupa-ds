"use client";
import * as React from "react";
import { cn, domId, oneOf, omit } from "../../internal/cn";
import { Icon } from "../Icon/Icon";
import { component } from "../../internal/component";
import { flattenChildren } from "../../internal/children";
import * as icons from "../../material/builtin";
import { useSettings } from "../../internal/provider";
import { warnOnce } from "../../internal/warn";
import { buttonClass } from "../Button/buttonClass";
import { en as words } from "./labels";

export interface AccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  /** 'single' (default): opening one closes the others. 'multiple': any number can be open. */
  type?: 'single' | 'multiple';
  /** The open items' values (controlled). Use with onValueChange. */
  value?: string[];
  /** The items open at first (uncontrolled). Default: none. */
  defaultValue?: string[];
  /** Called with the open items' values when one opens or closes. */
  onValueChange?: (value: string[]) => void;
  /** With type="single": lets the open item close again, leaving none open. Default: true. */
  collapsible?: boolean;
  /** 'plain' (default): lines between items. 'card': a bordered, rounded frame. */
  variant?: 'plain' | 'card';
  /** The heading level of the titles, to fit the page's outline. Default: 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** With type="multiple": an "Expand all" button above the items, which becomes "Collapse all" once every item
      is open. Disabled items stay as they are. Default: false. */
  showExpandAll?: boolean;
}

export interface AccordionItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Identifies the item in value. Default: its position ("0", "1"…). */
  value?: string;
  /** The title: what the heading button says. */
  title: React.ReactNode;
  /** Can't be opened or closed. Default: false. */
  disabled?: boolean;
  /** The content shown when it's open. */
  children?: React.ReactNode;
  /** Closed content stays in the page, keeping its state, and find-in-page searches it. false renders the content
      only while the item is open (and while it closes), for heavy content; find-in-page can't find it then. Default: true. */
  keepMounted?: boolean;
}

const toMs = (t: string) => (parseFloat(t) || 0) * (t.trim().endsWith("ms") ? 1 : 1000);

interface Ctx { open: string[]; toggle: (v: string) => void; level: number; collapsible: boolean; single: boolean; many: boolean; }
const AccordionContext = /* @__PURE__ */ React.createContext<Ctx | null>(null);

/* Accordion: a stack of items whose content shows and hides under a heading button (the WAI-ARIA accordion
   pattern). Arrow keys, Home and End move between the titles. className and every other prop go to the
   wrapper. */
/** Items that show and hide their content under heading buttons; one open at a time, or several. */
export const Accordion = /* @__PURE__ */ component<HTMLDivElement, AccordionProps>("Accordion", function Accordion(props, ref) {
  const rest = omit(props, { type: 1, value: 1, defaultValue: 1, onValueChange: 1, collapsible: 1, variant: 1, headingLevel: 1, showExpandAll: 1, className: 1, children: 1, onKeyDown: 1 });
  const labels = useSettings(words).labels;
  const single = props.type !== "multiple";
  const controlled = props.value !== undefined;
  const [inner, setInner] = React.useState<string[]>(() => (props.defaultValue || []).slice(0, single ? 1 : undefined));
  const open = controlled ? (props.value as string[]) : inner;
  if (process.env.NODE_ENV !== "production" && single && controlled && open.length > 1) warnOnce("accordion-single-value", `Accordion: value has ${open.length} items with type="single", so ${open.length} items show open; pass one value, or type="multiple".`);
  const collapsible = props.collapsible !== false;
  const onChange = React.useRef(props.onValueChange);
  onChange.current = props.onValueChange;
  const change = React.useCallback((next: string[]) => {
    if (!controlled) setInner(next);
    if (onChange.current) onChange.current(next);
  }, [controlled]);
  const toggle = React.useCallback((v: string) => {
    const isOpen = open.indexOf(v) >= 0;
    let next: string[];
    if (single) next = isOpen ? (collapsible ? [] : open) : [v];
    else next = isOpen ? open.filter((x) => x !== v) : open.concat(v);
    if (next !== open) change(next);
  }, [open, single, collapsible, change]);
  const level = [2, 3, 4, 5, 6].indexOf(props.headingLevel as number) >= 0 ? (props.headingLevel as number) : 3;
  const variant = oneOf(["plain", "card"] as const, props.variant, "plain");
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (props.onKeyDown) props.onKeyDown(e);
    const t = e.target as HTMLElement;
    // With Alt, Ctrl or ⌘ the keys are the browser's or the system's (Alt+← goes back a page): leave them (L8E29).
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !t.classList.contains("dk-accordion__trigger") || t.closest(".dk-accordion") !== e.currentTarget) return;
    const all = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>(".dk-accordion__trigger")).filter((b) => b.closest(".dk-accordion") === e.currentTarget && !b.disabled);
    const i = all.indexOf(t as HTMLButtonElement);
    const to = e.key === "ArrowDown" ? all[(i + 1) % all.length] : e.key === "ArrowUp" ? all[(i - 1 + all.length) % all.length] : e.key === "Home" ? all[0] : e.key === "End" ? all[all.length - 1] : null;
    if (to) { e.preventDefault(); to.focus(); }
  }
  let n = 0;
  const items = flattenChildren(props.children).map((c) => React.isValidElement(c) ? React.cloneElement(c as React.ReactElement<{ "data-index"?: string }>, { "data-index": String(n++) }) : c);
  // Each open panel is a region landmark (DP1). Past six that could be open at once, landmarks crowd the list screen
  // readers offer, so the panels are plain groups of content under their headings (the APG's advice).
  const many = !single && items.filter(React.isValidElement).length > 6;
  // Expand all / Collapse all acts on the items that can open and close (not disabled ones).
  let all: React.ReactNode = null;
  if (props.showExpandAll && !single) {
    const values = items.flatMap((c) => {
      if (!React.isValidElement(c)) return [];
      const p = c.props as AccordionItemProps & { "data-index"?: string };
      return p.disabled ? [] : [p.value != null ? p.value : String(p["data-index"])];
    });
    const allOpen = values.length > 0 && values.every((v) => open.indexOf(v) >= 0);
    const onAll = () => change(allOpen ? open.filter((v) => values.indexOf(v) < 0) : open.concat(values.filter((v) => open.indexOf(v) < 0)));
    all = (
      <div className="dk-accordion__toolbar">
        <button type="button" className={buttonClass({ variant: "link", size: "sm", className: "dk-accordion__all" })} onClick={onAll} disabled={!values.length}>
          {allOpen ? labels.collapseAll : labels.expandAll}
        </button>
      </div>
    );
  }
  return (
    <AccordionContext.Provider value={{ open, toggle, level, collapsible, single, many }}>
      <div {...rest} ref={ref} onKeyDown={onKeyDown} data-component="accordion" className={cn("dk-accordion", variant === "card" && "dk-accordion--card", props.className)}>{all}{items}</div>
    </AccordionContext.Provider>
  );
});

/* AccordionItem: a heading holding a button (aria-expanded, aria-controls) and a region (aria-labelledby) that
   grows to its height as it unfolds (a fade and a clip), and folds back as it shrinks; closed content is hidden from everyone, but find-in-page can still
   find it (hidden="until-found"), which opens the item. */
/** One item in an Accordion: a title button and the content it shows and hides. */
export const AccordionItem = /* @__PURE__ */ component<HTMLDivElement, AccordionItemProps>("AccordionItem", function AccordionItem(props, ref) {
  const ctx = React.useContext(AccordionContext);
  const rest = omit(props, { value: 1, title: 1, disabled: 1, keepMounted: 1, className: 1, children: 1 });
  const index = String(rest["data-index"] || "0");
  delete rest["data-index"];
  const value = props.value != null ? props.value : index;
  const open = !!ctx && ctx.open.indexOf(value) >= 0;
  const id = domId("dk-acc", React.useId());   // its own id, not its position, so ids stay unique however items are wrapped
  // an open item in a single, non-collapsible accordion can't close: say so with aria-disabled
  const locked = !!ctx && open && ctx.single && !ctx.collapsible;
  const H = ("h" + (ctx ? ctx.level : 3)) as "h3";
  // Closed content is hidden="until-found": hidden from everyone, but the browser's find-in-page still searches it,
  // and on a match fires beforematch, which opens the item. It's set once the closing animation ends, so the
  // content stays visible while it folds away. React renders any hidden value as hidden="", so it's set here.
  // The first render (the server's HTML) marks closed content plain hidden, so it stays hidden before the stylesheet
  // arrives (or without it: tools/test/no-css.mjs); the effect below then makes it until-found. The prop never
  // changes after that, so React leaves the attribute to the effect.
  const [startsClosed] = React.useState(!open);
  const content = React.useRef<HTMLDivElement>(null);
  const toggle = React.useRef<(() => void) | null>(null);
  toggle.current = ctx && !open && !props.disabled ? () => ctx.toggle(value) : null;
  const findable = !props.disabled;
  // With keepMounted={false} the content renders while the item is open, and goes once the closing animation ends.
  const keep = props.keepMounted !== false;
  const [mounted, setMounted] = React.useState(open || keep);
  if ((open || keep) && !mounted) setMounted(true);
  React.useLayoutEffect(function () {
    const el = content.current, panel = el && el.closest<HTMLElement>(".dk-accordion__panel");
    if (!el || !panel) return;
    if (open || (!findable && keep)) { el.removeAttribute("hidden"); return; }
    const style = getComputedStyle(panel);
    const delays = style.transitionDelay.split(",");
    const ms = Math.max(0, ...style.transitionDuration.split(",").map((d, i) => toMs(d) + toMs(delays[i] || "0")));
    // The panel keeps its content shown until the fold ends. CSS alone (a discrete content-visibility transition)
    // isn't enough: WebKit sometimes drops it, and the panel lost its height at the start of the fold.
    const hold = (on: boolean) => { panel.style.contentVisibility = on ? "visible" : ""; };
    const hide = () => { hold(false); if (grow.current) grow.current.cancel(); if (findable) el.setAttribute("hidden", "until-found"); if (!keep) setMounted(false); };
    if (ms) hold(true);
    if (!ms || !el.isConnected || panel.getBoundingClientRect().height === 0) { hide(); return; }
    const t = setTimeout(hide, ms);
    return () => { clearTimeout(t); hold(false); };
  }, [open, findable, keep]);
  // The height glides too (EH2, revised): the panel grows from nothing to its content's height, or shrinks to
  // nothing, over the same time as its fade (read from that transition), so what's below slides
  // instead of jumping. It's the one layout a component animates on purpose: one panel, while it moves. A press
  // mid-way turns back from the height it has. Not under reduced motion (the fade alone, and the height at once).
  const grow = React.useRef<Animation | null>(null);
  const was = React.useRef(open);
  React.useLayoutEffect(function () {
    const panel = content.current && content.current.closest<HTMLElement>(".dk-accordion__panel");
    if (!panel || was.current === open) return;
    was.current = open;
    const from = grow.current ? panel.getBoundingClientRect().height : open ? 0 : panel.offsetHeight;
    if (grow.current) { grow.current.cancel(); grow.current = null; }
    const fade = typeof panel.getAnimations === "function" ? panel.getAnimations().find((a) => (a as CSSTransition).transitionProperty === "opacity") : null;
    const timing = fade && fade.effect ? fade.effect.getTiming() : null;
    if (!timing || !timing.duration || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const to = open ? panel.offsetHeight : 0;
    if (from === to) return;
    // Closing, it slows to a stop on ease-move rather than the fade's ease-exit, which would end what's below at full speed.
    const easing = open ? timing.easing : getComputedStyle(panel).getPropertyValue("--ease-move").trim() || timing.easing;
    grow.current = panel.animate({ height: [from + "px", to + "px"] }, { duration: timing.duration, easing, fill: open ? "none" : "forwards" });
    grow.current.id = "dk-accordion-height";
    if (open) grow.current.onfinish = () => { grow.current = null; };
  }, [open]);
  React.useEffect(() => () => { if (grow.current) grow.current.cancel(); }, []);
  React.useEffect(function () {
    const el = content.current;
    if (!el) return;
    const onMatch = () => { if (toggle.current) toggle.current(); };
    el.addEventListener("beforematch", onMatch);
    return () => el.removeEventListener("beforematch", onMatch);
  }, []);
  return (
    <div {...rest} ref={ref} data-state={open ? "open" : "closed"} className={cn("dk-accordion__item", open && "dk-accordion__item--open", props.disabled && "dk-accordion__item--disabled", props.className)}>
      <H className="dk-accordion__heading">
        <button type="button" id={id + "-t"} className="dk-accordion__trigger" aria-expanded={open} aria-controls={id + "-p"} disabled={props.disabled}
          aria-disabled={locked ? true : undefined} onClick={() => { if (ctx && !locked) ctx.toggle(value); }}>
          <span className="dk-accordion__title">{props.title}</span>
          <Icon icon={icons.ExpandMore} className="dk-accordion__icon" />
        </button>
      </H>
      <div id={id + "-p"} role={open && !(ctx && ctx.many) ? "region" : undefined} aria-labelledby={id + "-t"} className="dk-accordion__panel">
        <div className="dk-accordion__clip"><div ref={content} className="dk-accordion__content" hidden={startsClosed || undefined}>{mounted ? props.children : null}</div></div>
      </div>
    </div>
  );
});
