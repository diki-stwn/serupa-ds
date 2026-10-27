"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { cn, oneOf, useIsoLayoutEffect } from "../../internal/cn";
import { announce, ensureAnnouncer } from "../../internal/announce";
import { warnOnce } from "../../internal/warn";
import { Icon } from "../Icon/Icon";
import { Button } from "../Button/Button";
import { IconButton } from "../IconButton/IconButton";
import { named } from "../../internal/component";
import { useSettings } from "../../internal/provider";
import { onModalChange, topModal } from "../../internal/layers";
import { settleTime, speed, track, type Samples } from "../../internal/fling";
import * as icons from "../../material/builtin";
import type { IconData } from "../../material/types";
import { en as ownWords } from "./labels";

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
  /** Milliseconds before it goes. Default: the Toaster's duration, 5000 unless set. 0 keeps it, as autoDismiss false does. The time stops while it's hovered or focused, or the window is in the background. */
  duration?: number;
  /** Whether it goes by itself after its duration. Default: the Toaster's autoDismiss, true unless set, with an action
   *  too (its time stops while it's hovered or focused, and F8 reaches it). false keeps it until it's closed: for a
   *  message someone has to act on, such as a failed upload with Retry. */
  autoDismiss?: boolean;
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
// Only the newest mounted Toaster shows the toasts, so two (one in a layout and one on a page, say) don't show each
// toast twice; when it unmounts, the one before it takes them over.
const emit = () => { let left = listeners.size; listeners.forEach((l) => l(--left ? [] : items)); };
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
// module state: browser only: NotificationCenter's useToastHistory hooks, told of each toast as it's shown, replaced
// or repeated.
const watchers = /* @__PURE__ */ new Set<(t: ShownToast) => void>();
// A toast as useToastHistory records it.
interface ShownToast { id: string; title: React.ReactNode; description?: React.ReactNode; tone: ToastTone; count: number }
/** For useToastHistory: calls fn with each toast as it's shown, replaced or repeated, and returns the way to stop. */
export function watchToasts(fn: (t: ShownToast) => void): () => void { watchers.add(fn); return () => { watchers.delete(fn); }; }
const tell = (t: Item) => watchers.forEach((w) => w({ id: t.id, title: t.title, description: t.description, tone: t.tone, count: t.count }));
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
    tell(items[same]);
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
  tell(item);
  let say = said(o);
  if (say && o.action && hint && !hinted) { say += ". " + hint; hinted = true; }
  if (say) announce(say, { assertive: item.tone === "danger" });   // an error interrupts; the rest wait their turn
  return id;
}
// module state: browser only: what an undo toast does when it closes without Undo (toast.undo's commit), by id.
const onClose = /* @__PURE__ */ new Map<string, () => void>();
/** Closes one toast, or every toast with no id. */
function dismiss(id?: string): void {
  const gone = id == null ? items : items.filter((x) => x.id === id);
  items = id == null ? [] : items.filter((x) => x.id !== id);
  emit();
  for (const x of gone) { const then = onClose.get(x.id); if (then) { onClose.delete(x.id); then(); } }
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
  show(Object.assign({ autoDismiss: false }, asOptions(messages.loading), { id: id }));
  const settle = <A,>(m: Message<A>, arg: A, tone: ToastTone) => {
    const o = asOptions(typeof m === "function" ? m(arg) : m);
    show(Object.assign({ tone: tone }, o, { id: id }));
  };
  p.then((v) => settle(messages.success, v, "success"), (e: unknown) => settle(messages.error, e, "danger"));
  return p;
}
export interface ToastUndoOptions extends Omit<ToastOptions, "action" | "autoDismiss"> {
  /** Does the action for good. It runs once, when the toast closes without Undo: its time runs out, it's closed, or
   *  the page is left. */
  commit: () => void;
  /** Runs instead of commit when Undo is chosen: show things as they were. */
  onUndo?: () => void;
  /** The button's text. Default: "Undo" (labels.undo). */
  undoLabel?: string;
}
// module state: browser only, set by the mounted Toaster: the Undo button's word in its labels ("" before one mounts).
let undoWord = "";
/* toast.undo: the undo pattern. The action looks done at once (the item is gone from the list), and a toast says so
   with an Undo button; the action is done for good (commit) only when the toast closes without Undo, or when the
   page is left (pagehide), so nothing is lost and nothing needs a "Are you sure?" first. Undo runs onUndo instead.
   Either runs once. */
