"use client";

// src/components/Loader/Loader.tsx
import * as React from "react";
import { cn, domId, oneOf, omit, SIZES } from "../../internal/cn.js";
import { announce, ensureAnnouncer } from "../../internal/announce.js";
import { component } from "../../internal/component.js";
import { useSettings } from "../../internal/provider.js";
import { useShowAfter } from "../../internal/showAfter.js";
import { spinnerDelay } from "../../internal/timing.js";
var VARIANTS = ["ring", "spokes", "dots", "pixel", "text", "skeleton"];
var SHAPES = ["text", "circle", "rect"];
var TONES = ["neutral", "primary", "muted", "inverse"];
var PATTERNS = ["wave", "random", "sweep", "fall", "rise", "snake", "spiral", "cross", "checker"];
var PIXEL_STEPS = {
  sweep: [0, 2, 4, 0, 2, 4, 0, 2, 4],
  // columns, left to right
  fall: [0, 0, 0, 2, 2, 2, 4, 4, 4],
  // rows, top to bottom
  rise: [4, 4, 4, 2, 2, 2, 0, 0, 0],
  // rows, bottom to top
  snake: [0, 1, 2, 5, 4, 3, 6, 7, 8],
  // left to right, then back, row by row
  spiral: [0, 1, 2, 7, 8, 3, 6, 5, 4],
  // clockwise round the edge from the top-left, then the center
  cross: [0, 7, 0, 7, 7, 7, 0, 7, 0],
  // the corners, then the plus (edges and center)
  checker: [0, 7, 0, 7, 0, 7, 0, 7, 0]
  // the X (corners and center), then the edges
};
var OWN = { variant: 1, size: 1, tone: 1, label: 1, delay: 1, loading: 1, shape: 1, lines: 1, pattern: 1, glow: 1, className: 1 };
var Loader = /* @__PURE__ */ component("Loader", function Loader2(props, ref) {
  const sds = useSettings();
  const rest = omit(props, OWN);
  const variant = oneOf(VARIANTS, props.variant, "ring");
  const size = oneOf(SIZES, props.size, "md");
  const tone = oneOf(TONES, props.tone, "neutral");
  const label = props.label == null ? sds.labels.loading : String(props.label);
  const isText = variant === "text", isSkeleton = variant === "skeleton";
  const shape = oneOf(SHAPES, props.shape, "text");
  const pattern = oneOf(PATTERNS, props.pattern, "wave");
  const lines = Math.min(20, Math.max(1, Math.floor(Number(props.lines)) || 1));
  const words = label || sds.labels.loading;
  const delay = props.delay == null ? spinnerDelay : Math.max(0, Number(props.delay) || 0);
  const [wait] = React.useState(delay);
  const loading = props.loading !== false;
  const shown = useShowAfter(loading, wait);
  React.useEffect(function() {
    ensureAnnouncer();
  }, []);
  const latestLabel = React.useRef(label);
  React.useEffect(function() {
    latestLabel.current = label;
  });
  React.useEffect(function() {
    if (shown && latestLabel.current) announce(latestLabel.current);
  }, [shown]);
  rest["data-component"] = "loader";
  rest["data-variant"] = variant;
  rest["data-size"] = size;
  if (isSkeleton) rest["data-shape"] = shape;
  if (variant === "pixel") rest["data-pattern"] = pattern;
  if (shown && label) {
    rest.role = "progressbar";
    rest["aria-label"] = label;
  } else rest["aria-hidden"] = true;
  const maskId = domId("dk-px", React.useId());
  const cells = [];
  if (variant === "pixel") for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
    cells.push(/* @__PURE__ */ React.createElement("rect", { key: r * 3 + c, className: "dk-loader__px " + (pattern === "wave" ? "dk-loader__px--d" + (r + c) : pattern === "random" ? "dk-loader__px--r" + (r * 3 + c) : "dk-loader__px--s" + PIXEL_STEPS[pattern][r * 3 + c]), x: c * 8, y: r * 8, width: 8, height: 8 }));
  const drawing = !shown || isText ? null : variant === "pixel" ? /* @__PURE__ */ React.createElement("svg", { width: "1em", height: "1em", viewBox: "0 0 24 24", "aria-hidden": true, focusable: "false" }, /* @__PURE__ */ React.createElement("mask", { id: maskId, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 24, height: 24 }, /* @__PURE__ */ React.createElement("rect", { width: 24, height: 24, fill: "white" }), /* @__PURE__ */ React.createElement("path", { className: "dk-loader__px-cut", d: "M16 0V48M32 0V48M0 16H48M0 32H48", transform: "scale(0.5)" })), /* @__PURE__ */ React.createElement("g", { mask: "url(#" + maskId + ")" }, cells), /* @__PURE__ */ React.createElement("path", { className: "dk-loader__px-divider", d: "M16 0V48M32 0V48M0 16H48M0 32H48", transform: "scale(0.5)" })) : variant === "spokes" ? /* @__PURE__ */ React.createElement("svg", { width: "1em", height: "1em", viewBox: "0 0 24 24", "aria-hidden": true, focusable: "false" }, /* @__PURE__ */ React.createElement("g", { transform: "scale(0.625)" }, [0, 1, 2, 3, 4, 5, 6, 7].map(function(k) {
    return /* @__PURE__ */ React.createElement("line", { key: k, className: "dk-loader__spoke", x1: 19.2, y1: 4, x2: 19.2, y2: 9.6, transform: "rotate(" + -45 * k + " 19.2 19.2)" });
  }))) : variant === "dots" ? /* @__PURE__ */ React.createElement("svg", { width: "1em", height: "1em", viewBox: "0 0 24 24", "aria-hidden": true, focusable: "false" }, /* @__PURE__ */ React.createElement("circle", { className: "dk-loader__dot", cx: 4, cy: 12, r: 2.5 }), /* @__PURE__ */ React.createElement("circle", { className: "dk-loader__dot", cx: 12, cy: 12, r: 2.5 }), /* @__PURE__ */ React.createElement("circle", { className: "dk-loader__dot", cx: 20, cy: 12, r: 2.5 })) : /* @__PURE__ */ React.createElement("svg", { width: "1em", height: "1em", viewBox: "0 0 24 24", "aria-hidden": true, focusable: "false" }, /* @__PURE__ */ React.createElement("circle", { className: "dk-loader__track", cx: 12, cy: 12, r: 10 }), /* @__PURE__ */ React.createElement("circle", { className: "dk-loader__arc", cx: 12, cy: 12, r: 10, pathLength: 100, strokeDasharray: "25 150" }));
  const text = isText ? /* @__PURE__ */ React.createElement("span", { className: "dk-loader__label", "aria-hidden": true, key: "label" }, words, /* @__PURE__ */ React.createElement("span", { className: "dk-loader__glint", "data-words": words })) : null;
  const cls = cn("dk-loader", "dk-loader--" + variant, isSkeleton && "dk-loader--shape-" + shape, variant === "pixel" && pattern !== "wave" && "dk-loader--pattern-" + pattern, variant === "pixel" && props.glow && "dk-loader--glow", "dk-loader--size-" + size, tone !== "neutral" && "dk-loader--" + tone, !shown && "dk-loader--waiting", props.className);
  if (!loading && !shown) return null;
  if (isSkeleton) {
    const bones = [];
    if (shape === "text") for (let i = 0; i < lines; i++) bones.push(/* @__PURE__ */ React.createElement("span", { className: "dk-loader__line", key: i }, /* @__PURE__ */ React.createElement("span", { className: "dk-loader__bone" })));
    else bones.push(/* @__PURE__ */ React.createElement("span", { className: "dk-loader__bone", key: "bone" }));
    return /* @__PURE__ */ React.createElement("span", { ...rest, ref, className: cls }, bones);
  }
  return /* @__PURE__ */ React.createElement("span", { ...rest, ref, className: cls }, isText ? null : /* @__PURE__ */ React.createElement("span", { className: "dk-loader__art", key: "art" }, drawing), text);
});
export {
  Loader
};
//# sourceMappingURL=Loader.js.map
