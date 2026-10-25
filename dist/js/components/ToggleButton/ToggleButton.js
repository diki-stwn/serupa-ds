"use client";

// src/components/ToggleButton/ToggleButton.tsx
import * as React from "react";
import { cn, oneOf } from "../../internal/cn.js";
import { Button } from "../Button/Button.js";
import { component } from "../../internal/component.js";
var ToggleButton = /* @__PURE__ */ component("ToggleButton", function ToggleButton2(props, ref) {
  const { pressed, defaultPressed, onPressedChange, variant, className, onClick, ...rest } = props;
  const [own, setOwn] = React.useState(!!defaultPressed);
  const controlled = pressed !== void 0;
  const on = controlled ? !!pressed : own;
  const v = oneOf(["outline", "ghost"], variant, "outline");
  return /* @__PURE__ */ React.createElement(
    Button,
    {
      ...rest,
      ref,
      variant: v,
      "aria-pressed": on,
      className: cn("dk-toggle-button", on && "dk-toggle-button--pressed", className),
      onClick: (e) => {
        if (onClick) onClick(e);
        if (e.defaultPrevented) return;
        if (!controlled) setOwn(!on);
        if (onPressedChange) onPressedChange(!on);
      }
    }
  );
});
export {
  ToggleButton
};
//# sourceMappingURL=ToggleButton.js.map
