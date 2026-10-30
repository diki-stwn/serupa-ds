"use client";

// src/components/SearchInput/SearchInput.tsx
import * as React from "react";
import { cn, isInvalid, omit, oneOf, SIZES } from "../../internal/cn.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { Icon } from "../Icon/Icon.js";
import { Loader } from "../Loader/Loader.js";
import { component } from "../../internal/component.js";
import { useFieldControl } from "../../internal/field.js";
import { isComposing } from "../../internal/ime.js";
import { pressFocuses } from "../../internal/affix.js";
import { useFormReset } from "../../internal/useFormReset.js";
import { useSettings } from "../../internal/provider.js";
import * as icons from "../../material/builtin.js";
import { en as words } from "./labels.js";
var SearchInput = /* @__PURE__ */ component("SearchInput", function SearchInput2(props, ref) {
  const nameRef = useNameCheck("SearchInput", NAME_HOW.field);
  props = useFieldControl(props);
  const sds = useSettings(words);
  const rest = omit(props, { size: 1, invalid: 1, className: 1, style: 1, onSearch: 1, onClear: 1, clearLabel: 1, loading: 1, loadingLabel: 1 });
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  const el = React.useRef(null);
  const controlled = props.value !== void 0;
  const [typed, setTyped] = React.useState(String(props.defaultValue ?? ""));
  const text = controlled ? String(props.value ?? "") : typed;
  const locked = !!rest.disabled || !!rest.readOnly;
  useFormReset(el, () => {
    if (!controlled) setTyped(String(props.defaultValue ?? ""));
  });
  const clear = () => {
    const i = el.current;
    if (!i) return;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    if (setValue && setValue.set) setValue.set.call(i, "");
    else i.value = "";
    i.dispatchEvent(new Event("input", { bubbles: true }));
    if (!controlled) setTyped("");
    i.focus();
    if (props.onClear) props.onClear();
  };
  const onChange = (e) => {
    if (!controlled) setTyped(e.target.value);
    if (rest.onChange) rest.onChange(e);
  };
  const onKeyDown = (e) => {
    if (rest.onKeyDown) rest.onKeyDown(e);
    if (e.defaultPrevented || isComposing(e)) return;
    if (e.key === "Escape" && e.currentTarget.value !== "" && !locked) {
      e.preventDefault();
      e.stopPropagation();
      clear();
    } else if (e.key === "Enter" && props.onSearch) props.onSearch(e.currentTarget.value);
  };
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      className: cn("dk-input dk-search-input", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.className),
      style: props.style,
      "data-component": "search-input",
      "data-size": size,
      onMouseDown: pressFocuses(el)
    },
    /* @__PURE__ */ React.createElement("span", { className: "dk-input__icon dk-input__icon--left dk-search-input__icon", "aria-hidden": props.loading ? void 0 : true }, props.loading ? /* @__PURE__ */ React.createElement(Loader, { size: "sm", delay: 0, label: props.loadingLabel ?? sds.labels.searching }) : /* @__PURE__ */ React.createElement(Icon, { icon: icons.Search })),
    /* @__PURE__ */ React.createElement(
      "input",
      {
        ...rest,
        ref: (n) => {
          el.current = n;
          nameRef(n);
          if (typeof ref === "function") ref(n);
          else if (ref) ref.current = n;
        },
        type: "search",
        enterKeyHint: rest.enterKeyHint || "search",
        className: "dk-input__field",
        onChange,
        onKeyDown
      }
    ),
    text !== "" && !locked ? /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "dk-search-input__clear",
        "aria-label": props.clearLabel || sds.labels.clearSearch,
        "aria-controls": rest.id,
        onClick: clear,
        onMouseDown: (e) => e.preventDefault()
      },
      /* @__PURE__ */ React.createElement(Icon, { icon: icons.Close })
    ) : null
  );
});
export {
  SearchInput
};
//# sourceMappingURL=SearchInput.js.map
