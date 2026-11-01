"use client";

// src/components/Switch/Switch.tsx
import * as React from "react";
import { cn, domId, isInvalid, oneOf, omit, SIZES } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useFieldControl } from "../../internal/field.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { warnOnce } from "../../internal/warn.js";
var OWN = { size: 1, invalid: 1, pending: 1, onCheckedChange: 1, description: 1, labelPosition: 1, children: 1, className: 1, style: 1, type: 1, role: 1 };
var NATIVE_SWITCH = { switch: "" };
var Switch = /* @__PURE__ */ component("Switch", function Switch2(props, ref) {
  const nameRef = useNameCheck("Switch", NAME_HOW.label, ref);
  if (process.env.NODE_ENV !== "production" && props.label != null) warnOnce("label-prop", "Switch: label isn't one of its props, so it lands on the <input> as an attribute and names nothing. Put the text in children.", "label-prop:Switch");
  props = useFieldControl(props);
  const rest = omit(props, OWN);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  const checkedChange = props.onCheckedChange;
  if (checkedChange) {
    const before = rest.onChange;
    rest.onChange = function(e) {
      if (before) before(e);
      checkedChange(e.currentTarget.checked, e);
    };
  }
  const readOnly = !!rest.readOnly, pending = !!props.pending;
  if (pending) rest["aria-busy"] = true;
  if (readOnly || pending) {
    if (readOnly) rest["aria-readonly"] = true;
    rest.onChange = () => {
    };
    const onClick = rest.onClick;
    rest.onClick = (e) => {
      if (onClick) onClick(e);
      e.preventDefault();
    };
  }
  const base = domId("dk-sw", React.useId()), labelId = base + "-label", descId = base + "-desc";
  const hasLabel = props.children != null && props.children !== false && props.children !== "";
  const hasDesc = props.description != null && props.description !== false && props.description !== "";
  if (hasDesc) rest["aria-describedby"] = cn(rest["aria-describedby"], descId);
  if (hasDesc && hasLabel && rest["aria-label"] == null && rest["aria-labelledby"] == null) rest["aria-labelledby"] = labelId;
  return /* @__PURE__ */ React.createElement("label", { className: cn("dk-switch", "dk-switch--size-" + size, props.labelPosition === "start" && "dk-switch--label-start", invalid && "dk-switch--invalid", rest.disabled && "dk-switch--disabled", readOnly && "dk-switch--readonly", pending && "dk-switch--pending", !hasLabel && !hasDesc && "dk-switch--bare", props.className), style: props.style, "data-component": "switch", "data-size": size, "data-pending": pending ? "" : void 0 }, /* @__PURE__ */ React.createElement("span", { className: "dk-switch__control", key: "control" }, /* @__PURE__ */ React.createElement("input", { ...rest, ...NATIVE_SWITCH, ref: nameRef, type: "checkbox", role: "switch", className: "dk-switch__input", key: "input" }), /* @__PURE__ */ React.createElement("span", { className: "dk-switch__thumb", "aria-hidden": true, key: "thumb" }, pending ? /* @__PURE__ */ React.createElement("span", { className: "dk-switch__spinner", key: "spin" }) : null)), hasLabel || hasDesc ? /* @__PURE__ */ React.createElement("span", { className: "dk-switch__text", key: "text" }, hasLabel ? /* @__PURE__ */ React.createElement("span", { className: "dk-switch__label", id: labelId, key: "label" }, props.children) : null, hasDesc ? /* @__PURE__ */ React.createElement("span", { className: "dk-switch__description", id: descId, key: "desc" }, props.description) : null) : null);
});
export {
  Switch
};
//# sourceMappingURL=Switch.js.map
