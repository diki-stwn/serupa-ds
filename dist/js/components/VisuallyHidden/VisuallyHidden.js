// src/components/VisuallyHidden/VisuallyHidden.tsx
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
var TAGS = ["span", "div", "h1", "h2", "h3", "h4", "h5", "h6", "p", "label", "legend"];
var VisuallyHidden = /* @__PURE__ */ component("VisuallyHidden", function VisuallyHidden2(props, ref) {
  const rest = omit(props, { focusable: 1, as: 1, className: 1 });
  return React.createElement(oneOf(TAGS, props.as, "span"), Object.assign(rest, {
    ref,
    "data-component": "visually-hidden",
    className: cn("dk-visually-hidden", props.focusable && "dk-visually-hidden--focusable", props.className)
  }));
});
export {
  VisuallyHidden
};
//# sourceMappingURL=VisuallyHidden.js.map
