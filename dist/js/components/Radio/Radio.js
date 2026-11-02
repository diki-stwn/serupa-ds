"use client";

// src/components/Radio/Radio.tsx
import * as React from "react";
import { cn, domId, isInvalid, omit, oneOf, setRef, SIZES } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useFormReset } from "../../internal/useFormReset.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { warnOnce } from "../../internal/warn.js";
import { delegateFocus, useAutoFocus } from "../../internal/focus.js";
var RadioContext = /* @__PURE__ */ React.createContext(null);
var GROUP_OWN = { name: 1, value: 1, defaultValue: 1, onValueChange: 1, orientation: 1, size: 1, invalid: 1, disabled: 1, required: 1, children: 1, className: 1, autoFocus: 1 };
var RadioGroup = /* @__PURE__ */ component("RadioGroup", function RadioGroup2(props, ref) {
  const nameRef = useNameCheck("RadioGroup", NAME_HOW.group);
  const rest = omit(props, GROUP_OWN);
  const autoName = domId("dk-rg", React.useId());
  const controlled = props.value !== void 0;
  const [picked, setPicked] = React.useState(props.defaultValue), cur = controlled ? props.value : picked;
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  const orientation = props.orientation === "horizontal" ? "horizontal" : "vertical";
  const onValueChange = props.onValueChange;
  const root = React.useRef(null);
  const [, rerender] = React.useState(0);
  useFormReset(root, function() {
    if (!controlled) setPicked(props.defaultValue);
    rerender(function(n) {
      return n + 1;
    });
  });
  const ctx = {
    name: props.name || autoName,
    value: cur,
    size: props.size,
    invalid,
    disabled: !!props.disabled,
    required: !!props.required,
    select: function(v, e) {
      if (!controlled) setPicked(v);
      if (onValueChange) onValueChange(v, e);
    }
  };
  const own = rest.onKeyDown;
  rest.onKeyDown = function(e) {
    if (own) own(e);
    const t = e.target, k = e.key;
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || t.type !== "radio" || k.indexOf("Arrow") !== 0) return;
    const all = Array.prototype.filter.call(root.current.querySelectorAll("input[type=radio]"), function(r) {
      return r.name === t.name && !r.disabled && r.getClientRects().length > 0;
    });
    const fwd = k === "ArrowDown" || k === (getComputedStyle(t).direction === "rtl" ? "ArrowLeft" : "ArrowRight"), i = all.indexOf(t);
    const to = fwd ? i === all.length - 1 ? all[0] : null : i === 0 ? all[all.length - 1] : null;
    if (!to || to === t) return;
    e.preventDefault();
    to.focus();
    to.click();
  };
  useAutoFocus(props.autoFocus, () => root.current);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ...rest,
      ref: function(n) {
        root.current = n;
        delegateFocus(n, () => n && (n.querySelector("input:checked:enabled") || n.querySelector("input:enabled")));
        nameRef(n);
        setRef(ref, n);
      },
      role: "radiogroup",
      "aria-invalid": invalid || void 0,
      "aria-required": props.required || rest["aria-required"] || void 0,
      "aria-disabled": props.disabled || void 0,
      className: cn("dk-radio-group", "dk-radio-group--" + orientation, invalid && "dk-radio-group--invalid", props.className),
      "data-component": "radio-group",
      "data-orientation": orientation
    },
    /* @__PURE__ */ React.createElement(RadioContext.Provider, { value: ctx }, props.children)
  );
});
var OWN = { size: 1, invalid: 1, description: 1, children: 1, className: 1, style: 1, type: 1 };
var Radio = /* @__PURE__ */ component("Radio", function Radio2(props, ref) {
  const nameRef = useNameCheck("Radio", NAME_HOW.label, ref);
  if (process.env.NODE_ENV !== "production" && props.label != null) warnOnce("label-prop", "Radio: label isn't one of its props, so it lands on the <input> as an attribute and names nothing. Put the text in children.", "label-prop:Radio");
  const ctx = React.useContext(RadioContext);
  const rest = omit(props, OWN);
  const size = oneOf(SIZES, props.size, oneOf(SIZES, ctx && ctx.size, "md"));
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  if (ctx) {
    const own = rest.onChange;
    rest.name = ctx.name;
    rest.checked = ctx.value != null && String(ctx.value) === String(props.value);
    delete rest.defaultChecked;
    rest.onChange = function(e) {
      if (own) own(e);
      ctx.select(props.value, e);
    };
    if (ctx.disabled) rest.disabled = true;
    if (ctx.required) rest.required = true;
  }
  const base = domId("dk-rd", React.useId()), labelId = base + "-label", descId = base + "-desc";
  const hasLabel = props.children != null && props.children !== false && props.children !== "";
  const hasDesc = props.description != null && props.description !== false && props.description !== "";
  if (hasDesc) rest["aria-describedby"] = cn(rest["aria-describedby"], descId);
  if (hasDesc && hasLabel && rest["aria-label"] == null && rest["aria-labelledby"] == null) rest["aria-labelledby"] = labelId;
  return /* @__PURE__ */ React.createElement("label", { className: cn("dk-radio", "dk-radio--size-" + size, (invalid || ctx && ctx.invalid) && "dk-radio--invalid", rest.disabled && "dk-radio--disabled", !hasLabel && !hasDesc && "dk-radio--bare", props.className), style: props.style, "data-component": "radio", "data-size": size }, /* @__PURE__ */ React.createElement("span", { className: "dk-radio__control", key: "control" }, /* @__PURE__ */ React.createElement("input", { ...rest, ref: nameRef, type: "radio", className: "dk-radio__input", key: "input" }), /* @__PURE__ */ React.createElement("span", { className: "dk-radio__dot", "aria-hidden": true, key: "dot" })), hasLabel || hasDesc ? /* @__PURE__ */ React.createElement("span", { className: "dk-radio__text", key: "text" }, hasLabel ? /* @__PURE__ */ React.createElement("span", { className: "dk-radio__label", id: labelId, key: "label" }, props.children) : null, hasDesc ? /* @__PURE__ */ React.createElement("span", { className: "dk-radio__description", id: descId, key: "desc" }, props.description) : null) : null);
});
export {
  Radio,
  RadioGroup
};
//# sourceMappingURL=Radio.js.map
