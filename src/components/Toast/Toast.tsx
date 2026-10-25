"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { cn, oneOf, useIsoLayoutEffect } from "../../internal/cn";
import { announce, ensureAnnouncer } from "../../internal/announce";
import { Icon } from "../Icon/Icon";
import { Button } from "../Button/Button";
import { IconButton } from "../IconButton/IconButton";
import { named } from "../../internal/component";
import { useSerupa } from "../../internal/provider";
import { onModalChange, topModal } from "../../internal/layers";
import * as icons from "../../material/builtin";
import type { IconData } from "../../material/types";

export type ToastTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type ToasterPosition = 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';

export interface ToastOptions {
  /** The main line. */
  title: React.ReactNode;
  /** A muted line under it. */
  description?: React.ReactNode;
  /** 'neutral' (default, no icon), 'info', 'success', 'warning' or 'danger': an icon in the tone's color. */
  tone?: ToastTone;
  /** One button in the toast, such as Undo. Choosing it also closes the toast. */
  action?: { label: string; onClick: () => void };
  /** Milliseconds before it goes. Default: 5000, or 0 with an action, so there's time to reach it; 0 keeps it until it's closed. The time stops while it's hovered or focused, or the window is in the background. */
  duration?: number;
  /** What screen readers announce. Default: the title and description, when they're text. */
  announcement?: string;
  /** Reuse an id to replace a toast that's showing (say, "Saving…" → "Saved"). */
  id?: string;
}

interface Item extends ToastOptions { id: string; tone: ToastTone; count: number }
type Listener = (items: Item[]) => void;
// module state: the browser's toast queue. toast() is for event handlers, and a Toaster starts empty on a server (its
// list fills from the queue after mounting), so a toast() called during a server render never reaches another request's HTML.
let items: Item[] = [];
const listeners = new Set<Listener>();
let next = 0;
const emit = () => listeners.forEach((l) => l(items));
const text = (n: React.ReactNode) => (typeof n === "string" || typeof n === "number" ? String(n) : "");
const TONES: readonly ToastTone[] = ["neutral", "info", "success", "warning", "danger"];
// The key that moves focus to the newest toast and back (as in Radix), and the hint the first toast with an action
// adds to what's announced, in the Toaster's words.
const HOTKEY = "F8";
// module state: browser only, set by the mounted Toaster.
let hint = "", hinted = false;
// A repeat is said once the burst stops (a second without another), with the count in the Toaster's words.
const REPEAT_QUIET = 1000;
// module state: browser only, set by the mounted Toaster, with the timers below.
let repeated: ((count: number) => string) | null = null;
const repeatTimers = new Map<string, ReturnType<typeof setTimeout>>();
const said = (o: ToastOptions) => (o.announcement != null ? o.announcement : [text(o.title), text(o.description)].filter(Boolean).join(". "));

/** Shows a toast in the page's <Toaster> and returns its id. */
function show(options: ToastOptions | string): string {
  const o: ToastOptions = typeof options === "string" ? { title: options } : options;
  const tone = oneOf(TONES, o.tone, "neutral");
  // The same message again (same words and tone, no id, no action), such as "Network error" in a burst: one toast
  // with a count ("×12") whose time starts over. It's said when it first shows, and once more with the count when
  // the burst stops, so screen reader users hear that it happened again without hearing it twelve times.
  const same = o.id || o.action ? -1 : items.findIndex((x) => !x.action && x.tone === tone && text(x.title) !== "" && text(x.title) === text(o.title) && text(x.description) === text(o.description));
  if (same >= 0) {
    items = items.map((x, i) => (i === same ? Object.assign({}, x, { count: x.count + 1 }) : x));
    emit();
    const rid = items[same].id;
    const wait = repeatTimers.get(rid);
    if (wait) clearTimeout(wait);
    repeatTimers.set(rid, setTimeout(() => {
      repeatTimers.delete(rid);
      const now = items.find((x) => x.id === rid), say = now ? said(now) : "";
      if (now && say && repeated) announce(say + ". " + repeated(now.count) + ".", { assertive: now.tone === "danger" });
    }, REPEAT_QUIET));
    return rid;
  }
  const id = o.id || "dk-toast-" + ++next;
  const item: Item = Object.assign({}, o, { id: id, tone: tone, count: 1 });
  const at = items.findIndex((x) => x.id === id);
  items = at >= 0 ? items.map((x, i) => (i === at ? item : x)) : items.concat(item);
  emit();
  let say = said(o);
  if (say && o.action && hint && !hinted) { say += ". " + hint; hinted = true; }
  if (say) announce(say, { assertive: item.tone === "danger" });   // an error interrupts; the rest wait their turn
  return id;
}
/** Closes one toast, or every toast with no id. */
function dismiss(id?: string): void {
  items = id == null ? [] : items.filter((x) => x.id !== id);
  emit();
}
type Message<A> = ToastOptions | string | ((arg: A) => ToastOptions | string);
export interface ToastPromiseMessages<T> {
  /** While it's pending: neutral, and it stays until the promise settles. */
  loading: ToastOptions | string;
  /** Once it resolves, replacing the loading toast; success tone. A function gets the value. */
  success: Message<T>;
  /** Once it rejects, replacing the loading toast; danger tone, said at once. A function gets the reason. */
  error: Message<unknown>;
}
const asOptions = (m: ToastOptions | string): ToastOptions => (typeof m === "string" ? { title: m } : m);
/* toast.promise: "Saving…" while the promise is pending, then "Saved" or "Couldn't save" in its place (the same id),
   in the success or danger tone unless the message says otherwise, with the normal duration. Returns the promise
   itself, so the caller still awaits it and handles its rejection. */
