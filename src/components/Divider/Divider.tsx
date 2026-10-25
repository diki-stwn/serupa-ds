import * as React from "react";
import { cn, omit } from "../../internal/cn";
import { component } from "../../internal/component";

export interface DividerProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** 'horizontal' (default) or 'vertical' (between items in a row: it takes the row's height). */
  orientation?: 'horizontal' | 'vertical';
  /** Text in the middle of a horizontal line, such as "or". */
  label?: React.ReactNode;
  /** Leaves it out of the accessibility tree, when it's only decoration. Default: false. */
  decorative?: boolean;
}

/* Divider: a 1px line between content, horizontal (an <hr>) or vertical, with an optional label in the middle.
   It's a separator for screen readers unless decorative. className and every other prop go to the element. */
/** A line between content, horizontal or vertical, with an optional label such as "or". */
export const Divider = /* @__PURE__ */ component<HTMLElement, DividerProps>("Divider", function Divider(props, ref) {
  const rest = omit(props, { orientation: 1, label: 1, decorative: 1, className: 1 });
  const vertical = props.orientation === "vertical";
  const label = props.label != null && props.label !== false && props.label !== "" && !vertical ? props.label : null;
  const cls = cn("dk-divider", vertical && "dk-divider--vertical", label != null && "dk-divider--label", props.className);
  const a11y: React.AriaAttributes & { role?: React.AriaRole } = props.decorative ? { role: "none", "aria-hidden": true } : { role: "separator", "aria-orientation": vertical ? "vertical" : undefined };
  if (label == null && !vertical) return React.createElement("hr", Object.assign(rest, a11y, { ref: ref, className: cls, "data-component": "divider", role: props.decorative ? "none" : undefined }));
  return React.createElement("div", Object.assign(rest, a11y, { ref: ref, className: cls, "data-component": "divider" }),
    label != null ? <span className="dk-divider__label">{label}</span> : null);
});
