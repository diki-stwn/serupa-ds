"use client";
import * as React from "react";
import { cn, oneOf, omit, setRef, useIsoLayoutEffect } from "../../internal/cn";
import { config } from "../../internal/config";
import { displayNumber } from "../../internal/numbers";
import { useLocale, useSettings } from "../../internal/provider";
import { useShowAfter } from "../../internal/showAfter";
import { announce, ensureAnnouncer } from "../../internal/announce";
import { block, both, chain, pressKey, releaseKey, ripple } from "../../internal/interactions";
import { warnOnce } from "../../internal/warn";
import { Icon, type IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { Loader } from "../Loader/Loader";
import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden";
import { component } from "../../internal/component";
import * as icons from "../../material/builtin";

export type BadgeVariant = 'subtle' | 'solid' | 'outline';
export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo' | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose';
export interface BadgeProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onClick'> {
  /** 'subtle' (default): a tint with colored text. 'solid': a full fill, for strong emphasis. 'outline': a colored border and text. */
  variant?: BadgeVariant;
  /** 'neutral' (default) and 'primary' use the alias colors; 'success' (green), 'warning' (amber), 'danger' (red) and 'info' (sky) are statuses; the palette families are for categories and tags. Every tone and variant keeps 4.5:1 text in light and dark. */
  tone?: BadgeTone;
  /** A small status dot before the label, in the badge's text color. Ignored with leftIcon or count. With no label, icon or count, renders a lone indicator dot ("something new"): decorative unless given aria-label. */
  dot?: boolean;
  /** With dot (in a label or the lone indicator): a copy of the dot grows and fades every second (the system's ping animation), for live states. Off under reduced motion. Ignored without a dot. Default false. */
  ping?: boolean;
  /** A Material Symbols (or custom) icon name, or an element, before the label. Decorative. */
  leftIcon?: IconSource;
  /** Makes it a count badge: a round pill with the number. 0 renders nothing unless showZero. */
  count?: number;
  /** With count: above this, shows "max+" (default 99: "99+"). */
  max?: number;
  /** With count: show the badge at 0. */
  showZero?: boolean;
  /** Adds a remove (×) button at the end that calls this. */
  onRemove?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** The remove button's accessible name, before the label: "Remove" (default) → "Remove Design". */
  removeLabel?: string;
  /** Makes it interactive: renders a <button type="button"> with hover, focus and active states. onRemove is ignored then. */
  onClick?: React.MouseEventHandler<HTMLElement>;
  /** Makes it a link (the component set with Serupa.configure({ link }), <a> by default), with hover, focus and active states. */
  href?: string;
  /** Where the link opens, as on <a>; with "_blank", rel defaults to "noopener noreferrer". */
  target?: string;
  /** The link's relation to the page, as on <a>. */
  rel?: string;
  /** Native button attributes, when interactive. */
  disabled?: boolean;
  /** 'button' (default, never submits by accident), 'submit' or 'reset', when interactive. */
  type?: 'button' | 'submit' | 'reset';
  /** A ring replaces the content (the width stays); aria-busy, and an interactive badge ignores clicks but keeps focus. */
  loading?: boolean;
  /** Announced to screen readers when loading starts. Default "Loading"; "" announces nothing. */
  loadingText?: string;
}

/* Badge: a short label for status, counts and categories. variant "subtle" (default: a tint), "solid" (a full
   fill) or "outline" (a border); tone "neutral" (default), "primary", "success", "warning", "danger", "info" or a
   palette family for categories ("violet", "teal"…). One size: 20px tall, text-xs, 12px icons. Extras: a status
   dot (dot; with no label, icon or count, dot alone renders a lone indicator dot; ping adds the system's ping animation to the dot), a leading icon (leftIcon: a Material Symbols or custom icon name, or an element), a count (count,
   max: shows "99+" past max, and nothing at 0 unless showZero) and a remove button (onRemove; its accessible
   name is removeLabel + the label, "Remove Design"). Interactive: with onClick it renders a <button type="button">,
   with href a link (the configured link component, like Button), and only then has hover, focus and active
   states and Button's micro-interactions (press, ripple). loading cross-fades the content to a centered ring (the width stays), sets aria-busy, announces
   loadingText ("Loading") and, on an interactive badge, blocks clicks while keeping focus. */
