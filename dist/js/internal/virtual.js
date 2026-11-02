"use client";

// src/internal/virtual.ts
import * as React from "react";
import { useIsoLayoutEffect } from "./cn.js";
var CAP = 15e6;
function find(o, y) {
  let lo = 0, hi = o.length - 2;
  while (lo < hi) {
    const mid = lo + hi + 1 >> 1;
    if (o[mid] <= y) lo = mid;
    else hi = mid - 1;
  }
  return Math.max(0, lo);
}
var clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
function topAt(L, p, height) {
  const total = L.offsets[L.offsets.length - 1];
  if (total <= CAP) return p;
  if (L.pending && Math.abs(L.pending.p - p) < 1) return L.offsets[L.pending.i] - L.pending.at;
  L.pending = null;
  const room = Math.max(0, CAP - height);
  return room ? Math.min(1, p / room) * Math.max(0, total - height) : 0;
}
function viewAt(L, el) {
  const p = el.scrollTop, height = el.clientHeight, v = topAt(L, p, height), i = find(L.offsets, v);
  L.seen = p;
  return { i, at: L.offsets[i] - v, height, p };
}
function go(L, el, v) {
  const h = el.clientHeight, span = Math.max(0, L.offsets[L.offsets.length - 1] - h), room = Math.max(0, CAP - h);
  v = clamp(v, 0, span);
  const i = find(L.offsets, v);
  L.pending = { i, at: L.offsets[i] - v, p: span ? v / span * room : 0 };
  L.top = v;
  el.scrollTop = L.pending.p;
}
var STEP = {
  ArrowDown: () => 40,
  ArrowUp: () => -40,
  PageDown: (h) => Math.max(40, h * 0.875),
  PageUp: (h) => -Math.max(40, h * 0.875)
};
var EDITABLE = "input, textarea, select, [contenteditable]:not([contenteditable='false'])";
function useVirtual(options) {
  const { count, estimate } = options;
  const overscan = options.overscan ?? 4, initial = options.initial ?? 20;
  const node = React.useRef(null);
  const [scroller, setScroller] = React.useState(null);
  const ref = React.useCallback((n) => {
    node.current = n;
    setScroller(n);
  }, []);
  const [store, remeasured] = React.useReducer((s) => ({ sizes: s.sizes }), null, () => ({ sizes: /* @__PURE__ */ new Map() }));
  const sizes = store.sizes;
  const [view, setView] = React.useState(null);
  const live = React.useRef({ offsets: new Float64Array(1), top: 0, pending: null, seen: 0 });
  const offsets = React.useMemo(() => {
    let sum = 0, n = 0;
    for (const [i, h] of store.sizes) if (i < count) {
      sum += h;
      n++;
    }
    const g = n ? sum / n : estimate;
    const o = new Float64Array(count + 1);
    for (let i = 0; i < count; i++) o[i + 1] = o[i] + (store.sizes.get(i) ?? g);
    return o;
  }, [count, estimate, store]);
  const total = offsets[count], scaled = total > CAP;
  const top = view ? clamp(offsets[Math.min(view.i, count)] - view.at, 0, Math.max(0, total - view.height)) : 0;
  const shift = scaled && view ? view.p - top : 0;
  let start, end;
  if (!view || !count) {
    start = 0;
    end = Math.min(count, initial);
  } else {
    start = Math.max(0, find(offsets, top) - overscan);
    end = Math.min(count, find(offsets, top + view.height) + 1 + overscan);
    while (start < end - 1 && offsets[start + 1] + shift <= 0) start++;
  }
  React.useEffect(() => {
    if (!scroller) return;
    const L = live.current;
    const read = () => {
      const v = viewAt(L, scroller);
      setView((w) => w && w.i === v.i && w.at === v.at && w.height === v.height && w.p === v.p ? w : v);
    };
    const step = (d) => {
      go(L, scroller, L.top + d);
      read();
    };
    const onKey = (e) => {
      const t = e.target, by = STEP[e.key];
      if (!by || !(L.offsets[L.offsets.length - 1] > CAP) || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || t !== scroller && t.closest(EDITABLE)) return;
      e.preventDefault();
      step(by(scroller.clientHeight));
    };
    const onWheel = (e) => {
      if (!(L.offsets[L.offsets.length - 1] > CAP) || e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const d = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? scroller.clientHeight : 1), v = L.top;
      if (d < 0 ? v <= 0 : v >= L.offsets[L.offsets.length - 1] - scroller.clientHeight) return;
      e.preventDefault();
      step(d);
    };
    scroller.addEventListener("scroll", read, { passive: true });
    scroller.addEventListener("keydown", onKey);
    scroller.addEventListener("wheel", onWheel, { passive: false });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      read();
      remeasured();
    }) : null;
    if (ro) ro.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", read);
      scroller.removeEventListener("keydown", onKey);
      scroller.removeEventListener("wheel", onWheel);
      if (ro) ro.disconnect();
    };
  }, [scroller]);
  React.useEffect(() => {
    for (const i of sizes.keys()) if (i >= count) sizes.delete(i);
  }, [count, sizes]);
  useIsoLayoutEffect(() => {
    const el = node.current, L = live.current;
    L.offsets = offsets;
    L.top = top;
    if (!el) return;
    if (view && !scaled && Math.abs(el.scrollTop - L.seen) < 1) {
      const to = clamp(top, 0, el.scrollHeight - el.clientHeight);
      if (Math.abs(to - el.scrollTop) >= 1) {
        el.scrollTop = to;
        L.seen = el.scrollTop;
      }
    }
    let changed = false;
    for (const r of el.querySelectorAll(":scope > [data-index]")) {
      const i = Number(r.dataset.index), h = r.getBoundingClientRect().height;
      if (!(i < count) || !h) continue;
      if (sizes.has(i) && Math.abs((sizes.get(i) ?? 0) - h) < 0.5) continue;
      sizes.set(i, h);
      changed = true;
    }
    if (changed) remeasured();
  });
  const scrollToIndex = (index) => {
    const el = node.current;
    if (!el || index < 0 || index >= count) return;
    const a = offsets[index], b = offsets[index + 1], h = el.clientHeight;
    const now = scaled ? top : el.scrollTop;
    const want = a < now ? a : b > now + h ? b - h : now;
    if (want === now) return;
    if (scaled) go(live.current, el, want);
    else el.scrollTop = want;
  };
  const drawn = offsets[end] - offsets[start];
  const before = scaled ? Math.max(0, offsets[start] + shift) : offsets[start];
  const after = scaled ? Math.max(0, CAP - before - drawn) : total - offsets[end];
  return { ref, start, end, before, after, offsetOf: (i) => offsets[clamp(i, 0, count)] + shift, scrollToIndex };
}
export {
  useVirtual
};
//# sourceMappingURL=virtual.js.map
