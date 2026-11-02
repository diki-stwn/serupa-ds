"use client";

// src/components/SortableList/SortableList.tsx
import * as React from "react";
import { cn, domId, omit, useIsoLayoutEffect } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useAutoFocus } from "../../internal/focus.js";
import { announce } from "../../internal/announce.js";
import { isComposing } from "../../internal/ime.js";
import { useSettings } from "../../internal/provider.js";
import { Icon } from "../Icon/Icon.js";
import * as icons from "../../material/builtin.js";
import { en as words } from "./labels.js";
var SortableList = /* @__PURE__ */ component("SortableList", function SortableList2(props, ref) {
  const rest = omit(props, { items: 1, getKey: 1, getLabel: 1, renderItem: 1, onReorder: 1, disabled: 1, reorderLabel: 1, orientation: 1, className: 1, autoFocus: 1 });
  const sds = useSettings(words);
  const { getKey, getLabel } = props;
  const items = props.items || [];
  const [drag, setDrag] = React.useState(null);
  const current = React.useRef(drag);
  current.current = drag;
  const hintId = domId("dk-sl", React.useId()) + "-hint";
  const list = React.useRef(null);
  const handles = React.useRef(/* @__PURE__ */ new Map());
  const pointer = React.useRef(null);
  const row = props.orientation === "horizontal";
  const lead = (b) => row ? b.left : b.top, span = (b) => row ? b.width : b.height;
  const rtl = () => row && !!list.current && getComputedStyle(list.current).direction === "rtl";
  useAutoFocus(props.autoFocus, () => list.current && list.current.querySelector(".dk-sortable-list__handle"));
  const total = items.length;
  const from = drag ? items.findIndex((it) => getKey(it) === drag.key) : -1;
  const shown = drag && from >= 0 ? move(items, from, drag.to) : items.slice();
  const label = (it) => getLabel(it);
  const finish = (d, drop) => {
    const at = items.findIndex((it) => getKey(it) === d.key);
    setDrag(null);
    if (at < 0) return;
    const name2 = label(items[at]);
    if (drop) {
      announce(sds.labels.reorderDropped(name2, d.to + 1, total));
      if (d.to !== at) props.onReorder(move(items, at, d.to), { from: at, to: d.to });
    } else announce(sds.labels.reorderCancelled(name2, at + 1, total));
  };
  const dragged = React.useRef(false);
  const dropping = React.useRef(false);
  const onClick = (key, index) => () => {
    dropping.current = false;
    if (props.disabled) return;
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    if (drag && !drag.pointer) finish(key === drag.key ? drag : { ...drag, to: index }, true);
    else {
      setDrag({ key, from: index, to: index, pointer: false });
      announce(sds.labels.reorderGrabbed(label(items[index]), index + 1, total));
    }
  };
  const onKeyDown = (e) => {
    if (!drag || drag.pointer || isComposing(e)) return;
    const k = e.key;
    let to = drag.to;
    const back = rtl() ? "ArrowRight" : "ArrowLeft", on = rtl() ? "ArrowLeft" : "ArrowRight";
    if (k === "ArrowUp" || k === back) to = Math.max(0, to - 1);
    else if (k === "ArrowDown" || k === on) to = Math.min(total - 1, to + 1);
    else if (k === "Home") to = 0;
    else if (k === "End") to = total - 1;
    else if (k === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      finish(drag, false);
      return;
    } else if (k === "Tab") {
      finish(drag, false);
      return;
    } else return;
    e.preventDefault();
    if (to !== drag.to) {
      setDrag({ ...drag, to });
      announce(sds.labels.reorderMoved(label(items[from]), to + 1, total));
    }
  };
  const onBlur = () => requestAnimationFrame(() => {
    const d = current.current;
    if (d && !d.pointer && !dropping.current && handles.current.get(d.key) !== document.activeElement) finish(d, false);
  });
  const shownAt = React.useRef(-1);
  useIsoLayoutEffect(() => {
    if (!drag || drag.pointer) {
      shownAt.current = -1;
      return;
    }
    const h = handles.current.get(drag.key);
    if (h && document.activeElement !== h) h.focus({ preventScroll: true });
    if (shownAt.current === -1) {
      shownAt.current = drag.to;
      return;
    }
    if (shownAt.current === drag.to) return;
    shownAt.current = drag.to;
    const row2 = h && h.closest("li");
    if (row2 && typeof row2.scrollIntoView === "function") row2.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
  const latest = React.useRef({ items, getKey, finish });
  latest.current = { items, getKey, finish };
  const stop = React.useRef(null);
  React.useEffect(() => () => {
    if (stop.current) stop.current();
  }, []);
  const onPointerDown = (key) => (e) => {
    dragged.current = false;
    if (drag && !drag.pointer && e.button === 0 && !props.disabled) {
      dropping.current = true;
      window.addEventListener("pointerup", () => setTimeout(() => {
        if (dropping.current) {
          dropping.current = false;
          onBlur();
        }
      }), { once: true });
    }
    if (props.disabled || e.button !== 0 || drag && !drag.pointer) return;
    const li = e.currentTarget.closest("li"), c = row ? e.clientX : e.clientY;
    pointer.current = { id: e.pointerId, key, start: c, at: c, grab: c - lead(li.getBoundingClientRect()), moved: false };
    const flip = rtl();
    const placeAt = (p) => {
      const { items: all, getKey: keyOf } = latest.current;
      const at = all.findIndex((it) => keyOf(it) === p.key);
      if (at < 0) return void 0;
      const rows = list.current ? [...list.current.children] : [];
      const self = rows.find((r) => r.dataset.key === String(p.key));
      const middle = p.at - p.grab + (self ? span(self.getBoundingClientRect()) / 2 : 0);
      let to = 0;
      for (const r of rows) {
        const b = r.getBoundingClientRect(), mid = lead(b) + span(b) / 2;
        if (r !== self && (flip ? mid > middle : mid < middle)) to++;
      }
      const next = { key: p.key, from: at, to, pointer: true };
      setDrag(next);
      return next;
    };
    let frame = 0;
    const scroller = () => {
      for (let n = list.current; n && n !== document.body; n = n.parentElement) {
        const o = row ? getComputedStyle(n).overflowX : getComputedStyle(n).overflowY;
        if ((o === "auto" || o === "scroll") && (row ? n.scrollWidth > n.clientWidth : n.scrollHeight > n.clientHeight)) return n;
      }
      return document.scrollingElement || document.documentElement;
    };
    const tick = () => {
      frame = 0;
      const p = pointer.current;
      if (!p || !p.moved) return;
      const box = scroller(), page = box === document.scrollingElement || box === document.documentElement;
      const b = box.getBoundingClientRect();
      const top = page ? 0 : lead(b), bottom = page ? row ? window.innerWidth : window.innerHeight : lead(b) + span(b);
      const edge = Math.min(48, (bottom - top) / 4);
      const by = p.at < top + edge ? -Math.ceil((top + edge - p.at) / edge * 16) : p.at > bottom - edge ? Math.ceil((p.at - bottom + edge) / edge * 16) : 0;
      if (!by) return;
      const before = row ? box.scrollLeft : box.scrollTop;
      if (row) box.scrollLeft = before + by;
      else box.scrollTop = before + by;
      if ((row ? box.scrollLeft : box.scrollTop) !== before) placeAt(p);
      frame = requestAnimationFrame(tick);
    };
    const moveTo = (ev) => {
      const p = pointer.current;
      if (!p || p.id !== ev.pointerId) return;
      p.at = row ? ev.clientX : ev.clientY;
      if (!p.moved && Math.abs(p.at - p.start) < 4) return;
      p.moved = true;
      dragged.current = true;
      ev.preventDefault();
      placeAt(p);
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const end = (cancel2) => (ev) => {
      const p = pointer.current;
      if (!p || p.id !== ev.pointerId) return;
      off();
      if (p.moved) setTimeout(() => {
        dragged.current = false;
      });
      let d = current.current;
      if (p.moved) {
        p.at = row ? ev.clientX : ev.clientY;
        d = placeAt(p) || d;
      }
      if (p.moved && d && d.pointer) latest.current.finish(d, !cancel2);
    };
    const up = end(false), cancel = end(true);
    const off = () => {
      pointer.current = null;
      stop.current = null;
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      window.removeEventListener("pointermove", moveTo);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
    if (stop.current) stop.current();
    stop.current = off;
    window.addEventListener("pointermove", moveTo);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
  };
  const tops = React.useRef(/* @__PURE__ */ new Map());
  useIsoLayoutEffect(() => {
    const rows = list.current ? [...list.current.children] : [];
    const held = pointer.current && drag && drag.pointer ? String(drag.key) : null;
    const next = /* @__PURE__ */ new Map(), moved = [];
    for (const r of rows) {
      const key = r.dataset.key || "", top = row ? r.offsetLeft : r.offsetTop, was = tops.current.get(key);
      next.set(key, top);
      if (was === void 0 || was === top || key === held) continue;
      const cs = getComputedStyle(r);
      const t = cs.transform === "none" ? null : new DOMMatrix(cs.transform);
      const shift = (t ? row ? t.m41 : t.m42 : 0) + (parseFloat(cs.translate.split(" ")[row ? 0 : 1]) || 0);
      const dy = Math.round(was + shift - top);
      if (dy) moved.push([r, dy]);
    }
    tops.current = next;
    if (!moved.length || !list.current) return;
    for (const [r, dy] of moved) {
      r.dataset.flip = "";
      r.style.translate = row ? dy + "px 0" : "0 " + dy + "px";
    }
    void list.current.offsetWidth;
    for (const [r] of moved) {
      delete r.dataset.flip;
      r.style.translate = "";
    }
  });
  useIsoLayoutEffect(() => {
    const p = pointer.current, rows = list.current ? [...list.current.children] : [];
    for (const r of rows) {
      if (p && drag && drag.pointer && r.dataset.key === String(drag.key)) {
        r.style.transform = "";
        r.style.transform = (row ? "translateX(" : "translateY(") + Math.round(p.at - p.grab - lead(r.getBoundingClientRect())) + "px)";
      } else if (r.style.transform) r.style.transform = "";
    }
  });
  const name = props.reorderLabel || sds.labels.reorder;
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "ul",
    {
      role: "list",
      ...rest,
      ref: (n) => {
        list.current = n;
        if (typeof ref === "function") ref(n);
        else if (ref) ref.current = n;
      },
      className: cn("dk-sortable-list", drag && "dk-sortable-list--sorting", props.disabled && "dk-sortable-list--disabled", props.className),
      "data-component": "sortable-list",
      "data-orientation": row ? "horizontal" : void 0
    },
    shown.map((it, index) => {
      const key = getKey(it), dragging = !!drag && drag.key === key;
      return /* @__PURE__ */ React.createElement("li", { key, "data-key": String(key), className: cn("dk-sortable-list__item", dragging && "dk-sortable-list__item--dragging"), "data-state": dragging ? "dragging" : void 0 }, props.disabled ? null : /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "dk-sortable-list__handle",
          "aria-label": name + " " + label(it),
          "aria-describedby": hintId,
          "aria-pressed": dragging && !drag.pointer,
          ref: (n) => {
            if (n) handles.current.set(key, n);
            else handles.current.delete(key);
          },
          onClick: onClick(key, index),
          onKeyDown,
          onBlur,
          onPointerDown: onPointerDown(key)
        },
        /* @__PURE__ */ React.createElement(Icon, { icon: icons.DragIndicator })
      ), /* @__PURE__ */ React.createElement("div", { className: "dk-sortable-list__content" }, props.renderItem(it, { index, dragging })));
    })
  ), props.disabled ? null : /* @__PURE__ */ React.createElement("span", { hidden: true, id: hintId }, sds.labels.reorderInstructions));
});
function move(items, from, to) {
  const out = items.slice();
  const [it] = out.splice(from, 1);
  out.splice(to, 0, it);
  return out;
}
export {
  SortableList
};
//# sourceMappingURL=SortableList.js.map
