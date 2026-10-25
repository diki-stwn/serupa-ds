import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn";
import { space, type Space } from "../../internal/space";
import { component } from "../../internal/component";

export interface StackProps extends React.HTMLAttributes<HTMLElement> {
  /** 'column' (default): items one under another. 'row': side by side. */
  direction?: 'column' | 'row';
  /** The space between items, a step of the spacing scale (4 → 16px). Default: 4. */
  gap?: Space;
  /** Cross-axis alignment: 'stretch' (default for columns), 'start', 'center' (default for rows), 'end' or 'baseline'. */
  align?: 'stretch' | 'start' | 'center' | 'end' | 'baseline';
  /** Main-axis distribution: 'start' (default), 'center', 'end' or 'between'. */
  justify?: 'start' | 'center' | 'end' | 'between';
  /** Lets a row wrap onto more lines. Default: false. */
  wrap?: boolean;
  /** The element. Default: 'div'. */
  as?: 'div' | 'section' | 'ul' | 'ol' | 'nav' | 'header' | 'footer' | 'form' | 'fieldset' | 'span';
}

const TAGS = ["div", "section", "ul", "ol", "nav", "header", "footer", "form", "fieldset", "span"] as const;

/* Stack: lays its children out in a column (or a row) with even space between them, from the spacing scale.
   className, style and every other prop go to the element. */
/** Lays children out in a column or a row, with even space from the spacing scale between them. */
export const Stack = /* @__PURE__ */ component<HTMLElement, StackProps>("Stack", function Stack(props, ref) {
  const rest = omit(props, { direction: 1, gap: 1, align: 1, justify: 1, wrap: 1, as: 1, className: 1, style: 1 });
  const row = props.direction === "row";
  const align = oneOf(["stretch", "start", "center", "end", "baseline"] as const, props.align, row ? "center" : "stretch");
  const justify = oneOf(["start", "center", "end", "between"] as const, props.justify, "start");
  const gap = space(props.gap);
  return React.createElement(oneOf(TAGS, props.as, "div"), Object.assign(rest, {
    ref: ref, "data-component": "stack",
    className: cn("dk-stack", row && "dk-stack--row", "dk-stack--align-" + align, justify !== "start" && "dk-stack--justify-" + justify, props.wrap && "dk-stack--wrap", props.className),
    style: gap ? Object.assign({ "--dk-stack-gap": gap }, props.style) : props.style,
  }));
});