function undo(options: ToastUndoOptions): string {
  const { commit, onUndo, undoLabel, ...rest } = options;
  let settled = false;
  const once = (f?: () => void) => () => {
    if (settled) return;
    settled = true;
    window.removeEventListener("pagehide", keep);
    if (f) f();
  };
  const keep = once(commit), back = once(onUndo);
  const id = show(Object.assign({}, rest, { action: { label: undoLabel || undoWord || ownWords.undo, onClick: back }, autoDismiss: true }));
  onClose.set(id, keep);
  window.addEventListener("pagehide", keep);
  return id;
}
/** Shows a toast in the page's <Toaster> and returns its id; toast.dismiss(id) closes it, toast.promise(p, { loading, success, error }) follows a promise, and toast.undo({ title, commit, onUndo }) does an action for good only if Undo isn't chosen. */
export const toast = /* @__PURE__ */ Object.assign(show, { dismiss, promise, undo });

export interface ToasterProps extends React.HTMLAttributes<HTMLElement> {
  /** Where toasts appear: 'bottom-end' (default), 'bottom-start', 'bottom-center', 'top-start', 'top-center' or 'top-end'. Start and end follow the text direction. */
  position?: ToasterPosition;
  /** The region's name for screen readers. Default: 'Notifications'. */
  label?: string;
  /** The close button's name. Default: 'Dismiss'. */
  dismissLabel?: string;
  /** The most toasts shown at once; the newest show, and older ones wait under a "+2 more" line until there's room. Default: 3. */
  limit?: number;
  /** How long each toast stays, in milliseconds, unless it sets its own duration. Default: 5000. */
  duration?: number;
  /** Whether toasts go by themselves, unless one sets its own autoDismiss. Default: true. */
  autoDismiss?: boolean;
}

const POSITIONS: readonly ToasterPosition[] = ["top-start", "top-center", "top-end", "bottom-start", "bottom-center", "bottom-end"];
const ICONS: Record<ToastTone, IconData | null> = { neutral: null, info: icons.Info, success: icons.CheckCircle, warning: icons.Warning, danger: icons.Error };

/* Toaster: where toast() messages appear. Render one, once, near the root. Each toast has a title, an optional
   description, tone icon, action and close button, and goes after its duration unless autoDismiss is false; the
   time stops while it's hovered or focused. New toasts are announced through the shared polite live region. F8
   moves focus to the newest toast, and F8 or Escape takes it back to where it was. */
