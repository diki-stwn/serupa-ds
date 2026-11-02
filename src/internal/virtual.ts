"use client";
import * as React from "react";
import { useIsoLayoutEffect } from "./cn";

/* useVirtual: the windowing behind VirtualList (and, later, any long list that draws only what's in view). Given the
   scrolling element, how many rows there are and a guess at a row's height, it says which rows to draw (start to end,
   with a few overscan rows either side) and how much space stands in for the rows above and below them. Rows are
   measured once drawn (each drawn element with data-index), so rows of different heights are fine; the guess is used
   only for rows not yet seen, and then only until some are: after that, unseen rows count as the average of the seen.
   A row measured above the view keeps the view where it is: the scroll moves by the difference. Before the first
   measure (and on the server) it draws the first `initial` rows. Attach `ref` to the scrolling element; its drawn rows
   are its children with data-index.
   The view is kept as the row at its top and how far into that row it is, not as a scroll position: when rows above
   it are measured, or the guess for the rows not yet seen changes, the scroll position moves to keep that row where it
   was (GR93).
   Browsers stop an element's height at about 17.9 million px (Firefox; 33.5 million in Chromium and WebKit), so past
   CAP the scroll range is scaled down: the scroll position is a fraction of the whole, the rows for that fraction
   are drawn, and the space before them puts them under the view. Dragging the scrollbar then moves through the rows
   at total / CAP times the pointer, as in react-window's and TanStack Virtual's large lists, and every row is reached
   (GR92); the arrow and Page keys and the wheel step through the rows themselves, row by row, as in a short list
   (GR94). */
export interface VirtualOptions {
  /** How many rows there are. */
  count: number;
  /** A guess at a row's height in px, for rows not yet drawn. */
  estimate: number;
  /** Rows drawn beyond each edge of the view. Default 4. */
  overscan?: number;
  /** Rows drawn before the scroller has been measured (on the server too). Default 20. */
  initial?: number;
  /** The element whose children (with data-index) are the drawn rows, when it isn't the scroller itself: a table's
      <tbody> inside the scrolling frame. Read after each render. Default: the scroller. */
  rows?: () => HTMLElement | null;
  /** How far down the scroller's content the first row starts, in px (below a table's caption and header). Read after
      each render. Default 0. */
  origin?: () => number;
}

export interface VirtualRange {
  /** Put on the scrolling element. */
  ref: (node: HTMLElement | null) => void;
  /** The first row to draw. */
  start: number;
  /** One past the last row to draw. */
  end: number;
  /** The height of the rows above start, in px. */
  before: number;
  /** The height of the rows from end on, in px. */
  after: number;
  /** Where a row starts, in px from the top of the list. */
  offsetOf: (index: number) => number;
  /** Brings a row into view (block "nearest"). */
  scrollToIndex: (index: number) => void;
}

// The tallest scroll range drawn as is, under every browser's limit; past it, the range is scaled down to it.
const CAP = 15_000_000;

// The last index whose start is at or above y.
function find(o: Float64Array, y: number): number {
  let lo = 0, hi = o.length - 2;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (o[mid] <= y) lo = mid; else hi = mid - 1; }
  return Math.max(0, lo);
}

// The view: the row at its top, how far below the view's top that row starts (0 or less), the view's height, and the
// scroll position it was read at.
interface View { i: number; at: number; height: number; p: number }

// What the listeners need from the last render, kept in one ref: the rows' offsets, where the rows' top is, the scroll
// position a move by the keys or the wheel set past CAP (and the row it put at the top, which measuring doesn't move),
// and the position last read or set (a different one means the user has scrolled since, and the scroll event is on
// its way).
interface Live { offsets: Float64Array; top: number; pending: { i: number; at: number; p: number } | null; seen: number; origin: number }

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// Where the rows' top is for a scroll position: the position itself, or past CAP the same fraction of the rows (or
// the rows' top a key or the wheel asked for, while the scroll position is still the one it set).
function topAt(L: Live, p: number, height: number): number {
  const total = L.offsets[L.offsets.length - 1];
  if (total <= CAP) return p;
  if (L.pending && Math.abs(L.pending.p - p) < 1) return L.offsets[L.pending.i] - L.pending.at;
  L.pending = null;
  const room = Math.max(0, CAP - height);
  return room ? Math.min(1, p / room) * Math.max(0, total - height) : 0;
}

