"use client";
import * as React from "react";
import { announce } from "../../internal/announce";
import { cn, domId, oneOf, omit, setRef, useIsoLayoutEffect } from "../../internal/cn";
import { Icon } from "../Icon/Icon";
import { Checkbox, type CheckboxProps } from "../Checkbox/Checkbox";
import { Button } from "../Button/Button";
import { component } from "../../internal/component";
import { activeIn } from "../../internal/root";
import { warnOnce } from "../../internal/warn";
import { useLocale, useSettings } from "../../internal/provider";
import { displayNumber } from "../../internal/numbers";
import * as icons from "../../material/builtin";
import type { IconData } from "../../material/types";
import { en as words } from "./labels";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /** 'md' (default): 12px cell padding. 'sm': 8px top and bottom, for dense data. */
  size?: 'sm' | 'md';
  /** Shades every other body row. Rows then don't change on hover. Default: false. */
  striped?: boolean;
  /** Keeps the header row in view while the table scrolls inside a container with a height. Default: false. */
  stickyHeader?: boolean;
  /** A title for the table, rendered as its <caption> (announced with it, and names the scroll area). */
  caption?: React.ReactNode;
  /** Hides the caption on screen; screen readers still announce it. Default: false. */
  hideCaption?: boolean;
  /** Props for the scrolling frame around the table (style with a maxHeight for stickyHeader). */
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Marks a row as selected: a shaded background and a primary bar at its start. Screen readers can't tell from
      the shading (and ignore aria-selected in a table), so give the row a TableSelectCell, whose checkbox says it. */
  selected?: boolean;
  /** Makes the whole row a link to this URL: a real <a> in one cell (the first TableCell, or the one marked link)
      whose area is stretched over the row. Buttons, checkboxes and links in other cells sit above it and work on
      their own. Ctrl/Cmd-click and middle-click open it in a new tab, as any link does. */
  href?: string;
  /** The row link's target. "_blank" adds rel="noopener noreferrer". */
  target?: string;
  /** The row link's rel. */
  rel?: string;
}

export interface TableSelectCellProps extends Omit<CheckboxProps, 'children' | 'description' | 'size'> {
  /** The checkbox's name for screen readers, such as "Select Alpha", or "Select all rows" in the header. */
  label: string;
  /** In the header row: renders a <th>, for a select-all checkbox (with indeterminate while some rows are). Default: false. */
  header?: boolean;
  /** Props for the cell around the checkbox. */
  cellProps?: React.TdHTMLAttributes<HTMLTableCellElement>;
}

export type SortDirection = 'ascending' | 'descending' | 'none';

export interface TableHeaderCellProps extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'align'> {
  /** Lines the text up: 'start' (default), 'center' or 'end' (numbers). */
  align?: 'start' | 'center' | 'end';
  /** Makes the column sortable: the header becomes a button, and this is the current order. */
  sort?: SortDirection;
  /** Called when the sort button is pressed (decide the next order yourself). */
  onSort?: () => void;
}

export interface TableCellProps extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
  /** Lines the text up: 'start' (default), 'center' or 'end' (numbers, which also get tabular digits). */
  align?: 'start' | 'center' | 'end';
  /** In a TableRow with href: this cell holds the row's link (its text is the link's name). Default: the row's
      first TableCell. Mark one when that cell isn't a direct child of the row, or isn't the one that names it. */
  link?: boolean;
}

export interface TableActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** How many rows are selected. The bar shows while it's more than 0, with "3 selected" at its start. */
  count: number;
  /** Called by its "Clear selection" button: clear the selection. Without it, there's no button. */
  onClear?: () => void;
  /** The clear button's text. Default: "Clear selection" (labels.clearSelection). */
  clearLabel?: string;
  /** The actions for the selected rows: Buttons such as Delete or Export. */
  children?: React.ReactNode;
}

const ALIGN = ["start", "center", "end"] as const;

/* Table: a native <table> in a frame that scrolls sideways when it's too wide (and then takes keyboard focus
   so it can be scrolled with the arrows). size, striped and stickyHeader style the rows; caption names it.
   className and every other prop go to the <table>; containerProps go to the frame. */