/** The place toast() messages appear: render one, once, near the root of the app. */
export const Toaster = /* @__PURE__ */ named("Toaster", function Toaster(props: ToasterProps): React.ReactElement {
  const sds = useSettings(ownWords);
  const { position, label, dismissLabel, limit, duration, autoDismiss, className, ...rest } = props;
  // Empty at first, as on a server, where a toast() from another request could be in the queue; the effect reads it.
  const [list, setList] = React.useState<Item[]>([]);
  const self = React.useRef<HTMLElement | null>(null);
  // Where each toast was before the list changes, so the ones left glide to their new place (below).
  const before = React.useRef<Map<string, number> | null>(null);
  const snap = () => {
    const region = self.current;
    if (!region || before.current) return;
    before.current = new Map([...region.querySelectorAll<HTMLElement>(MOVES)].map((e) => [e.dataset.toast || "more", e.getBoundingClientRect().top]));
  };
  // Toasts already there as the Toaster arrives (in its first effects) are shown from the first frame, not slid in.
  const early = React.useRef(new Set<string>()), arriving = React.useRef(true);
  React.useEffect(() => {
    ensureAnnouncer(); hinted = false;
    if (process.env.NODE_ENV !== "production" && listeners.size) warnOnce("toaster-twice", "Toaster: another Toaster is already mounted, so only this newer one shows toasts. Render one Toaster, once, near the root.");
    const take: Listener = (l) => { snap(); if (arriving.current) l.forEach((x) => early.current.add(x.id)); setList(l); };
    arriving.current = true;
    listeners.add(take); emit();
    void Promise.resolve().then(() => { arriving.current = false; });
    return () => { listeners.delete(take); emit(); };
  }, []);
  const pos = oneOf(POSITIONS, position, "bottom-end");
  // The F8 hint is set once the Toaster is in the page, not while rendering, and goes with it: with no Toaster, F8
  // does nothing, so a toast doesn't mention it.
  const shortcut = sds.labels.toastShortcut(HOTKEY);
  React.useEffect(() => { hint = shortcut; return () => { hint = ""; }; }, [shortcut]);
  const times = sds.labels.toastRepeated;
  React.useEffect(() => { repeated = times; return () => { repeated = null; }; }, [times]);
  const undoText = sds.labels.undo;
  React.useEffect(() => { undoWord = undoText; return () => { undoWord = ""; }; }, [undoText]);
  const back = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    const away = () => { const b = back.current; back.current = null; if (b && b.isConnected) b.focus(); };
    const onKey = (e: KeyboardEvent) => {
      const region = self.current;
      if (!region || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const inside = region.contains(document.activeElement);
      if (e.key === HOTKEY) {
        const toasts = region.querySelectorAll<HTMLElement>("[data-toast]:not([data-leaving])");
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
  // A toast closing with keyboard focus in it (its ×, its action, toast.dismiss()) would drop focus on <body>: it
  // goes back where F8 came from, else to the toast next to it. held is the focused toast; a blur to nowhere that
  // leaves it in the page (a click on blank space) lets go of it, so a later close doesn't take focus. Closed with
  // the mouse (FO1), focus isn't moved: on the toast next to it, it would stop that one's time until a click elsewhere.
  const held = React.useRef<{ toast: HTMLElement; at: number; keys: boolean } | null>(null);
  const onFocus = (e: React.FocusEvent<HTMLElement>) => {
    if (rest.onFocus) rest.onFocus(e);
    const t = (e.target).closest<HTMLElement>(".dk-toast");
    if (t && self.current) held.current = { toast: t, at: [...self.current.querySelectorAll("[data-toast]:not([data-leaving])")].indexOf(t), keys: e.target.matches(":focus-visible") };
  };
  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (rest.onPointerDown) rest.onPointerDown(e);
    if (held.current) held.current.keys = false;
  };
  const onBlur = (e: React.FocusEvent<HTMLElement>) => {
    if (rest.onBlur) rest.onBlur(e);
    const h = held.current, to = e.relatedTarget as Node | null;
    if (to && self.current && !self.current.contains(to)) held.current = null;
    else if (!to && h) window.setTimeout(() => { if (held.current === h && h.toast.isConnected && !h.toast.contains(document.activeElement)) held.current = null; }, 0);
  };
  useIsoLayoutEffect(() => {
    const h = held.current, region = self.current;
    // A toast fading out (data-leaving, inert) is gone as far as focus goes.
    if (!h || (h.toast.isConnected && !h.toast.hasAttribute("data-leaving")) || !region) return;
    held.current = null;
    if (!h.keys) return;
    const now = document.activeElement;
    if (now && now !== document.body && now.isConnected && !h.toast.contains(now)) return;
    const b = back.current, toasts = region.querySelectorAll<HTMLElement>("[data-toast]:not([data-leaving])");
    if (b && b.isConnected) { back.current = null; b.focus(); }
    else if (toasts.length) toasts[Math.min(h.at, toasts.length - 1)].focus();
  }, [list]);
  // The newest few show; the rest wait (their time hasn't started) and come back as those close. A burst can't
  // push the stack past the screen's edge.
  const max = Math.max(1, Math.floor(limit != null && limit > 0 ? limit : 3));
  const shown = list.slice(-max), waiting = list.length - shown.length;
  // The waiting line fades in and out (FO1), and glides with the toasts; once gone, it fades out with its last words.
  const [moreWas, setMoreWas] = React.useState({ waiting: 0, words: "" });
  const words = waiting > 0 ? sds.labels.moreToasts(waiting) : moreWas.words;
  if (waiting !== moreWas.waiting || (waiting > 0 && words !== moreWas.words)) setMoreWas({ waiting: waiting, words: waiting > 0 ? words : moreWas.words });
  const moreRef = React.useRef<HTMLLIElement | null>(null);
  const moreLeaving = waiting === 0 && words !== "";
  useIsoLayoutEffect(() => {
    const e = moreRef.current;
    if (!moreLeaving || !e) return;
    const runs = typeof e.getAnimations === "function" ? e.getAnimations().filter((a) => a.id !== "dk-toast-move") : [];
    const end = () => { snap(); setMoreWas((m) => (m.waiting ? m : { waiting: 0, words: "" })); };
    if (!runs.length) { end(); return; }
    let on = true;
    void Promise.all(runs.map((a) => a.finished.catch(() => {}))).then(() => { if (on) end(); });
    return () => { on = false; };
  }, [moreLeaving]);
  // Only toasts there as the Toaster arrived waiting: there from the first frame, like them.
  const moreInstant = list.slice(0, waiting).every((x) => early.current.has(x.id));
  const more = words ? <li key="more" ref={moreRef} className="dk-toaster__more" data-leaving={moreLeaving ? "" : undefined} data-instant={moreInstant ? "" : undefined} aria-hidden={moreLeaving || undefined}>{words}</li> : null;
  const ordered = pos.startsWith("top") ? shown.slice().reverse() : shown;   // newest nearest the edge, the waiting line farthest
  // Closed toasts stay where they were, fading out (DZ1), until their transitions end; one shown again comes back.
  // Each goes back after the toast it followed (FO1), not at its old index, which with toasts arriving above it
  // put it ahead of that one: React moved the other one's <li>, and it faded in again and slid past. One pushed
  // into the waiting line (queued) folds toward the line rather than leaving by its edge.
  const [gone, setGone] = React.useState<Array<{ item: Item; at: number; after: string | null; queued: boolean }>>([]);
  const [last, setLast] = React.useState<Item[]>([]);
  const key = ordered.map((t) => t.id).join(" ");
  if (key !== last.map((t) => t.id).join(" ")) {
    const ids = new Set(ordered.map((t) => t.id)), held = new Set(list.map((t) => t.id));
    setGone(gone.filter((g) => !ids.has(g.item.id)).concat(last.flatMap((t, at) => (ids.has(t.id) ? [] : [{ item: t, at, after: at ? last[at - 1].id : null, queued: held.has(t.id) }]))));
    setLast(ordered);
  }
  const rows: Array<{ item: Item; leaving: false | "closed" | "queued" }> = ordered.map((t) => ({ item: t, leaving: false }));
  for (const g of gone) {
    const i = g.after == null ? -1 : rows.findIndex((r) => r.item.id === g.after);
    rows.splice(g.after == null ? 0 : i >= 0 ? i + 1 : Math.min(g.at, rows.length), 0, { item: g.item, leaving: g.queued ? "queued" : "closed" });
  }
  // How long each toast that has been seen has left (FO1). One pushed into the waiting line keeps its time running
  // there and comes back with what's left, so they still go in the order they came; one never shown waits paused.
  const clocks = React.useRef(new Map<string, Clock>());
  React.useEffect(() => {
    const ids = new Set(list.map((t) => t.id));
    for (const id of clocks.current.keys()) if (!ids.has(id)) clocks.current.delete(id);
    const run = list.slice(0, waiting).flatMap((t) => {
      const c = clocks.current.get(t.id);
      if (!c || c.item !== t || !(c.left > 0)) return [];
      c.since = Date.now();
      return [{ c, timer: window.setTimeout(() => toast.dismiss(t.id), c.left) }];
    });
    return () => { for (const r of run) { window.clearTimeout(r.timer); r.c.left = timeLeft(r.c); r.c.since = null; } };
  }, [list, waiting]);
  const done = React.useCallback((id: string) => { snap(); setGone((l) => l.filter((g) => g.item.id !== id)); }, []);
  // The toasts left glide to their new place over --dk-toast-move (FLIP), from wherever they are (a glide that's
  // still running included); with reduced motion they move at once.
  // every render: a count or a replaced message can change a toast's height too, and it only acts after a snap.
  useIsoLayoutEffect(() => {
    const was = before.current, region = self.current;
    before.current = null;
    if (!was || !region || typeof window.matchMedia !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cs = getComputedStyle(region), ms = parseFloat(cs.getPropertyValue("--dk-toast-move")) || 0;
    if (!ms) return;
    for (const e of region.querySelectorAll<HTMLElement>(MOVES)) {
      const from = was.get(e.dataset.toast || "more");
      if (from == null || typeof e.animate !== "function") continue;
      for (const a of e.getAnimations()) if (a.id === "dk-toast-move") a.cancel();
      const dy = from - e.getBoundingClientRect().top;
      if (Math.abs(dy) < 0.5) continue;
      e.animate([{ translate: "0 " + dy + "px" }, { translate: "0 0" }], { duration: ms, easing: cs.getPropertyValue("--dk-toast-move-ease").trim() || "ease", id: "dk-toast-move" });
    }
  });
  // While a Dialog or Drawer is open the page behind it is inert and under it, so the toasts move into it: a
  // "Couldn't save, Retry" toast from inside a dialog can be seen and clicked.
  const modal = React.useSyncExternalStore(onModalChange, topModal, () => null);
  const region = (
    <section {...rest} ref={self} onFocus={onFocus} onBlur={onBlur} onPointerDown={onPointerDown} aria-label={label || sds.labels.notifications} className={cn("dk-toaster", "dk-toaster--" + pos, className)} data-component="toaster" data-position={pos}>
      <ol className="dk-toaster__list" role="list">
        {pos.startsWith("top") ? null : more}
        {rows.map((r) => <ToastView key={r.item.id} item={r.item} leaving={r.leaving} clocks={clocks.current} instant={early.current.has(r.item.id)} onGone={done} dismissLabel={dismissLabel || sds.labels.dismiss} time={(r.item.autoDismiss ?? autoDismiss ?? true) ? Math.max(0, r.item.duration ?? duration ?? 5000) : 0} />)}
        {pos.startsWith("top") ? more : null}
      </ol>
    </section>
  );
  return modal ? createPortal(region, modal) : region;
});

// A seen toast's time: what was left when it last stopped, and since when it has run in the waiting line.
interface Clock { item: Item; left: number; since: number | null }
const timeLeft = (c: Clock) => c.left - (c.since == null ? 0 : Date.now() - c.since);
const MOVES = "[data-toast], .dk-toaster__more";

function ToastView(props: { item: Item; leaving: false | "closed" | "queued"; instant: boolean; clocks: Map<string, Clock>; onGone: (id: string) => void; dismissLabel: string; time: number }): React.ReactElement {
  const t = props.item;
  const self = React.useRef<HTMLLIElement | null>(null);
  // Closed: gone once its fade and slide end, or at once when nothing runs.
  const { leaving, onGone } = props;
  useIsoLayoutEffect(() => {
    const e = self.current;
    if (!leaving || !e) return;
    // It leaves the flow where it is (data-gone, at its own top), so the toasts and the waiting line close up at once,
    // in the same glide as everything else, rather than in a second one once its fade ends.
    if (!e.hasAttribute("data-gone")) { e.style.top = e.offsetTop + "px"; e.setAttribute("data-gone", ""); }
    const runs = typeof e.getAnimations === "function" ? e.getAnimations().filter((a) => a.id !== "dk-toast-move") : [];
    if (!runs.length) { onGone(t.id); return; }
    let on = true;
    void Promise.all(runs.map((a) => a.finished.catch(() => {}))).then(() => { if (on) onGone(t.id); });
    return () => { on = false; };
  }, [leaving]);
  const sds = useSettings(ownWords);
  const duration = props.time;   // 0 when it stays
  // Each reason to stop the time is kept apart, so leaving with the mouse doesn't restart it while focus is still inside.
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [held, setHeld] = React.useState(false);   // under a finger (a swipe)
  const paused = hovered || focused || hidden || held;
  // Back from the waiting line, it goes on with the time it had left.
  const { clocks } = props;
  const [kept] = React.useState(() => clocks.get(t.id));
  const left = React.useRef(kept && kept.item === t ? Math.max(0, timeLeft(kept)) : duration);
  const shown = React.useRef(t);
  React.useEffect(() => { if (shown.current !== t) { shown.current = t; left.current = duration; } }, [t, duration]);   // a replaced toast starts its time again
  React.useEffect(() => {
    if (leaving) return;
    clocks.set(t.id, { item: t, left: left.current, since: null });
    if (!duration || paused) return;
    const start = Date.now();
    const timer = window.setTimeout(() => toast.dismiss(t.id), left.current);
    return () => { window.clearTimeout(timer); left.current -= Date.now() - start; clocks.set(t.id, { item: t, left: left.current, since: null }); };
  }, [paused, t, duration, leaving, clocks]);
  React.useEffect(() => {
    const vis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, []);
  // Swipe to dismiss (touch): sideways, it follows the finger and fades as it goes. Let go past a third of its width,
  // or flicked away, it carries on at the finger's speed (ease-fling, as Drawer and Carousel) and closes; otherwise
  // it slides back. The × stays the way to close it without a swipe (WCAG 2.5.1).
  const drag = React.useRef<{ id: number; x: number; y: number; d: number; on: boolean; s: Samples } | null>(null);
  const onSwipeDown = (e: React.PointerEvent<HTMLLIElement>) => {
    if (leaving || e.pointerType !== "touch" || !e.isPrimary || (e.target as Element).closest("button, a, input, textarea, select")) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, d: 0, on: false, s: [{ t: e.timeStamp, p: 0 }] };
  };
  const onSwipeMove = (e: React.PointerEvent<HTMLLIElement>) => {
    const g = drag.current;
    if (!g || e.pointerId !== g.id) return;
    const d = e.clientX - g.x, across = Math.abs(e.clientY - g.y), el = e.currentTarget;
    if (!g.on) {
      if (across > 10 && across > Math.abs(d)) { drag.current = null; return; }
      if (Math.abs(d) < 10) return;
      g.on = true;
      setHeld(true);
      el.setAttribute("data-dragging", "");   // follows the finger, with no transition behind it
      try { el.setPointerCapture(e.pointerId); } catch { /* a pointer that already ended */ }
    }
    g.d = d;
    track(g.s, e.timeStamp, d);
    el.style.translate = d + "px 0";
    el.style.opacity = String(Math.max(0, 1 - Math.abs(d) / el.offsetWidth));
  };
  const onSwipeEnd = (e: React.PointerEvent<HTMLLIElement>) => {
    const g = drag.current;
    if (!g || e.pointerId !== g.id) return;
    drag.current = null;
    const el = e.currentTarget, w = el.offsetWidth, v = speed(g.s), dir = Math.sign(g.d);
    el.removeAttribute("data-dragging");
    setHeld(false);
    if (!g.on) return;
    const away = v * dir;   // px per ms, the way it was dragged
    const out = e.type === "pointerup" && (away > 0.5 || (Math.abs(g.d) > w / 3 && away > -0.1));
    if (out && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.transition = ["translate", "opacity"].map((p) => p + " " + settleTime(w - Math.abs(g.d), Math.max(0, away)) + "ms var(--ease-fling)").join(", ");
      el.style.translate = dir * w + "px 0";
      el.style.opacity = "0";
    } else el.style.translate = el.style.opacity = "";
    if (!out) return;
    toast.dismiss(t.id);
  };
  const titleId = t.id + "-title", descId = t.id + "-desc";
  const icon = ICONS[t.tone];
  return (
    <li ref={self} tabIndex={-1} className={cn("dk-toast", "dk-toast--" + t.tone)} data-tone={t.tone} data-toast={t.id}
      data-leaving={leaving ? (leaving === "queued" ? "queued" : "") : undefined} data-instant={props.instant ? "" : undefined} inert={leaving ? true : undefined} aria-labelledby={titleId} aria-describedby={t.description != null ? descId : undefined}
      onPointerDown={onSwipeDown} onPointerMove={onSwipeMove} onPointerUp={onSwipeEnd} onPointerCancel={onSwipeEnd}
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
