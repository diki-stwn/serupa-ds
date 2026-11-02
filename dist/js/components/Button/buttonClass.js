// src/components/Button/buttonClass.ts
import { cn, oneOf, SIZES } from "../../internal/cn.js";
var BUTTON_VARIANTS = ["primary", "secondary", "outline", "ghost", "link"];
function buttonClass(opts) {
  opts = opts || {};
  const v = oneOf(BUTTON_VARIANTS, opts.variant, "primary");
  const s = oneOf(SIZES, opts.size, "md");
  const iconOnly = !!opts.iconOnly, pos = opts.iconPosition;
  return cn("dk-btn", "dk-btn--" + v, opts.destructive && "dk-btn--destructive", "dk-btn--size-" + s, iconOnly && "dk-btn--icon-only", !iconOnly && (pos === "left" || pos === "right") && "dk-btn--icon-" + pos, !iconOnly && opts.wrap && "dk-btn--wrap", opts.className);
}
export {
  BUTTON_VARIANTS,
  buttonClass
};
//# sourceMappingURL=buttonClass.js.map
