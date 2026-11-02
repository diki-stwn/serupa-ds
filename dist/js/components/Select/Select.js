"use client";

// src/components/Select/Select.tsx
import * as React from "react";
import { cn, isInvalid, oneOf, omit, setRef, SIZES } from "../../internal/cn.js";
import { useFormReset } from "../../internal/useFormReset.js";
import { warnOnce } from "../../internal/warn.js";
import { Icon } from "../Icon/Icon.js";
import { asIcon } from "../Icon/asIcon.js";
import { component } from "../../internal/component.js";
import { useFieldControl } from "../../internal/field.js";
import * as icons from "../../material/builtin.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
var OWN = { size: 1, invalid: 1, leftIcon: 1, placeholder: 1, options: 1, children: 1, className: 1, style: 1, multiple: 1 };
function optionNodes(list) {
  return (list || []).map(function(o, i) {
    if (o != null && typeof o === "object" && "options" in o && Array.isArray(o.options)) return /* @__PURE__ */ React.createElement("optgroup", { key: "g" + i, label: o.label, disabled: o.disabled }, optionNodes(o.options));
    const v = o != null && typeof o === "object" ? o : { value: o, label: o, disabled: void 0 };
    return /* @__PURE__ */ React.createElement("option", { key: String(v.value), value: v.value, disabled: v.disabled }, v.label != null ? v.label : v.value);
  });
}
var Select = /* @__PURE__ */ component("Select", function Select2(props, ref) {
  const nameRef = useNameCheck("Select", NAME_HOW.field);
  props = useFieldControl(props);
  const rest = omit(props, OWN);
  if (process.env.NODE_ENV !== "production" && props.multiple) warnOnce("select-multiple", "Serupa.Select: multiple isn't supported (a native multi-select is hard to use); use checkboxes instead. It was ignored.");
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  const hasPh = props.placeholder != null && props.placeholder !== "";
  const controlled = rest.value !== void 0;
  if (hasPh && !controlled && rest.defaultValue === void 0) rest.defaultValue = "";
  const [picked, setPicked] = React.useState(controlled ? rest.value : rest.defaultValue), cur = controlled ? rest.value : picked;
  const onChange = rest.onChange;
  rest.onChange = function(e) {
    if (!controlled) setPicked(e.target.value);
    if (onChange) onChange(e);
  };
  const own = React.useRef(null);
  const setRefs = React.useCallback(function(node) {
    own.current = node;
    nameRef(node);
    setRef(ref, node);
  }, [ref, nameRef]);
  const start = rest.defaultValue;
  useFormReset(own, () => {
    if (!controlled) setPicked(start);
  });
  const empty = hasPh && (cur == null || cur === "");
  const left = asIcon(props.leftIcon);
  return /* @__PURE__ */ React.createElement("span", { className: cn("dk-select", "dk-select--size-" + size, invalid && "dk-select--invalid", rest.disabled && "dk-select--disabled", empty && "dk-select--empty", left != null && left !== false && "dk-select--has-icon", props.className), style: props.style, "data-component": "select", "data-size": size }, left == null || left === false ? null : /* @__PURE__ */ React.createElement("span", { className: "dk-select__icon dk-select__icon--left", "aria-hidden": true, key: "left" }, left), /* @__PURE__ */ React.createElement("select", { ...rest, ref: setRefs, className: "dk-select__field", key: "field" }, hasPh ? /* @__PURE__ */ React.createElement("option", { value: "", disabled: true, key: "__placeholder" }, props.placeholder) : null, optionNodes(props.options), props.children), /* @__PURE__ */ React.createElement("span", { className: "dk-select__icon dk-select__icon--chevron", "aria-hidden": true, key: "chevron" }, /* @__PURE__ */ React.createElement(Icon, { icon: icons.ExpandMore })));
});
export {
  Select
};
//# sourceMappingURL=Select.js.map
