"use client";
import * as React from "react";
import { cn, oneOf, omit, setRef, useIsoLayoutEffect } from "../../internal/cn";
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
  // An attached row wider than its container (six buttons at 320px) wraps as separate buttons rather than scrolling the
  // page sideways (WCAG 1.4.10), and joins again once there's room for the row.
  const root = React.useRef<HTMLDivElement | null>(null);
  const [wrapped, setWrapped] = React.useState(false);
  const fits = attached && !vertical;
  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el || !fits || typeof ResizeObserver === "undefined") { setWrapped(false); return; }
    const measure = () => {
      const kids = [...el.children] as HTMLElement[];
      // Attached, it's capped at its container's width, so a row that doesn't fit overflows. Wrapped, it's as wide as
      // its container, and the row fits once the buttons side by side are no wider.
      if (el.classList.contains("dk-button-group--attached")) { if (el.scrollWidth > el.clientWidth + 1) setWrapped(true); }
      else if (kids.reduce((w, k) => w + k.offsetWidth, 0) <= el.clientWidth) setWrapped(false);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const k of el.children) ro.observe(k);
    measure();
    return () => ro.disconnect();
  }, [fits, props.children]);
  return <div role="group" {...rest} ref={(n) => { root.current = n; setRef(ref, n); }} data-component="button-group" data-orientation={vertical ? "vertical" : "horizontal"}
    data-wrapped={wrapped || undefined}
    className={cn("dk-button-group", vertical && "dk-button-group--vertical", attached && !wrapped && "dk-button-group--attached", props.className)} />;
});
