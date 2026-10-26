"use client";

// src/components/Drawer/Drawer.tsx
import * as React from "react";
import { cn, domId, oneOf, omit, setRef, useIsoLayoutEffect } from "../../internal/cn.js";
import { IconButton } from "../IconButton/IconButton.js";
import { component } from "../../internal/component.js";
import { useSerupa } from "../../internal/provider.js";
import { modalClosed, modalOpened, modalOpening, wasDismissal } from "../../internal/layers.js";
import * as icons from "../../material/builtin.js";
import { useScrolls } from "../../internal/useScrolls.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { isComposing } from "../../internal/ime.js";
var OWN = { open: 1, defaultOpen: 1, onOpenChange: 1, side: 1, size: 1, title: 1, description: 1, footer: 1, closeButton: 1, closeLabel: 1, closeOnBackdrop: 1, modal: 1, swipeToClose: 1, className: 1, children: 1 };
var Drawer = /* @__PURE__ */ component("Drawer", function Drawer2(props, ref) {
  const nameRef = useNameCheck("Drawer", NAME_HOW.title);
  const sds = useSerupa();
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
  const [inner, setInner] = React.useState(!!props.defaultOpen);
  const controlled = props.open !== void 0;
  const open = controlled ? !!props.open : inner;
  const close = React.useCallback((reason) => {
    if (!controlled) setInner(false);
    if (ask.current) ask.current(false, { reason });
  }, [controlled]);
  const has = (n) => n != null && n !== false && n !== "";
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
      const own = d.querySelector("[data-autofocus], [autofocus]");
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
      const b = back.current;
      back.current = null;
      if (inside && b && b.isConnected && typeof b.focus === "function") b.focus();
    }
  }, [open, reopened]);
  React.useEffect(() => {
    const d = el.current;
    return () => {
      if (d) modalClosed(d);
      const b = back.current;
      if (b && b.isConnected) b.focus();
    };
  }, []);
  const onKeyDown = (e) => {
    if (rest.onKeyDown) rest.onKeyDown(e);
    if (modal || e.defaultPrevented || e.key !== "Escape" || isComposing(e)) return;
    if (e.target instanceof Element && e.target.closest("dialog") !== e.currentTarget) return;
    e.preventDefault();
    close("escape");
  };
  const onCancel = (e) => {
    if (rest.onCancel) rest.onCancel(e);
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    close("escape");
  };
  const openNow = React.useRef(open);
  openNow.current = open;
  const onClose = (e) => {
    if (rest.onClose) rest.onClose(e);
    if (e.target !== e.currentTarget) return;
    if (!e.currentTarget.open) modalClosed(e.currentTarget);
    if (!openNow.current || e.currentTarget.open) return;
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
  const drag = React.useRef(null);
  const onSwipeDown = (e) => {
    const t = e.target;
    if (!swipe || e.pointerType !== "touch" || !e.isPrimary || t.closest("input, textarea, select, [contenteditable]")) return;
    if (!horiz && t.closest(".dk-drawer__body")) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, d: 0, on: false };
  };
  const onSwipeMove = (e) => {
    const g = drag.current;
    if (!g || e.pointerId !== g.id) return;
    const d = Math.max(0, (horiz ? e.clientX - g.x : e.clientY - g.y) * away), across = Math.abs(horiz ? e.clientY - g.y : e.clientX - g.x);
    if (!g.on) {
      if (across > 10 && across > d) {
        drag.current = null;
        return;
      }
      if (d < 10) return;
      g.on = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
      }
    }
    g.d = d;
    e.currentTarget.style.translate = horiz ? d * away + "px 0" : "0 " + d * away + "px";
  };
  const onSwipeEnd = (e) => {
    const g = drag.current;
    if (!g || e.pointerId !== g.id) return;
    drag.current = null;
    e.currentTarget.style.translate = "";
    const size2 = horiz ? e.currentTarget.offsetWidth : e.currentTarget.offsetHeight;
    const fast = g.d > 30 && g.d / Math.max(1, e.timeStamp - g.t) > 0.5;
    if (g.on && e.type === "pointerup" && (g.d > size2 / 3 || fast)) close("swipe");
  };
  const onClick = (e) => {
    if (rest.onClick) rest.onClick(e);
    if (backdrop && downOnBackdrop.current && e.target === e.currentTarget && !wasDismissal(e.nativeEvent)) close("outside");
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
      "data-side": side,
      "data-size": size,
      onKeyDown,
      onCancel,
      onClose,
      onPointerDown,
      onClick
    },
    /* @__PURE__ */ React.createElement("div", { className: "dk-drawer__panel", onPointerDown: onSwipeDown, onPointerMove: onSwipeMove, onPointerUp: onSwipeEnd, onPointerCancel: onSwipeEnd }, has(props.title) || has(props.description) || showClose ? /* @__PURE__ */ React.createElement("div", { className: "dk-drawer__header" }, /* @__PURE__ */ React.createElement("div", { className: "dk-drawer__heading" }, has(props.title) ? /* @__PURE__ */ React.createElement("h2", { className: "dk-drawer__title", id: base + "-title" }, props.title) : null, has(props.description) ? /* @__PURE__ */ React.createElement("p", { className: "dk-drawer__description", id: base + "-desc" }, props.description) : null), showClose ? /* @__PURE__ */ React.createElement(IconButton, { className: "dk-drawer__close", icon: icons.Close, label: props.closeLabel || sds.labels.close, size: "sm", noTitle: true, onClick: () => close("close") }) : null) : null, has(props.children) ? /* @__PURE__ */ React.createElement("div", { ...region, ref: setBody, className: "dk-drawer__body" }, props.children) : null, has(props.footer) ? /* @__PURE__ */ React.createElement("div", { className: "dk-drawer__footer" }, props.footer) : null)
  );
});
export {
  Drawer
};
//# sourceMappingURL=Drawer.js.map
