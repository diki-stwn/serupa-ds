"use client";

// src/components/Alert/Alert.tsx
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn.js";
import { Icon } from "../Icon/Icon.js";
import { asIcon } from "../Icon/asIcon.js";
import { Button } from "../Button/Button.js";
import { component } from "../../internal/component.js";
import { useSettings } from "../../internal/provider.js";
import * as icons from "../../material/builtin.js";
import { rootOf } from "../../internal/root.js";
var OWN = { tone: 1, title: 1, icon: 1, actions: 1, onDismiss: 1, dismissLabel: 1, className: 1, children: 1 };
var TONES = ["info", "success", "warning", "danger", "neutral"];
var ICONS = { info: icons.Info, success: icons.CheckCircle, warning: icons.Warning, danger: icons.Error, neutral: icons.Info };
var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function dismissAndRefocus(e, onDismiss) {
  const me = e.currentTarget, box = me.closest(".dk-alert"), doc = me.ownerDocument, r = rootOf(me);
  const near = box && r.activeElement === me ? Array.from(r.querySelectorAll(FOCUSABLE)).filter((el) => el.tabIndex >= 0 && !box.contains(el)) : [];
  const next = near.filter((el) => box.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
  const prev = near.filter((el) => !next.includes(el)).reverse();
  onDismiss();
  if (near.length) setTimeout(function() {
    const a = r.activeElement;
    if (me.isConnected || a && a !== doc.body) return;
    next.concat(prev).some((el) => el.isConnected && el.getClientRects().length > 0 && (el.focus(), r.activeElement === el));
  }, 0);
}
var Alert = /* @__PURE__ */ component("Alert", function Alert2(props, ref) {
  const sds = useSettings();
  const rest = omit(props, OWN);
  const tone = oneOf(TONES, props.tone, "info");
  const has = (n) => n != null && n !== false && n !== "";
  if (rest.role == null) rest.role = tone === "warning" || tone === "danger" ? "alert" : "status";
  const icon = props.icon === false ? null : props.icon == null || props.icon === true ? /* @__PURE__ */ React.createElement(Icon, { icon: ICONS[tone] }) : asIcon(props.icon);
  return /* @__PURE__ */ React.createElement("div", { ...rest, ref, className: cn("dk-alert", "dk-alert--" + tone, props.className), "data-component": "alert", "data-tone": tone }, icon ? /* @__PURE__ */ React.createElement("span", { className: "dk-alert__icon", "aria-hidden": "true" }, icon) : null, /* @__PURE__ */ React.createElement("div", { className: "dk-alert__content" }, has(props.title) ? /* @__PURE__ */ React.createElement("p", { className: "dk-alert__title" }, props.title) : null, has(props.children) ? /* @__PURE__ */ React.createElement("div", { className: "dk-alert__message" }, props.children) : null, has(props.actions) ? /* @__PURE__ */ React.createElement("div", { className: "dk-alert__actions" }, props.actions) : null), props.onDismiss ? /* @__PURE__ */ React.createElement(Button, { className: "dk-alert__dismiss", variant: "ghost", size: "sm", icon: icons.Close, "aria-label": props.dismissLabel || sds.labels.dismiss, onClick: (e) => dismissAndRefocus(e, props.onDismiss) }) : null);
});
export {
  Alert
};
//# sourceMappingURL=Alert.js.map
