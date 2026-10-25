"use client";
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn";
import { Icon, type IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { component } from "../../internal/component";
import { flattenChildren } from "../../internal/children";
import { useSerupa } from "../../internal/provider";
import * as icons from "../../material/builtin";

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  /** BreadcrumbItems, from the top level down to the current page (the last one). */
  children?: React.ReactNode;
  /** 'chevron' (default) or 'slash' between items. */
  separator?: 'chevron' | 'slash';
  /** Shows at most this many items: the first, a "…" button that shows the rest, and the last ones. Default: no limit. */
  maxItems?: number;
  /** The nav's accessible name. Default: "Breadcrumb". */
  "aria-label"?: string;
  /** The "…" button's accessible name. Default: "Show all pages". */
  expandLabel?: string;
}

export interface BreadcrumbItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Where it goes. The last item is the current page: it's text, not a link, whatever href says. */
  href?: string;
  /** An icon before the label: a Material Symbols or custom name, or an element. */
  icon?: IconSource;
  /** What renders the link: 'a' (default), or your router's link component. */
  as?: React.ElementType;
  /** Set by Breadcrumb on the last item. */
  current?: boolean;
}

/* BreadcrumbItem: one page in the trail, a link (or, as the current page, text with aria-current="page"). */
/** One page in a Breadcrumb: a link, or the current page when it's the last. */
export const BreadcrumbItem = /* @__PURE__ */ component<HTMLAnchorElement, BreadcrumbItemProps>("BreadcrumbItem", function BreadcrumbItem(props, ref) {
  const rest = omit(props, { icon: 1, as: 1, current: 1, className: 1, children: 1 });
  const content = <>{props.icon ? <span className="dk-breadcrumb__icon">{asIcon(props.icon)}</span> : null}{props.children}</>;
  if (props.current) {
    delete rest.href;
    return <span {...rest} ref={ref} aria-current="page" className={cn("dk-breadcrumb__item dk-breadcrumb__item--current", props.className)}>{content}</span>;
  }
  return React.createElement(props.as || "a", Object.assign(rest, { ref: ref, className: cn("dk-breadcrumb__item dk-breadcrumb__link", props.className) }), content);
});

/* Breadcrumb: a nav with an ordered list of pages from the top level to the current one, a chevron (or slash)
   between them. maxItems collapses the middle into a "…" button that shows them again. className and every
   other prop go to the <nav>. */
/** Where the current page sits: links to the pages above it, separated by chevrons. maxItems collapses the middle. */
export const Breadcrumb = /* @__PURE__ */ component<HTMLElement, BreadcrumbProps>("Breadcrumb", function Breadcrumb(props, ref) {
  const sds = useSerupa();
  const rest = omit(props, { separator: 1, maxItems: 1, expandLabel: 1, className: 1, children: 1 });
  const separator = oneOf(["chevron", "slash"] as const, props.separator, "chevron");
  const [expanded, setExpanded] = React.useState(false);
  const firstHidden = React.useRef<HTMLLIElement>(null);
  const focusAfter = React.useRef(false);
  const items = flattenChildren(props.children).filter(React.isValidElement) as React.ReactElement<BreadcrumbItemProps>[];
  const max = typeof props.maxItems === "number" && props.maxItems >= 2 ? Math.floor(props.maxItems) : 0;
  const collapse = !expanded && max > 0 && items.length > max;
  // collapsed: the first item, "…", then the last max - 1
  const shown = items.map((el, i) => ({ el, i })).filter(({ i }) => !collapse || i === 0 || i >= items.length - (max - 1));
  React.useEffect(() => {
    if (expanded && focusAfter.current && firstHidden.current) {
      focusAfter.current = false;
      const a = firstHidden.current.querySelector<HTMLElement>("a, [tabindex], button");
      if (a) a.focus();
    }
  }, [expanded]);
  const sep = (key: string) => <li key={key} className="dk-breadcrumb__separator" aria-hidden="true">{separator === "slash" ? "/" : <><Icon icon={icons.ChevronRight} className="dk-breadcrumb__ltr" /><Icon icon={icons.ChevronLeft} className="dk-breadcrumb__rtl" /></>}</li>;
  const out: React.ReactNode[] = [];
  shown.forEach(({ el, i }, n) => {
    if (n > 0) out.push(sep("s" + i));
    if (collapse && n === 1) {
      out.push(<li key="more" className="dk-breadcrumb__li">
        <button type="button" className="dk-breadcrumb__item dk-breadcrumb__more" aria-label={props.expandLabel || sds.labels.showHiddenPages}
          onClick={() => { focusAfter.current = true; setExpanded(true); }}>…</button>
      </li>, sep("s-more"));
    }
    const last = i === items.length - 1;
    out.push(<li key={el.key != null ? el.key : i} className="dk-breadcrumb__li" ref={expanded && max > 0 && i === 1 ? firstHidden : undefined}>
      {React.cloneElement(el, { current: last || el.props.current })}
    </li>);
  });
  return (
    <nav aria-label={sds.labels.breadcrumb} {...rest} ref={ref} data-component="breadcrumb" className={cn("dk-breadcrumb", props.className)}>
      <ol className="dk-breadcrumb__list">{out}</ol>
    </nav>
  );
});
