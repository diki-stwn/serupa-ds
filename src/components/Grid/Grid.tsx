import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn";
import { space, type Space } from "../../internal/space";
import { component } from "../../internal/component";

export interface GridProps extends React.HTMLAttributes<HTMLElement> {
  /** A number of equal columns (1 to 12), or 'auto' (default): as many columns as fit, each at least minColumnWidth.
      A number with minColumnWidth is "up to": that many on a wide screen, fewer as columns would get narrower than minColumnWidth. */
  columns?: number | 'auto';
  /** The narrowest a column gets, a CSS length or a sizing token name ('container-3xs'). Default: 256px (container-3xs) with columns="auto"; none with a number. */
  minColumnWidth?: string;
  /** With columns="auto" or "up to": a short last row's cells stretch across the empty columns (auto-fit), so two cards on a wide screen share the width. Default: false (empty columns stay, so cells line up with the rows above). */
  fill?: boolean;
  /** The space between cells, a step of the spacing scale. Default: 4 (16px). */
  gap?: Space;
  /** The element. Default: 'div'. */
  as?: 'div' | 'section' | 'ul' | 'ol';
}

const TAGS = ["div", "section", "ul", "ol"] as const;

/* Grid: equal columns (columns={3}), as many as fit (columns="auto", each at least minColumnWidth), or up to a
   number (columns={3} with minColumnWidth: three, fewer as they'd get narrower), with gap from the spacing scale. A column never gets wider than the grid. className, style and every other prop go
   to the element. */
/** Equal columns, or as many as fit, with even space from the spacing scale between cells. */
export const Grid = /* @__PURE__ */ component<HTMLElement, GridProps>("Grid", function Grid(props, ref) {
  const rest = omit(props, { columns: 1, minColumnWidth: 1, fill: 1, gap: 1, as: 1, className: 1, style: 1 });
  const n = typeof props.columns === "number" ? Math.round(props.columns) : 0;
  const cols = n >= 1 && n <= 12 ? n : 0;
  const vars: Record<string, string> = {};
  const gap = space(props.gap);
  if (gap) vars["--dk-grid-gap"] = gap;
  if (cols) vars["--dk-grid-cols"] = String(cols);
  const kind = !cols ? "auto" : props.minColumnWidth ? "upto" : "fixed";
  if (props.minColumnWidth) vars["--dk-grid-min"] = /^[a-z][a-z0-9-]*$/.test(props.minColumnWidth) ? "var(--" + props.minColumnWidth + ")" : props.minColumnWidth;
  const tag = oneOf(TAGS, props.as, "div");
  // role="list": Safari drops list semantics from a <ul>/<ol> styled list-style: none, so VoiceOver stops saying "list, 6 items" (FU1).
  return React.createElement(tag, Object.assign(rest, {
    ref: ref, "data-component": "grid", role: rest.role ?? (tag === "ul" || tag === "ol" ? "list" : undefined), className: cn("dk-grid", "dk-grid--" + kind, props.fill && kind !== "fixed" && "dk-grid--fill", props.className),
    style: Object.assign(vars, props.style),
  }));
});
