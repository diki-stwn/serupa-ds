"use client";
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn";
import { config } from "../../internal/config";
import { Icon } from "../Icon/Icon";
import { component } from "../../internal/component";
import { displayNumber } from "../../internal/numbers";
import { useLocale, useSerupa } from "../../internal/provider";
import { paginationRange } from "./paginationRange";
import { useFocusHandover } from "../../internal/focus";
import * as icons from "../../material/builtin";

export { paginationRange };

export interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  /** How many pages there are. */
  count: number;
  /** The current page, from 1 (controlled). Use with onPageChange. */
  page?: number;
  /** The page it starts on when uncontrolled. Default: 1. */
  defaultPage?: number;
  /** Called with the new page when someone picks one. */
  onPageChange?: (page: number) => void;
  /** Makes every page a link to this URL instead of a button (it still calls onPageChange on click). */
  getHref?: (page: number) => string;
  /** With getHref, what renders each page link: your router's link component. Default: the link set with configure({ link }), else 'a'. */
  linkAs?: React.ElementType;
  /** Pages shown on each side of the current one. Default: 1. */
  siblings?: number;
  /** Pages always shown at the start and the end. Default: 1. */
  boundaries?: number;
  /** 'md' (default, 32px) or 'sm' (24px). */
  size?: 'sm' | 'md';
  /** The nav's accessible name. Default: "Pagination". */
  "aria-label"?: string;
  /** Default: "Previous page". */
  previousLabel?: string;
  /** Default: "Next page". */
  nextLabel?: string;
  /** A page's accessible name. Default: (n) => "Page " + n. */
  pageLabel?: (page: number) => string;
}


function int(v: unknown, min: number, fallback: number): number {
  return typeof v === "number" && isFinite(v) && v >= min ? Math.floor(v) : fallback;
}

/* Pagination: previous and next arrows around page numbers, with … where pages are skipped. Pages are buttons
   (onPageChange) or, with getHref, links. The current page has aria-current="page". className and every other
   prop go to the <nav>. */
/** Moves through pages of results: previous, next, and page numbers with … where pages are skipped. */
export const Pagination = /* @__PURE__ */ component<HTMLElement, PaginationProps>("Pagination", function Pagination(props, ref) {
  const sds = useSerupa();
  const locale = useLocale();
  const rest = omit(props, { count: 1, page: 1, defaultPage: 1, onPageChange: 1, getHref: 1, linkAs: 1, siblings: 1, boundaries: 1, size: 1, previousLabel: 1, nextLabel: 1, pageLabel: 1, className: 1 });
  const count = int(props.count, 0, 0);
  const [own, setOwn] = React.useState(() => int(props.defaultPage, 1, 1));
  const controlled = props.page !== undefined;
  const page = Math.min(Math.max(int(controlled ? props.page : own, 1, 1), 1), Math.max(count, 1));
  const size = oneOf(["sm", "md"] as const, props.size, "md");
  const label = props.pageLabel || sds.labels.page;
  // An arrow that takes you to the first or last page turns disabled under focus (FJ1): focus goes to the other one.
  const handover = useFocusHandover();
  const go = (n: number, e: React.MouseEvent) => {
    if (n < 1 || n > count || n === page) { if (!props.getHref || n === page) e.preventDefault(); return; }
    const from = e.currentTarget as HTMLElement;
    if (from.classList.contains("dk-pagination__arrow")) handover(from, () => { const all = from.closest("nav")?.querySelectorAll<HTMLElement>(".dk-pagination__arrow"); return all && all[n < page ? all.length - 1 : 0]; });
    if (!controlled) setOwn(n);
    if (props.onPageChange) props.onPageChange(n);
  };
  const item = (n: number, content: React.ReactNode, aria: React.AriaAttributes & { rel?: string }, disabled: boolean, cls: string) => {
    const common = Object.assign({ className: cn("dk-pagination__item", cls), onClick: (e: React.MouseEvent) => go(n, e) }, aria);
    if (props.getHref) return disabled ? <a {...common} role="link" aria-disabled="true">{content}</a> : React.createElement(props.linkAs || config.link, Object.assign(common, { href: props.getHref(n) }), content);
    return <button type="button" {...common} disabled={disabled}>{content}</button>;
  };
  const arrow = (dir: "prev" | "next") => {
    const n = dir === "prev" ? page - 1 : page + 1;
    const arrows = dir === "prev"
      ? <><Icon icon={icons.ChevronLeft} className="dk-pagination__ltr" /><Icon icon={icons.ChevronRight} className="dk-pagination__rtl" /></>
      : <><Icon icon={icons.ChevronRight} className="dk-pagination__ltr" /><Icon icon={icons.ChevronLeft} className="dk-pagination__rtl" /></>;
    return <li key={dir}>{item(n, arrows, { "aria-label": dir === "prev" ? props.previousLabel || sds.labels.previousPage : props.nextLabel || sds.labels.nextPage, rel: props.getHref ? dir : undefined }, n < 1 || n > count, "dk-pagination__arrow")}</li>;
  };
  return (
    <nav aria-label={sds.labels.pagination} {...rest} ref={ref} data-component="pagination" className={cn("dk-pagination", size === "sm" && "dk-pagination--sm", props.className)}>
      <ul className="dk-pagination__list">
        {arrow("prev")}
        {paginationRange(page, count, int(props.siblings, 0, 1), int(props.boundaries, 0, 1)).map((e) => typeof e === "number"
          ? <li key={e}>{item(e, displayNumber(e, locale), { "aria-label": label(e), "aria-current": e === page ? "page" : undefined }, false, e === page ? "dk-pagination__item--current" : "")}</li>
          : <li key={e} className="dk-pagination__ellipsis" aria-hidden="true">…</li>)}
        {arrow("next")}
      </ul>
    </nav>
  );
});
