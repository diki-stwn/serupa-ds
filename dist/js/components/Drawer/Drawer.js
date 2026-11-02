"use client";

// src/components/Drawer/Drawer.tsx
import * as React from "react";
import { cn, domId, oneOf, omit, setRef, useIsoLayoutEffect } from "../../internal/cn.js";
import { IconButton } from "../IconButton/IconButton.js";
import { Discard } from "../Dialog/Dialog.js";
import { component } from "../../internal/component.js";
import { useSettings } from "../../internal/provider.js";
import { modalClosed, modalOpened, modalOpening, wasDismissal } from "../../internal/layers.js";
import * as icons from "../../material/builtin.js";
import { useScrolls } from "../../internal/useScrolls.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { isComposing } from "../../internal/ime.js";
import { project, rubber, settleTime, speed, track } from "../../internal/fling.js";
var FLICK = 0.2;
var INWARD = 24;
var OWN = { open: 1, defaultOpen: 1, onOpenChange: 1, side: 1, size: 1, title: 1, description: 1, footer: 1, closeButton: 1, closeLabel: 1, closeOnBackdrop: 1, modal: 1, swipeToClose: 1, initialFocus: 1, finalFocus: 1, unsaved: 1, className: 1, children: 1 };
var Drawer = /* @__PURE__ */ component("Drawer", function Drawer2(props, ref) {
  const nameRef = useNameCheck("Drawer", NAME_HOW.title);
  const sds = useSettings();
  const rest = omit(props, OWN);
  const base = domId("dk-drw", React.useId());
  const el = React.useRef(null);
  const back = React.useRef(null);
  const side = oneOf(["right", "left", "top", "bottom"], props.side, "right");
  const size = oneOf(["sm", "md", "lg"], props.size, "md");
  const showClose = props.closeButton !== false;
  const modal = props.modal !== false;
  const backdrop = modal && props.closeOnBackdrop !== false;
  const ask = React.useRef(props.onOpenChange);
  ask.current = props.onOpenChange;
  const initial = React.useRef(props.initialFocus);
  initial.current = props.initialFocus;
  const final = React.useRef(props.finalFocus);
  final.current = props.finalFocus;
  const isModal = React.useRef(modal);
  isModal.current = modal;
  const [inner, setInner] = React.useState(!!props.defaultOpen);
  const controlled = props.open !== void 0;
  const open = controlled ? !!props.open : inner;
  const close = React.useCallback((reason) => {
    if (!controlled) setInner(false);
    if (ask.current) ask.current(false, { reason });
  }, [controlled]);
  const unsaved = React.useRef(props.unsaved);
  unsaved.current = props.unsaved;
  const [asking, setAsking] = React.useState(null);
  if (!open && asking) setAsking(null);
  const request = (reason) => {
    if (unsaved.current) setAsking(reason);
    else close(reason);
  };
  React.useEffect(() => {
    if (!open || !props.unsaved) return;
    const stay = (e) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", stay);
    return () => window.removeEventListener("beforeunload", stay);
  }, [open, props.unsaved]);
  const has = (n) => n != null && n !== false && n !== "";
  const arrived = React.useRef(open);
  if (!open) arrived.current = false;
  const giveBack = (go, keep) => {
    if (!back.current) return;
    const f = final.current && final.current.current, b = f && f.isConnected ? f : back.current;
    if (!keep) back.current = null;
    if (go && b && b.isConnected && typeof b.focus === "function") b.focus();
  };
  const [reopened, reopen] = React.useState(0);
  useIsoLayoutEffect(() => {
    const d = el.current;
    if (!d) return;
    if (open && !d.open) {
      if (!back.current) back.current = document.activeElement;
      if (!modal) {
        if (typeof d.show === "function") d.show();
        else d.setAttribute("open", "");
      } else {
        modalOpening();
        if (typeof d.showModal === "function") d.showModal();
        else d.setAttribute("open", "");
        modalOpened(d);
      }
      const want = initial.current && initial.current.current;
      const own = want && d.contains(want) ? want : d.querySelector("[data-autofocus], [autofocus]");
      if (own && typeof own.focus === "function") own.focus();
    } else if (open) {
      if (modal) modalOpened(d);
    } else {
      const inside = modal || d.contains(document.activeElement);
      if (d.open) {
        if (typeof d.close === "function") d.close();
        else d.removeAttribute("open");
      }
      modalClosed(d);
      giveBack(inside);
    }
  }, [open, reopened]);
  React.useEffect(() => {
    const d = el.current;
    return () => {
      if (d) modalClosed(d);
      const a = document.activeElement;
      giveBack(isModal.current || !a || a === document.body || !!d && d.contains(a), true);
    };
  }, []);
  const onKeyDown = (e) => {
    if (rest.onKeyDown) rest.onKeyDown(e);
    if (modal || e.defaultPrevented || e.key !== "Escape" || isComposing(e)) return;
    if (e.target instanceof Element && e.target.closest("dialog") !== e.currentTarget) return;
    e.preventDefault();
    request("escape");
  };
  const onCancel = (e) => {
    if (rest.onCancel) rest.onCancel(e);
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    request("escape");
  };
  const openNow = React.useRef(open);
  openNow.current = open;
  const onClose = (e) => {
    if (rest.onClose) rest.onClose(e);
    if (e.target !== e.currentTarget) return;
    if (!e.currentTarget.open) modalClosed(e.currentTarget);
    if (!openNow.current || e.currentTarget.open) return;
    if (unsaved.current) {
      const d = e.currentTarget;
      if (!modal) {
        if (typeof d.show === "function") d.show();
      } else {
        modalOpening();
        if (typeof d.showModal === "function") d.showModal();
        modalOpened(d);
      }
      setAsking("api");
      return;
    }
    close("api");
    reopen((n) => n + 1);
  };
  const downOnBackdrop = React.useRef(false);
  const onPointerDown = (e) => {
    if (rest.onPointerDown) rest.onPointerDown(e);
    downOnBackdrop.current = e.target === e.currentTarget && !wasDismissal(e.nativeEvent);
  };
  const swipe = props.swipeToClose !== false;
  const horiz = side === "left" || side === "right", away = side === "right" || side === "bottom" ? 1 : -1;
  const settling = React.useRef(null);
  const shift = (d) => horiz ? d * away + "px 0" : "0 " + d * away + "px";
  const drag = React.useRef(null);
  const onSwipeDown = (e) => {
    const t = e.target;
    if (!swipe || e.pointerType !== "touch" || !e.isPrimary || t.closest("input, textarea, select, [contenteditable]")) return;
    if (!horiz && t.closest(".dk-drawer__body")) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, d: 0, at: 0, on: false, s: [{ t: e.timeStamp, p: 0 }] };
  };
  const onSwipeMove = (e) => {
    const g = drag.current;
    if (!g || e.pointerId !== g.id) return;
    const d = (horiz ? e.clientX - g.x : e.clientY - g.y) * away, across = Math.abs(horiz ? e.clientY - g.y : e.clientX - g.x);
    if (!g.on) {
      if (across > 10 && across > Math.abs(d)) {
        drag.current = null;
        return;
      }
      if (Math.abs(d) < 10) return;
      g.on = true;
      e.currentTarget.setAttribute("data-dragging", "");
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
      }
      if (settling.current) settling.current();
    }
    g.d = d;
    track(g.s, e.timeStamp, d);
    g.at = d >= 0 ? d : rubber(d, INWARD);
    e.currentTarget.style.translate = shift(g.at);
    e.currentTarget.toggleAttribute("data-inward", g.at < 0);
  };
  const onSwipeEnd = (e) => {
    const g = drag.current;
    if (!g || e.pointerId !== g.id) return;
    drag.current = null;
    const p = e.currentTarget, size2 = horiz ? p.offsetWidth : p.offsetHeight;
    p.removeAttribute("data-dragging");
    if (!g.on) {
      p.style.translate = "";
      delete p.dataset.inward;
      return;
    }
    const v = speed(g.s);
    const out = e.type === "pointerup" && (v > FLICK || g.d + project(v) > size2 / 3 && v > -0.1);
    const left = out ? size2 - g.at : Math.abs(g.at);
    const done = () => {
      delete p.dataset.settling;
      delete p.dataset.inward;
      if (!out) {
        p.style.translate = "";
        return;
      }
      if (unsaved.current) {
        p.style.translate = "";
        request("swipe");
        return;
      }
      close("swipe");
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!drag.current) p.style.translate = "";
      }));
    };
    p.style.setProperty("--dk-drawer-settle", settleTime(left, (out ? v : -v) > 0 ? v : 0) + "ms");
    p.dataset.settling = "";
    if (!left || !parseFloat(getComputedStyle(p).transitionDuration)) {
      done();
      return;
    }
    const end = (ev) => {
      if (ev.target === p && ev.propertyName === "translate") {
        stop();
        done();
      }
    };
    const stop = () => {
      p.removeEventListener("transitionend", end);
      delete p.dataset.settling;
      settling.current = null;
    };
    p.addEventListener("transitionend", end);
    settling.current = stop;
    p.style.translate = out ? shift(size2) : "";
  };
  const onClick = (e) => {
    if (rest.onClick) rest.onClick(e);
    if (backdrop && downOnBackdrop.current && e.target === e.currentTarget && !wasDismissal(e.nativeEvent)) request("outside");
    downOnBackdrop.current = false;
  };
  const [body, setBody] = React.useState(null);
  const scrolls = useScrolls(body);
  const named = rest["aria-labelledby"] || (has(props.title) ? base + "-title" : void 0);
  const region = !scrolls ? {} : named ? { tabIndex: 0, role: "region", "aria-labelledby": named } : rest["aria-label"] ? { tabIndex: 0, role: "region", "aria-label": rest["aria-label"] } : { tabIndex: 0 };
  return /* @__PURE__ */ React.createElement(
    "dialog",
    {
      ...rest,
      ref: (n) => {
        el.current = n;
        nameRef(n);
        setRef(ref, n);
      },
      "aria-modal": modal ? "true" : void 0,
      "aria-labelledby": rest["aria-labelledby"] || (has(props.title) ? base + "-title" : void 0),
      "aria-describedby": rest["aria-describedby"] || (has(props.description) ? base + "-desc" : void 0),
      className: cn("dk-drawer", "dk-drawer--" + side, "dk-drawer--" + size, !modal && "dk-drawer--nonmodal", props.className),
      "data-component": "drawer",
      "data-state": open ? "open" : "closed",
      "data-side": side,
      "data-size": size,
      "data-instant": arrived.current ? "" : void 0,
      onKeyDown,
      onCancel,
      onClose,
      onPointerDown,
      onClick
    },
    /* @__PURE__ */ React.createElement("div", { className: "dk-drawer__panel", onPointerDown: onSwipeDown, onPointerMove: onSwipeMove, onPointerUp: onSwipeEnd, onPointerCancel: onSwipeEnd }, has(props.title) || has(props.description) || showClose ? /* @__PURE__ */ React.createElement("div", { className: "dk-drawer__header" }, /* @__PURE__ */ React.createElement("div", { className: "dk-drawer__heading" }, has(props.title) ? /* @__PURE__ */ React.createElement("h2", { className: "dk-drawer__title", id: base + "-title" }, props.title) : null, has(props.description) ? /* @__PURE__ */ React.createElement("p", { className: "dk-drawer__description", id: base + "-desc" }, props.description) : null), showClose ? /* @__PURE__ */ React.createElement(IconButton, { className: "dk-drawer__close", icon: icons.Close, label: props.closeLabel || sds.labels.close, size: "sm", hideTitle: true, onClick: () => request("close") }) : null) : null, has(props.children) ? /* @__PURE__ */ React.createElement("div", { ...region, ref: setBody, className: "dk-drawer__body" }, props.children) : null, has(props.footer) ? /* @__PURE__ */ React.createElement("div", { className: "dk-drawer__footer" }, props.footer) : null),
    props.unsaved || asking ? /* @__PURE__ */ React.createElement(Discard, { open: !!asking && open, onKeep: () => setAsking(null), onDiscard: () => {
      const why = asking || "close";
      setAsking(null);
      close(why);
    } }) : null
  );
});
export {
  Drawer
};
//# sourceMappingURL=Drawer.js.map
