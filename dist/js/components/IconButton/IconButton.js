// src/components/IconButton/IconButton.tsx
import * as React from "react";
import { cn } from "../../internal/cn.js";
import { ButtonBase } from "../Button/Button.js";
import { component } from "../../internal/component.js";
var IconButton = /* @__PURE__ */ component("IconButton", function IconButton2(props, ref) {
  const { icon, label, shape, noTitle, className, ...rest } = props;
  const round = shape === "round";
  const title = !noTitle && rest.title == null ? label : rest.title;
  return /* @__PURE__ */ React.createElement(
    ButtonBase,
    {
      variant: "ghost",
      ...rest,
      "aria-label": label,
      "data-shape": round ? "round" : "square",
      title,
      ref,
      icon,
      className: cn("dk-icon-btn", round && "dk-icon-btn--round", className)
    }
  );
});
export {
  IconButton
};
//# sourceMappingURL=IconButton.js.map
