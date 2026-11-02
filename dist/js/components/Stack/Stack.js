// src/components/Stack/Stack.tsx
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn.js";
import { space } from "../../internal/space.js";
import { component } from "../../internal/component.js";
var TAGS = ["div", "section", "ul", "ol", "nav", "header", "footer", "form", "fieldset", "span"];
var Stack = /* @__PURE__ */ component("Stack", function Stack2(props, ref) {
  const rest = omit(props, { direction: 1, gap: 1, align: 1, justify: 1, wrap: 1, as: 1, className: 1, style: 1 });
  const row = props.direction === "row";
  const align = oneOf(["stretch", "start", "center", "end", "baseline"], props.align, row ? "center" : "stretch");
  const justify = oneOf(["start", "center", "end", "between"], props.justify, "start");
  const gap = space(props.gap);
  const tag = oneOf(TAGS, props.as, "div");
  return React.createElement(tag, Object.assign(rest, {
    ref,
    "data-component": "stack",
    role: rest.role ?? (tag === "ul" || tag === "ol" ? "list" : void 0),
    className: cn("dk-stack", row && "dk-stack--row", "dk-stack--align-" + align, justify !== "start" && "dk-stack--justify-" + justify, props.wrap && "dk-stack--wrap", props.className),
    style: gap ? Object.assign({ "--dk-stack-gap": gap }, props.style) : props.style
  }));
});
export {
  Stack
};
//# sourceMappingURL=Stack.js.map
