"use client";

// src/components/Textarea/Textarea.tsx
import * as React from "react";
import { cn, domId, isInvalid, oneOf, omit, setRef, SIZES, useIsoLayoutEffect } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useFieldControl } from "../../internal/field.js";
import { displayNumber } from "../../internal/numbers.js";
import { useLocale } from "../../internal/provider.js";
import { useTextLimit } from "../../internal/textLimit.js";
var PLAIN = { useGrouping: false };
var OWN = { size: 1, invalid: 1, rows: 1, autoResize: 1, maxRows: 1, resize: 1, showCount: 1, className: 1, style: 1 };
var Textarea = /* @__PURE__ */ component("Textarea", function Textarea2(props, ref) {
  props = useFieldControl(props);
  const rest = omit(props, OWN);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  const rows = props.rows > 0 ? Math.floor(props.rows) : 3;
  const auto = !!props.autoResize;
  const maxRows = props.maxRows > 0 ? Math.max(rows, Math.floor(props.maxRows)) : 0;
  const resize = auto || props.resize === "none" ? "none" : "vertical";
  const own = React.useRef(null);
  const { length, max } = useTextLimit(rest, own, { announce: !!props.showCount });
  const countId = domId("dk-ta", React.useId());
  const locale = useLocale();
  const num = (n) => displayNumber(n, locale, PLAIN);
  const fit = React.useCallback(function() {
    const el = own.current;
    if (!auto || !el) return;
    const cs = getComputedStyle(el), line = parseFloat(cs.lineHeight) || 0, pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    el.style.height = "auto";
    const need = el.scrollHeight, max2 = maxRows ? maxRows * line + pad : Infinity;
    el.style.height = Math.min(need, max2) + "px";
    el.style.overflowY = need > max2 ? "auto" : "hidden";
  }, [auto, maxRows]);
  useIsoLayoutEffect(fit, [fit, rest.value, length, size, rows]);
  if (auto) {
    const changed = rest.onChange;
    rest.onChange = function(e) {
      if (changed) changed(e);
      fit();
    };
  }
  React.useEffect(function() {
    if (!auto || typeof ResizeObserver === "undefined" || !own.current) return;
    let w = own.current.offsetWidth, raf = 0;
    const ro = new ResizeObserver(function() {
      const nw = own.current && own.current.offsetWidth;
      if (nw !== w) {
        w = nw;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(fit);
      }
    });
    ro.observe(own.current);
    return function() {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [auto, fit]);
  const setRefs = React.useCallback(function(node) {
    own.current = node;
    setRef(ref, node);
  }, [ref]);
  if (props.showCount) rest["aria-describedby"] = cn(rest["aria-describedby"], countId);
  return /* @__PURE__ */ React.createElement("span", { className: cn("dk-textarea", "dk-textarea--size-" + size, invalid && "dk-textarea--invalid", rest.disabled && "dk-textarea--disabled", rest.readOnly && "dk-textarea--readonly", resize === "none" && "dk-textarea--resize-none", auto && "dk-textarea--auto", props.className), style: props.style, "data-component": "textarea", "data-size": size }, /* @__PURE__ */ React.createElement("textarea", { ...rest, ref: setRefs, rows, className: "dk-textarea__field", key: "field" }), props.showCount ? /* @__PURE__ */ React.createElement("span", { className: cn("dk-textarea__count", max != null && length >= max && "dk-textarea__count--full"), id: countId, key: "count" }, max != null ? num(length) + " / " + num(max) : num(length)) : null);
});
export {
  Textarea
};
//# sourceMappingURL=Textarea.js.map
