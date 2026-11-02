"use client";

// src/components/Stepper/Stepper.tsx
import * as React from "react";
import { cn, omit, setRef, useIsoLayoutEffect } from "../../internal/cn.js";
import { Icon } from "../Icon/Icon.js";
import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden.js";
import { component } from "../../internal/component.js";
import { displayNumber } from "../../internal/numbers.js";
import { useLocale, useSettings } from "../../internal/provider.js";
import * as icons from "../../material/builtin.js";
import { en as words } from "./labels.js";
var OWN = { steps: 1, current: 1, orientation: 1, size: 1, onStepClick: 1, clickable: 1, labels: 1, className: 1 };
var Stepper = /* @__PURE__ */ component("Stepper", function Stepper2(props, ref) {
  const sds = useSettings(words);
  const locale = useLocale();
  const rest = omit(props, OWN);
  const steps = props.steps || [];
  const current = Math.max(0, Math.min(steps.length, Math.floor(Number(props.current)) || 0));
  const vertical = props.orientation === "vertical";
  const size = props.size === "sm" ? "sm" : "md";
  const L = { completed: sds.labels.completed, error: sds.labels.hasError, warning: sds.labels.hasWarning, optional: sds.labels.optional, stepOf: sds.labels.stepOf, ...props.labels || {} };
  const nav = React.useRef(null);
  const [compact, setCompact] = React.useState(false);
  const [tight, setTight] = React.useState(false);
  const text = (n) => n == null || typeof n === "string" || typeof n === "number" || typeof n === "boolean" ? String(n) : null;
  const parts = steps.map((s) => [text(s.title), text(s.description), String(!!s.optional), s.status || ""]);
  const shape = parts.every((p) => p[0] != null && p[1] != null) ? parts.map((p) => p.join("")).join("\0") : steps;
  useIsoLayoutEffect(() => {
    const el = nav.current;
    if (!el || vertical) {
      setCompact(false);
      return;
    }
    el.setAttribute("data-fit", "");
    const fit = () => {
      const list = el.firstElementChild, has = (c) => el.classList.contains(c);
      el.classList.add("dk-stepper--measure");
      const need = list.scrollWidth;
      el.classList.remove("dk-stepper--measure");
      const narrow = need > el.clientWidth;
      let small = false;
      if (narrow && size === "md") {
        const was = [has("dk-stepper--compact"), has("dk-stepper--tight")];
        el.classList.add("dk-stepper--compact");
        el.classList.remove("dk-stepper--tight");
        small = list.scrollWidth > el.clientWidth;
        el.classList.toggle("dk-stepper--compact", was[0]);
        el.classList.toggle("dk-stepper--tight", was[1]);
      }
      setCompact(narrow);
      setTight(small);
    };
    fit();
    const fonts = typeof document !== "undefined" ? document.fonts : void 0;
    let live = true;
    if (fonts) {
      if (fonts.status !== "loaded") fonts.ready.then(() => {
        if (live) fit();
      }, () => {
      });
      fonts.addEventListener("loadingdone", fit);
    }
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    if (ro) ro.observe(el);
    return () => {
      live = false;
      if (fonts) fonts.removeEventListener("loadingdone", fit);
      if (ro) ro.disconnect();
    };
  }, [vertical, shape, size]);
  const going = React.useRef(null);
  useIsoLayoutEffect(() => {
    const el = nav.current, to = going.current;
    going.current = null;
    if (!el || to !== current) return;
    const active = document.activeElement;
    if (active && active !== document.body && el.contains(active)) return;
    const head = el.querySelectorAll(".dk-stepper__head")[current];
    if (head) head.focus();
  }, [current]);
  const shown = Math.min(current, steps.length - 1);
  return /* @__PURE__ */ React.createElement(
    "nav",
    {
      ...rest,
      ref: (node) => {
        nav.current = node;
        setRef(ref, node);
      },
      "aria-label": rest["aria-label"] || (rest["aria-labelledby"] ? void 0 : sds.labels.progress),
      className: cn("dk-stepper", vertical ? "dk-stepper--vertical" : "dk-stepper--horizontal", compact && "dk-stepper--compact", compact && tight && "dk-stepper--tight", "dk-stepper--size-" + size, props.className),
      "data-component": "stepper",
      "data-orientation": vertical ? "vertical" : "horizontal",
      "data-size": size
    },
    /* @__PURE__ */ React.createElement("ol", { className: "dk-stepper__list" }, steps.map((s, i) => {
      const state = s.status === "error" || s.status === "warning" ? s.status : i < current ? "complete" : i === current ? "current" : "upcoming";
      const clickable = !!props.onStepClick && (props.clickable === "all" ? i !== current : i < current);
      const Head = clickable ? "button" : "div";
      const hasDesc = s.description != null && s.description !== "";
      return /* @__PURE__ */ React.createElement("li", { key: i, className: cn("dk-stepper__step", "dk-stepper__step--" + state, i < current && "dk-stepper__step--done"), "data-state": state, "aria-current": i === current ? "step" : void 0 }, /* @__PURE__ */ React.createElement(Head, { className: "dk-stepper__head", ...clickable ? { type: "button", onClick: () => {
        going.current = i;
        props.onStepClick(i);
      } } : props.onStepClick && i === current ? { tabIndex: -1 } : {} }, /* @__PURE__ */ React.createElement("span", { className: "dk-stepper__indicator", "aria-hidden": true }, state === "complete" ? /* @__PURE__ */ React.createElement(Icon, { icon: icons.Check }) : state === "error" ? /* @__PURE__ */ React.createElement(Icon, { icon: icons.PriorityHigh }) : state === "warning" ? /* @__PURE__ */ React.createElement(Icon, { icon: icons.Warning }) : displayNumber(i + 1, locale)), /* @__PURE__ */ React.createElement("span", { className: "dk-stepper__text" }, /* @__PURE__ */ React.createElement("span", { className: "dk-stepper__title" }, s.title, state === "complete" ? /* @__PURE__ */ React.createElement(VisuallyHidden, null, ", " + L.completed) : state === "error" ? /* @__PURE__ */ React.createElement(VisuallyHidden, null, ", " + L.error) : state === "warning" ? /* @__PURE__ */ React.createElement(VisuallyHidden, null, ", " + L.warning) : null), hasDesc ? /* @__PURE__ */ React.createElement("span", { className: "dk-stepper__description" }, s.description) : null, s.optional ? /* @__PURE__ */ React.createElement("span", { className: "dk-stepper__description dk-stepper__optional" }, L.optional) : null)), i < steps.length - 1 ? /* @__PURE__ */ React.createElement("span", { className: "dk-stepper__connector", "aria-hidden": true }) : null);
    })),
    compact && shown >= 0 ? /* @__PURE__ */ React.createElement("p", { className: "dk-stepper__summary", "aria-hidden": true }, L.stepOf(shown + 1, steps.length) + ": ", /* @__PURE__ */ React.createElement("span", { className: "dk-stepper__title" }, steps[shown].title)) : null
  );
});
export {
  Stepper
};
//# sourceMappingURL=Stepper.js.map
