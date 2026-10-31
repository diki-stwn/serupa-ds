"use client";

// src/components/PasswordInput/PasswordInput.tsx
import * as React from "react";
import { announce } from "../../internal/announce.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { cn, domId, isInvalid, omit, oneOf, setRef, useIsoLayoutEffect } from "../../internal/cn.js";
import { Icon } from "../Icon/Icon.js";
import { asIcon } from "../Icon/asIcon.js";
import { component } from "../../internal/component.js";
import { useFieldControl } from "../../internal/field.js";
import { pressFocuses } from "../../internal/affix.js";
import { useSettings } from "../../internal/provider.js";
import * as icons from "../../material/builtin.js";
import { en as words } from "./labels.js";
var SIZES = ["sm", "md", "lg"];
var PasswordInput = /* @__PURE__ */ component("PasswordInput", function PasswordInput2(props, ref) {
  const nameRef = useNameCheck("PasswordInput", NAME_HOW.field);
  props = useFieldControl(props);
  const sds = useSettings(words);
  const rest = omit(props, { size: 1, invalid: 1, leftIcon: 1, className: 1, style: 1, visible: 1, defaultVisible: 1, onVisibleChange: 1, toggleLabel: 1, capsLockHint: 1 });
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  if (rest.autoComplete === void 0) rest.autoComplete = "current-password";
  const [own2, setOwn] = React.useState(!!props.defaultVisible);
  const controlled = props.visible !== void 0;
  const shown = controlled ? !!props.visible : own2;
  const left = asIcon(props.leftIcon);
  const [caps, setCaps] = React.useState(false);
  const capsId = domId("dk-pw-caps", React.useId());
  const hint = props.capsLockHint !== false;
  const sense = (e) => {
    if (!hint || typeof e.getModifierState !== "function") return;
    const on = e.getModifierState("CapsLock");
    if (on !== caps) {
      setCaps(on);
      if (on) announce(sds.labels.capsLockOn);
    }
  };
  const onKeyDown = rest.onKeyDown, onKeyUp = rest.onKeyUp, onBlur = rest.onBlur;
  rest.onKeyDown = (e) => {
    sense(e);
    if (onKeyDown) onKeyDown(e);
  };
  rest.onKeyUp = (e) => {
    sense(e);
    if (onKeyUp) onKeyUp(e);
  };
  rest.onBlur = (e) => {
    setCaps(false);
    if (onBlur) onBlur(e);
  };
  if (caps) rest["aria-describedby"] = cn(rest["aria-describedby"], capsId);
  const field = React.useRef(null);
  const caret = React.useRef(null);
  const fieldRef = React.useCallback((n) => {
    field.current = n;
    nameRef(n);
    setRef(ref, n);
  }, [ref, nameRef]);
  useIsoLayoutEffect(() => {
    const f = field.current, c = caret.current;
    caret.current = null;
    if (!f || !c) return;
    const put = () => {
      if (f.selectionStart === null) return;
      f.setSelectionRange(c[0], c[1], c[2]);
      const at = (c[2] === "backward" ? c[0] : c[1]) / Math.max(f.value.length, 1);
      f.scrollLeft = at * f.scrollWidth - (at * c[4] - c[3]);
    };
    put();
    const frame = requestAnimationFrame(put);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [shown]);
  const toggle = () => {
    const f = field.current;
    if (f && f.selectionStart !== null && f.selectionEnd !== null) caret.current = [f.selectionStart, f.selectionEnd, f.selectionDirection || "none", f.scrollLeft, f.scrollWidth];
    if (!controlled) setOwn(!shown);
    if (props.onVisibleChange) props.onVisibleChange(!shown);
  };
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      className: cn("dk-input dk-password-input", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.className),
      style: props.style,
      "data-component": "password-input",
      "data-size": size,
      onMouseDown: pressFocuses(field)
    },
    left != null && left !== false ? /* @__PURE__ */ React.createElement("span", { className: "dk-input__icon dk-input__icon--left", "aria-hidden": true }, left) : null,
    /* @__PURE__ */ React.createElement("input", { ...rest, ref: fieldRef, type: shown ? "text" : "password", className: "dk-input__field", spellCheck: false, autoCapitalize: "off" }),
    caps ? /* @__PURE__ */ React.createElement("span", { className: "dk-password-input__caps", id: capsId }, sds.labels.capsLockOn) : null,
    /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "dk-password-input__toggle",
        "aria-label": props.toggleLabel || sds.labels.showPassword,
        "aria-pressed": shown,
        "aria-controls": rest.id,
        disabled: rest.disabled,
        onClick: toggle,
        onMouseDown: (e) => e.preventDefault()
      },
      /* @__PURE__ */ React.createElement(Icon, { icon: shown ? icons.VisibilityOff : icons.Visibility })
    )
  );
});
export {
  PasswordInput
};
//# sourceMappingURL=PasswordInput.js.map
