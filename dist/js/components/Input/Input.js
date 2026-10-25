"use client";

// src/components/Input/Input.tsx
import * as React from "react";
import { cn, domId, isInvalid, omit, oneOf, setRef, SIZES } from "../../internal/cn.js";
import "../Icon/Icon.js";
import { asIcon } from "../Icon/asIcon.js";
import { component } from "../../internal/component.js";
import { useFieldControl } from "../../internal/field.js";
import { displayNumber } from "../../internal/numbers.js";
import { useLocale } from "../../internal/provider.js";
import { useTextLimit } from "../../internal/textLimit.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
var PLAIN = { useGrouping: false };
var VERBATIM = /^(email|url)$/;
var VERBATIM_AUTOCOMPLETE = /\b(username|email|url|one-time-code)\b/;
var Input = /* @__PURE__ */ component("Input", function Input2(props, ref) {
  const nameRef = useNameCheck("Input", NAME_HOW.field);
  props = useFieldControl(props);
  const rest = omit(props, { size: 1, invalid: 1, leftIcon: 1, rightIcon: 1, showCount: 1, className: 1, style: 1 });
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  if (rest.type === void 0) rest.type = "text";
  if (VERBATIM.test(rest.type) || VERBATIM_AUTOCOMPLETE.test(rest.autoComplete || "")) {
    if (rest.autoCapitalize === void 0) rest.autoCapitalize = "off";
    if (rest.autoCorrect === void 0) rest.autoCorrect = "off";
    if (rest.spellCheck === void 0) rest.spellCheck = false;
  }
  const own = React.useRef(null);
  const { length, max } = useTextLimit(rest, own, { announce: !!props.showCount });
  const countId = domId("dk-in", React.useId());
  const locale = useLocale();
  const num = (n) => displayNumber(n, locale, PLAIN);
  const setRefs = React.useCallback(function(node) {
    own.current = node;
    nameRef(node);
    setRef(ref, node);
  }, [ref, nameRef]);
  if (props.showCount) rest["aria-describedby"] = cn(rest["aria-describedby"], countId);
  const icon = function(source, side) {
    const node = asIcon(source);
    return node == null || node === false ? null : /* @__PURE__ */ React.createElement("span", { className: "dk-input__icon dk-input__icon--" + side, "aria-hidden": true, key: side }, node);
  };
  return /* @__PURE__ */ React.createElement("span", { className: cn("dk-input", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.className), style: props.style, "data-component": "input", "data-size": size }, icon(props.leftIcon, "left"), /* @__PURE__ */ React.createElement("input", { ...rest, ref: setRefs, className: "dk-input__field", key: "field" }), props.showCount ? /* @__PURE__ */ React.createElement("span", { className: cn("dk-input__count", max != null && length >= max && "dk-input__count--full"), id: countId, key: "count" }, max != null ? num(length) + " / " + num(max) : num(length)) : null, icon(props.rightIcon, "right"));
});
export {
  Input
};
//# sourceMappingURL=Input.js.map
