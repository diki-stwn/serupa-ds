"use client";
import * as React from "react";
import { cn, oneOf, omit, setRef } from "../../internal/cn";
import { useRowWrap } from "../../internal/useRowWrap";
import { component } from "../../internal/component";
import type { ButtonGroupProps } from "../ButtonGroup/ButtonGroup";
import type { ToggleButtonProps } from "../ToggleButton/ToggleButton";

export interface ToggleGroupProps extends Omit<ButtonGroupProps, "defaultValue" | "onChange"> {
  /** 'single' (default): turning one on turns the others off, and pressing the one that's on turns it off. 'multiple': each turns on and off by itself. */
  type?: 'single' | 'multiple';
  /** The values of the buttons that are on (controlled). Use with onValueChange. */
  value?: string[];
  /** The values of the buttons that are on at first (uncontrolled). */
  defaultValue?: string[];
  /** Called with the values of the buttons that are on, when one is pressed. */
  onValueChange?: (value: string[]) => void;
  /** With type="single": one button always stays on, so pressing the one that's on does nothing. Default: false. */
  required?: boolean;
  /** Turns every button off and out of use. */
  disabled?: boolean;
  /** The buttons' size, for those that don't set their own. */
  size?: ToggleButtonProps["size"];
  /** The buttons' variant, for those that don't set their own: 'outline' (default) or 'ghost'. */
  variant?: ToggleButtonProps["variant"];
  /** ToggleButtons, each with a value ("bold", "left"). Other children render as they are. */
  children?: React.ReactNode;
}

/* ToggleGroup: a ButtonGroup whose ToggleButtons share one value. With type="single" it works like a set of
   radios that can all be off (text alignment, a view mode in a toolbar); with type="multiple" each button is its
   own setting but the group reports them together (bold, italic, underline). Each button keeps aria-pressed and
   its own Tab stop, as in a ButtonGroup; inside a Toolbar the arrow keys move between them. */
/** ToggleButtons that share one value: one on at a time, or any number. */
export const ToggleGroup = /* @__PURE__ */ component<HTMLDivElement, ToggleGroupProps>("ToggleGroup", function ToggleGroup(props, ref) {
  const rest = omit(props, { type: 1, value: 1, defaultValue: 1, onValueChange: 1, required: 1, disabled: 1, size: 1, variant: 1, attached: 1, orientation: 1, className: 1, children: 1 });
  const vertical = oneOf(["horizontal", "vertical"] as const, props.orientation, "horizontal") === "vertical";
  const single = props.type !== "multiple";
  const [own, setOwn] = React.useState<string[]>(props.defaultValue || []);
  const value = props.value !== undefined ? props.value : own;
  const change = (next: string[]) => {
    if (props.value === undefined) setOwn(next);
    if (props.onValueChange) props.onValueChange(next);
  };
  const press = (v: string, on: boolean) => {
    if (single) { if (on) change([v]); else if (!props.required) change([]); return; }
    change(on ? value.concat(v) : value.filter((x) => x !== v));
  };
  const children = React.Children.map(props.children, function (child) {
    if (!React.isValidElement<ToggleButtonProps>(child) || child.props.value == null) return child;
    const v = String(child.props.value), own = child.props;
    return React.cloneElement(child, {
      pressed: value.indexOf(v) >= 0,
      onPressedChange: (on: boolean) => { if (own.onPressedChange) own.onPressedChange(on); press(v, on); },
      size: own.size ?? props.size,
      variant: own.variant ?? props.variant,
      disabled: own.disabled || props.disabled,
    });
  });
  // As ButtonGroup: an attached row wider than its container wraps as separate buttons (GP1).
  const root = React.useRef<HTMLDivElement | null>(null);
  const wrapped = useRowWrap(root, props.attached !== false && !vertical, props.children);
  return (
    // ButtonGroup's markup and classes, so it looks and lays out the same.
    <div role="group" {...rest} ref={(n) => { root.current = n; setRef(ref, n); }} data-component="toggle-group" data-orientation={vertical ? "vertical" : "horizontal"} data-type={single ? "single" : "multiple"}
      data-wrapped={wrapped || undefined}
      className={cn("dk-button-group dk-toggle-group", vertical && "dk-button-group--vertical", props.attached !== false && !wrapped && "dk-button-group--attached", props.className)}>
      {children}
    </div>
  );
});
