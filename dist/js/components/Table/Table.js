"use client";

// src/components/Table/Table.tsx
import * as React from "react";
import { announce } from "../../internal/announce.js";
import { cn, domId, oneOf, omit } from "../../internal/cn.js";
import { Icon } from "../Icon/Icon.js";
import { Checkbox } from "../Checkbox/Checkbox.js";
import { component } from "../../internal/component.js";
import { useSerupa } from "../../internal/provider.js";
import * as icons from "../../material/builtin.js";
var ALIGN = ["start", "center", "end"];
var Table = /* @__PURE__ */ component("Table", function Table2(props, ref) {
  const sds = useSerupa();
  const rest = omit(props, { size: 1, striped: 1, stickyHeader: 1, caption: 1, captionHidden: 1, containerProps: 1, className: 1, children: 1 });
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
    return () => {
      ro.disconnect();
      el.style.removeProperty("--dk-table-head");
    };
  }, [sticky]);
  const { "aria-label": frameLabel, "aria-labelledby": frameLabelledBy, ...cp } = props.containerProps || {};
  const hasCaption = props.caption != null && props.caption !== false && props.caption !== "";
  const region = !scrolls ? {} : hasCaption ? { tabIndex: 0, role: "region", "aria-labelledby": cid } : { tabIndex: 0, role: "region", "aria-labelledby": frameLabelledBy, "aria-label": frameLabelledBy ? void 0 : frameLabel || sds.labels.table };
  return /* @__PURE__ */ React.createElement("div", { ...cp, ...region, ref: frame, "data-component": "table", className: cn("dk-table", size === "sm" && "dk-table--sm", props.striped && "dk-table--striped", props.stickyHeader && "dk-table--sticky", cp.className) }, /* @__PURE__ */ React.createElement("table", { ...rest, ref, className: cn("dk-table__table", props.className) }, hasCaption ? /* @__PURE__ */ React.createElement("caption", { id: cid, className: cn("dk-table__caption", props.captionHidden && "dk-visually-hidden") }, props.caption) : null, props.children));
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
var TableRow = /* @__PURE__ */ component("TableRow", function TableRow2(props, ref) {
  const rest = omit(props, { selected: 1, className: 1 });
  return /* @__PURE__ */ React.createElement("tr", { ...rest, ref, className: cn("dk-table__row", props.selected && "dk-table__row--selected", props.className) });
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
  const labels = useSerupa().labels;
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
var TableCell = /* @__PURE__ */ component("TableCell", function TableCell2(props, ref) {
  const rest = omit(props, { align: 1, className: 1 });
  const align = oneOf(ALIGN, props.align, "start");
  return /* @__PURE__ */ React.createElement("td", { ...rest, ref, className: cn("dk-table__cell", align !== "start" && "dk-table__cell--" + align, props.className) });
});
export {
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSelectCell
};
//# sourceMappingURL=Table.js.map
