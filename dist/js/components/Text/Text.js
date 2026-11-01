// src/components/Text/Text.tsx
import * as React from "react";
import { cn, oneOf } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
var TAGS = ["p", "span", "div", "label", "strong", "em", "small", "li", "figcaption"];
var SIZES = ["xs", "sm", "base", "lg", "xl"];
var TONES = ["default", "muted", "primary", "danger"];
var WEIGHTS = ["normal", "medium", "semibold", "bold"];
var pick = (list, v) => list.indexOf(v) < 0 ? null : v;
var Text = /* @__PURE__ */ component("Text", function Text2(props, ref) {
  const { as, size, tone, weight, truncate, measure, className, ...rest } = props;
  const s = pick(SIZES, size), t = pick(TONES, tone), w = pick(WEIGHTS, weight);
  return React.createElement(oneOf(TAGS, as, "p"), Object.assign(rest, {
    ref,
    "data-component": "text",
    className: cn("dk-text", s && "dk-text--" + s, t && "dk-text--" + t, w && "dk-text--" + w, truncate && "dk-text--truncate", measure && "dk-text--measure", className)
  }));
});
export {
  Text
};
//# sourceMappingURL=Text.js.map
