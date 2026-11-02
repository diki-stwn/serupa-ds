// src/components/Heading/Heading.tsx
import * as React from "react";
import { cn } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
var SIZES = ["sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"];
var Heading = /* @__PURE__ */ component("Heading", function Heading2(props, ref) {
  const { level: lv, size: sz, className, ...rest } = props;
  const level = [1, 2, 3, 4, 5, 6].indexOf(lv) < 0 ? 2 : lv;
  const size = SIZES.indexOf(sz) < 0 ? null : sz;
  return React.createElement("h" + level, Object.assign(rest, {
    ref,
    className: cn("dk-heading", "dk-heading--" + level, size && "dk-heading--size-" + size, className),
    "data-component": "heading"
  }));
});
export {
  Heading
};
//# sourceMappingURL=Heading.js.map
