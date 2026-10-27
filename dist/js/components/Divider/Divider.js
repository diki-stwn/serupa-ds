// src/components/Divider/Divider.tsx
import * as React from "react";
import { cn, omit } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
var Divider = /* @__PURE__ */ component("Divider", function Divider2(props, ref) {
  const rest = omit(props, { orientation: 1, label: 1, decorative: 1, className: 1 });
  const vertical = props.orientation === "vertical";
  const label = props.label != null && props.label !== false && props.label !== "" && !vertical ? props.label : null;
  const cls = cn("dk-divider", vertical && "dk-divider--vertical", label != null && "dk-divider--label", props.className);
  const a11y = props.decorative ? { role: "none", "aria-hidden": true } : { role: "separator", "aria-orientation": vertical ? "vertical" : void 0 };
  if (label != null && !props.decorative) {
    if (typeof label === "string" || typeof label === "number") {
      if (rest["aria-label"] == null) a11y["aria-label"] = String(label);
    } else {
      delete a11y.role;
    }
  }
  if (label == null && !vertical) return React.createElement("hr", Object.assign(rest, a11y, { ref, className: cls, "data-component": "divider", role: props.decorative ? "none" : void 0 }));
  return React.createElement(
    "div",
    Object.assign(rest, a11y, { ref, className: cls, "data-component": "divider" }),
    label != null ? /* @__PURE__ */ React.createElement("span", { className: "dk-divider__label" }, label) : null
  );
});
export {
  Divider
};
//# sourceMappingURL=Divider.js.map
