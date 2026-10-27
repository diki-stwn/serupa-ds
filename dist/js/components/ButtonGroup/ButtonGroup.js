"use client";

// src/components/ButtonGroup/ButtonGroup.tsx
import * as React from "react";
import { cn, oneOf, omit, setRef } from "../../internal/cn.js";
import { useRowWrap } from "../../internal/useRowWrap.js";
import { component } from "../../internal/component.js";
var ButtonGroup = /* @__PURE__ */ component("ButtonGroup", function ButtonGroup2(props, ref) {
  const rest = omit(props, { attached: 1, orientation: 1, className: 1 });
  const vertical = oneOf(["horizontal", "vertical"], props.orientation, "horizontal") === "vertical";
  const attached = props.attached !== false;
  const root = React.useRef(null);
  const wrapped = useRowWrap(root, attached && !vertical, props.children);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      role: "group",
      ...rest,
      ref: (n) => {
        root.current = n;
        setRef(ref, n);
      },
      "data-component": "button-group",
      "data-orientation": vertical ? "vertical" : "horizontal",
      "data-wrapped": wrapped || void 0,
      className: cn("dk-button-group", vertical && "dk-button-group--vertical", attached && !wrapped && "dk-button-group--attached", props.className)
    }
  );
});
export {
  ButtonGroup
};
//# sourceMappingURL=ButtonGroup.js.map
