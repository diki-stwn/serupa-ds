"use client";

// src/components/Pagination/Pagination.tsx
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn.js";
import { config } from "../../internal/config.js";
import { Icon } from "../Icon/Icon.js";
import { component } from "../../internal/component.js";
import { displayNumber } from "../../internal/numbers.js";
import { useLocale, useSerupa } from "../../internal/provider.js";
import { paginationRange } from "./paginationRange.js";
import * as icons from "../../material/builtin.js";
function int(v, min, fallback) {
  return typeof v === "number" && isFinite(v) && v >= min ? Math.floor(v) : fallback;
}
var Pagination = /* @__PURE__ */ component("Pagination", function Pagination2(props, ref) {
  const sds = useSerupa();
  const locale = useLocale();
  const rest = omit(props, { count: 1, page: 1, defaultPage: 1, onPageChange: 1, getHref: 1, linkAs: 1, siblings: 1, boundaries: 1, size: 1, previousLabel: 1, nextLabel: 1, pageLabel: 1, className: 1 });
  const count = int(props.count, 0, 0);
  const [own, setOwn] = React.useState(() => int(props.defaultPage, 1, 1));
  const controlled = props.page !== void 0;
  const page = Math.min(Math.max(int(controlled ? props.page : own, 1, 1), 1), Math.max(count, 1));
  const size = oneOf(["sm", "md"], props.size, "md");
  const label = props.pageLabel || sds.labels.page;
  const go = (n, e) => {
    if (n < 1 || n > count || n === page) {
      if (!props.getHref || n === page) e.preventDefault();
      return;
    }
    if (!controlled) setOwn(n);
    if (props.onPageChange) props.onPageChange(n);
  };
  const item = (n, content, aria, disabled, cls) => {
    const common = Object.assign({ className: cn("dk-pagination__item", cls), onClick: (e) => go(n, e) }, aria);
    if (props.getHref) return disabled ? /* @__PURE__ */ React.createElement("a", { ...common, role: "link", "aria-disabled": "true" }, content) : React.createElement(props.linkAs || config.link, Object.assign(common, { href: props.getHref(n) }), content);
    return /* @__PURE__ */ React.createElement("button", { type: "button", ...common, disabled }, content);
  };
  const arrow = (dir) => {
    const n = dir === "prev" ? page - 1 : page + 1;
    const arrows = dir === "prev" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronLeft, className: "dk-pagination__ltr" }), /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronRight, className: "dk-pagination__rtl" })) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronRight, className: "dk-pagination__ltr" }), /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronLeft, className: "dk-pagination__rtl" }));
    return /* @__PURE__ */ React.createElement("li", { key: dir }, item(n, arrows, { "aria-label": dir === "prev" ? props.previousLabel || sds.labels.previousPage : props.nextLabel || sds.labels.nextPage, rel: props.getHref ? dir : void 0 }, n < 1 || n > count, "dk-pagination__arrow"));
  };
  return /* @__PURE__ */ React.createElement("nav", { "aria-label": sds.labels.pagination, ...rest, ref, "data-component": "pagination", className: cn("dk-pagination", size === "sm" && "dk-pagination--sm", props.className) }, /* @__PURE__ */ React.createElement("ul", { className: "dk-pagination__list" }, arrow("prev"), paginationRange(page, count, int(props.siblings, 0, 1), int(props.boundaries, 0, 1)).map((e) => typeof e === "number" ? /* @__PURE__ */ React.createElement("li", { key: e }, item(e, displayNumber(e, locale), { "aria-label": label(e), "aria-current": e === page ? "page" : void 0 }, false, e === page ? "dk-pagination__item--current" : "")) : /* @__PURE__ */ React.createElement("li", { key: e, className: "dk-pagination__ellipsis", "aria-hidden": "true" }, "\u2026")), arrow("next")));
});
export {
  Pagination,
  paginationRange
};
//# sourceMappingURL=Pagination.js.map