function promise<T>(work: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T>): Promise<T> {
  const p = typeof work === "function" ? work() : work;
  // Its own id, so a second promise with the same words gets its own toast rather than a count on this one.
  const id = "dk-toast-" + ++next;
  show(Object.assign({ duration: 0 }, asOptions(messages.loading), { id: id }));
  const settle = <A,>(m: Message<A>, arg: A, tone: ToastTone) => {
    const o = asOptions(typeof m === "function" ? m(arg) : m);
    show(Object.assign({ tone: tone }, o, { id: id }));
  };
  p.then((v) => settle(messages.success, v, "success"), (e: unknown) => settle(messages.error, e, "danger"));
  return p;
}
/** Shows a toast in the page's <Toaster> and returns its id; toast.dismiss(id) closes it, and toast.promise(p, { loading, success, error }) follows a promise. */
export const toast = /* @__PURE__ */ Object.assign(show, { dismiss, promise });

export interface ToasterProps extends React.HTMLAttributes<HTMLElement> {
  /** Where toasts appear: 'bottom-end' (default), 'bottom-start', 'bottom-center', 'top-start', 'top-center' or 'top-end'. Start and end follow the text direction. */
  position?: ToasterPosition;
  /** The region's name for screen readers. Default: 'Notifications'. */
  label?: string;
  /** The close button's name. Default: 'Dismiss'. */
  dismissLabel?: string;
  /** The most toasts shown at once; the newest show, and older ones wait under a "+2 more" line until there's room. Default: 3. */
  limit?: number;
}

const POSITIONS: readonly ToasterPosition[] = ["top-start", "top-center", "top-end", "bottom-start", "bottom-center", "bottom-end"];
const ICONS: Record<ToastTone, IconData | null> = { neutral: null, info: icons.Info, success: icons.CheckCircle, warning: icons.Warning, danger: icons.Error };

/* Toaster: where toast() messages appear. Render one, once, near the root. Each toast has a title, an optional
   description, tone icon, action and close button, and goes after its duration (one with an action stays); the
   time stops while it's hovered or focused. New toasts are announced through the shared polite live region. F8
   moves focus to the newest toast, and F8 or Escape takes it back to where it was. */
