"use client";

// src/components/Table/Table.tsx
import * as React from "react";
import { announce } from "../../internal/announce.js";
import { cn, domId, oneOf, omit, setRef, useIsoLayoutEffect } from "../../internal/cn.js";
import { Icon } from "../Icon/Icon.js";
import { Checkbox } from "../Checkbox/Checkbox.js";
import { Button } from "../Button/Button.js";
import { component } from "../../internal/component.js";
import { activeIn } from "../../internal/root.js";
import { warnOnce } from "../../internal/warn.js";
import { useLocale, useSettings } from "../../internal/provider.js";
import { displayNumber } from "../../internal/numbers.js";
import * as icons from "../../material/builtin.js";
import { en as words } from "./labels.js";
var ALIGN = ["start", "center", "end"];
var Table = /* @__PURE__ */ component("Table", function Table2(props, ref) {
  const sds = useSettings(words);
  const rest = omit(props, { size: 1, striped: 1, stickyHeader: 1, caption: 1, hideCaption: 1, containerProps: 1, className: 1, children: 1 });
  const size = oneOf(["sm", "md"], props.size, "md");
  const frame = React.useRef(null);
  const [scrolls, setScrolls] = React.useState(false);
  const cid = domId("dk-tc", React.useId());
  React.useEffect(() => {
    const el = frame.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const check = () => setScrolls(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    check();
    return () => ro.disconnect();
  }, []);
  const sticky = !!props.stickyHeader;
  React.useEffect(() => {
    const el = frame.current, head = el && el.querySelector(".dk-table__head");
    if (!el || !sticky || !head || typeof ResizeObserver === "undefined") return;
    const set = () => el.style.setProperty("--dk-table-head", head.getBoundingClientRect().height + "px");
    const ro = new ResizeObserver(set);
    ro.observe(head);
    set();
    let raf = 0;
    const onFocus = (e) => {
      const t = e.target;
      if (t === el || head.contains(t)) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const covered = el.getBoundingClientRect().top + el.clientTop + head.getBoundingClientRect().height - t.getBoundingClientRect().top;
        if (covered > 0) el.scrollTop -= covered;
      });
    };
    el.addEventListener("focusin", onFocus);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      el.removeEventListener("focusin", onFocus);
      el.style.removeProperty("--dk-table-head");
    };
  }, [sticky]);
  const { "aria-label": frameLabel, "aria-labelledby": frameLabelledBy, ...cp } = props.containerProps || {};
  const hasCaption = props.caption != null && props.caption !== false && props.caption !== "";
  const region = !scrolls ? {} : hasCaption ? { tabIndex: 0, role: "region", "aria-labelledby": cid } : { tabIndex: 0, role: "region", "aria-labelledby": frameLabelledBy, "aria-label": frameLabelledBy ? void 0 : frameLabel || sds.labels.table };
  return /* @__PURE__ */ React.createElement("div", { ...cp, ...region, ref: frame, "data-component": "table", className: cn("dk-table", size === "sm" && "dk-table--sm", props.striped && "dk-table--striped", props.stickyHeader && "dk-table--sticky", cp.className) }, /* @__PURE__ */ React.createElement("table", { ...rest, ref, className: cn("dk-table__table", props.className) }, hasCaption ? /* @__PURE__ */ React.createElement("caption", { id: cid, className: cn("dk-table__caption", props.hideCaption && "dk-visually-hidden") }, props.caption) : null, props.children));
});
var TableHead = /* @__PURE__ */ component("TableHead", function TableHead2(props, ref) {
  return /* @__PURE__ */ React.createElement("thead", { ...props, ref, className: cn("dk-table__head", props.className) });
});
var TableBody = /* @__PURE__ */ component("TableBody", function TableBody2(props, ref) {
  return /* @__PURE__ */ React.createElement("tbody", { ...props, ref, className: cn("dk-table__body", props.className) });
});
var TableFoot = /* @__PURE__ */ component("TableFoot", function TableFoot2(props, ref) {
  return /* @__PURE__ */ React.createElement("tfoot", { ...props, ref, className: cn("dk-table__foot", props.className) });
});
var RowLinkContext = /* @__PURE__ */ React.createContext(null);
var TableRow = /* @__PURE__ */ component("TableRow", function TableRow2(props, ref) {
  const rest = omit(props, { selected: 1, className: 1, href: 1, target: 1, rel: 1, children: 1 });
  const isLink = props.href != null;
  if (process.env.NODE_ENV !== "production" && props.onClick && !isLink) warnOnce("table-row-click", "TableRow: onClick on a row reaches mouse users only: the keyboard and screen readers can't press a row. To open something, give the row an href (the whole row becomes a link); for an action, put a button in a cell.");
  const link = React.useMemo(function() {
    return isLink ? { href: props.href, target: props.target, rel: props.target === "_blank" && props.rel == null ? "noopener noreferrer" : props.rel } : null;
  }, [isLink, props.href, props.target, props.rel]);
  let children = props.children;
  if (isLink) {
    const kids = React.Children.toArray(children);
    const marked = kids.some(function(k) {
      return React.isValidElement(k) && k.type === TableCell && k.props.link;
    });
    if (!marked) {
      const first = kids.findIndex(function(k) {
        return React.isValidElement(k) && k.type === TableCell;
      });
      if (first >= 0) children = kids.map(function(k, i) {
        return i === first ? React.cloneElement(k, { link: true }) : k;
      });
    }
  }
  return /* @__PURE__ */ React.createElement("tr", { ...rest, ref, className: cn("dk-table__row", props.selected && "dk-table__row--selected", isLink && "dk-table__row--link", props.className) }, link ? /* @__PURE__ */ React.createElement(RowLinkContext.Provider, { value: link }, children) : children);
});
var TableSelectCell = /* @__PURE__ */ component("TableSelectCell", function TableSelectCell2(props, ref) {
  const { label, header, cellProps, ...rest } = props;
  const cp = cellProps || {};
  const box = /* @__PURE__ */ React.createElement(Checkbox, { ...rest, ref, "aria-label": label });
  const cls = cn("dk-table__cell dk-table__select", cp.className);
  return header ? /* @__PURE__ */ React.createElement("th", { scope: "col", ...cp, className: cn(cls, "dk-table__header") }, box) : /* @__PURE__ */ React.createElement("td", { ...cp, className: cls }, box);
});
var NEXT_ICON = { ascending: icons.ArrowUpward, descending: icons.ArrowDownward, none: icons.UnfoldMore };
var TableHeaderCell = /* @__PURE__ */ component("TableHeaderCell", function TableHeaderCell2(props, ref) {
  const rest = omit(props, { align: 1, sort: 1, onSort: 1, className: 1, children: 1 });
  const align = oneOf(ALIGN, props.align, "start");
  const sort = props.sort !== void 0 ? oneOf(["ascending", "descending", "none"], props.sort, "none") : null;
  const labels = useSettings(words).labels;
  const button = React.useRef(null);
  const was = React.useRef(sort);
  React.useEffect(function() {
    if (sort === was.current) return;
    was.current = sort;
    if ((sort === "ascending" || sort === "descending") && button.current) announce(labels.tableSorted((button.current.textContent || "").trim(), sort));
  }, [sort, labels]);
  return /* @__PURE__ */ React.createElement(
    "th",
    {
      scope: "col",
      ...rest,
      ref,
      "aria-sort": sort && sort !== "none" ? sort : void 0,
      className: cn("dk-table__cell dk-table__header", align !== "start" && "dk-table__cell--" + align, sort && "dk-table__header--sortable", props.className)
    },
    sort ? /* @__PURE__ */ React.createElement("button", { type: "button", ref: button, className: "dk-table__sort", onClick: props.onSort }, /* @__PURE__ */ React.createElement("span", null, props.children), /* @__PURE__ */ React.createElement(Icon, { icon: NEXT_ICON[sort], className: cn("dk-table__sort-icon", sort === "none" && "dk-table__sort-icon--idle") })) : props.children
  );
});
var PLAIN = { useGrouping: false };
var TableCell = /* @__PURE__ */ component("TableCell", function TableCell2(props, ref) {
  const rest = omit(props, { align: 1, className: 1, children: 1, link: 1 });
  const align = oneOf(ALIGN, props.align, "start");
  const locale = useLocale();
  const row = React.useContext(RowLinkContext);
  const n = props.children;
  const content = typeof n === "number" && Number.isFinite(n) ? displayNumber(n, locale, PLAIN) : n;
  return /* @__PURE__ */ React.createElement("td", { ...rest, ref, className: cn("dk-table__cell", align !== "start" && "dk-table__cell--" + align, props.className) }, row && props.link ? /* @__PURE__ */ React.createElement("a", { className: "dk-table__row-link", href: row.href, target: row.target, rel: row.rel }, content) : content);
});
var TableActionBar = /* @__PURE__ */ component("TableActionBar", function TableActionBar2(props, ref) {
  const labels = useSettings(words).labels;
  const rest = omit(props, { count: 1, onClear: 1, clearLabel: 1, className: 1, children: 1 });
  const count = Math.max(0, Math.floor(props.count) || 0);
  const self = React.useRef(null);
  const setRefs = React.useCallback((e) => {
    self.current = e;
    setRef(ref, e);
  }, [ref]);
  const id = domId("dk-tab", React.useId());
  const said = labels.tableSelected(count);
  useIsoLayoutEffect(() => {
    const bar = self.current;
    if (count || !bar || !bar.contains(activeIn(bar))) return;
    const box = bar.nextElementSibling && bar.nextElementSibling.querySelector('input[type="checkbox"]:not(:disabled)');
    if (box) box.focus();
  }, [count]);
  const was = React.useRef(0);
  React.useEffect(() => {
    if (count === was.current) return;
    was.current = count;
    if (count) announce(said);
  }, [count, said]);
  return /* @__PURE__ */ React.createElement("div", { role: "group", "aria-labelledby": id, ...rest, ref: setRefs, hidden: !count || void 0, "data-component": "table-action-bar", className: cn("dk-table-action-bar", props.className) }, /* @__PURE__ */ React.createElement("span", { id, className: "dk-table-action-bar__count" }, said), /* @__PURE__ */ React.createElement("div", { className: "dk-table-action-bar__actions" }, props.children), props.onClear ? /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", onClick: props.onClear }, props.clearLabel || labels.clearSelection) : null);
});
export {
  Table,
  TableActionBar,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSelectCell
};
//# sourceMappingURL=Table.js.map
