"use client";

// src/components/Progress/Progress.tsx
import * as React from "react";
import { cn, domId, oneOf, omit, SIZES } from "../../internal/cn.js";
import { useServerStyles } from "../../internal/serverStyles.js";
import { component } from "../../internal/component.js";
import { displayNumber } from "../../internal/numbers.js";
import { useLocale, useSettings } from "../../internal/provider.js";
import { announce, ensureAnnouncer } from "../../internal/announce.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { en as ownWords } from "./labels.js";
var TONES = ["primary", "success", "warning", "danger"];
var OWN = { value: 1, max: 1, variant: 1, size: 1, tone: 1, label: 1, showValue: 1, formatValue: 1, announceComplete: 1, onComplete: 1, className: 1 };
var PERCENT = { style: "percent", maximumFractionDigits: 0 };
var Progress = /* @__PURE__ */ component("Progress", function Progress2(props, ref) {
  const nameRef = useNameCheck("Progress", NAME_HOW.label);
  const restyle = useServerStyles(ref);
  const rest = omit(props, OWN);
  const locale = useLocale();
  const base = domId("dk-prg", React.useId());
  const variant = props.variant === "circle" ? "circle" : "bar";
  const size = oneOf(SIZES, props.size, "md");
  const tone = oneOf(TONES, props.tone, "primary");
  const max = Number(props.max) > 0 ? Number(props.max) : 100;
  const known = props.value != null && isFinite(Number(props.value));
  const value = known ? Math.min(max, Math.max(0, Number(props.value))) : 0;
  const text = known ? props.formatValue ? props.formatValue(value, max) : displayNumber(value / max, locale, PERCENT) : "";
  const hasLabel = props.label != null && props.label !== false && props.label !== "";
  const showValue = !!props.showValue && known;
  const share = known ? value / max : 0;
  const sds = useSettings(ownWords);
  const done = known && value >= max;
  const was = React.useRef(done);
  const name = typeof props.label === "string" ? props.label : typeof rest["aria-label"] === "string" ? rest["aria-label"] : "";
  const words = props.announceComplete ? typeof props.announceComplete === "string" ? props.announceComplete : sds.labels.progressComplete(name) : "";
  const finish = React.useRef({ words, onComplete: props.onComplete });
  finish.current = { words, onComplete: props.onComplete };
  const speaks = !!props.announceComplete;
  React.useEffect(() => {
    if (speaks) ensureAnnouncer();
  }, [speaks]);
  React.useEffect(() => {
    if (done && !was.current) {
      if (finish.current.words) announce(finish.current.words);
      if (finish.current.onComplete) finish.current.onComplete();
    }
    was.current = done;
  }, [done]);
  const aria = { role: "progressbar", "aria-valuemin": 0, "aria-valuemax": max };
  if (known) {
    aria["aria-valuenow"] = value;
    aria["aria-valuetext"] = text;
  }
  const nameless = hasLabel && !rest["aria-label"] && !rest["aria-labelledby"];
  const said = typeof props.label === "string" || typeof props.label === "number" ? String(props.label) : null;
  const ringText = nameless && variant === "circle" && said != null;
  if (ringText) aria["aria-label"] = said;
  else if (nameless) aria["aria-labelledby"] = base + "-label";
  const cls = cn("dk-progress", "dk-progress--" + variant, "dk-progress--size-" + size, tone !== "primary" && "dk-progress--" + tone, !known && "dk-progress--indeterminate", props.className);
  const data = { "data-component": "progress", "data-variant": variant, "data-size": size, "data-tone": tone, "data-state": known ? value >= max ? "complete" : "loading" : "indeterminate" };
  if (variant === "circle") {
    return /* @__PURE__ */ React.createElement("div", { ...rest, ...aria, ...data, ref: (n) => {
      restyle(n);
      nameRef(n);
    }, className: cls }, /* @__PURE__ */ React.createElement("svg", { className: "dk-progress__ring", width: "1em", height: "1em", viewBox: "0 0 24 24", "aria-hidden": true, focusable: "false" }, /* @__PURE__ */ React.createElement("circle", { className: "dk-progress__track", cx: 12, cy: 12, r: 10.5 }), /* @__PURE__ */ React.createElement("circle", { className: "dk-progress__arc", cx: 12, cy: 12, r: 10.5, pathLength: 100, strokeDasharray: known ? share * 100 + " 100" : "25 100" })), showValue && size !== "sm" ? /* @__PURE__ */ React.createElement("span", { className: "dk-progress__value", "aria-hidden": true }, text) : null, nameless && !ringText ? /* @__PURE__ */ React.createElement("span", { id: base + "-label", hidden: true }, props.label) : null);
  }
  const outer = omit(rest, { "aria-label": 1, "aria-labelledby": 1 });
  return /* @__PURE__ */ React.createElement("div", { ...outer, ...data, ref: restyle, className: cls }, hasLabel || showValue ? /* @__PURE__ */ React.createElement("div", { className: "dk-progress__header" }, hasLabel ? /* @__PURE__ */ React.createElement("span", { className: "dk-progress__label", id: base + "-label" }, props.label) : null, showValue ? /* @__PURE__ */ React.createElement("span", { className: "dk-progress__value", "aria-hidden": true }, text) : null) : null, /* @__PURE__ */ React.createElement("div", { ...aria, ref: nameRef, className: "dk-progress__track", "aria-label": rest["aria-label"], "aria-labelledby": rest["aria-labelledby"] || aria["aria-labelledby"] }, /* @__PURE__ */ React.createElement("div", { className: "dk-progress__fill", style: known ? { "--dk-progress-rest": +((1 - share) * 100).toFixed(4) + "%" } : void 0 })));
});
export {
  Progress
};
//# sourceMappingURL=Progress.js.map
