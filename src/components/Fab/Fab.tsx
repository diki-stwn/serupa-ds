import * as React from "react";
import type { IconSource } from "../Icon/Icon";
import { cn, oneOf } from "../../internal/cn";
import { ButtonBase, type ButtonAsButtonProps } from "../Button/Button";
import { component } from "../../internal/component";

export type FabPosition = 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start' | 'static';

export interface FabProps extends Omit<ButtonAsButtonProps, 'icon' | 'leftIcon' | 'rightIcon' | 'children' | 'variant' | 'size' | 'aria-label'> {
  /** The icon: a custom or Material Symbols name ("add") or any element. */
  icon: IconSource;
  /** What the button does. Shown next to the icon when extended; otherwise its aria-label and title. */
  label: string;
  /** Shows the label next to the icon (an extended FAB). Default: false. */
  extended?: boolean;
  /** 'md' (default, 56px) or 'sm' (40px). */
  size?: 'sm' | 'md';
  /** Where it's fixed on the screen: 'bottom-end' (default), 'bottom-start', 'top-end' or 'top-start', 24px from the corner; 'static' leaves the placing to you. */
  position?: FabPosition;
}

/* Fab: a floating action button for a screen's main action. A round, raised primary Button fixed to a corner of
   the screen (position), 56px (or 40px with size="sm"); extended shows the label next to the icon. Every other
   Button prop (onClick, loading, disabled, destructive, ref…) works the same. */
const POSITIONS: readonly FabPosition[] = ["bottom-end", "bottom-start", "top-end", "top-start", "static"];

/** A floating action button: the screen's main action, round and raised, fixed to a corner. */
export const Fab = /* @__PURE__ */ component<HTMLButtonElement, FabProps>("Fab", function Fab(props, ref) {
  const { icon, label, extended, size, position, className, ...rest } = props;
  const pos = oneOf(POSITIONS, position, "bottom-end");
  const sm = size === "sm";
  const look = { variant: "primary", size: sm ? "sm" : "md", "data-position": pos,
    className: cn("dk-fab", sm && "dk-fab--sm", extended && "dk-fab--extended", pos !== "static" && "dk-fab--" + pos, className) } as const;
  return extended
    ? <ButtonBase {...rest} {...look} ref={ref} leftIcon={icon}>{label}</ButtonBase>
    : <ButtonBase title={label} {...rest} {...look} ref={ref} icon={icon} aria-label={label} />;
});
