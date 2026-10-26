"use client";

// src/components/Rating/Rating.tsx
import * as React from "react";
import { cn, domId, oneOf, SIZES } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useSerupa } from "../../internal/provider.js";
import { useFormReset } from "../../internal/useFormReset.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { FieldContext, useFieldControl } from "../../internal/field.js";
var STAR = "m233-120 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Z";
var Star = () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 -960 960 960", "aria-hidden": true, focusable: "false" }, /* @__PURE__ */ React.createElement("path", { d: STAR }));
var round = (n, by) => Math.round(n / by) * by;
var Rating = /* @__PURE__ */ component("Rating", function Rating2(given, ref) {
  const props = useFieldControl(given);
  const fieldLabel = React.useContext(FieldContext)?.labelId;
  const { invalid, value: valueIn, defaultValue, onValueChange, max: maxIn, allowHalf, clearable, readOnly, disabled, name, form, required, size: sizeIn, className, onKeyDown, onPointerLeave, ...rest } = props;
  const nameRef = useNameCheck("Rating", NAME_HOW.group);
  const sds = useSerupa();
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
  });
  const set = (n) => {
    if (n === value) return;
    if (!controlled) setOwn(n);
    if (onValueChange) onValueChange(n);
  };
  const shown = readOnly ? value : hover ?? (value == null ? null : round(value, step));
  const stars = Array.from({ length: max }, (_, i) => {
    const share = shown == null ? 0 : Math.min(1, Math.max(0, shown - i));
    return { i, fill: Math.round(share * 100) + "%" };
  });
  const box = (children, i, fill) => /* @__PURE__ */ React.createElement("span", { key: i, className: "dk-rating__star", style: { "--dk-rating-share": fill } }, /* @__PURE__ */ React.createElement("span", { className: "dk-rating__empty" }, /* @__PURE__ */ React.createElement(Star, null)), /* @__PURE__ */ React.createElement("span", { className: "dk-rating__fill" }, /* @__PURE__ */ React.createElement(Star, null)), children);
  const ref2 = (n) => {
    root.current = n;
    nameRef(n);
    if (typeof ref === "function") ref(n);
    else if (ref) ref.current = n;
  };
  const classes = cn("dk-rating", "dk-rating--size-" + size, readOnly && "dk-rating--readonly", disabled && "dk-rating--disabled", className);
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
        checked: value === v,
        disabled,
        required,
        "aria-label": sds.labels.ratingStars(v),
        onChange: () => set(v),
        onClick: () => {
          if (clearable && value === v) set(null);
        },
        onPointerEnter: (e) => {
          if (e.pointerType !== "touch") setHover(v);
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
      "aria-disabled": disabled || void 0,
      "aria-required": required || void 0,
      className: classes,
      "data-component": "rating",
      "data-size": size,
      onPointerLeave: (e) => {
        if (onPointerLeave) onPointerLeave(e);
        setHover(null);
      },
      onKeyDown: (e) => {
        if (onKeyDown) onKeyDown(e);
        if (!e.defaultPrevented && clearable && !disabled && (e.key === "Backspace" || e.key === "Delete")) {
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