function viewAt(L: Live, el: HTMLElement): View {
  // Rows that start below other content (a table's header) are scrolled to from that point: until it's passed, the
  // first row is at the top.
  const p = el.scrollTop, height = el.clientHeight, v = topAt(L, Math.max(0, p - L.origin), height), i = find(L.offsets, v);
  L.seen = p;
  return { i, at: L.offsets[i] - v, height, p };
}

// Past CAP: puts the rows' top at v, and the scroll position at the same fraction.
function go(L: Live, el: HTMLElement, v: number) {
  const h = el.clientHeight, span = Math.max(0, L.offsets[L.offsets.length - 1] - h), room = Math.max(0, CAP - h);
  v = clamp(v, 0, span);
  const i = find(L.offsets, v);
  L.pending = { i, at: L.offsets[i] - v, p: span ? (v / span) * room : 0 };
  L.top = v;
  el.scrollTop = L.pending.p;
}

// The keys that scroll a list, and how far (px) they move the rows' top, for a view h tall.
const STEP: Record<string, (h: number) => number> = {
  ArrowDown: () => 40, ArrowUp: () => -40,
  PageDown: (h) => Math.max(40, h * 0.875), PageUp: (h) => -Math.max(40, h * 0.875),
};
const EDITABLE = "input, textarea, select, [contenteditable]:not([contenteditable='false'])";

