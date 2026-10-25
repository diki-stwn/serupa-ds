// src/components/ButtonGroup/ButtonGroup.tsx
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
var ButtonGroup = /* @__PURE__ */ component("ButtonGroup", function ButtonGroup2(props, ref) {
  const rest = omit(props, { attached: 1, orientation: 1, className: 1 });
  const vertical = oneOf(["horizontal", "vertical"], props.orientation, "horizontal") === "vertical";
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      role: "group",
      ...rest,
      ref,
      "data-component": "button-group",
      "data-orientation": vertical ? "vertical" : "horizontal",
      className: cn("dk-button-group", vertical && "dk-button-group--vertical", props.attached !== false && "dk-button-group--attached", props.className)
    }
  );
});
export {
  ButtonGroup
};
//# sourceMappingURL=ButtonGroup.js.map
