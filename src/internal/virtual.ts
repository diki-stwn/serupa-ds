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
   Browsers stop an element's height at about 17.9 million px (Firefox; 33.5 million in Chromium and WebKit), so past
   CAP the scroll range is scaled down: the scroll position is a fraction of the whole, the rows for that fraction
   are drawn, and the space before them puts them under the view. A scroll then moves through the rows faster than
   the pointer (total / CAP times), as in react-window's and TanStack Virtual's large lists, but every row is reached
   (GR92). Measuring doesn't move the scroll position then: the fraction stays put. */
export interface VirtualOptions {
  /** How many rows there are. */
  count: number;
  /** A guess at a row's height in px, for rows not yet drawn. */
  estimate: number;
  /** Rows drawn beyond each edge of the view. Default 4. */
  overscan?: number;
  /** Rows drawn before the scroller has been measured (on the server too). Default 20. */
  initial?: number;
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
  const [view, setView] = React.useState<{ top: number; height: number } | null>(null);
  // The first drawn row at the top of the view, and how far below the view's top it starts. Taken on each scroll and
  // after each measure; after the next render that row is put back where it was, so rows above the view that were
  // measured (or a guess that changed) never move what's seen.
  const anchor = React.useRef<{ i: number; at: number } | null>(null);

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

  // Past CAP, the scroll position (view.top, out of CAP less the view) is the same fraction of the rows (top, out of
  // the total less the view), and the rows are drawn shifted by the difference.
  const total = offsets[count], scaled = total > CAP;
  const room = view ? Math.max(0, CAP - view.height) : 0, span = view ? Math.max(0, total - view.height) : 0;
  const top = !view ? 0 : scaled ? (room ? Math.min(1, view.top / room) * span : 0) : view.top;
  const shift = scaled && view ? view.top - top : 0;
  let start: number, end: number;
  if (!view || !count) { start = 0; end = Math.min(count, initial); }
  else {
    start = Math.max(0, find(offsets, top) - overscan);
    end = Math.min(count, find(offsets, top + view.height) + 1 + overscan);
  }

  // Follow the scroll and the scroller's size (a ResizeObserver also reports once as soon as it starts).
  React.useEffect(() => {
    if (!scroller) return;
    const read = () => {
      anchor.current = anchorOf(scroller);
      const top = scroller.scrollTop, height = scroller.clientHeight;
      setView((v) => v && v.top === top && v.height === height ? v : { top, height });
    };
    scroller.addEventListener("scroll", read, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { read(); remeasured(); }) : null;
    if (ro) ro.observe(scroller);
    return () => { scroller.removeEventListener("scroll", read); if (ro) ro.disconnect(); };
  }, [scroller]);

  // Forget sizes past the end when rows go away.
  React.useEffect(() => { for (const i of sizes.keys()) if (i >= count) sizes.delete(i); }, [count, sizes]);

  // Put the anchor row back where it was, then measure what was drawn.
  // every render: any render can draw other rows or change their heights, and only the drawn rows say how tall they are.
  useIsoLayoutEffect(() => {
    const el = node.current;
    if (!el) return;
    const a = anchor.current;
    const row = a && a.i < count ? el.querySelector<HTMLElement>(`:scope > [data-index="${a.i}"]`) : null;
    // Not when scaled (the fraction is the position), and never past either end: a scroll the browser clamps fires no
    // scroll event to settle on, and correcting it again each render looped until React gave up (GR91).
    if (a && row && row.style.position !== "absolute" && el.scrollTop > 0 && !scaled) {
      const d = row.getBoundingClientRect().top - el.getBoundingClientRect().top - a.at;
      const to = el.scrollTop + d, max = el.scrollHeight - el.clientHeight;
      if (Math.abs(d) >= 1 && to >= 0 && to <= max) el.scrollTop = to;
    }
    let changed = false;
    for (const r of el.querySelectorAll<HTMLElement>(":scope > [data-index]")) {
      const i = Number(r.dataset.index), h = r.getBoundingClientRect().height;
      if (!(i < count) || !h) continue;
      if (sizes.has(i) && Math.abs((sizes.get(i) ?? 0) - h) < 0.5) continue;
      sizes.set(i, h);
      changed = true;
    }
    anchor.current = anchorOf(el);
    if (changed) remeasured();
  });

  const scrollToIndex = (index: number) => {
    const el = node.current;
    if (!el || index < 0 || index >= count) return;
    const a = offsets[index], b = offsets[index + 1], h = el.clientHeight;
    // Where the rows' top is now (the fraction when scaled), and from there the nearest top that shows the row.
    const now = scaled ? (CAP - h > 0 ? (el.scrollTop / (CAP - h)) * Math.max(0, total - h) : 0) : el.scrollTop;
    const want = a < now ? a : b > now + h ? b - h : now;
    if (want === now) return;
    el.scrollTop = scaled ? (total - h > 0 ? (want / (total - h)) * (CAP - h) : 0) : want;
  };

  const drawn = offsets[end] - offsets[start];
  const before = scaled ? Math.max(0, offsets[start] + shift) : offsets[start];
  const after = scaled ? Math.max(0, CAP - before - drawn) : total - offsets[end];
  return { ref, start, end, before, after, offsetOf: (i: number) => offsets[Math.max(0, Math.min(count, i))] + shift, scrollToIndex };
}

// The first drawn row (in the flow) whose bottom is below the top of the view, and where it starts in the view.
function anchorOf(el: HTMLElement): { i: number; at: number } | null {
  const box = el.getBoundingClientRect().top;
  for (const row of el.querySelectorAll<HTMLElement>(":scope > [data-index]")) {
    if (row.style.position === "absolute") continue;
    const r = row.getBoundingClientRect();
    if (r.bottom > box) return { i: Number(row.dataset.index), at: r.top - box };
  }
  return null;
}
