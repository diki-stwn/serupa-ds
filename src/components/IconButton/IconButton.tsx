import * as React from "react";
import type { IconSource } from "../Icon/Icon";
import { cn } from "../../internal/cn";
import { ButtonBase, type ButtonAsButtonProps, type ButtonAsLinkProps } from "../Button/Button";
import { component } from "../../internal/component";

type Without<T> = T extends unknown ? Omit<T, 'icon' | 'leftIcon' | 'rightIcon' | 'children' | 'aria-label'> : never;

interface IconButtonOwnProps {
  /** The icon: a custom or Material Symbols name ("more_vert") or any element. */
  icon: IconSource;
  /** What the button does, for screen readers (its aria-label) and as a tooltip (title). Required: an icon alone has no name. */
  label: string;
  /** 'square' (default, the Button's corners) or 'round'. */
  shape?: 'square' | 'round';
  /** Leaves out the title tooltip, for when a Tooltip or visible text already shows the label. Default: false. */
  noTitle?: boolean;
}

export type IconButtonProps = Without<ButtonAsButtonProps> & IconButtonOwnProps | Without<ButtonAsLinkProps> & IconButtonOwnProps;

// Named, so the type declarations print it as written: a bare union's members come out in whichever order the
// compiler met them, and index.d.ts then differs from one build to the next (tools/test/reproducible.mjs).
type IconButtonElement = HTMLButtonElement | HTMLAnchorElement;

/* IconButton: a Button that shows only an icon, with a required label (its accessible name and a title tooltip).
   Variant defaults to "ghost"; shape "square" (default) or "round". Every other Button prop (size, destructive,
   loading, href, onClick, ref…) works the same. */
/** A Button that shows only an icon, with a required label for screen readers. Default variant: ghost. */
export const IconButton = /* @__PURE__ */ component<IconButtonElement, IconButtonProps>("IconButton", function IconButton(props, ref) {
  const { icon, label, shape, noTitle, className, ...rest } = props;
  const round = shape === "round";
  const title = !noTitle && rest.title == null ? label : rest.title;
  return <ButtonBase variant="ghost" {...rest} aria-label={label} data-shape={round ? "round" : "square"} title={title}
    ref={ref} icon={icon} className={cn("dk-icon-btn", round && "dk-icon-btn--round", className)} />;
});