/** The place toast() messages appear: render one, once, near the root of the app. */
export const Toaster = /* @__PURE__ */ named("Toaster", function Toaster(props: ToasterProps): React.ReactElement {
  const sds = useSerupa();
  const { position, label, dismissLabel, limit, className, ...rest } = props;
  // Empty at first, as on a server, where a toast() from another request could be in the queue; the effect reads it.
  const [list, setList] = React.useState<Item[]>([]);
  React.useEffect(() => { ensureAnnouncer(); hinted = false; listeners.add(setList); setList(items); return () => { listeners.delete(setList); }; }, []);
  const pos = oneOf(POSITIONS, position, "bottom-end");
  // The F8 hint is set once the Toaster is in the page, not while rendering, and goes with it: with no Toaster, F8
  // does nothing, so a toast doesn't mention it.
  const shortcut = sds.labels.toastShortcut(HOTKEY);
  React.useEffect(() => { hint = shortcut; return () => { hint = ""; }; }, [shortcut]);
  const times = sds.labels.toastRepeated;
  React.useEffect(() => { repeated = times; return () => { repeated = null; }; }, [times]);
  const self = React.useRef<HTMLElement | null>(null);
  const back = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    const away = () => { const b = back.current; back.current = null; if (b && b.isConnected) b.focus(); };
    const onKey = (e: KeyboardEvent) => {
      const region = self.current;
      if (!region || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const inside = region.contains(document.activeElement);
      if (e.key === HOTKEY) {
        const toasts = region.querySelectorAll<HTMLElement>(".dk-toast");
        if (inside) { e.preventDefault(); away(); return; }
        if (!toasts.length) return;
        e.preventDefault();
        back.current = document.activeElement as HTMLElement | null;
        // The newest one: last in the list, or first when the toasts stack downward from the top.
        toasts[pos.startsWith("top") ? 0 : toasts.length - 1].focus();
      } else if (e.key === "Escape" && inside && back.current) { e.preventDefault(); away(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pos]);
  // A toast closing with focus in it (its ×, its action, toast.dismiss()) would drop focus on
  // <body>: it goes back where F8 came from, else to the toast next to it. held is the focused toast; a blur to
  // nowhere that leaves it in the page (a click on blank space) lets go of it, so a later close doesn't take focus.
  const held = React.useRef<{ toast: HTMLElement; at: number } | null>(null);
  const onFocus = (e: React.FocusEvent<HTMLElement>) => {
    if (rest.onFocus) rest.onFocus(e);
    const t = (e.target).closest<HTMLElement>(".dk-toast");
    if (t && self.current) held.current = { toast: t, at: [...self.current.querySelectorAll(".dk-toast")].indexOf(t) };
  };
  const onBlur = (e: React.FocusEvent<HTMLElement>) => {
    if (rest.onBlur) rest.onBlur(e);
    const h = held.current, to = e.relatedTarget as Node | null;
    if (to && self.current && !self.current.contains(to)) held.current = null;
    else if (!to && h) window.setTimeout(() => { if (held.current === h && h.toast.isConnected && !h.toast.contains(document.activeElement)) held.current = null; }, 0);
  };
  useIsoLayoutEffect(() => {
    const h = held.current, region = self.current;
    if (!h || h.toast.isConnected || !region) return;
    held.current = null;
    const now = document.activeElement;
    if (now && now !== document.body && now.isConnected) return;
    const b = back.current, toasts = region.querySelectorAll<HTMLElement>(".dk-toast");
    if (b && b.isConnected) { back.current = null; b.focus(); }
    else if (toasts.length) toasts[Math.min(h.at, toasts.length - 1)].focus();
  }, [list]);
  // The newest few show; the rest wait (their time hasn't started) and come back as those close. A burst can't
  // push the stack past the screen's edge.
  const max = Math.max(1, Math.floor(limit != null && limit > 0 ? limit : 3));
  const shown = list.slice(-max), waiting = list.length - shown.length;
  const more = waiting > 0 ? <li key="more" className="dk-toaster__more">{sds.labels.moreToasts(waiting)}</li> : null;
  const ordered = pos.startsWith("top") ? shown.slice().reverse() : shown;   // newest nearest the edge, the waiting line farthest
  // While a Dialog or Drawer is open the page behind it is inert and under it, so the toasts move into it: a
  // "Couldn't save, Retry" toast from inside a dialog can be seen and clicked.
  const modal = React.useSyncExternalStore(onModalChange, topModal, () => null);
  const region = (
    <section {...rest} ref={self} onFocus={onFocus} onBlur={onBlur} aria-label={label || sds.labels.notifications} className={cn("dk-toaster", "dk-toaster--" + pos, className)} data-component="toaster" data-position={pos}>
      <ol className="dk-toaster__list">
        {pos.startsWith("top") ? null : more}
        {ordered.map((t) => <ToastView key={t.id} item={t} dismissLabel={dismissLabel || sds.labels.dismiss} />)}
        {pos.startsWith("top") ? more : null}
      </ol>
    </section>
  );
  return modal ? createPortal(region, modal) : region;
});

function ToastView(props: { item: Item; dismissLabel: string }): React.ReactElement {
  const t = props.item;
  const sds = useSerupa();
  const duration = t.duration == null ? (t.action ? 0 : 5000) : t.duration;
  // Each reason to stop the time is kept apart, so leaving with the mouse doesn't restart it while focus is still inside.
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const paused = hovered || focused || hidden;
  const left = React.useRef(duration);
  React.useEffect(() => { left.current = duration; }, [t, duration]);   // a replaced toast starts its time again
  React.useEffect(() => {
    if (!duration || paused) return;
    const start = Date.now();
    const timer = window.setTimeout(() => toast.dismiss(t.id), left.current);
    return () => { window.clearTimeout(timer); left.current -= Date.now() - start; };
  }, [paused, t, duration]);
  React.useEffect(() => {
    const vis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, []);
  const titleId = t.id + "-title", descId = t.id + "-desc";
  const icon = ICONS[t.tone];
  return (
    <li tabIndex={-1} className={cn("dk-toast", "dk-toast--" + t.tone)} data-tone={t.tone} aria-labelledby={titleId} aria-describedby={t.description != null ? descId : undefined}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}>
      {icon ? <span className="dk-toast__icon" aria-hidden="true"><Icon icon={icon} /></span> : null}
      <div className="dk-toast__content">
        <p className="dk-toast__title" id={titleId}>{t.title}{t.count > 1 ? <span className="dk-toast__count"><span aria-hidden="true">{"×" + t.count}</span><span className="dk-visually-hidden">{", " + sds.labels.toastRepeated(t.count)}</span></span> : null}</p>
        {t.description != null ? <p className="dk-toast__description" id={descId}>{t.description}</p> : null}
      </div>
      {t.action ? <Button className="dk-toast__action" size="sm" variant="secondary" onClick={() => { t.action!.onClick(); toast.dismiss(t.id); }}>{t.action.label}</Button> : null}
      <IconButton className="dk-toast__close" icon={icons.Close} label={props.dismissLabel} size="sm" noTitle onClick={() => toast.dismiss(t.id)} />
    </li>
  );
}
