"use client";
import * as React from "react";
import { cn, oneOf, omit, setRef } from "../../internal/cn";
import { useRowWrap } from "../../internal/useRowWrap";
import { component } from "../../internal/component";

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Buttons, IconButtons or ToggleButtons. */
  children?: React.ReactNode;
  /** Joins them into one control: shared borders, outer corners only. Default: true. */
  attached?: boolean;
  /** 'horizontal' (default) or 'vertical'. */
  orientation?: 'horizontal' | 'vertical';
  /** What the group is for ("Text formatting"), for screen readers. */
  "aria-label"?: string;
}

/* ButtonGroup: related buttons side by side (or stacked) in a role="group": attached into one control, or
   spaced apart. Size and variant stay on each button. className and every other prop go to the wrapper. */
/** Related buttons in a row or a column, joined into one control or spaced apart. */
export const ButtonGroup = /* @__PURE__ */ component<HTMLDivElement, ButtonGroupProps>("ButtonGroup", function ButtonGroup(props, ref) {
  const rest = omit(props, { attached: 1, orientation: 1, className: 1 });
  const vertical = oneOf(["horizontal", "vertical"] as const, props.orientation, "horizontal") === "vertical";
  const attached = props.attached !== false;
  // An attached row wider than its container wraps as separate buttons (useRowWrap).
  const root = React.useRef<HTMLDivElement | null>(null);
  const wrapped = useRowWrap(root, attached && !vertical, props.children);
  return <div role="group" {...rest} ref={(n) => { root.current = n; setRef(ref, n); }} data-component="button-group" data-orientation={vertical ? "vertical" : "horizontal"}
    data-wrapped={wrapped || undefined}
    className={cn("dk-button-group", vertical && "dk-button-group--vertical", attached && !wrapped && "dk-button-group--attached", props.className)} />;
});
