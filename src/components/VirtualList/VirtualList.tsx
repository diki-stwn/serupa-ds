"use client";
import * as React from "react";
import { cn, oneOf, omit, setRef } from "../../internal/cn";
import { component } from "../../internal/component";
import { useVirtual } from "../../internal/virtual";

export interface VirtualListProps extends Omit<React.HTMLAttributes<HTMLUListElement>, "children"> {
  /** How many rows there are. */
  count: number;
  /** Draws row `index`: a ListItem (or another element that passes its props and style on to an <li>). */
  renderItem: (index: number) => React.ReactElement;
  /** A stable key for row `index` (its id), so a row keeps its state when rows are added or removed. Default: the index. */
  itemKey?: (index: number) => React.Key;
  /** A guess at a row's height in px, for rows not drawn yet. Rows are measured once drawn. Default: 56. */
  estimatedItemHeight?: number;
  /** Rows drawn beyond each edge of the view, so a fast scroll doesn't show a gap. Default: 4. */
  overscan?: number;
  /** 'plain' (default) or 'card': inside a bordered, rounded frame, as List. */
  variant?: "plain" | "card";
  /** Lines between rows. Default: true. */
  divided?: boolean;
  /** 'ul' (default) or 'ol' when the order matters. */
  as?: "ul" | "ol";
}

/* VirtualList: a List of any length that draws only the rows in view, plus a few either side (useVirtual in
   src/internal/virtual.ts). The <ul> is the scroller, up to 384px tall (--virtual-list-height), and keyboard
   scrollable (tabIndex 0); an empty ::before and ::after stand in for the rows not drawn. Each drawn row gets aria-posinset and
   aria-setsize, so screen readers still say "row 5,001 of 10,000". A row with focus stays drawn when it scrolls out
   of view, so focus is never lost. className and every other prop go to the <ul>. */
/** A List of thousands of rows that draws only the ones in view: same rows, same look, fast at any length.
 *  @beta New: its API may still change in a minor release. Take this tag off once it has shipped with its bug bash done (CONTRIBUTING.md). */
export const VirtualList = /* @__PURE__ */ component<HTMLUListElement, VirtualListProps>("VirtualList", function VirtualList(props, ref) {
  const rest = omit(props, { count: 1, renderItem: 1, itemKey: 1, estimatedItemHeight: 1, overscan: 1, variant: 1, divided: 1, as: 1, className: 1, style: 1, onFocus: 1, onBlur: 1 } as const);
  const count = Math.max(0, Math.floor(props.count) || 0);
  const estimate = props.estimatedItemHeight && props.estimatedItemHeight > 0 ? props.estimatedItemHeight : 56;
  const r = useVirtual({ count, estimate, overscan: props.overscan != null && props.overscan >= 0 ? props.overscan : 4 });
  // The row that has focus, kept drawn (in place, absolutely) while it's out of the window.
  const [focused, setFocused] = React.useState<number | null>(null);
  const variant = oneOf(["plain", "card"] as const, props.variant, "plain");

  const { renderItem, itemKey } = props;
  const row = (i: number, out: boolean) => {
    const el = renderItem(i) as React.ReactElement<{ style?: React.CSSProperties }>;
    const style = out ? { ...el.props.style, position: "absolute" as const, insetInline: 0, top: r.offsetOf(i) } : el.props.style;
    return React.cloneElement(el, { key: itemKey ? itemKey(i) : i, "data-index": i, "aria-posinset": i + 1, "aria-setsize": count, style } as React.Attributes);
  };
  const rows: React.ReactElement[] = [];
  const keep = focused != null && focused < count && (focused < r.start || focused >= r.end) ? focused : null;
  if (keep != null && keep < r.start) rows.push(row(keep, true));
  for (let i = r.start; i < r.end; i++) rows.push(row(i, false));
  if (keep != null && keep >= r.end) rows.push(row(keep, true));

  const indexOf = (t: EventTarget | null, list: Element) => {
    const li = t instanceof HTMLElement ? t.closest<HTMLElement>("[data-index]") : null;
    return li && li.parentElement === list ? Number(li.dataset.index) : null;
  };
  const attach = r.ref;
  const setNode = React.useCallback((n: HTMLUListElement | null) => { attach(n); setRef(ref, n); }, [attach, ref]);
  return React.createElement(oneOf(["ul", "ol"] as const, props.as, "ul"), Object.assign(rest, {
    ref: setNode,
    "data-component": "virtual-list", role: rest.role ?? "list", tabIndex: rest.tabIndex ?? 0,
    className: cn("dk-list", "dk-virtual-list", variant === "card" && "dk-list--card", props.divided !== false && "dk-list--divided", props.className),
    style: { ...props.style, "--dk-vl-before": r.before + "px", "--dk-vl-after": r.after + "px" } as React.CSSProperties,
    onFocus: (e: React.FocusEvent<HTMLUListElement>) => { setFocused(indexOf(e.target, e.currentTarget)); if (props.onFocus) props.onFocus(e); },
    onBlur: (e: React.FocusEvent<HTMLUListElement>) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(null); if (props.onBlur) props.onBlur(e); },
  }), rows);
});