/** A data table: native table markup in a scrolling frame, with sizes, stripes, a sticky header and sortable columns. */
export const Table = /* @__PURE__ */ component<HTMLTableElement, TableProps>("Table", function Table(props, ref) {
  const sds = useSettings(words);
  const rest = omit(props, { size: 1, striped: 1, stickyHeader: 1, caption: 1, hideCaption: 1, containerProps: 1, className: 1, children: 1 });
  const size = oneOf(["sm", "md"] as const, props.size, "md");
  const frame = React.useRef<HTMLDivElement>(null);
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
  // A sticky header covers the top of the frame: measure it, so focus scrolls in below it (the CSS reads --dk-table-head).
  const sticky = !!props.stickyHeader;
  React.useEffect(() => {
    const el = frame.current, head = el && el.querySelector<HTMLElement>(".dk-table__head");
    if (!el || !sticky || !head || typeof ResizeObserver === "undefined") return;
    const set = () => el.style.setProperty("--dk-table-head", head.getBoundingClientRect().height + "px");
    const ro = new ResizeObserver(set);
    ro.observe(head);
    set();
    // Firefox leaves scroll-padding out when it decides whether a focused control needs scrolling, so one that is partly
    // under the header stays there (WCAG 2.4.11). After the browser's own focus scroll, the frame moves by what's still covered.
    let raf = 0;
    const onFocus = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (t === el || head.contains(t)) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const covered = el.getBoundingClientRect().top + el.clientTop + head.getBoundingClientRect().height - t.getBoundingClientRect().top;
        if (covered > 0) el.scrollTop -= covered;
      });
    };
    el.addEventListener("focusin", onFocus);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); el.removeEventListener("focusin", onFocus); el.style.removeProperty("--dk-table-head"); };
  }, [sticky]);
  // A name on the frame belongs to its region role: a plain div that doesn't scroll can't carry one (axe aria-prohibited-attr).
  const { "aria-label": frameLabel, "aria-labelledby": frameLabelledBy, ...cp } = props.containerProps || {};
  const hasCaption = props.caption != null && props.caption !== false && props.caption !== "";
  const region = !scrolls ? {} : hasCaption ? { tabIndex: 0, role: "region", "aria-labelledby": cid }
    : { tabIndex: 0, role: "region", "aria-labelledby": frameLabelledBy, "aria-label": frameLabelledBy ? undefined : frameLabel || sds.labels.table };
  return (
    <div {...cp} {...region} ref={frame} data-component="table" className={cn("dk-table", size === "sm" && "dk-table--sm", props.striped && "dk-table--striped", props.stickyHeader && "dk-table--sticky", cp.className)}>
      <table {...rest} ref={ref} className={cn("dk-table__table", props.className)}>
        {hasCaption ? <caption id={cid} className={cn("dk-table__caption", props.hideCaption && "dk-visually-hidden")}>{props.caption}</caption> : null}
        {props.children}
      </table>
    </div>
  );
});

export type TableHeadProps = React.HTMLAttributes<HTMLTableSectionElement>;
export type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;
export type TableFootProps = React.HTMLAttributes<HTMLTableSectionElement>;

/** The header rows (<thead>). */
export const TableHead = /* @__PURE__ */ component<HTMLTableSectionElement, TableHeadProps>("TableHead", function TableHead(props, ref) {
  return <thead {...props} ref={ref} className={cn("dk-table__head", props.className)} />;
});

/** The body rows (<tbody>). */
export const TableBody = /* @__PURE__ */ component<HTMLTableSectionElement, TableBodyProps>("TableBody", function TableBody(props, ref) {
  return <tbody {...props} ref={ref} className={cn("dk-table__body", props.className)} />;
});

/** Footer rows such as totals (<tfoot>). */
export const TableFoot = /* @__PURE__ */ component<HTMLTableSectionElement, TableFootProps>("TableFoot", function TableFoot(props, ref) {
  return <tfoot {...props} ref={ref} className={cn("dk-table__foot", props.className)} />;
});

type RowLink = { href: string; target?: string; rel?: string };
const RowLinkContext = /* @__PURE__ */ React.createContext<RowLink | null>(null);

/* With href, the row is one link: an <a> in its link cell (the TableCell marked link, or else the first direct
   TableCell child), whose ::after covers the row (Table.css). A real link, so Ctrl/Cmd and middle click, "Copy link"
   and the status bar work, with nothing re-dispatched. onClick on a row without href reaches the mouse only. */
