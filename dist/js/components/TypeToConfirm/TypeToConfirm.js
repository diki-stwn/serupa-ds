"use client";

// src/components/TypeToConfirm/TypeToConfirm.tsx
import * as React from "react";
import { cn } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useSettings } from "../../internal/provider.js";
import { en as words } from "./labels.js";
import { Field } from "../Field/Field.js";
import { Input } from "../Input/Input.js";
import { Button } from "../Button/Button.js";
var TypeToConfirm = /* @__PURE__ */ component("TypeToConfirm", function TypeToConfirm2(props, ref) {
  const sds = useSettings(words);
  const { phrase, confirmLabel, onConfirm, label, hint, caseSensitive, onMatch, disabled, className, ...rest } = props;
  const [text, setText] = React.useState("");
  const same = (a, b) => caseSensitive === false ? a.toLocaleLowerCase() === b.toLocaleLowerCase() : a === b;
  const matched = !!phrase && same(text.trim(), phrase.trim());
  const told = React.useRef(false);
  React.useEffect(() => {
    if (matched === told.current) return;
    told.current = matched;
    if (onMatch) onMatch(matched);
  }, [matched, onMatch]);
  const button = React.useRef(null);
  return /* @__PURE__ */ React.createElement("div", { ...rest, ref, className: cn("dk-type-to-confirm", className), "data-component": "type-to-confirm" }, /* @__PURE__ */ React.createElement(Field, { label: label != null ? label : /* @__PURE__ */ React.createElement(React.Fragment, null, sds.labels.typeToConfirm, " ", /* @__PURE__ */ React.createElement("strong", { className: "dk-type-to-confirm__phrase" }, phrase)), hint, disabled }, /* @__PURE__ */ React.createElement(
    Input,
    {
      value: text,
      onChange: (e) => setText(e.currentTarget.value),
      disabled,
      autoComplete: "off",
      spellCheck: false,
      autoCapitalize: "off",
      autoCorrect: "off",
      onKeyDown: (e) => {
        if (e.key === "Enter" && matched && !e.nativeEvent.isComposing && button.current) {
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
