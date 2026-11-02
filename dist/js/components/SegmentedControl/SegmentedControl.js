"use client";

// src/components/SegmentedControl/SegmentedControl.tsx
import * as React from "react";
import { cn, isInvalid, omit, setRef, useIsoLayoutEffect } from "../../internal/cn.js";
import { asIcon } from "../Icon/asIcon.js";
import { component } from "../../internal/component.js";
import { useFormReset } from "../../internal/useFormReset.js";
import { lastInputKeyboard, listenForInput } from "../../internal/lastInput.js";
import { useFieldLabel } from "../../internal/fieldLabel.js";
import { useFieldControl } from "../../internal/field.js";
import { delegateFocus, useAutoFocus } from "../../internal/focus.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
var OWN = { options: 1, value: 1, defaultValue: 1, onValueChange: 1, size: 1, fullWidth: 1, disabled: 1, name: 1, form: 1, invalid: 1, required: 1, readOnly: 1, "aria-invalid": 1, "aria-required": 1, "aria-readonly": 1, autoFocus: 1, className: 1 };
var SegmentedControl = /* @__PURE__ */ component("SegmentedControl", function SegmentedControl2(props, ref) {
  const nameRef = useNameCheck("SegmentedControl", NAME_HOW.group);
  props = useFieldControl(props);
  const rest = omit(props, OWN);
  const options = props.options || [];
  const disabled = !!props.disabled;
  const invalid = isInvalid(props.invalid, props["aria-invalid"]);
  const truthy = (a) => a === true || a === "true";
  const readOnly = !!props.readOnly || truthy(props["aria-readonly"]);
  const required = !!props.required || truthy(props["aria-required"]);
  const usable = options.filter((o) => !o.disabled && !disabled);
  const controlled = props.value !== void 0;
  const [own, setOwn] = React.useState(props.defaultValue ?? (options.find((o) => !o.disabled) || {}).value);
  const value = controlled ? props.value : own;
  const root = React.useRef(null);
  useFormReset(root, () => {
    if (!controlled) setOwn(props.defaultValue ?? (options.find((o) => !o.disabled) || {}).value);
  }, props.form);
  const buttons = React.useRef({});
  const [box, setBox] = React.useState(null);
  const size = props.size === "sm" || props.size === "lg" ? props.size : "md";
  const fieldLabel = useFieldLabel(props.id);
  const tabStop = () => root.current && root.current.querySelector('[role=radio][tabindex="0"]');
  useAutoFocus(props.autoFocus, tabStop);
  const choose = (v, focus) => {
    if (focus) {
      const b = buttons.current[v];
      if (b) b.focus();
    }
    if (v === value || readOnly) return;
    if (!controlled) setOwn(v);
    if (props.onValueChange) props.onValueChange(v);
  };
  const [cut, setCut] = React.useState("");
  const [tight, setTight] = React.useState(false);
  const measure = React.useCallback(() => {
    const r = root.current, b = value != null ? buttons.current[value] : null;
    let c = "", total = 0, n = 0, most = 0;
    for (const k in buttons.current) {
      const btn = buttons.current[k], l = btn?.querySelector(".dk-segmented__label");
      if (!btn) continue;
      total += btn.offsetWidth;
      n++;
      if (props.fullWidth) {
        const cs = getComputedStyle(btn), kids = [...btn.children];
        let need = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + (parseFloat(cs.columnGap) || 0) * Math.max(0, kids.length - 1);
        for (const kid of kids) need += kid === l ? l.scrollWidth : kid.offsetWidth;
        most = Math.max(most, need);
      }
      if (l && l.scrollWidth > l.clientWidth) c += k + "\n";
    }
    setCut(c);
    setTight(!!props.fullWidth && n > 0 && most > total / n + 0.5);
    if (!r || !b) {
      setBox(null);
      return;
    }
    const x = b.offsetLeft, w = b.offsetWidth;
    setBox((p) => p && p.x === x && p.w === w ? p : { x, w });
  }, [value, props.fullWidth]);
  useIsoLayoutEffect(measure, [measure, options.length, size, tight]);
  const indicator = React.useRef(null);
  const last = React.useRef(null);
  const sliding = React.useRef(void 0);
  const settle = (el, at) => {
    el.removeAttribute("data-slide");
    el.style.left = at.x + "px";
    el.style.width = at.w + "px";
  };
  useIsoLayoutEffect(() => {
    const was = last.current, el = indicator.current;
    last.current = box ? { ...box, v: value } : null;
    clearTimeout(sliding.current);
    if (el && box && el.hasAttribute("data-slide")) settle(el, box);
    if (!el || !box || !was || was.v === value || !box.w || was.x === box.x && was.w === box.w || lastInputKeyboard()) return;
    const l = Math.min(was.x, box.x), r = Math.max(was.x + was.w, box.x + box.w);
    const cut2 = (at) => {
      el.style.setProperty("--dk-seg-l", at.x - l + "px");
      el.style.setProperty("--dk-seg-r", r - at.x - at.w + "px");
    };
    el.setAttribute("data-flip", "");
    el.setAttribute("data-slide", "");
    el.style.left = l + "px";
    el.style.width = r - l + "px";
    cut2(was);
    void el.offsetWidth;
    el.removeAttribute("data-flip");
    const t = getComputedStyle(el, "::after"), ms = (parseFloat(t.transitionDuration) + parseFloat(t.transitionDelay)) * 1e3 || 0;
    cut2(box);
    if (ms > 0) sliding.current = setTimeout(() => settle(el, box), ms);
    else settle(el, box);
  }, [box]);
  React.useEffect(() => () => clearTimeout(sliding.current), []);
  useIsoLayoutEffect(listenForInput, []);
  React.useEffect(() => {
    const r = root.current;
    if (!r || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(r);
    for (const k in buttons.current) {
      const b = buttons.current[k];
      if (b) ro.observe(b);
    }
    return () => ro.disconnect();
  }, [measure, options.length]);
  const onKeyDownCapture = (e) => {
    if (rest.onKeyDownCapture) rest.onKeyDownCapture(e);
    if (rest.onKeyDown) rest.onKeyDown(e);
  };
  const onKeyDown = (e) => {
    if (!usable.length || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const from = readOnly || !usable.some((o) => o.value === value) ? e.currentTarget.dataset.value : value;
    const i = usable.findIndex((o) => o.value === from);
    let n;
    switch (e.key) {
      case "ArrowRight":
        n = i + (rtl ? -1 : 1);
        break;
      case "ArrowDown":
        n = i + 1;
        break;
      case "ArrowLeft":
        n = i + (rtl ? 1 : -1);
        break;
      case "ArrowUp":
        n = i - 1;
        break;
      case "Home":
        n = 0;
        break;
      case "End":
        n = usable.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    choose(usable[(n + usable.length) % usable.length].value, true);
  };
  const crossing = (e) => !(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget));
  const onFocus = (e) => {
    if (rest.onFocus && crossing(e)) rest.onFocus(e);
  };
  const onBlur = (e) => {
    if (rest.onBlur && crossing(e)) rest.onBlur(e);
  };
  const checkedUsable = usable.some((o) => o.value === value);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ...rest,
      ref: (n) => {
        root.current = n;
        nameRef(n);
        delegateFocus(n, tabStop);
        setRef(ref, n);
      },
      role: "radiogroup",
      "aria-disabled": disabled || void 0,
      "aria-invalid": invalid || void 0,
      "aria-required": required || void 0,
      "aria-readonly": readOnly || void 0,
      "aria-labelledby": props["aria-labelledby"] ?? (props["aria-label"] ? void 0 : fieldLabel),
      className: cn("dk-segmented", "dk-segmented--size-" + size, props.fullWidth && "dk-segmented--full", props.fullWidth && tight && "dk-segmented--fit", disabled && "dk-segmented--disabled", invalid && "dk-segmented--invalid", readOnly && "dk-segmented--readonly", props.className),
      "data-component": "segmented-control",
      "data-size": size,
      onKeyDown: void 0,
      onKeyDownCapture,
      onFocus,
      onBlur
    },
    box ? /* @__PURE__ */ React.createElement("span", { ref: indicator, className: "dk-segmented__indicator", "aria-hidden": true, style: { left: box.x, width: box.w } }) : null,
    options.map((o) => {
      const on = o.value === value, off = disabled || !!o.disabled;
      const icon = asIcon(o.icon);
      const hasLabel = o.label != null && o.label !== false && o.label !== "";
      const tab = off ? -1 : on || !checkedUsable && usable[0] && usable[0].value === o.value ? 0 : -1;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: o.value,
          ref: (n) => {
            buttons.current[o.value] = n;
          },
          type: "button",
          role: "radio",
          "aria-checked": on,
          "aria-label": o["aria-label"],
          title: typeof o.label === "string" && !o["aria-label"] && cut.split("\n").includes(o.value) ? o.label : void 0,
          disabled: off,
          tabIndex: tab,
          "data-value": o.value,
          className: cn("dk-segmented__item", on && "dk-segmented__item--selected", !hasLabel && "dk-segmented__item--icon-only"),
          onClick: () => choose(o.value),
          onKeyDown
        },
        icon != null && icon !== false ? /* @__PURE__ */ React.createElement("span", { className: "dk-segmented__icon", "aria-hidden": true }, icon) : null,
        hasLabel ? /* @__PURE__ */ React.createElement("span", { className: "dk-segmented__label" }, o.label) : null
      );
    }),
    props.name ? /* @__PURE__ */ React.createElement("input", { type: "hidden", name: props.name, form: props.form, value: value ?? "", disabled }) : null
  );
});
export {
  SegmentedControl
};
//# sourceMappingURL=SegmentedControl.js.map
