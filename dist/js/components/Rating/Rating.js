"use client";

// src/components/Rating/Rating.tsx
import * as React from "react";
import { cn, domId, oneOf, SIZES } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useSettings } from "../../internal/provider.js";
import { useFormReset } from "../../internal/useFormReset.js";
import { useFieldsetDisabled } from "../../internal/useFieldsetDisabled.js";
import { useServerStyles } from "../../internal/serverStyles.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { FieldContext, useFieldControl } from "../../internal/field.js";
import { delegateFocus, useAutoFocus } from "../../internal/focus.js";
import { en as words } from "./labels.js";
var STAR = "m233-120 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Z";
var Star = () => /* @__PURE__ */ React.createElement("svg", { width: "1em", height: "1em", viewBox: "0 -960 960 960", "aria-hidden": true, focusable: "false" }, /* @__PURE__ */ React.createElement("path", { d: STAR }));
var round = (n, by) => Math.round(n / by) * by;
var Rating = /* @__PURE__ */ component("Rating", function Rating2(given, ref) {
  const props = useFieldControl(given);
  const fieldLabel = React.useContext(FieldContext)?.labelId;
  const { invalid, value: valueIn, defaultValue, onValueChange, max: maxIn, allowHalf, clearable, readOnly, disabled, name, form, required, size: sizeIn, className, onKeyDown, onPointerLeave, autoFocus, ...rest } = props;
  const nameRef = useNameCheck("Rating", NAME_HOW.group);
  const sds = useSettings(words);
  const size = oneOf(SIZES, sizeIn, "md");
  const max = typeof maxIn === "number" && maxIn >= 1 ? Math.floor(maxIn) : 5;
  const step = allowHalf ? 0.5 : 1;
  const fit = (n) => typeof n === "number" && isFinite(n) && n > 0 ? Math.min(max, n) : null;
  const controlled = valueIn !== void 0;
  const [own, setOwn] = React.useState(() => fit(defaultValue));
  const value = controlled ? fit(valueIn) : own;
  const [hover, setHover] = React.useState(null);
  const root = React.useRef(null);
  const auto = domId("dk-rating", React.useId());
  useFormReset(root, () => {
    if (!controlled) setOwn(fit(defaultValue));
  }, form);
  const inDisabledFieldset = useFieldsetDisabled(root);
  const off = !!disabled || inDisabledFieldset;
  const set = (n) => {
    if (n === value) return;
    if (!controlled) setOwn(n);
    if (onValueChange) onValueChange(n);
  };
  const picked = value == null ? null : round(value, step);
  const shown = readOnly ? value : hover ?? picked;
  const stars = Array.from({ length: max }, (_, i) => {
    const share = shown == null ? 0 : Math.min(1, Math.max(0, shown - i));
    return { i, fill: Math.round(share * 100) + "%" };
  });
  const box = (children, i, fill) => /* @__PURE__ */ React.createElement("span", { key: i, className: "dk-rating__star", style: { "--dk-rating-share": fill } }, /* @__PURE__ */ React.createElement("span", { className: "dk-rating__empty" }, /* @__PURE__ */ React.createElement(Star, null)), /* @__PURE__ */ React.createElement("span", { className: "dk-rating__fill" }, /* @__PURE__ */ React.createElement(Star, null)), children);
  const styled = useServerStyles();
  const ref2 = (n) => {
    root.current = n;
    if (!readOnly) delegateFocus(n, () => n && (n.querySelector("input:checked:enabled") || n.querySelector("input:enabled")));
    nameRef(n);
    styled(n);
    if (typeof ref === "function") ref(n);
    else if (ref) ref.current = n;
  };
  useAutoFocus(autoFocus, () => root.current);
  const classes = cn("dk-rating", "dk-rating--size-" + size, readOnly && "dk-rating--readonly", off && "dk-rating--disabled", className);
  if (readOnly) {
    const said = value == null ? 0 : Math.round(value * 10) / 10;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        ...rest,
        ref: ref2,
        role: "img",
        "aria-label": rest["aria-label"] ? rest["aria-label"] + ", " + sds.labels.ratingValue(said, max) : sds.labels.ratingValue(said, max),
        className: classes,
        "data-component": "rating",
        "data-size": size
      },
      stars.map((s) => box(null, s.i, s.fill))
    );
  }
  const radios = (i) => {
    const choices = allowHalf ? [i + 0.5, i + 1] : [i + 1];
    return choices.map((v) => /* @__PURE__ */ React.createElement(
      "input",
      {
        key: v,
        type: "radio",
        className: "dk-rating__choice",
        name: name || auto,
        form,
        value: v,
        checked: picked === v,
        disabled,
        required,
        "aria-label": sds.labels.ratingStars(v),
        onChange: () => set(v),
        onClick: () => {
          if (clearable && picked === v) set(null);
        },
        onPointerEnter: (e) => {
          if (!off && e.pointerType !== "touch") setHover(v);
        }
      }
    ));
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ...rest,
      ref: ref2,
      role: "radiogroup",
      "aria-labelledby": rest["aria-labelledby"] || (rest["aria-label"] ? void 0 : fieldLabel),
      "aria-invalid": invalid || void 0,
      "aria-disabled": off || void 0,
      "aria-required": required || rest["aria-required"] === true || rest["aria-required"] === "true" || void 0,
      className: classes,
      "data-component": "rating",
      "data-size": size,
      onPointerLeave: (e) => {
        if (onPointerLeave) onPointerLeave(e);
        setHover(null);
      },
      onKeyDown: (e) => {
        if (onKeyDown) onKeyDown(e);
        if (!e.defaultPrevented && clearable && !off && (e.key === "Backspace" || e.key === "Delete" || e.key === " " && e.target.checked)) {
          e.preventDefault();
          set(null);
        }
      }
    },
    stars.map((s) => box(radios(s.i), s.i, s.fill))
  );
});
export {
  Rating
};
//# sourceMappingURL=Rating.js.map
