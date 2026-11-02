// src/components/Grid/Grid.tsx
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn.js";
import { space } from "../../internal/space.js";
import { component } from "../../internal/component.js";
var TAGS = ["div", "section", "ul", "ol"];
var Grid = /* @__PURE__ */ component("Grid", function Grid2(props, ref) {
  const rest = omit(props, { columns: 1, minColumnWidth: 1, fill: 1, gap: 1, as: 1, className: 1, style: 1 });
  const n = typeof props.columns === "number" ? Math.round(props.columns) : 0;
  const cols = n >= 1 && n <= 12 ? n : 0;
  const vars = {};
  const gap = space(props.gap);
  if (gap) vars["--dk-grid-gap"] = gap;
  if (cols) vars["--dk-grid-cols"] = String(cols);
  const kind = !cols ? "auto" : props.minColumnWidth ? "upto" : "fixed";
  if (props.minColumnWidth) vars["--dk-grid-min"] = /^[a-z][a-z0-9-]*$/.test(props.minColumnWidth) ? "var(--" + props.minColumnWidth + ")" : props.minColumnWidth;
  const tag = oneOf(TAGS, props.as, "div");
  return React.createElement(tag, Object.assign(rest, {
    ref,
    "data-component": "grid",
    role: rest.role ?? (tag === "ul" || tag === "ol" ? "list" : void 0),
    className: cn("dk-grid", "dk-grid--" + kind, props.fill && kind !== "fixed" && "dk-grid--fill", props.className),
    style: Object.assign(vars, props.style)
  }));
});
export {
  Grid
};
//# sourceMappingURL=Grid.js.map
