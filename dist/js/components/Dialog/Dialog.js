"use client";

// src/components/Dialog/Dialog.tsx
import * as React from "react";
import { cn, domId, oneOf, omit, setRef, useIsoLayoutEffect } from "../../internal/cn.js";
import { IconButton } from "../IconButton/IconButton.js";
import { Button } from "../Button/Button.js";
import { en as words } from "./labels.js";
import { component } from "../../internal/component.js";
import { useSettings } from "../../internal/provider.js";
import { modalClosed, modalOpened, modalOpening, wasDismissal } from "../../internal/layers.js";
import * as icons from "../../material/builtin.js";
import { useScrolls } from "../../internal/useScrolls.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
var OWN = { open: 1, defaultOpen: 1, onOpenChange: 1, title: 1, description: 1, footer: 1, size: 1, alert: 1, closeButton: 1, closeLabel: 1, closeOnBackdrop: 1, fullScreen: 1, initialFocus: 1, finalFocus: 1, unsaved: 1, className: 1, children: 1 };
var Dialog = /* @__PURE__ */ component("Dialog", function Dialog2(props, ref) {
  const nameRef = useNameCheck("Dialog", NAME_HOW.title);
  const sds = useSettings();
  const rest = omit(props, OWN);
  const base = domId("dk-dlg", React.useId());
  const el = React.useRef(null);
  const back = React.useRef(null);
  const size = oneOf(["sm", "md", "lg"], props.size, "md");
  const alert = !!props.alert;
  const showClose = props.closeButton != null ? props.closeButton : !alert;
  const backdrop = props.closeOnBackdrop != null ? props.closeOnBackdrop : !alert;
  const ask = React.useRef(props.onOpenChange);
  ask.current = props.onOpenChange;
  const initial = React.useRef(props.initialFocus);
  initial.current = props.initialFocus;
  const final = React.useRef(props.finalFocus);
  final.current = props.finalFocus;
  const giveBack = (keep) => {
    if (!back.current) return;
    const f = final.current && final.current.current, b = f && f.isConnected ? f : back.current;
    if (!keep) back.current = null;
    if (b && b.isConnected && typeof b.focus === "function") b.focus();
  };
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
  const [reopened, reopen] = React.useState(0);
  useIsoLayoutEffect(() => {
    const d = el.current;
    if (!d) return;
    if (open && !d.open) {
      if (!back.current) back.current = document.activeElement;
      modalOpening();
      if (typeof d.showModal === "function") d.showModal();
      else d.setAttribute("open", "");
      modalOpened(d);
      const want = initial.current && initial.current.current;
      const own = want && d.contains(want) ? want : d.querySelector("[data-autofocus], [autofocus]");
      if (own && typeof own.focus === "function") own.focus();
    } else if (open) {
      modalOpened(d);
    } else {
      if (d.open) {
        if (typeof d.close === "function") d.close();
        else d.removeAttribute("open");
      }
      modalClosed(d);
      giveBack();
    }
  }, [open, reopened]);
  React.useEffect(() => {
    const d = el.current;
    return () => {
      if (d) modalClosed(d);
      giveBack(true);
    };
  }, []);
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
      modalOpening();
      if (typeof d.showModal === "function") d.showModal();
      modalOpened(d);
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
      role: alert ? "alertdialog" : void 0,
      "aria-modal": "true",
      "aria-labelledby": rest["aria-labelledby"] || (has(props.title) ? base + "-title" : void 0),
      "aria-describedby": rest["aria-describedby"] || (has(props.description) ? base + "-desc" : void 0),
      className: cn("dk-dialog", "dk-dialog--" + size, props.fullScreen === true && "dk-dialog--full", props.fullScreen === "mobile" && "dk-dialog--full-mobile", props.className),
      "data-component": "dialog",
      "data-size": size,
      "data-state": open ? "open" : "closed",
      "data-instant": arrived.current ? "" : void 0,
      onCancel,
      onClose,
      onPointerDown,
      onClick
    },
    /* @__PURE__ */ React.createElement("div", { className: "dk-dialog__panel" }, has(props.title) || has(props.description) || showClose ? /* @__PURE__ */ React.createElement("div", { className: "dk-dialog__header" }, /* @__PURE__ */ React.createElement("div", { className: "dk-dialog__heading" }, has(props.title) ? /* @__PURE__ */ React.createElement("h2", { className: "dk-dialog__title", id: base + "-title" }, props.title) : null, has(props.description) ? /* @__PURE__ */ React.createElement("p", { className: "dk-dialog__description", id: base + "-desc" }, props.description) : null), showClose ? /* @__PURE__ */ React.createElement(IconButton, { className: "dk-dialog__close", icon: icons.Close, label: props.closeLabel || sds.labels.close, size: "sm", hideTitle: true, onClick: () => request("close") }) : null) : null, has(props.children) ? /* @__PURE__ */ React.createElement("div", { ...region, ref: setBody, className: "dk-dialog__body" }, props.children) : null, has(props.footer) ? /* @__PURE__ */ React.createElement("div", { className: "dk-dialog__footer" }, props.footer) : null),
    props.unsaved || asking ? /* @__PURE__ */ React.createElement(Discard, { open: !!asking && open, onKeep: () => setAsking(null), onDiscard: () => {
      const why = asking || "close";
      setAsking(null);
      close(why);
    } }) : null
  );
});
function Discard(props) {
  const sds = useSettings(words);
  const keep = React.useRef(null);
  return /* @__PURE__ */ React.createElement(
    Dialog,
    {
      alert: true,
      size: "sm",
      open: props.open,
      onOpenChange: props.onKeep,
      title: sds.labels.discardTitle,
      description: sds.labels.discardDescription,
      initialFocus: keep,
      footer: [
        /* @__PURE__ */ React.createElement(Button, { key: "keep", ref: keep, variant: "secondary", onClick: props.onKeep }, sds.labels.keepEditing),
        /* @__PURE__ */ React.createElement(Button, { key: "discard", destructive: true, onClick: props.onDiscard }, sds.labels.discard)
      ]
    }
  );
}
export {
  Dialog,
  Discard
};
//# sourceMappingURL=Dialog.js.map