/** A row (<tr>). selected shades it, with a bar at its start; a TableSelectCell in it says so to screen readers. With href, the whole row is a link. */
export const TableRow = /* @__PURE__ */ component<HTMLTableRowElement, TableRowProps>("TableRow", function TableRow(props, ref) {
  const rest = omit(props, { selected: 1, className: 1, href: 1, target: 1, rel: 1, children: 1 });
  const isLink = props.href != null;
  if (process.env.NODE_ENV !== "production" && props.onClick && !isLink) warnOnce("table-row-click", "TableRow: onClick on a row reaches mouse users only: the keyboard and screen readers can't press a row. To open something, give the row an href (the whole row becomes a link); for an action, put a button in a cell.");
  const link = React.useMemo(function () {
    return isLink ? { href: props.href!, target: props.target, rel: props.target === "_blank" && props.rel == null ? "noopener noreferrer" : props.rel } : null;
  }, [isLink, props.href, props.target, props.rel]);
  let children = props.children;
  if (isLink) {
    const kids = React.Children.toArray(children);
    const marked = kids.some(function (k) { return React.isValidElement(k) && k.type === TableCell && (k.props as TableCellProps).link; });
    if (!marked) {
      const first = kids.findIndex(function (k) { return React.isValidElement(k) && k.type === TableCell; });
      if (first >= 0) children = kids.map(function (k, i) { return i === first ? React.cloneElement(k as React.ReactElement<TableCellProps>, { link: true }) : k; });
    }
  }
  return <tr {...rest} ref={ref} className={cn("dk-table__row", props.selected && "dk-table__row--selected", isLink && "dk-table__row--link", props.className)}>
    {link ? <RowLinkContext.Provider value={link}>{children}</RowLinkContext.Provider> : children}
  </tr>;
});

/* TableSelectCell: a narrow cell holding a checkbox named by label, for picking rows ("Select Alpha") or, with
   header, all of them. checked, onChange, indeterminate, disabled, name, value and ref go to the checkbox, and
   cellProps to the cell. A row whose checkbox is checked is shaded like a selected row, so an uncontrolled one
   works too; set the row's selected as well when you keep the selection yourself. */
/** A cell with a checkbox for selecting its row (or, with header, every row); the checkbox carries the selected state for screen readers. */
export const TableSelectCell = /* @__PURE__ */ component<HTMLInputElement, TableSelectCellProps>("TableSelectCell", function TableSelectCell(props, ref) {
  const { label, header, cellProps, ...rest } = props;   // the rest is the Checkbox's
  const cp = cellProps || {};
  const box = <Checkbox {...rest} ref={ref} aria-label={label} />;
  const cls = cn("dk-table__cell dk-table__select", cp.className);
  return header ? <th scope="col" {...cp} className={cn(cls, "dk-table__header")}>{box}</th> : <td {...cp} className={cls}>{box}</td>;
});

const NEXT_ICON: Record<SortDirection, IconData> = { ascending: icons.ArrowUpward, descending: icons.ArrowDownward, none: icons.UnfoldMore };

/** A header cell (<th>, scope="col" unless you say otherwise). With sort, its text is a button and aria-sort says the order. */
export const TableHeaderCell = /* @__PURE__ */ component<HTMLTableCellElement, TableHeaderCellProps>("TableHeaderCell", function TableHeaderCell(props, ref) {
  const rest = omit(props, { align: 1, sort: 1, onSort: 1, className: 1, children: 1 });
  const align = oneOf(ALIGN, props.align, "start");
  const sort = props.sort !== undefined ? oneOf(["ascending", "descending", "none"] as const, props.sort, "none") : null;
  // A new order is read out ("Sorted by Amount, ascending"): aria-sort alone is only heard when focus reaches the
  // header again, and the button keeps focus. Not on the first render.
  const labels = useSettings(words).labels;
  const button = React.useRef<HTMLButtonElement | null>(null);
  const was = React.useRef(sort);
  React.useEffect(function () {
    if (sort === was.current) return;
    was.current = sort;
    if ((sort === "ascending" || sort === "descending") && button.current) announce(labels.tableSorted((button.current.textContent || "").trim(), sort));
  }, [sort, labels]);
  return (
    <th scope="col" {...rest} ref={ref} aria-sort={sort && sort !== "none" ? sort : undefined}
      className={cn("dk-table__cell dk-table__header", align !== "start" && "dk-table__cell--" + align, sort && "dk-table__header--sortable", props.className)}>
      {sort ? (
        <button type="button" ref={button} className="dk-table__sort" onClick={props.onSort}>
          <span>{props.children}</span>
          <Icon icon={NEXT_ICON[sort]} className={cn("dk-table__sort-icon", sort === "none" && "dk-table__sort-icon--idle")} />
        </button>
      ) : props.children}
    </th>
  );
});

