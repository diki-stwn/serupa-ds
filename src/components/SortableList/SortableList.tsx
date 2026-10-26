"use client";
import * as React from "react";
import { cn, domId, omit, useIsoLayoutEffect } from "../../internal/cn";
import { component } from "../../internal/component";
import { useAutoFocus } from "../../internal/focus";
import { announce } from "../../internal/announce";
import { isComposing } from "../../internal/ime";
import { useSerupa } from "../../internal/provider";
import { Icon } from "../Icon/Icon";
import * as icons from "../../material/builtin";

export interface SortableListProps<T> extends Omit<React.HTMLAttributes<HTMLUListElement>, 'children' | 'onChange'> {
  /** The items, in order. Controlled: pass the new order back from onReorder. */
  items: readonly T[];
  /** A stable key for each item (its id), so focus and React state follow it as it moves. */
  getKey: (item: T) => string | number;
  /** The item's name in words ("Apollo"): on its handle ("Reorder Apollo") and in what's announced as it moves. */
  getLabel: (item: T) => string;
  /** What each row shows, after its handle. dragging is true for the item being moved. */
  renderItem: (item: T, state: { index: number; dragging: boolean }) => React.ReactNode;
  /** Called with the new order when an item is dropped somewhere new, and which positions it moved between (from 0). */
  onReorder: (items: T[], move: { from: number; to: number }) => void;
  /** Shows the items without handles. */
  disabled?: boolean;
  /** The word before an item's name on its handle. Default: "Reorder" (from SerupaProvider labels). */
  reorderLabel?: string;
}

type Drag = { key: string | number; from: number; to: number; pointer: boolean };

/* SortableList: a list people reorder by dragging a handle, or from the keyboard: Space or Enter on a handle picks
   the item up, the arrow keys (Home, End) move it, Space or Enter drops it and Escape puts it back. Each step is
   announced ("Apollo, position 3 of 5"). A drag moves the other items out of the way as it goes and is only
   reported on drop (onReorder), so a cancelled one changes nothing. A <ul> of <li>; className and props go to the <ul>. */
