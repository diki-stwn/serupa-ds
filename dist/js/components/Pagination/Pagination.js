"use client";

// src/components/Pagination/Pagination.tsx
import * as React from "react";
import { cn, oneOf, omit, useIsoLayoutEffect } from "../../internal/cn.js";
import { config } from "../../internal/config.js";
import { Icon } from "../Icon/Icon.js";
import { Select } from "../Select/Select.js";
import { component } from "../../internal/component.js";
import { displayNumber } from "../../internal/numbers.js";
import { useLocale, useSettings } from "../../internal/provider.js";
import { paginationRange } from "./paginationRange.js";
import { useFocusHandover } from "../../internal/focus.js";
import * as icons from "../../material/builtin.js";
import { en as words } from "./labels.js";
function int(v, min, fallback) {
  return typeof v === "number" && isFinite(v) && v >= min ? Math.floor(v) : fallback;
}
var Pagination = /* @__PURE__ */ component("Pagination", function Pagination2(props, ref) {
  const sds = useSettings(words);
  const locale = useLocale();
  const rest = omit(props, { count: 1, page: 1, defaultPage: 1, onPageChange: 1, getHref: 1, linkAs: 1, siblings: 1, boundaries: 1, size: 1, previousLabel: 1, nextLabel: 1, pageLabel: 1, total: 1, pageSize: 1, pageSizeOptions: 1, onPageSizeChange: 1, className: 1 });
  const count = int(props.count, 0, 0);
  const [own, setOwn] = React.useState(() => int(props.defaultPage, 1, 1));
  const controlled = props.page !== void 0;
  const page = Math.min(Math.max(int(controlled ? props.page : own, 1, 1), 1), Math.max(count, 1));
  const size = oneOf(["sm", "md"], props.size, "md");
  const label = props.pageLabel || sds.labels.page;
  const siblings = int(props.siblings, 0, 1), boundaries = int(props.boundaries, 0, 1);
  const [cut, setCut] = React.useState(0);
  const most = siblings + boundaries, list = React.useRef(null);
  const over = () => {
    const l = list.current;
    return !!l && l.scrollWidth > l.clientWidth + 1;
  };
  const cutAt = React.useRef(0);
  useIsoLayoutEffect(function() {
    setCut(0);
  }, [page, count]);
  useIsoLayoutEffect(function() {
    if (list.current) list.current.setAttribute("data-fit", "");
  }, []);
  useIsoLayoutEffect(function() {
    const l = list.current;
    if (!l) return;
    if (cut > 0 && l.clientWidth > cutAt.current + 1) setCut(0);
    else if (cut < most && over()) {
      cutAt.current = l.clientWidth;
      setCut(cut + 1);
    }
  });
  const [, remeasure] = React.useReducer((n) => n + 1, 0);
  useIsoLayoutEffect(function() {
    const l = list.current;
    if (!l || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(remeasure);
    ro.observe(l);
    return () => ro.disconnect();
  }, []);
  useIsoLayoutEffect(function() {
    const fonts = typeof document !== "undefined" ? document.fonts : void 0;
    if (!fonts) return;
    let live = true;
    const again = () => {
      if (!live) return;
      setCut(0);
      remeasure();
    };
    if (fonts.status !== "loaded") fonts.ready.then(again, () => {
    });
    fonts.addEventListener("loadingdone", again);
    return () => {
      live = false;
      fonts.removeEventListener("loadingdone", again);
    };
  }, []);
  const handover = useFocusHandover();
  const go = (n, e) => {
    if (n < 1 || n > count || n === page) {
      if (!props.getHref || n === page) e.preventDefault();
      return;
    }
    const from = e.currentTarget;
    if (from.classList.contains("dk-pagination__arrow")) handover(from, () => {
      const all = from.closest("nav")?.querySelectorAll(".dk-pagination__arrow");
      return all && all[n < page ? all.length - 1 : 0];
    });
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
    const arrows = /* @__PURE__ */ React.createElement(Icon, { icon: dir === "prev" ? icons.ChevronLeft : icons.ChevronRight });
    return /* @__PURE__ */ React.createElement("li", { key: dir }, item(n, arrows, { "aria-label": dir === "prev" ? props.previousLabel || sds.labels.previousPage : props.nextLabel || sds.labels.nextPage, rel: props.getHref ? dir : void 0 }, n < 1 || n > count, "dk-pagination__arrow"));
  };
  const total = int(props.total, 0, -1), per = int(props.pageSize, 1, 0);
  const summary = total >= 0 && per > 0 ? sds.labels.itemsOf(displayNumber(total ? Math.min((page - 1) * per + 1, total) : 0, locale), displayNumber(Math.min(page * per, total), locale), displayNumber(total, locale)) : null;
  const sizeId = React.useId();
  const sizes = Array.isArray(props.pageSizeOptions) && props.pageSizeOptions.length && per > 0 ? props.pageSizeOptions.filter((n) => int(n, 1, 0) > 0) : null;
  const resize = (e) => {
    const next = int(Number(e.currentTarget.value), 1, per), to = Math.floor((page - 1) * per / next) + 1;
    if (!controlled) setOwn(to);
    if (props.onPageSizeChange) props.onPageSizeChange(next, to);
  };
  const bar = summary != null || sizes != null;
  return /* @__PURE__ */ React.createElement("nav", { "aria-label": sds.labels.pagination, ...rest, ref, "data-component": "pagination", className: cn("dk-pagination", size === "sm" && "dk-pagination--sm", bar && "dk-pagination--summary", props.className) }, summary != null ? /* @__PURE__ */ React.createElement("p", { className: "dk-pagination__summary" }, summary) : null, sizes ? /* @__PURE__ */ React.createElement("span", { className: "dk-pagination__page-size" }, /* @__PURE__ */ React.createElement("label", { htmlFor: sizeId }, sds.labels.perPage), /* @__PURE__ */ React.createElement(Select, { id: sizeId, size, value: String(per), onChange: resize, options: (sizes.indexOf(per) < 0 ? sizes.concat(per).sort((a, b) => a - b) : sizes).map((n) => ({ value: String(n), label: displayNumber(n, locale) })) })) : null, /* @__PURE__ */ React.createElement("ul", { className: "dk-pagination__list", ref: list }, arrow("prev"), paginationRange(page, count, Math.max(siblings - cut, 0), Math.max(boundaries - Math.max(cut - siblings, 0), 0)).map((e) => typeof e === "number" ? /* @__PURE__ */ React.createElement("li", { key: e }, item(e, displayNumber(e, locale), { "aria-label": label(e), "aria-current": e === page ? "page" : void 0 }, false, e === page ? "dk-pagination__item--current" : "")) : /* @__PURE__ */ React.createElement("li", { key: e, className: "dk-pagination__ellipsis", "aria-hidden": "true" }, "\u2026")), arrow("next")));
});
export {
  Pagination,
  paginationRange
};
//# sourceMappingURL=Pagination.js.map