const PLAIN = { useGrouping: false } as const;
/** A data cell (<td>). align="end" for numbers. A number as its child is written in the locale's digits (ungrouped,
 *  as given: 1204 stays 1204 in en-US and is ١٢٠٤ in ar-EG); for grouping, currency or units, pass FormattedNumber. */
export const TableCell = /* @__PURE__ */ component<HTMLTableCellElement, TableCellProps>("TableCell", function TableCell(props, ref) {
  const rest = omit(props, { align: 1, className: 1, children: 1, link: 1 });
  const align = oneOf(ALIGN, props.align, "start");
  const locale = useLocale();
  const row = React.useContext(RowLinkContext);
  const n = props.children;
  const content = typeof n === "number" && Number.isFinite(n) ? displayNumber(n, locale, PLAIN) : n;
  return <td {...rest} ref={ref} className={cn("dk-table__cell", align !== "start" && "dk-table__cell--" + align, props.className)}>
    {row && props.link ? <a className="dk-table__row-link" href={row.href} target={row.target} rel={row.rel}>{content}</a> : content}
  </td>;
});

/* TableActionBar: the bar above a table with selectable rows. While rows are selected, it shows "3 selected", your
   actions and "Clear selection"; with none, it's hidden. It's a group named by the count, and a new count is read out
   politely. When it hides with focus in it (Clear, or an action that empties the selection), focus moves to the first
   checkbox of the table after it (the header's "Select all"), so it isn't lost: render it just before the Table. */
/** The bar of actions for a table's selected rows: "3 selected", your buttons, and "Clear selection". */
export const TableActionBar = /* @__PURE__ */ component<HTMLDivElement, TableActionBarProps>("TableActionBar", function TableActionBar(props, ref) {
  const labels = useSettings(words).labels;
  const rest = omit(props, { count: 1, onClear: 1, clearLabel: 1, className: 1, children: 1 });
  const count = Math.max(0, Math.floor(props.count) || 0);
  const self = React.useRef<HTMLDivElement | null>(null);
  const setRefs = React.useCallback((e: HTMLDivElement | null) => { self.current = e; setRef(ref, e); }, [ref]);
  const id = domId("dk-tab", React.useId());
  const said = labels.tableSelected(count);
  // Hidden (not removed) at 0, so focus is still in it here and can go to the table's "Select all" before it's lost.
  useIsoLayoutEffect(() => {
    const bar = self.current;
    if (count || !bar || !bar.contains(activeIn(bar))) return;   // its own root's focus, in a shadow root too (GR95)
    const box = bar.nextElementSibling && bar.nextElementSibling.querySelector<HTMLInputElement>('input[type="checkbox"]:not(:disabled)');
    if (box) box.focus();
  }, [count]);
  // From 0, not the mounted count: a bar rendered only while rows are selected ({n > 0 && <TableActionBar />}) says
  // its first count too (GR55).
  const was = React.useRef(0);
  React.useEffect(() => {
    if (count === was.current) return;
    was.current = count;
    if (count) announce(said);   // not 0: the hidden bar says nothing, and the checkbox that cleared it says its own state
  }, [count, said]);
  return (
    <div role="group" aria-labelledby={id} {...rest} ref={setRefs} hidden={!count || undefined} data-component="table-action-bar" className={cn("dk-table-action-bar", props.className)}>
      <span id={id} className="dk-table-action-bar__count">{said}</span>
      <div className="dk-table-action-bar__actions">{props.children}</div>
      {props.onClear ? <Button variant="ghost" size="sm" onClick={props.onClear}>{props.clearLabel || labels.clearSelection}</Button> : null}
    </div>
  );
});
