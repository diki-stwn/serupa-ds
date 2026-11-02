"use client";

// src/components/TypeToConfirm/TypeToConfirm.tsx
import * as React from "react";
import { cn } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { isComposing } from "../../internal/ime.js";
import { useAutoFocus } from "../../internal/focus.js";
import { useSettings } from "../../internal/provider.js";
import { en as words } from "./labels.js";
import { Field } from "../Field/Field.js";
import { Input } from "../Input/Input.js";
import { Button } from "../Button/Button.js";
var TypeToConfirm = /* @__PURE__ */ component("TypeToConfirm", function TypeToConfirm2(props, ref) {
  const sds = useSettings(words);
  const { phrase, confirmLabel, onConfirm, label, hint, caseSensitive, onMatch, disabled, className, autoFocus, ...rest } = props;
  const [text, setText] = React.useState("");
  const fold = (x) => x.toLowerCase().replace(/i\u0307|\u0131/g, "i");
  const same = (a, b) => caseSensitive === false ? fold(a) === fold(b) : a === b;
  const norm = (s) => s.normalize("NFKC").trim().replace(/\s+/g, " ");
  const matched = !!phrase && same(norm(text), norm(phrase));
  const told = React.useRef(false);
  React.useEffect(() => {
    if (matched === told.current) return;
    told.current = matched;
    if (onMatch) onMatch(matched);
  }, [matched, onMatch]);
  const button = React.useRef(null);
  const field = React.useRef(null);
  useAutoFocus(autoFocus, () => field.current);
  React.useEffect(() => {
    const at = field.current, box = at && (at.closest("dialog") || at.form);
    if (!box) return;
    const clear = () => setText("");
    const type = box.tagName === "DIALOG" ? "close" : "reset";
    box.addEventListener(type, clear);
    return () => box.removeEventListener(type, clear);
  }, []);
  return /* @__PURE__ */ React.createElement("div", { ...rest, ref, className: cn("dk-type-to-confirm", className), "data-component": "type-to-confirm" }, /* @__PURE__ */ React.createElement(Field, { label: label != null ? label : /* @__PURE__ */ React.createElement(React.Fragment, null, sds.labels.typeToConfirm, " ", /* @__PURE__ */ React.createElement("strong", { className: "dk-type-to-confirm__phrase" }, phrase)), hint, disabled }, /* @__PURE__ */ React.createElement(
    Input,
    {
      value: text,
      onChange: (e) => setText(e.currentTarget.value),
      disabled,
      ref: field,
      autoComplete: "off",
      spellCheck: false,
      autoCapitalize: "off",
      autoCorrect: "off",
      onKeyDown: (e) => {
        if (e.key === "Enter" && matched && !isComposing(e) && button.current) {
          e.preventDefault();
          button.current.click();
        }
      }
    }
  )), /* @__PURE__ */ React.createElement(
    Button,
    {
      ref: button,
      className: "dk-type-to-confirm__button",
      destructive: true,
      wrap: true,
      disabled: disabled || !matched,
      disabledReason: disabled ? void 0 : sds.labels.typePhraseFirst(phrase),
      onClick: () => onConfirm()
    },
    confirmLabel
  ));
});
export {
  TypeToConfirm
};
//# sourceMappingURL=TypeToConfirm.js.map
