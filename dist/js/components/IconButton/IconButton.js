// src/components/IconButton/IconButton.tsx
import * as React from "react";
import { cn } from "../../internal/cn.js";
import { ButtonBase } from "../Button/Button.js";
import { component } from "../../internal/component.js";
import { warnOnce } from "../../internal/warn.js";
var IconButton = /* @__PURE__ */ component("IconButton", function IconButton2(props, ref) {
  const { icon, label, shape, hideTitle, noTitle, className, ...rest } = props;
  if (process.env.NODE_ENV !== "production" && noTitle != null) warnOnce("icon-button-no-title", "IconButton: noTitle is deprecated and is removed in 12.0.0. Use hideTitle, which does the same.");
  const round = shape === "round";
  const shown = hideTitle || noTitle || rest["aria-describedby"] != null || rest["aria-labelledby"] != null;
  const name = label || rest["aria-label"];
  const title = !shown && rest.title == null ? name : rest.title;
  return /* @__PURE__ */ React.createElement(
    ButtonBase,
    {
      variant: "ghost",
      ...rest,
      "aria-label": name,
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
