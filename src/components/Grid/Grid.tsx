import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn";
import { useServerStyles } from "../../internal/serverStyles";
import { space, type Space } from "../../internal/space";
import { component } from "../../internal/component";

export interface GridProps extends React.HTMLAttributes<HTMLElement> {
  /** A number of equal columns (1 to 12), or 'auto' (default): as many columns as fit, each at least minColumnWidth. */
  columns?: number | 'auto';
  /** With columns="auto": the narrowest a column gets, a CSS length or a sizing token name ('container-3xs'). Default: 256px (container-3xs). */
  minColumnWidth?: string;
  /** The space between cells, a step of the spacing scale. Default: 4 (16px). */
  gap?: Space;
  /** The element. Default: 'div'. */
  as?: 'div' | 'section' | 'ul' | 'ol';
}

const TAGS = ["div", "section", "ul", "ol"] as const;

/* Grid: equal columns (columns={3}) or as many as fit (columns="auto", each at least minColumnWidth), with gap
   from the spacing scale. A column never gets wider than the grid. className, style and every other prop go
   to the element. */
/** Equal columns, or as many as fit, with even space from the spacing scale between cells. */
export const Grid = /* @__PURE__ */ component<HTMLElement, GridProps>("Grid", function Grid(props, ref) {
  const restyle = useServerStyles(ref);
  const rest = omit(props, { columns: 1, minColumnWidth: 1, gap: 1, as: 1, className: 1, style: 1 });
  const n = typeof props.columns === "number" ? Math.round(props.columns) : 0;
  const cols = n >= 1 && n <= 12 ? n : 0;
  const vars: Record<string, string> = {};
  const gap = space(props.gap);
  if (gap) vars["--dk-grid-gap"] = gap;
  if (cols) vars["--dk-grid-cols"] = String(cols);
  if (!cols && props.minColumnWidth) vars["--dk-grid-min"] = /^[a-z][a-z0-9-]*$/.test(props.minColumnWidth) ? "var(--" + props.minColumnWidth + ")" : props.minColumnWidth;
  return React.createElement(oneOf(TAGS, props.as, "div"), Object.assign(rest, {
    ref: restyle, "data-component": "grid", className: cn("dk-grid", cols ? "dk-grid--fixed" : "dk-grid--auto", props.className),
    style: Object.assign(vars, props.style),
  }));
});