const VARIANTS: readonly BadgeVariant[] = ["subtle", "solid", "outline"];
const TONES: readonly BadgeTone[] = ["neutral", "primary", "success", "warning", "danger", "info", "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose"];
const PLAIN = { useGrouping: false } as const;
// Removing a tag drops focus on <body> when its × had it (179). Once the badge is gone, focus moves to the next
// remove button among its siblings (the badges in the same list), else the one before it. A handler that moves focus
// itself, or keeps the badge, is left alone.
function removeAndRefocus(e: React.MouseEvent<HTMLButtonElement>, onRemove: (e: React.MouseEvent<HTMLButtonElement>) => void): void {
  const me = e.currentTarget, badge = me.closest(".dk-badge");
  let scope = badge && badge.parentElement;
  if (scope && scope.childElementCount === 1 && scope.parentElement) scope = scope.parentElement;   // each badge in its own <li>
  const all = scope ? Array.from(scope.querySelectorAll<HTMLButtonElement>(".dk-badge__remove")) : [];
  const at = all.indexOf(me);
  onRemove(e);
  setTimeout(function () {
    const active = me.ownerDocument.activeElement;
    if (me.isConnected || (active && active !== me.ownerDocument.body)) return;
    const next = all.slice(at + 1).concat(all.slice(0, at).reverse()).find((b) => b.isConnected && !b.disabled);
    if (next) next.focus();
  }, 0);
}

const OWN = { variant: 1, tone: 1, dot: 1, ping: 1, leftIcon: 1, count: 1, max: 1, showZero: 1, onRemove: 1, removeLabel: 1, loading: 1, loadingText: 1, className: 1, children: 1 } as const;

