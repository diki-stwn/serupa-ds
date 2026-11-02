"use client";

// src/components/Input/Input.tsx
import * as React from "react";
import { useValidityMessages } from "../../internal/validity.js";
import { cn, domId, isInvalid, omit, oneOf, setRef, SIZES } from "../../internal/cn.js";
import { asIcon } from "../Icon/asIcon.js";
import { component } from "../../internal/component.js";
import { activeIn } from "../../internal/root.js";
import { useFieldControl } from "../../internal/field.js";
import { displayNumber } from "../../internal/numbers.js";
import { useLocale } from "../../internal/provider.js";
import { useTextLimit } from "../../internal/textLimit.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { pressFocuses, useAffixes } from "../../internal/affix.js";
import { applyMask, digitsOnly, isPlain, parseMask, unmask } from "../../internal/mask.js";
import { isComposing } from "../../internal/ime.js";
var PLAIN = { useGrouping: false };
var VERBATIM = /^(email|url)$/;
var VERBATIM_AUTOCOMPLETE = /\b(username|email|url|one-time-code)\b/;
function useMask(input, mask) {
  const slots = React.useMemo(() => mask ? parseMask(mask) : null, [mask]);
  if (!slots) return input;
  const rest = { ...input };
  const show = (v) => applyMask(slots, unmask(slots, String(v))).text;
  if (rest.value != null && !Array.isArray(rest.value)) rest.value = show(rest.value);
  if (rest.defaultValue != null && !Array.isArray(rest.defaultValue)) rest.defaultValue = show(rest.defaultValue);
  if (rest.inputMode === void 0 && digitsOnly(slots)) rest.inputMode = "numeric";
  const change = rest.onChange, key = rest.onKeyDown;
  rest.onChange = function(e) {
    const el = e.target, v = el.value, at = el.selectionStart != null ? el.selectionStart : v.length;
    const typed = unmask(slots, v), { text, ends } = applyMask(slots, typed);
    if (text !== v) {
      const n = Math.min(unmask(slots, v.slice(0, at)).length, ends.length);
      el.value = text;
      if (activeIn(el) === el) el.setSelectionRange(n ? ends[n - 1] : 0, n ? ends[n - 1] : 0);
    }
    if (change) change(e);
  };
  rest.onKeyDown = function(e) {
    if (key) key(e);
    const el = e.currentTarget, at = el.selectionStart;
    if (!e.defaultPrevented && !isComposing(e) && (e.key === "Backspace" || e.key === "Delete") && at != null && at === el.selectionEnd) {
      const back = e.key === "Backspace";
      let p = at;
      while (back ? p > 0 && isPlain(slots, el.value, p - 1) : p < el.value.length && isPlain(slots, el.value, p)) p += back ? -1 : 1;
      if (p !== at && (back ? p > 0 : p < el.value.length)) el.setSelectionRange(p, p);
    }
  };
  return rest;
}
var Input = /* @__PURE__ */ component("Input", function Input2(props, ref) {
  const nameRef = useNameCheck("Input", NAME_HOW.field);
  props = useFieldControl(props);
  let rest = omit(props, { size: 1, invalid: 1, leftIcon: 1, rightIcon: 1, prefix: 1, suffix: 1, showCount: 1, mask: 1, className: 1, style: 1 });
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
  rest = useMask(rest, props.mask);
  const limited = useTextLimit(rest, own, { announce: !!props.showCount }), { length, max } = limited;
  rest = useValidityMessages(limited.props, own);
  const countId = domId("dk-in", React.useId());
  const locale = useLocale();
  const num = (n) => displayNumber(n, locale, PLAIN);
  const setRefs = React.useCallback(function(node) {
    own.current = node;
    nameRef(node);
    setRef(ref, node);
  }, [ref, nameRef]);
  const affix = useAffixes(props.prefix, props.suffix, countId, own);
  if (affix.ids || props.showCount) rest["aria-describedby"] = cn(rest["aria-describedby"], affix.ids, props.showCount && countId);
  const icon = function(source, side) {
    const node = asIcon(source);
    return node == null || node === false ? null : /* @__PURE__ */ React.createElement("span", { className: "dk-input__icon dk-input__icon--" + side, "aria-hidden": true, key: side }, node);
  };
  return /* @__PURE__ */ React.createElement("span", { className: cn("dk-input", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.className), style: props.style, "data-component": "input", "data-size": size, onMouseDown: pressFocuses(own) }, icon(props.leftIcon, "left"), affix.prefix, /* @__PURE__ */ React.createElement("input", { ...rest, ref: setRefs, className: "dk-input__field", key: "field" }), affix.suffix, props.showCount ? /* @__PURE__ */ React.createElement("span", { className: cn("dk-input__count", max != null && length >= max && "dk-input__count--full"), id: countId, key: "count" }, max != null ? num(length) + " / " + num(max) : num(length)) : null, icon(props.rightIcon, "right"));
});
export {
  Input
};
//# sourceMappingURL=Input.js.map