export function useVirtual(options: VirtualOptions): VirtualRange {
  const { count, estimate } = options;
  const overscan = options.overscan ?? 4, initial = options.initial ?? 20;
  // The scrolling element: in a ref for the effects to read and scroll, and in state so they run again when it changes.
  const node = React.useRef<HTMLElement | null>(null);
  const [scroller, setScroller] = React.useState<HTMLElement | null>(null);
  const ref = React.useCallback((n: HTMLElement | null) => { node.current = n; setScroller(n); }, []);
  // The measured heights by row. A new wrapper (same map) each time a row is measured, so what reads it runs again.
  const [store, remeasured] = React.useReducer((s: { sizes: Map<number, number> }) => ({ sizes: s.sizes }), null, () => ({ sizes: new Map<number, number>() }));
  const sizes = store.sizes;
  const [view, setView] = React.useState<View | null>(null);
  const live = React.useRef<Live>({ offsets: new Float64Array(1), top: 0, pending: null, seen: 0, origin: 0 });

  // Rows not measured yet count as the average of those that are (the guess until one is), so the scroll range
  // settles near the real one after the first screen.
  const offsets = React.useMemo(() => {
    let sum = 0, n = 0;
    for (const [i, h] of store.sizes) if (i < count) { sum += h; n++; }
    const g = n ? sum / n : estimate;
    const o = new Float64Array(count + 1);
    for (let i = 0; i < count; i++) o[i + 1] = o[i] + (store.sizes.get(i) ?? g);
    return o;
  }, [count, estimate, store]);

  // The rows' top: the view's row where it is now, so measuring keeps that row where it was. Past CAP, the scroll
  // position (view.p) is put at the same fraction of CAP, and the rows are drawn shifted by the difference.
  const total = offsets[count], scaled = total > CAP;
  const top = view ? clamp(offsets[Math.min(view.i, count)] - view.at, 0, Math.max(0, total - view.height)) : 0;
  const shift = scaled && view ? view.p - top : 0;
  let start: number, end: number;
  if (!view || !count) { start = 0; end = Math.min(count, initial); }
  else {
    start = Math.max(0, find(offsets, top) - overscan);
    end = Math.min(count, find(offsets, top + view.height) + 1 + overscan);
    // Past CAP near the top, overscan rows that would start above the scroll range aren't drawn.
    while (start < end - 1 && offsets[start + 1] + shift <= 0) start++;
  }

  // Follow the scroll and the scroller's size (a ResizeObserver also reports once as soon as it starts). Past CAP,
  // the keys and the wheel move the rows' top by their own amount, not the scroll position's (GR94).
  React.useEffect(() => {
    if (!scroller) return;
    const L = live.current;
    const read = () => { const v = viewAt(L, scroller); setView((w) => w && w.i === v.i && w.at === v.at && w.height === v.height && w.p === v.p ? w : v); };
    const step = (d: number) => { go(L, scroller, L.top + d); read(); };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement, by = STEP[e.key];
      if (!by || !(L.offsets[L.offsets.length - 1] > CAP) || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || (t !== scroller && t.closest(EDITABLE))) return;
      e.preventDefault();
      step(by(scroller.clientHeight));
    };
    const onWheel = (e: WheelEvent) => {
      if (!(L.offsets[L.offsets.length - 1] > CAP) || e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const d = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? scroller.clientHeight : 1), v = L.top;
      // At either end, the page scrolls instead.
      if (d < 0 ? v <= 0 : v >= L.offsets[L.offsets.length - 1] - scroller.clientHeight) return;
      e.preventDefault();
      step(d);
    };
    scroller.addEventListener("scroll", read, { passive: true });
    scroller.addEventListener("keydown", onKey);
    scroller.addEventListener("wheel", onWheel, { passive: false });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { read(); remeasured(); }) : null;
    if (ro) ro.observe(scroller);
    return () => { scroller.removeEventListener("scroll", read); scroller.removeEventListener("keydown", onKey); scroller.removeEventListener("wheel", onWheel); if (ro) ro.disconnect(); };
  }, [scroller]);

  // Forget sizes past the end when rows go away.
  React.useEffect(() => { for (const i of sizes.keys()) if (i >= count) sizes.delete(i); }, [count, sizes]);

  // Keep the view's row where it was, then measure what was drawn.
  // every render: any render can draw other rows or change their heights, and only the drawn rows say how tall they are.
  useIsoLayoutEffect(() => {
    const el = node.current, L = live.current;
    L.offsets = offsets;
    L.top = top;
    if (!el) return;
    const o = options.origin ? options.origin() : 0;
    L.origin = o > 0 ? o : 0;
    // Below CAP the scroll position is the rows' top: when measuring moved the view's row, scroll by as much. Only
    // while the scroll position is the one last read or set (else the user has scrolled, and that wins), and never
    // past either end (a scroll the browser clamps fires no scroll event, and setting it again each render looped
    // until React gave up, GR91).
    if (view && !scaled && Math.abs(el.scrollTop - L.seen) < 1 && el.scrollTop >= L.origin) {
      const to = clamp(top + L.origin, 0, el.scrollHeight - el.clientHeight);
      if (Math.abs(to - el.scrollTop) >= 1) { el.scrollTop = to; L.seen = el.scrollTop; }
    }
    let changed = false;
    const holder = (options.rows && options.rows()) || el;
    for (const r of holder.querySelectorAll<HTMLElement>(":scope > [data-index]")) {
      const i = Number(r.dataset.index), h = r.getBoundingClientRect().height;
      if (!(i < count) || !h) continue;
      if (sizes.has(i) && Math.abs((sizes.get(i) ?? 0) - h) < 0.5) continue;
      sizes.set(i, h);
      changed = true;
    }
    if (changed) remeasured();
  });

  const scrollToIndex = (index: number) => {
    const el = node.current;
    if (!el || index < 0 || index >= count) return;
    const o = scaled ? 0 : live.current.origin, a = offsets[index] + o, b = offsets[index + 1] + o, h = el.clientHeight;
    // From where the rows' top is now, the nearest top that shows the row.
    const now = scaled ? top : el.scrollTop;
    const want = a < now ? a : b > now + h ? b - h : now;
    if (want === now) return;
    if (scaled) go(live.current, el, want); else el.scrollTop = want;
  };

  const drawn = offsets[end] - offsets[start];
  const before = scaled ? Math.max(0, offsets[start] + shift) : offsets[start];
  const after = scaled ? Math.max(0, CAP - before - drawn) : total - offsets[end];
  return { ref, start, end, before, after, offsetOf: (i: number) => offsets[clamp(i, 0, count)] + shift, scrollToIndex };
}