/** A list people reorder by dragging a handle or with the keyboard, with every move announced. */
export const SortableList = /* @__PURE__ */ component<HTMLUListElement, SortableListProps<unknown>>("SortableList", function SortableList(props, ref) {
  const rest = omit(props, { items: 1, getKey: 1, getLabel: 1, renderItem: 1, onReorder: 1, disabled: 1, reorderLabel: 1, className: 1, autoFocus: 1 } as const);
  const sds = useSerupa();
  const { getKey, getLabel } = props;
  const items: readonly unknown[] = props.items || [];   // missing items (a plain-JS caller): an empty list, not a TypeError
  const [drag, setDrag] = React.useState<Drag | null>(null);
  const current = React.useRef(drag);
  current.current = drag;
  const hintId = domId("dk-sl", React.useId()) + "-hint";
  const list = React.useRef<HTMLUListElement | null>(null);
  const handles = React.useRef(new Map<string | number, HTMLButtonElement>());
  const pointer = React.useRef<{ id: number; key: string | number; startY: number; y: number; grab: number; moved: boolean } | null>(null);
  useAutoFocus(props.autoFocus, () => list.current && list.current.querySelector<HTMLButtonElement>(".dk-sortable-list__handle"));
  const total = items.length;
  const from = drag ? items.findIndex((it) => getKey(it) === drag.key) : -1;
  // While dragging, the list shows the item at its new place; nothing is reported until it's dropped.
  const shown = drag && from >= 0 ? move(items, from, drag.to) : items.slice();

  const label = (it: unknown) => getLabel(it);
  const finish = (d: Drag, drop: boolean) => {
    const at = items.findIndex((it) => getKey(it) === d.key);
    setDrag(null);
    if (at < 0) return;
    const name = label(items[at]);
    if (drop) {
      announce(sds.labels.reorderDropped(name, d.to + 1, total));
      if (d.to !== at) props.onReorder(move(items, at, d.to), { from: at, to: d.to });
    } else announce(sds.labels.reorderCancelled(name, at + 1, total));
  };

  // A click picks the item up or drops it: from the keyboard, a screen reader's virtual click, or a press that didn't
  // move (WCAG 2.5.7: a single pointer can reorder without dragging). With one picked up, a click on another row's
  // handle drops it in that row's place.
  const dragged = React.useRef(false);
  const onClick = (key: string | number, index: number) => () => {
    if (props.disabled) return;
    if (dragged.current) { dragged.current = false; return; }   // the click that ends a drag
    if (drag && !drag.pointer) finish(key === drag.key ? drag : { ...drag, to: index }, true);
    else { setDrag({ key, from: index, to: index, pointer: false }); announce(sds.labels.reorderGrabbed(label(items[index]), index + 1, total)); }
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!drag || drag.pointer || isComposing(e)) return;
    const k = e.key;
    let to = drag.to;
    if (k === "ArrowUp" || k === "ArrowLeft") to = Math.max(0, to - 1);
    else if (k === "ArrowDown" || k === "ArrowRight") to = Math.min(total - 1, to + 1);
    else if (k === "Home") to = 0;
    else if (k === "End") to = total - 1;
    else if (k === "Escape") { e.preventDefault(); e.stopPropagation(); finish(drag, false); return; }
    else if (k === "Tab") { finish(drag, false); return; }
    else return;
    e.preventDefault();
    if (to !== drag.to) {
      setDrag({ ...drag, to });
      announce(sds.labels.reorderMoved(label(items[from]), to + 1, total));
    }
  };
  // Focus leaving a picked-up item (a click elsewhere) puts it back. Checked a frame later: a move refocuses it first.
  const onBlur = () => requestAnimationFrame(() => {
    const d = current.current;
    if (d && !d.pointer && handles.current.get(d.key) !== document.activeElement) finish(d, false);
  });
  // Moving a row in the DOM can take focus off its handle: give it back.
  // every render: a keyboard move re-renders the rows; nothing is read unless a row is being moved.
  useIsoLayoutEffect(() => {
    if (!drag || drag.pointer) return;
    const h = handles.current.get(drag.key);
    if (h && document.activeElement !== h) h.focus({ preventScroll: true });
  });

  // Pointer: press a handle and move more than a few pixels to drag; the row follows the pointer. The moves are
  // followed on the window: the handle's row moves in the DOM as the order changes, which would drop a pointer capture.
  const latest = React.useRef({ items, getKey, finish });
  latest.current = { items, getKey, finish };
  const stop = React.useRef<(() => void) | null>(null);
  React.useEffect(() => () => { if (stop.current) stop.current(); }, []);
  const onPointerDown = (key: string | number) => (e: React.PointerEvent<HTMLButtonElement>) => {
    dragged.current = false;
    if (props.disabled || e.button !== 0 || (drag && !drag.pointer)) return;
    const row = e.currentTarget.closest("li") as HTMLElement;
    pointer.current = { id: e.pointerId, key, startY: e.clientY, y: e.clientY, grab: e.clientY - row.getBoundingClientRect().top, moved: false };
    const placeAt = (p: NonNullable<typeof pointer.current>) => {
      const { items: all, getKey: keyOf } = latest.current;
      const at = all.findIndex((it) => keyOf(it) === p.key);
      if (at < 0) return;
      // The new place: how many of the other rows have their middle above the dragged row's middle.
      const rows = list.current ? [...list.current.children] as HTMLElement[] : [];
      const self = rows.find((r) => r.dataset.key === String(p.key));
      const middle = p.y - p.grab + (self ? self.getBoundingClientRect().height / 2 : 0);
      let to = 0;
      for (const r of rows) if (r !== self && r.getBoundingClientRect().top + r.getBoundingClientRect().height / 2 < middle) to++;
      // A new object every move, so the row is placed under the pointer again.
      setDrag({ key: p.key, from: at, to, pointer: true });
    };
    // Near the top or bottom edge of what scrolls (the list's scrolling container, or the page), it scrolls that way,
    // faster the closer the pointer is, so a long list can be reordered past the screen. touch-action: none on the
    // handle means the browser won't scroll for a touch drag on its own.
    let frame = 0;
    const scroller = (): HTMLElement => {
      for (let n = list.current ? list.current.parentElement : null; n && n !== document.body; n = n.parentElement) {
        const o = getComputedStyle(n).overflowY;
        if ((o === "auto" || o === "scroll") && n.scrollHeight > n.clientHeight) return n;
      }
      return (document.scrollingElement || document.documentElement) as HTMLElement;
    };
    const tick = () => {
      frame = 0;
      const p = pointer.current;
      if (!p || !p.moved) return;
      const box = scroller(), page = box === document.scrollingElement || box === document.documentElement;
      const top = page ? 0 : box.getBoundingClientRect().top, bottom = page ? window.innerHeight : box.getBoundingClientRect().bottom;
      const edge = Math.min(48, (bottom - top) / 4);
      const by = p.y < top + edge ? -Math.ceil((top + edge - p.y) / edge * 16) : p.y > bottom - edge ? Math.ceil((p.y - bottom + edge) / edge * 16) : 0;
      if (!by) return;
      const before = box.scrollTop;
      box.scrollTop = before + by;
      if (box.scrollTop !== before) placeAt(p);
      frame = requestAnimationFrame(tick);
    };
    const moveTo = (ev: PointerEvent) => {
      const p = pointer.current;
      if (!p || p.id !== ev.pointerId) return;
      p.y = ev.clientY;
      if (!p.moved && Math.abs(p.y - p.startY) < 4) return;
      p.moved = true;
      dragged.current = true;
      ev.preventDefault();
      placeAt(p);
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const end = (cancel: boolean) => (ev: PointerEvent) => {
      const p = pointer.current;
      if (!p || p.id !== ev.pointerId) return;
      off();
      if (p.moved) setTimeout(() => { dragged.current = false; });   // no click came after it (let go off the handle)
      const d = current.current;
      if (p.moved && d && d.pointer) latest.current.finish(d, !cancel);
    };
    const up = end(false), cancel = end(true);
    const off = () => {
      pointer.current = null; stop.current = null;
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      window.removeEventListener("pointermove", moveTo); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", cancel);
    };
    if (stop.current) stop.current();
    stop.current = off;
    window.addEventListener("pointermove", moveTo); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", cancel);
  };
  const tops = React.useRef(new Map<string, number>());
  // The rows that change place glide there (FLIP): each starts where it showed (mid-way through an earlier move, or
  // where the pointer left it), offset by translate, and the transition in the CSS takes it to its new slot. The row
  // under the pointer is left to follow it. Reduced motion has no transition, so they move at once.
  // every render: a move re-renders the rows; reads each row's offsetTop, and styles only the rows that moved.
  useIsoLayoutEffect(() => {
    const rows = list.current ? [...list.current.children] as HTMLElement[] : [];
    const held = pointer.current && drag && drag.pointer ? String(drag.key) : null;
    const next = new Map<string, number>(), moved: [HTMLElement, number][] = [];
    for (const r of rows) {
      const key = r.dataset.key || "", top = r.offsetTop, was = tops.current.get(key);
      next.set(key, top);
      if (was === undefined || was === top || key === held) continue;
      const cs = getComputedStyle(r);
      const shift = (cs.transform === "none" ? 0 : new DOMMatrix(cs.transform).m42) + (parseFloat(cs.translate.split(" ")[1]) || 0);
      const dy = Math.round(was + shift - top);
      if (dy) moved.push([r, dy]);
    }
    tops.current = next;
    if (!moved.length || !list.current) return;
    for (const [r, dy] of moved) { r.dataset.flip = ""; r.style.translate = "0 " + dy + "px"; }
    void list.current.offsetWidth;   // one reflow: they start from where they were
    for (const [r] of moved) { delete r.dataset.flip; r.style.translate = ""; }
  });

  // The dragged row sits where the pointer is, between the others.
  // every render: each pointer move re-renders; outside a drag it only clears a transform left behind.
  useIsoLayoutEffect(() => {
    const p = pointer.current, rows = list.current ? [...list.current.children] as HTMLElement[] : [];
    for (const r of rows) {
      if (p && drag && drag.pointer && r.dataset.key === String(drag.key)) {
        r.style.transform = "";
        r.style.transform = "translateY(" + Math.round(p.y - p.grab - r.getBoundingClientRect().top) + "px)";
      } else if (r.style.transform) r.style.transform = "";
    }
  });

  const name = props.reorderLabel || sds.labels.reorder;
  return (<>
    <ul role="list" {...rest} ref={(n) => { list.current = n; if (typeof ref === "function") ref(n); else if (ref) ref.current = n; }}
      className={cn("dk-sortable-list", drag && "dk-sortable-list--sorting", props.disabled && "dk-sortable-list--disabled", props.className)} data-component="sortable-list">
      {shown.map((it, index) => {
        const key = getKey(it), dragging = !!drag && drag.key === key;
        return (
          <li key={key} data-key={String(key)} className={cn("dk-sortable-list__item", dragging && "dk-sortable-list__item--dragging")} data-state={dragging ? "dragging" : undefined}>
            {props.disabled ? null : (
              <button type="button" className="dk-sortable-list__handle" aria-label={name + " " + label(it)} aria-describedby={hintId} aria-pressed={dragging && !drag.pointer}
                ref={(n) => { if (n) handles.current.set(key, n); else handles.current.delete(key); }}
                onClick={onClick(key, index)} onKeyDown={onKeyDown} onBlur={onBlur}
                onPointerDown={onPointerDown(key)}>
                <Icon icon={icons.DragIndicator} />
              </button>
            )}
            <div className="dk-sortable-list__content">{props.renderItem(it, { index, dragging })}</div>
          </li>
        );
      })}
    </ul>
    {props.disabled ? null : <span hidden id={hintId}>{sds.labels.reorderInstructions}</span>}
  </>);
}) as <T>(props: SortableListProps<T> & { ref?: React.Ref<HTMLUListElement> }) => React.ReactElement;

/** items with the one at `from` moved to `to`. */
function move<T>(items: readonly T[], from: number, to: number): T[] {
  const out = items.slice();
  const [it] = out.splice(from, 1);
  out.splice(to, 0, it);
  return out;
}
