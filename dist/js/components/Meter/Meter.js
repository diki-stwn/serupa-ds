"use client";

// src/components/Meter/Meter.tsx
import * as React from "react";
import { cn, domId, oneOf, omit, SIZES } from "../../internal/cn.js";
import { useServerStyles } from "../../internal/serverStyles.js";
import { component } from "../../internal/component.js";
import { displayNumber } from "../../internal/numbers.js";
import { useLocale, useSettings } from "../../internal/provider.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { en as words } from "./labels.js";
var OWN = { value: 1, min: 1, max: 1, low: 1, high: 1, optimum: 1, size: 1, label: 1, showValue: 1, formatValue: 1, className: 1 };
var PERCENT = { style: "percent", maximumFractionDigits: 0 };
var num = (v) => v != null && isFinite(Number(v)) ? Number(v) : void 0;
function meterState(value, min, max, low, high, optimum) {
  if (low == null && high == null) return "none";
  const lo = Math.min(Math.max(low ?? min, min), max), hi = Math.min(Math.max(high ?? max, lo), max);
  const best = Math.min(Math.max(optimum ?? (min + max) / 2, min), max);
  if (best < lo) return value < lo ? "optimum" : value <= hi ? "suboptimal" : "poor";
  if (best > hi) return value > hi ? "optimum" : value >= lo ? "suboptimal" : "poor";
  return value >= lo && value <= hi ? "optimum" : "suboptimal";
}
function zone(value, min, max, low, high) {
  const lo = Math.min(Math.max(low ?? min, min), max), hi = Math.min(Math.max(high ?? max, lo), max);
  return value < lo ? "low" : value > hi ? "high" : "medium";
}
var TONE = { optimum: "success", suboptimal: "warning", poor: "danger", none: null };
var Meter = /* @__PURE__ */ component("Meter", function Meter2(props, ref) {
  const nameRef = useNameCheck("Meter", NAME_HOW.label);
  const restyle = useServerStyles(ref);
  const rest = omit(props, OWN);
  const locale = useLocale();
  const base = domId("dk-mtr", React.useId());
  const size = oneOf(SIZES, props.size, "md");
  const min = num(props.min) ?? 0;
  const max = Math.max(num(props.max) ?? 100, min);
  const value = Math.min(max, Math.max(min, num(props.value) ?? min));
  const share = max > min ? (value - min) / (max - min) : 0;
  const state = meterState(value, min, max, num(props.low), num(props.high), num(props.optimum));
  const tone = TONE[state];
  const labels = useSettings(words).labels;
  const text = props.formatValue ? props.formatValue(value, min, max) : displayNumber(share, locale, PERCENT);
  const spoken = props.formatValue || state === "none" || state === "optimum" ? text : labels.meterZone(text, zone(value, min, max, num(props.low), num(props.high)));
  const hasLabel = props.label != null && props.label !== false && props.label !== "";
  const showValue = !!props.showValue;
  const outer = omit(rest, { "aria-label": 1, "aria-labelledby": 1 });
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ...outer,
      ref: restyle,
      className: cn("dk-meter", "dk-meter--size-" + size, tone && "dk-meter--" + tone, props.className),
      "data-component": "meter",
      "data-size": size,
      "data-state": state
    },
    hasLabel || showValue ? /* @__PURE__ */ React.createElement("div", { className: "dk-meter__header" }, hasLabel ? /* @__PURE__ */ React.createElement("span", { className: "dk-meter__label", id: base + "-label" }, props.label) : null, showValue ? /* @__PURE__ */ React.createElement("span", { className: "dk-meter__value", "aria-hidden": true }, spoken) : null) : null,
    /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: nameRef,
        className: "dk-meter__track",
        role: "meter",
        "aria-valuemin": min,
        "aria-valuemax": max,
        "aria-valuenow": value,
        "aria-valuetext": spoken,
        "aria-label": rest["aria-label"],
        "aria-labelledby": rest["aria-labelledby"] || (hasLabel && !rest["aria-label"] ? base + "-label" : void 0)
      },
      /* @__PURE__ */ React.createElement("div", { className: "dk-meter__fill", style: { "--dk-meter-rest": +((1 - share) * 100).toFixed(4) + "%" } })
    )
  );
});
export {
  Meter,
  meterState
};
//# sourceMappingURL=Meter.js.map
