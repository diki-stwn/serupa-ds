import { cn, oneOf, SIZES } from "../../internal/cn";
import type { ButtonSize, ButtonVariant } from "./Button";

// In its own module, without "use client", so a Server Component can call it (a function from a client module is
// only a reference there). Button.tsx re-exports it.

export const BUTTON_VARIANTS: readonly ButtonVariant[] = ["primary", "secondary", "outline", "ghost", "link"];

/** The button's class names, for styling any other element as a button. iconPosition adds the optical padding for one icon beside a label; wrap lets the label take more than one line. */
export function buttonClass(opts?: { variant?: ButtonVariant; destructive?: boolean; size?: ButtonSize; iconOnly?: boolean; iconPosition?: 'left' | 'right'; wrap?: boolean; className?: string }): string {
  opts = opts || {};
  const v = oneOf(BUTTON_VARIANTS, opts.variant, "primary");
  const s = oneOf(SIZES, opts.size, "md");
  const iconOnly = !!opts.iconOnly, pos = opts.iconPosition;
  return cn("dk-btn", "dk-btn--" + v, opts.destructive && "dk-btn--destructive", "dk-btn--size-" + s, iconOnly && "dk-btn--icon-only", !iconOnly && (pos === "left" || pos === "right") && "dk-btn--icon-" + pos, !iconOnly && opts.wrap && "dk-btn--wrap", opts.className);
}
