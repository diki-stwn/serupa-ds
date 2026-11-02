"use client";

// src/components/Button/Button.tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import { cn, domId, omit, oneOf, setRef, SIZES, useIsoLayoutEffect } from "../../internal/cn.js";
import { config } from "../../internal/config.js";
import { useShowAfter } from "../../internal/showAfter.js";
import { useSettings } from "../../internal/provider.js";
import { announce, ensureAnnouncer } from "../../internal/announce.js";
import { block, both, chain, pressKey, releaseKey } from "../../internal/interactions.js";
import { warnOnce } from "../../internal/warn.js";
import { asIcon } from "../Icon/asIcon.js";
import { Loader } from "../Loader/Loader.js";
import { component } from "../../internal/component.js";
import { BUTTON_VARIANTS, buttonClass } from "./buttonClass.js";
import { feedbackHold, spinnerDelay } from "../../internal/timing.js";
var noFormStatus = () => ({ pending: false });
var useFormStatus2 = ReactDOM.useFormStatus ?? noFormStatus;
var OWN = { variant: 1, size: 1, destructive: 1, className: 1, children: 1, leftIcon: 1, rightIcon: 1, icon: 1, loading: 1, loadingText: 1, disabledReason: 1, successText: 1, wrap: 1 };
var isThenable = (v) => v != null && typeof v.then === "function";
function slot(source, side) {
  const node = asIcon(source);
  return node == null || node === false ? null : /* @__PURE__ */ React.createElement("span", { className: "dk-btn__icon dk-btn__icon--" + side, "aria-hidden": true, key: side }, node);
}
var ButtonBase = /* @__PURE__ */ component("Button", function Button(props, ref) {
  const sds = useSettings();
  const rest = omit(props, OWN);
  const isLink = rest.href != null;
  const iconOnly = props.icon != null;
  const pos = props.leftIcon != null && props.rightIcon == null ? "left" : props.rightIcon != null && props.leftIcon == null ? "right" : void 0;
  const variant = oneOf(BUTTON_VARIANTS, props.variant, "primary");
  const size = oneOf(SIZES, props.size, "md");
  let classes = buttonClass({ variant, size, destructive: props.destructive, iconOnly, iconPosition: pos, wrap: props.wrap, className: props.className });
  if (process.env.NODE_ENV !== "production" && iconOnly && !rest["aria-label"] && !rest["aria-labelledby"] && !rest.title) {
    warnOnce("button-icon-label", "Button: an icon-only button needs an aria-label.");
  }
  const [working, setWorking] = React.useState(false);
  const busy = useShowAfter(working, spinnerDelay);
  const [success, setSuccess] = React.useState(false);
  const pending = React.useRef(false);
  const won = React.useRef("");
  const alive = React.useRef(true);
  React.useEffect(function() {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  React.useEffect(function() {
    if (!success) return;
    const t = setTimeout(() => setSuccess(false), feedbackHold);
    return () => clearTimeout(t);
  }, [success]);
  React.useEffect(function() {
    if (working || busy || !won.current) return;
    const text2 = won.current;
    won.current = "";
    setSuccess(true);
    announce(text2);
  }, [working, busy]);
  const successText = props.successText;
  const own = rest.onClick;
  if (own) rest.onClick = function(e) {
    if (pending.current) {
      block(e);
      return;
    }
    const r = own(e);
    if (!isThenable(r)) return;
    pending.current = true;
    won.current = "";
    setSuccess(false);
    setWorking(true);
    const settle = function(ok) {
      pending.current = false;
      if (!alive.current) return;
      if (ok && successText) won.current = successText;
      setWorking(false);
    };
    r.then(function() {
      settle(true);
    }, function(err) {
      settle(false);
      throw err;
    });
  };
  const form = useFormStatus2();
  const loading = (props.loading != null ? !!props.loading : !isLink && rest.type === "submit" && form.pending) || busy;
  const disabled = !!rest.disabled;
  const reasonId = domId("dk-btn-why", React.useId());
  const reason = disabled && props.disabledReason ? props.disabledReason : "";
  const loadingText = props.loadingText == null ? sds.labels.loading : props.loadingText;
  React.useEffect(function() {
    ensureAnnouncer();
  }, []);
  const wasLoading = React.useRef(false);
  const latestText = React.useRef(loadingText);
  React.useEffect(function() {
    latestText.current = loadingText;
  });
  React.useEffect(function() {
    if (loading && !wasLoading.current && latestText.current) announce(latestText.current);
    wasLoading.current = loading;
  }, [loading]);
  const spin = /* @__PURE__ */ React.createElement(Loader, { className: "dk-btn__spinner", label: "", delay: 0 });
  let content = iconOnly ? [slot(props.icon, "only")] : [
    slot(props.leftIcon, "left"),
    props.children == null || props.children === false ? null : /* @__PURE__ */ React.createElement("span", { className: "dk-btn__label", key: "label" }, props.children),
    slot(props.rightIcon, "right")
  ];
  if (loading) content = content.concat([/* @__PURE__ */ React.createElement("span", { className: "dk-btn__loader", "aria-hidden": true, key: "loader" }, spin)]);
  else if (success) content = content.concat([/* @__PURE__ */ React.createElement("span", { className: "dk-btn__loader dk-btn__success", "aria-hidden": true, key: "success" }, /* @__PURE__ */ React.createElement("span", { className: "dk-btn__check" }))]);
  if (reason && !rest["aria-describedby"]) {
    content.push(/* @__PURE__ */ React.createElement("span", { hidden: true, id: reasonId, key: "reason" }, reason));
    rest["aria-describedby"] = reasonId;
  }
  const text = typeof props.children === "string" || typeof props.children === "number" ? String(props.children) : "";
  const tipOk = !!text && !iconOnly && !props.wrap && rest.title == null && !rest["aria-label"] && !rest["aria-labelledby"] && !rest["aria-describedby"];
  const node = React.useRef(null);
  const [cut, setCut] = React.useState(false);
  useIsoLayoutEffect(function() {
    const label = node.current && node.current.querySelector(".dk-btn__label");
    if (!tipOk || !label) {
      setCut(false);
      return;
    }
    const check = () => setCut(label.scrollWidth > label.clientWidth);
    check();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(check);
    ro.observe(label);
    return () => ro.disconnect();
  }, [tipOk, text]);
  if (cut && tipOk) rest.title = text;
  const setNode = React.useCallback(function(n) {
    node.current = n;
    setRef(ref, n);
  }, [ref]);
  rest.onKeyDown = chain(rest.onKeyDown, pressKey);
  rest.onKeyUp = both(rest.onKeyUp, releaseKey);
  rest.onBlur = both(rest.onBlur, releaseKey);
  rest["data-component"] = "button";
  rest["data-variant"] = variant;
  rest["data-size"] = size;
  if (props.destructive) rest["data-destructive"] = "";
  if (iconOnly) rest["data-icon-only"] = "";
  if (disabled) rest["data-disabled"] = "";
  if (success && !loading) {
    classes = cn(classes, "dk-btn--loading-cover", "dk-btn--success");
    rest["data-success"] = "";
  }
  if (reason) {
    delete rest.disabled;
    rest["aria-disabled"] = true;
    rest.onClick = block;
  }
  if (loading) {
    classes = cn(classes, "dk-btn--loading", "dk-btn--loading-cover");
    rest["aria-busy"] = true;
    rest["aria-disabled"] = true;
    rest["data-loading"] = "";
    rest.onClick = block;
  }
  if (isLink) {
    if (rest.target === "_blank" && rest.rel == null) rest.rel = "noopener noreferrer";
    if (disabled) {
      if (reason) rest.tabIndex = rest.tabIndex ?? 0;
      delete rest.href;
      delete rest.disabled;
      rest.role = "link";
      rest["aria-disabled"] = true;
      rest.onClick = block;
    }
    delete rest.type;
    return React.createElement(disabled ? "a" : config.link, Object.assign({}, rest, { ref: setNode, className: classes }), ...content);
  }
  if (rest.type === void 0) rest.type = "button";
  return React.createElement("button", Object.assign({}, rest, { ref: setNode, className: classes }), ...content);
});
var Button2 = ButtonBase;
export {
  Button2 as Button,
  ButtonBase,
  buttonClass
};
//# sourceMappingURL=Button.js.map
