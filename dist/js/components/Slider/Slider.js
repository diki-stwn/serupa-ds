"use client";

// src/components/Slider/Slider.tsx
import * as React from "react";
import { cn, isInvalid, omit, useIsoLayoutEffect } from "../../internal/cn.js";
import { useServerStyles } from "../../internal/serverStyles.js";
import { component } from "../../internal/component.js";
import { useFormReset } from "../../internal/useFormReset.js";
import { useFieldsetDisabled } from "../../internal/useFieldsetDisabled.js";
import { snap as snapToGrid } from "../../internal/step.js";
import { useFieldLabel } from "../../internal/fieldLabel.js";
import { useFieldControl } from "../../internal/field.js";
import { delegateFocus, useAutoFocus } from "../../internal/focus.js";
import { useLocale, useSettings } from "../../internal/provider.js";
import { displayNumber } from "../../internal/numbers.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { en as words } from "./labels.js";
var OWN = { value: 1, defaultValue: 1, onValueChange: 1, onValueCommit: 1, min: 1, max: 1, step: 1, largeStep: 1, size: 1, disabled: 1, formatValue: 1, thumbLabels: 1, name: 1, form: 1, invalid: 1, readOnly: 1, required: 1, marks: 1, showValue: 1, "aria-required": 1, "aria-invalid": 1, "aria-readonly": 1, autoFocus: 1, className: 1, "aria-label": 1, "aria-labelledby": 1, "aria-describedby": 1, "aria-errormessage": 1 };
function markList(marks, min, max, step, large) {
  if (Array.isArray(marks)) return marks.filter((m) => m && isFinite(m.value) && m.value >= min && m.value <= max);
  if (marks !== true) return [];
  const every = (max - min) / step > 100 ? step * large : step, out = [];
  for (let i = 0, v = min; v <= max + every / 1e9 && i <= 1e3; i++, v = min + i * every) out.push({ value: snapToGrid(v, min, max, step) });
  return out;
}
var FIT = ".dk-slider__mark-label > span, .dk-slider__value > span";
var Slider = /* @__PURE__ */ component("Slider", function Slider2(props, ref) {
  const nameRef = useNameCheck("Slider", NAME_HOW.field);
  props = useFieldControl(props);
  const restyle = useServerStyles(ref);
  const rest = omit(props, OWN);
  const sds = useSettings(words), locale = useLocale();
  const min = isFinite(Number(props.min)) && props.min != null ? Number(props.min) : 0;
  const maxIn = isFinite(Number(props.max)) && props.max != null ? Number(props.max) : 100;
  const max = maxIn > min ? maxIn : min + 1;
  const step = Number(props.step) > 0 ? Number(props.step) : 1;
  const large = Number(props.largeStep) > 0 ? Number(props.largeStep) : 10;
  const snap = (v) => snapToGrid(v, min, max, step);
  const controlled = props.value !== void 0;
  const [own, setOwn] = React.useState(props.defaultValue ?? min);
  const raw = controlled ? props.value : own;
  const isRange = Array.isArray(raw);
  const vals = isRange ? [snap(raw[0]), snap(raw[1])].sort((a, b) => a - b) : [snap(raw)];
  const latest = React.useRef(vals);
  latest.current = vals;
  const root = React.useRef(null);
  useFormReset(root, () => {
    if (!controlled) setOwn(props.defaultValue ?? min);
  }, props.form);
  const thumbs = React.useRef([]);
  const drag = React.useRef(null);
  const inDisabledFieldset = useFieldsetDisabled(root);
  const disabled = !!props.disabled || inDisabledFieldset;
  const invalid = isInvalid(props.invalid, props["aria-invalid"]);
  const readOnly = !!props.readOnly || props["aria-readonly"] === true || props["aria-readonly"] === "true";
  const still = disabled || readOnly;
  const pct = (v) => (v - min) / (max - min) * 100;
  const out = (vs) => isRange ? [vs[0], vs[1]] : vs[0];
  const text = (v) => props.formatValue ? props.formatValue(v) : displayNumber(v, locale);
  const live = React.useRef(disabled);
  live.current = disabled;
  const first = () => live.current ? null : thumbs.current[0];
  useAutoFocus(props.autoFocus, first);
  const set = (i, v) => {
    const vs = latest.current.slice();
    let n = snap(v);
    if (isRange) n = i === 0 ? Math.min(n, vs[1]) : Math.max(n, vs[0]);
    if (n === vs[i]) return vs;
    vs[i] = n;
    latest.current = vs;
    if (!controlled) setOwn(out(vs));
    if (props.onValueChange) props.onValueChange(out(vs));
    return vs;
  };
  const commit = () => {
    if (props.onValueCommit) props.onValueCommit(out(latest.current));
  };
  const from = React.useRef([]);
  const fromPoint = (x) => {
    const r = root.current.querySelector(".dk-slider__track").getBoundingClientRect();
    let share = r.width ? (x - r.left) / r.width : 0;
    if (getComputedStyle(root.current).direction === "rtl") share = 1 - share;
    return min + Math.min(1, Math.max(0, share)) * (max - min);
  };
  const onPointerDown = (e) => {
    if (rest.onPointerDown) rest.onPointerDown(e);
    if (disabled || e.button !== 0 || e.defaultPrevented) return;
    e.preventDefault();
    const v = fromPoint(e.clientX), vs = latest.current;
    let i = 0;
    if (isRange) {
      const d0 = Math.abs(v - vs[0]), d1 = Math.abs(v - vs[1]);
      i = d1 < d0 || d1 === d0 && v > vs[1] ? 1 : 0;
    }
    if (readOnly) {
      thumbs.current[i]?.focus({ preventScroll: true });
      return;
    }
    drag.current = i;
    from.current = vs.slice();
    e.currentTarget.setPointerCapture(e.pointerId);
    set(i, v);
    const t = thumbs.current[i];
    if (t) t.focus({ preventScroll: true });
  };
  const onPointerMove = (e) => {
    if (rest.onPointerMove) rest.onPointerMove(e);
    if (drag.current != null) set(drag.current, fromPoint(e.clientX));
  };
  const end = (e) => {
    if (drag.current == null) return;
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (latest.current.some((v, k) => v !== from.current[k])) commit();
  };
  const onKeyDownCapture = (e) => {
    if (rest.onKeyDownCapture) rest.onKeyDownCapture(e);
    if (rest.onKeyDown) rest.onKeyDown(e);
  };
  const onKeyDown = (i) => (e) => {
    if (still || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const by = (e.shiftKey ? large : 1) * step, v = latest.current[i];
    let n;
    switch (e.key) {
      case "ArrowUp":
        n = v + by;
        break;
      case "ArrowDown":
        n = v - by;
        break;
      case "ArrowRight":
        n = rtl ? v - by : v + by;
        break;
      case "ArrowLeft":
        n = rtl ? v + by : v - by;
        break;
      case "PageUp":
        n = v + large * step;
        break;
      case "PageDown":
        n = v - large * step;
        break;
      case "Home":
        n = isRange && i === 1 ? latest.current[0] : min;
        break;
      case "End":
        n = isRange && i === 0 ? latest.current[1] : max;
        break;
      default:
        return;
    }
    e.preventDefault();
    const before = latest.current[i];
    if (set(i, n)[i] !== before) commit();
  };
  const crossing = (e) => !(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget));
  const onFocus = (e) => {
    if (rest.onFocus && crossing(e)) rest.onFocus(e);
  };
  const onBlur = (e) => {
    if (rest.onBlur && crossing(e)) rest.onBlur(e);
  };
  const names = props.thumbLabels || [sds.labels.sliderMinimum, sds.labels.sliderMaximum];
  const fieldLabel = useFieldLabel(props.id);
  const labelledBy = props["aria-labelledby"] ?? (props["aria-label"] ? void 0 : fieldLabel);
  const lo = isRange ? pct(vals[0]) : 0, hi = pct(vals[vals.length - 1]);
  const marks = markList(props.marks, min, max, step, large);
  const labelled = marks.some((m) => m.label != null && m.label !== false && m.label !== "");
  const fit = React.useCallback(() => {
    const el = root.current;
    if (!el) return;
    const parts = Array.from(el.querySelectorAll(FIT));
    if (!parts.length) return;
    for (const p of parts) p.style.removeProperty("--dk-slider-nudge");
    const box = el.getBoundingClientRect();
    const by = parts.map((p) => {
      const r = p.getBoundingClientRect();
      return r.width >= box.width ? 0 : Math.max(0, box.left - r.left) - Math.max(0, r.right - box.right);
    });
    parts.forEach((p, i) => {
      if (by[i]) p.style.setProperty("--dk-slider-nudge", by[i] + "px");
    });
  }, []);
  const ro = React.useRef(void 0);
  const watch = () => {
    const el = root.current;
    if (el && ro.current) {
      for (const p of [el, ...el.querySelectorAll(FIT)]) if (!ro.current[1].has(p)) {
        ro.current[1].add(p);
        ro.current[0].observe(p);
      }
    }
  };
  useIsoLayoutEffect(() => {
    fit();
    watch();
  });
  React.useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const o = new ResizeObserver(fit);
    ro.current = [o, /* @__PURE__ */ new WeakSet()];
    watch();
    return () => o.disconnect();
  }, [fit]);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ...rest,
      ref: (n) => {
        root.current = n;
        delegateFocus(n, first);
        restyle(n);
      },
      role: isRange ? "group" : rest.role,
      "aria-label": isRange ? props["aria-label"] : void 0,
      "aria-labelledby": isRange ? labelledBy : void 0,
      "aria-describedby": isRange ? props["aria-describedby"] : void 0,
      className: cn("dk-slider", props.size === "sm" ? "dk-slider--size-sm" : "dk-slider--size-md", disabled && "dk-slider--disabled", readOnly && "dk-slider--readonly", invalid && "dk-slider--invalid", labelled && "dk-slider--mark-labels", props.className),
      "data-component": "slider",
      "data-size": props.size === "sm" ? "sm" : "md",
      "data-disabled": disabled ? "" : void 0,
      "data-readonly": readOnly ? "" : void 0,
      "data-invalid": invalid ? "" : void 0,
      onPointerDown,
      onPointerMove,
      onPointerUp: end,
      onPointerCancel: end,
      onKeyDown: void 0,
      onKeyDownCapture,
      onFocus,
      onBlur
    },
    /* @__PURE__ */ React.createElement("div", { className: "dk-slider__track" }, /* @__PURE__ */ React.createElement("div", { className: "dk-slider__fill", style: { insetInlineStart: lo + "%", inlineSize: hi - lo + "%" } }), marks.map((m, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "dk-slider__mark", style: { insetInlineStart: pct(m.value) + "%" }, "aria-hidden": "true" }, m.value > min && m.value < max ? /* @__PURE__ */ React.createElement("span", { className: "dk-slider__tick" }) : null, m.label != null && m.label !== false ? /* @__PURE__ */ React.createElement("span", { className: "dk-slider__mark-label" }, /* @__PURE__ */ React.createElement("span", null, m.label)) : null)), vals.map((v, i) => /* @__PURE__ */ React.createElement(
      "span",
      {
        key: i,
        ref: (n) => {
          thumbs.current[i] = n;
          if (!isRange) nameRef(n);
        },
        className: "dk-slider__thumb",
        style: { insetInlineStart: pct(v) + "%" },
        role: "slider",
        tabIndex: disabled ? -1 : 0,
        "aria-valuenow": v,
        "aria-valuemin": isRange && i === 1 ? vals[0] : min,
        "aria-valuemax": isRange && i === 0 ? vals[1] : max,
        "aria-valuetext": props.formatValue ? text(v) : void 0,
        "aria-orientation": "horizontal",
        "aria-disabled": disabled || void 0,
        "aria-readonly": readOnly || void 0,
        "aria-invalid": invalid || void 0,
        "aria-errormessage": invalid ? props["aria-errormessage"] : void 0,
        "aria-label": isRange ? names[i] : props["aria-label"],
        "aria-labelledby": isRange ? void 0 : labelledBy,
        "aria-describedby": isRange ? void 0 : props["aria-describedby"],
        onKeyDown: onKeyDown(i)
      },
      props.showValue ? /* @__PURE__ */ React.createElement("span", { className: "dk-slider__value", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", null, text(v))) : null
    ))),
    props.name ? vals.map((v, i) => /* @__PURE__ */ React.createElement("input", { key: "in" + i, type: "hidden", name: props.name, form: props.form, value: v, disabled })) : null
  );
});
export {
  Slider
};
//# sourceMappingURL=Slider.js.map
