"use client";

// src/components/PinInput/PinInput.tsx
import * as React from "react";
import { cn, isInvalid, omit, oneOf, setRef, SIZES } from "../../internal/cn.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { component } from "../../internal/component.js";
import { useFieldControl } from "../../internal/field.js";
import { useFormReset } from "../../internal/useFormReset.js";
import { latinDigits } from "../../internal/digits.js";
var KEEP = { numeric: /[^0-9]/g, alphanumeric: /[^0-9A-Za-z]/g };
var PinInput = /* @__PURE__ */ component("PinInput", function PinInput2(props, ref) {
  const nameRef = useNameCheck("PinInput", NAME_HOW.field);
  props = useFieldControl(props);
  const rest = omit(props, { length: 1, value: 1, defaultValue: 1, onValueChange: 1, onComplete: 1, type: 1, mask: 1, size: 1, invalid: 1, className: 1, style: 1 });
  const length = Math.max(1, Math.floor(props.length || 6));
  const type = oneOf(["numeric", "alphanumeric"], props.type, "numeric");
  const size = oneOf(SIZES, props.size, "md");
  const clean = (s) => latinDigits((s || "").normalize("NFKC")).replace(KEEP[type], "").slice(0, length);
  const controlled = props.value !== void 0;
  const [own, setOwn] = React.useState(() => clean(props.defaultValue));
  const code = controlled ? clean(props.value) : own;
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  const input = React.useRef(null);
  const [focused, setFocused] = React.useState(false);
  useFormReset(input, function() {
    if (!controlled) setOwn(clean(props.defaultValue));
  });
  const toEnd = function(e) {
    const el = e.currentTarget, n = el.value.length, s = el.selectionStart, end = el.selectionEnd;
    if ((s !== n || end !== n) && !(s === 0 && end === n)) {
      try {
        el.setSelectionRange(n, n);
      } catch {
      }
    }
  };
  const onChange = function(e) {
    const next = clean(e.currentTarget.value);
    if (next === code) {
      e.currentTarget.value = code;
      return;
    }
    if (!controlled) setOwn(next);
    if (props.onValueChange) props.onValueChange(next);
    if (next.length === length && props.onComplete) props.onComplete(next);
  };
  const active = Math.min(code.length, length - 1);
  const boxes = [];
  for (let i = 0; i < length; i++) {
    const ch = code.charAt(i);
    boxes.push(/* @__PURE__ */ React.createElement("span", { key: i, className: cn("dk-pin-input__box", ch && "dk-pin-input__box--filled", focused && i === active && "dk-pin-input__box--active", focused && i === active && !ch && "dk-pin-input__box--caret") }, ch ? props.mask ? "\u2022" : ch : null));
  }
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      className: cn("dk-pin-input", "dk-pin-input--size-" + size, invalid && "dk-pin-input--invalid", rest.disabled && "dk-pin-input--disabled", rest.readOnly && "dk-pin-input--readonly", props.className),
      style: props.style,
      "data-component": "pin-input",
      "data-size": size
    },
    /* @__PURE__ */ React.createElement("span", { className: "dk-pin-input__boxes", "aria-hidden": true }, boxes),
    /* @__PURE__ */ React.createElement(
      "input",
      {
        autoComplete: "one-time-code",
        pattern: type === "numeric" ? "[0-9]{" + length + "}" : "[0-9A-Za-z]{" + length + "}",
        inputMode: type === "numeric" ? "numeric" : "text",
        autoCapitalize: "off",
        autoCorrect: "off",
        spellCheck: false,
        ...rest,
        type: props.mask ? "password" : "text",
        value: code,
        onChange,
        onFocus: function(e) {
          setFocused(true);
          if (rest.onFocus) rest.onFocus(e);
        },
        onBlur: function(e) {
          setFocused(false);
          if (rest.onBlur) rest.onBlur(e);
        },
        onKeyDown: function(e) {
          if (rest.onKeyDown) rest.onKeyDown(e);
          if (e.defaultPrevented) return;
          if (!(e.altKey || e.ctrlKey || e.metaKey) && /^(Arrow(Left|Right|Up|Down)|Home|End|PageUp|PageDown)$/.test(e.key)) e.preventDefault();
          else toEnd(e);
        },
        onSelect: function(e) {
          toEnd(e);
          if (rest.onSelect) rest.onSelect(e);
        },
        onPaste: function(e) {
          if (rest.onPaste) rest.onPaste(e);
          const el = e.currentTarget;
          if (!e.defaultPrevented && clean(e.clipboardData.getData("text")).length === length) el.setSelectionRange(0, el.value.length);
        },
        ref: function(n) {
          input.current = n;
          nameRef(n);
          setRef(ref, n);
        },
        className: "dk-pin-input__field"
      }
    )
  );
});
export {
  PinInput
};
//# sourceMappingURL=PinInput.js.map
