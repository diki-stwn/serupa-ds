// src/components/Container/Container.tsx
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
var SIZES = ["prose", "md", "lg", "xl", "2xl", "full"];
var TAGS = ["div", "main", "section", "header", "footer", "article"];
var Container = /* @__PURE__ */ component("Container", function Container2(props, ref) {
  const rest = omit(props, { size: 1, padded: 1, as: 1, className: 1 });
  const size = oneOf(SIZES, props.size, "xl");
  return React.createElement(oneOf(TAGS, props.as, "div"), Object.assign(rest, {
    ref,
    "data-component": "container",
    "data-size": size,
    className: cn("dk-container", "dk-container--" + size, props.padded !== false && "dk-container--padded", props.className)
  }));
});
export {
  Container
};
//# sourceMappingURL=Container.js.map