/** A short label for status, counts and categories. A <span>; a <button> with onClick, a link with href. */
export const Badge = /* @__PURE__ */ component<HTMLElement, BadgeProps>("Badge", function Badge(props, ref) {
  const sds = useSettings();
  const locale = useLocale();
  const rest = omit(props, OWN);
  const variant = oneOf(VARIANTS, props.variant, "subtle");
  const tone = oneOf(TONES, props.tone, "neutral");
  // Once it shows, the ring stays at least MIN_SHOWN, so loading that ends a moment later doesn't flash it (EB1).
  const loading = useShowAfter(!!props.loading, 0);
  const loadingText = props.loadingText == null ? sds.labels.loading : props.loadingText;
  // Hooks first: a count of 0 renders nothing below, and hooks must run on every render.
  React.useEffect(function () { ensureAnnouncer(); }, []);   // no cleanup: the region is shared
  // Announces only when loading starts: a new loadingText while it loads re-runs this but announces nothing.
  const wasLoading = React.useRef(false);
  React.useEffect(function () {
    if (loading && !wasLoading.current && loadingText) announce(loadingText);
    wasLoading.current = loading;
  }, [loading, loadingText]);
  const isCount = props.count != null;
  // A text label cut with an ellipsis shows in full as the badge's title on hover, as Button's does (DV1): the same
  // words as its text, so nothing is read twice. Not for a count, or a badge with a title or name of its own.
  const text = !isCount && (typeof props.children === "string" || typeof props.children === "number") ? String(props.children) : "";
  const tipOk = !!text && rest.title == null && !rest["aria-label"] && !rest["aria-labelledby"];
  const node = React.useRef<HTMLElement | null>(null);
  const [cut, setCut] = React.useState(false);
  useIsoLayoutEffect(function () {
    const own = node.current && node.current.querySelector<HTMLElement>(".dk-badge__label");
    if (!tipOk || !own) { setCut(false); return; }
    const check = () => setCut(own.scrollWidth > own.clientWidth);
    check();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(check);
    ro.observe(own);
    return () => ro.disconnect();
  }, [tipOk, text]);
  const setNode = React.useCallback(function (n: HTMLElement | null) { node.current = n; setRef(ref, n); }, [ref]);
  let label: React.ReactNode = props.children;
  if (isCount) {
    const n = Math.max(0, Math.floor(Number(props.count)) || 0);
    const max = Math.max(1, Math.floor(Number(props.max)) || 99);
    if (n === 0 && !props.showZero) return null;   // nothing to count: no badge
    label = displayNumber(Math.min(n, max), locale, PLAIN) + (n > max ? "+" : "");   // the locale's digits, as Calendar's
    if (n > max) {
      // "99+" is what shows; screen readers and the tooltip get the real count.
      const full = displayNumber(n, locale, PLAIN);
      label = <><span aria-hidden="true">{label}</span><VisuallyHidden>{full}</VisuallyHidden></>;
      if (rest.title == null) rest.title = full;
    }
  }
  const isLink = rest.href != null, interactive = isLink || typeof rest.onClick === "function";
  let removable = !isCount && typeof props.onRemove === "function";
  if (removable && interactive) {   // a button inside a button (or link) isn't valid: the badge's own click wins
    if (process.env.NODE_ENV !== "production") warnOnce("badge-remove-interactive", "Badge: onRemove is ignored on a badge with onClick or href (a button can't hold another button).");
    removable = false;
  }
  // Indicator: dot with no label, icon or count is a lone dot ("something new", no number): a solid circle in the
  // tone with a ring in the surface color, for the corner of an icon or avatar. Decorative unless you name it.
  const hasLabel = !(label == null || label === false || label === "");
  if (!isCount && props.dot && !hasLabel && (props.leftIcon == null || props.leftIcon === false)) {
    if (process.env.NODE_ENV !== "production" && (interactive || typeof props.onRemove === "function")) warnOnce("badge-indicator", "Badge: a dot indicator can't be clicked or removed (it's too small to target); name and handle the control it sits on.");
    delete rest.href; delete rest.onClick; delete rest.type; delete rest.disabled; delete rest.target; delete rest.rel;
    rest["data-component"] = "badge";
    rest["data-variant"] = "indicator";
    rest["data-tone"] = tone;
    if (rest["aria-label"] || rest["aria-labelledby"]) rest.role = rest.role || "img"; else rest["aria-hidden"] = true;
    return <span {...rest} ref={ref} className={cn("dk-badge", "dk-badge--indicator", "dk-badge--tone-" + tone, props.ping && "dk-badge--ping", props.className)} />;
  }
  if (cut && tipOk) rest.title = text;
  rest["data-component"] = "badge";
  rest["data-variant"] = variant;
  rest["data-tone"] = tone;
  if (interactive) rest["data-interactive"] = "";
  if (loading) {
    rest["aria-busy"] = true;
    rest["data-loading"] = "";
    if (interactive) {
      rest["aria-disabled"] = true;   // stays focusable, announced as unavailable
      rest.onClick = block;           // clicks, Space and Enter do nothing while it loads
    }
  }
  const icon = !isCount && props.leftIcon != null && props.leftIcon !== false
    ? <span className="dk-badge__icon" aria-hidden key="icon">{asIcon(props.leftIcon)}</span> : null;
  const dot = !isCount && !icon && props.dot   // in an icon-sized box, so a dot badge lines up with icon badges
    ? <span className="dk-badge__icon dk-badge__icon--dot" aria-hidden key="dot"><span className="dk-badge__dot" /></span> : null;
  const named = typeof label === "string" || typeof label === "number" ? " " + label : "";
  const remove = removable
    ? <button type="button" className="dk-badge__remove" key="remove" onClick={(e) => removeAndRefocus(e, props.onRemove!)} disabled={loading || undefined}
        aria-label={(props.removeLabel || sds.labels.remove) + named}><Icon icon={icons.Close} /></button>
    : null;
  // Loading: a ring centered over the hidden content, so the badge keeps its width (decorative: the badge announces loadingText)
  const spin = loading ? <span className="dk-badge__loader" aria-hidden key="loader"><Loader label="" delay={0} /></span> : null;
  const classes = cn("dk-badge", "dk-badge--" + variant, "dk-badge--tone-" + tone, isCount && "dk-badge--count", (icon || dot) && "dk-badge--lead", dot && props.ping && "dk-badge--ping", removable && "dk-badge--removable", interactive && "dk-badge--interactive", loading && "dk-badge--loading", props.className);
  const content: React.ReactNode[] = [dot, icon, <span className="dk-badge__label" key="label">{label}</span>, remove, spin];
  if (interactive) {
    // Micro-interactions, as on Button: a ripple from the press point, and Enter shows the press like Space (your handlers run first)
    content.unshift(<span className="dk-badge__ripples" aria-hidden key="ripples" />);
    rest.onPointerDown = chain(rest.onPointerDown, ripple);
    rest.onKeyDown = chain(rest.onKeyDown, pressKey);
    rest.onKeyUp = both(rest.onKeyUp, releaseKey);
    rest.onBlur = both(rest.onBlur, releaseKey);
  }
  if (isLink) {
    if (rest.target === "_blank" && rest.rel == null) rest.rel = "noopener noreferrer";
    delete rest.type;
    return React.createElement(config.link, Object.assign(rest, { ref: setNode, className: classes }), ...content);
  }
  if (interactive && rest.type === undefined) rest.type = "button";   // never submits a form by accident
  return React.createElement(interactive ? "button" : "span", Object.assign(rest, { ref: setNode, className: classes }), ...content);
});
