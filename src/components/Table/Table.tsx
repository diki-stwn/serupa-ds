"use client";
import * as React from "react";
import { cn, domId, oneOf, omit } from "../../internal/cn";
import { Icon } from "../Icon/Icon";
import { Checkbox, type CheckboxProps } from "../Checkbox/Checkbox";
import { component } from "../../internal/component";
import { useSerupa } from "../../internal/provider";
import * as icons from "../../material/builtin";
import type { IconData } from "../../material/types";

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
  captionHidden?: boolean;
  /** Props for the scrolling frame around the table (style with a maxHeight for stickyHeader). */
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Marks a row as selected: a shaded background and a primary bar at its start. Screen readers can't tell from
      the shading (and ignore aria-selected in a table), so give the row a TableSelectCell, whose checkbox says it. */
  selected?: boolean;
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
}

const ALIGN = ["start", "center", "end"] as const;

/* Table: a native <table> in a frame that scrolls sideways when it's too wide (and then takes keyboard focus
   so it can be scrolled with the arrows). size, striped and stickyHeader style the rows; caption names it.
   className and every other prop go to the <table>; containerProps go to the frame. */
/** A data table: native table markup in a scrolling frame, with sizes, stripes, a sticky header and sortable columns. */
export const Table = /* @__PURE__ */ component<HTMLTableElement, TableProps>("Table", function Table(props, ref) {
  const sds = useSerupa();
  const rest = omit(props, { size: 1, striped: 1, stickyHeader: 1, caption: 1, captionHidden: 1, containerProps: 1, className: 1, children: 1 });
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
  // A name on the frame belongs to its region role: a plain div that doesn't scroll can't carry one (axe aria-prohibited-attr).
  const { "aria-label": frameLabel, "aria-labelledby": frameLabelledBy, ...cp } = props.containerProps || {};
  const hasCaption = props.caption != null && props.caption !== false && props.caption !== "";
  const region = !scrolls ? {} : hasCaption ? { tabIndex: 0, role: "region", "aria-labelledby": cid }
    : { tabIndex: 0, role: "region", "aria-labelledby": frameLabelledBy, "aria-label": frameLabelledBy ? undefined : frameLabel || sds.labels.table };
  return (
    <div {...cp} {...region} ref={frame} data-component="table" className={cn("dk-table", size === "sm" && "dk-table--sm", props.striped && "dk-table--striped", props.stickyHeader && "dk-table--sticky", cp.className)}>
      <table {...rest} ref={ref} className={cn("dk-table__table", props.className)}>
        {hasCaption ? <caption id={cid} className={cn("dk-table__caption", props.captionHidden && "dk-visually-hidden")}>{props.caption}</caption> : null}
        {props.children}
      </table>
    </div>
  );
});

/** The header rows (<thead>). */
export const TableHead = /* @__PURE__ */ component<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>("TableHead", function TableHead(props, ref) {
  return <thead {...props} ref={ref} className={cn("dk-table__head", props.className)} />;
});

/** The body rows (<tbody>). */
export const TableBody = /* @__PURE__ */ component<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>("TableBody", function TableBody(props, ref) {
  return <tbody {...props} ref={ref} className={cn("dk-table__body", props.className)} />;
});

/** Footer rows such as totals (<tfoot>). */
export const TableFoot = /* @__PURE__ */ component<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>("TableFoot", function TableFoot(props, ref) {
  return <tfoot {...props} ref={ref} className={cn("dk-table__foot", props.className)} />;
});

/** A row (<tr>). selected shades it, with a bar at its start; a TableSelectCell in it says so to screen readers. */
export const TableRow = /* @__PURE__ */ component<HTMLTableRowElement, TableRowProps>("TableRow", function TableRow(props, ref) {
  const rest = omit(props, { selected: 1, className: 1 });
  return <tr {...rest} ref={ref} className={cn("dk-table__row", props.selected && "dk-table__row--selected", props.className)} />;
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
  return (
    <th scope="col" {...rest} ref={ref} aria-sort={sort && sort !== "none" ? sort : undefined}
      className={cn("dk-table__cell dk-table__header", align !== "start" && "dk-table__cell--" + align, sort && "dk-table__header--sortable", props.className)}>
      {sort ? (
        <button type="button" className="dk-table__sort" onClick={props.onSort}>
          <span>{props.children}</span>
          <Icon icon={NEXT_ICON[sort]} className={cn("dk-table__sort-icon", sort === "none" && "dk-table__sort-icon--idle")} />
        </button>
      ) : props.children}
    </th>
  );
});

/** A data cell (<td>). align="end" for numbers. */
export const TableCell = /* @__PURE__ */ component<HTMLTableCellElement, TableCellProps>("TableCell", function TableCell(props, ref) {
  const rest = omit(props, { align: 1, className: 1 });
  const align = oneOf(ALIGN, props.align, "start");
  return <td {...rest} ref={ref} className={cn("dk-table__cell", align !== "start" && "dk-table__cell--" + align, props.className)} />;
});
