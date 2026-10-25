"use client";

// src/components/Badge/Badge.tsx
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn.js";
import { config } from "../../internal/config.js";
import { displayNumber } from "../../internal/numbers.js";
import { useLocale, useSerupa } from "../../internal/provider.js";
import { announce, ensureAnnouncer } from "../../internal/announce.js";
import { block, both, chain, pressKey, releaseKey, ripple } from "../../internal/interactions.js";
import { warnOnce } from "../../internal/warn.js";
import { Icon } from "../Icon/Icon.js";
import { asIcon } from "../Icon/asIcon.js";
import { Loader } from "../Loader/Loader.js";
import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden.js";
import { component } from "../../internal/component.js";
import * as icons from "../../material/builtin.js";
var VARIANTS = ["subtle", "solid", "outline"];
var TONES = ["neutral", "primary", "success", "warning", "danger", "info", "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose"];
var PLAIN = { useGrouping: false };
var OWN = { variant: 1, tone: 1, size: 1, dot: 1, ping: 1, leftIcon: 1, count: 1, max: 1, showZero: 1, onRemove: 1, removeLabel: 1, loading: 1, loadingText: 1, className: 1, children: 1 };
var Badge = /* @__PURE__ */ component("Badge", function Badge2(props, ref) {
  const sds = useSerupa();
  const locale = useLocale();
  const rest = omit(props, OWN);
  const variant = oneOf(VARIANTS, props.variant, "subtle");
  const tone = oneOf(TONES, props.tone, "neutral");
  if (props.size != null) warnOnce("badge-size", "Badge: size was removed in 4.0.0; badges have one size (20px, text-xs). Remove the size prop.");
  const loading = !!props.loading;
  const loadingText = props.loadingText == null ? sds.labels.loading : props.loadingText;
  React.useEffect(function() {
    ensureAnnouncer();
  }, []);
  const wasLoading = React.useRef(false);
  React.useEffect(function() {
    if (loading && !wasLoading.current && loadingText) announce(loadingText);
    wasLoading.current = loading;
  }, [loading, loadingText]);
  const isCount = props.count != null;
  let label = props.children;
  if (isCount) {
    const n = Math.max(0, Math.floor(Number(props.count)) || 0);
    const max = Math.max(1, Math.floor(Number(props.max)) || 99);
    if (n === 0 && !props.showZero) return null;
    label = displayNumber(Math.min(n, max), locale, PLAIN) + (n > max ? "+" : "");
    if (n > max) {
      const full = displayNumber(n, locale, PLAIN);
      label = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, label), /* @__PURE__ */ React.createElement(VisuallyHidden, null, full));
      if (rest.title == null) rest.title = full;
    }
  }
  const isLink = rest.href != null, interactive = isLink || typeof rest.onClick === "function";
  let removable = !isCount && typeof props.onRemove === "function";
  if (removable && interactive) {
    warnOnce("badge-remove-interactive", "Badge: onRemove is ignored on a badge with onClick or href (a button can't hold another button).");
    removable = false;
  }
  const hasLabel = !(label == null || label === false || label === "");
  if (!isCount && props.dot && !hasLabel && (props.leftIcon == null || props.leftIcon === false)) {
    if (interactive || typeof props.onRemove === "function") warnOnce("badge-indicator", "Badge: a dot indicator can't be clicked or removed (it's too small to target); name and handle the control it sits on.");
    delete rest.href;
    delete rest.onClick;
    delete rest.type;
    delete rest.disabled;
    delete rest.target;
    delete rest.rel;
    rest["data-component"] = "badge";
    rest["data-variant"] = "indicator";
    rest["data-tone"] = tone;
    if (rest["aria-label"] || rest["aria-labelledby"]) rest.role = rest.role || "img";
    else rest["aria-hidden"] = true;
    return /* @__PURE__ */ React.createElement("span", { ...rest, ref, className: cn("dk-badge", "dk-badge--indicator", "dk-badge--tone-" + tone, props.ping && "dk-badge--ping", props.className) });
  }
  rest["data-component"] = "badge";
  rest["data-variant"] = variant;
  rest["data-tone"] = tone;
  if (interactive) rest["data-interactive"] = "";
  if (loading) {
    rest["aria-busy"] = true;
    rest["data-loading"] = "";
    if (interactive) {
      rest["aria-disabled"] = true;
      rest.onClick = block;
    }
  }
  const icon = !isCount && props.leftIcon != null && props.leftIcon !== false ? /* @__PURE__ */ React.createElement("span", { className: "dk-badge__icon", "aria-hidden": true, key: "icon" }, asIcon(props.leftIcon)) : null;
  const dot = !isCount && !icon && props.dot ? /* @__PURE__ */ React.createElement("span", { className: "dk-badge__icon dk-badge__icon--dot", "aria-hidden": true, key: "dot" }, /* @__PURE__ */ React.createElement("span", { className: "dk-badge__dot" })) : null;
  const named = typeof label === "string" || typeof label === "number" ? " " + label : "";
  const remove = removable ? /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "dk-badge__remove",
      key: "remove",
      onClick: props.onRemove,
      disabled: loading || void 0,
      "aria-label": (props.removeLabel || sds.labels.remove) + named
    },
    /* @__PURE__ */ React.createElement(Icon, { icon: icons.Close })
  ) : null;
  const spin = loading ? /* @__PURE__ */ React.createElement("span", { className: "dk-badge__loader", "aria-hidden": true, key: "loader" }, /* @__PURE__ */ React.createElement(Loader, { label: "", delay: 0 })) : null;
  const classes = cn("dk-badge", "dk-badge--" + variant, "dk-badge--tone-" + tone, isCount && "dk-badge--count", (icon || dot) && "dk-badge--lead", dot && props.ping && "dk-badge--ping", removable && "dk-badge--removable", interactive && "dk-badge--interactive", loading && "dk-badge--loading", props.className);
  const content = [dot, icon, /* @__PURE__ */ React.createElement("span", { className: "dk-badge__label", key: "label" }, label), remove, spin];
  if (interactive) {
    content.unshift(/* @__PURE__ */ React.createElement("span", { className: "dk-badge__ripples", "aria-hidden": true, key: "ripples" }));
    rest.onPointerDown = chain(rest.onPointerDown, ripple);
    rest.onKeyDown = chain(rest.onKeyDown, pressKey);
    rest.onKeyUp = both(rest.onKeyUp, releaseKey);
    rest.onBlur = both(rest.onBlur, releaseKey);
  }
  if (isLink) {
    if (rest.target === "_blank" && rest.rel == null) rest.rel = "noopener noreferrer";
    delete rest.type;
    return React.createElement(config.link, Object.assign(rest, { ref, className: classes }), ...content);
  }
  if (interactive && rest.type === void 0) rest.type = "button";
  return React.createElement(interactive ? "button" : "span", Object.assign(rest, { ref, className: classes }), ...content);
});
export {
  Badge
};
//# sourceMappingURL=Badge.js.map
