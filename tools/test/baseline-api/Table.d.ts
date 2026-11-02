// exports: type SortDirection, Table, TableActionBar, type TableActionBarProps, TableBody, type TableBodyProps, TableCell, type TableCellProps, TableFoot, type TableFootProps, TableHead, TableHeaderCell, type TableHeaderCellProps, type TableHeadProps, type TableProps, TableRow, type TableRowProps, TableSelectCell, type TableSelectCellProps, TableVirtualBody, type TableVirtualBodyProps
interface TableLabels {
    table: string;
    tableSorted: (column: string, direction: "ascending" | "descending") => string;
    tableSelected: (count: number) => string;
    clearSelection: string;
}
interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    size?: "md" | "sm";
    striped?: boolean;
    stickyHeader?: boolean;
    caption?: React.ReactNode;
    hideCaption?: boolean;
    containerProps?: React.HTMLAttributes<HTMLDivElement>;
}
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    selected?: boolean;
    href?: string;
    target?: string;
    rel?: string;
}
interface TableSelectCellProps extends Omit<CheckboxProps, "children" | "description" | "size"> {
    label: string;
    header?: boolean;
    cellProps?: React.TdHTMLAttributes<HTMLTableCellElement>;
}
type SortDirection = "ascending" | "descending" | "none";
interface TableHeaderCellProps extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, "align"> {
    align?: "center" | "end" | "start";
    sort?: SortDirection;
    onSort?: () => void;
}
interface TableCellProps extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, "align"> {
    align?: "center" | "end" | "start";
    link?: boolean;
}
interface TableActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
    count: number;
    onClear?: () => void;
    clearLabel?: string;
    children?: React.ReactNode;
}
declare const Table: React.ForwardRefExoticComponent<TableProps & React.RefAttributes<HTMLTableElement>>;
type TableHeadProps = React.HTMLAttributes<HTMLTableSectionElement>;
type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;
type TableFootProps = React.HTMLAttributes<HTMLTableSectionElement>;
declare const TableHead: React.ForwardRefExoticComponent<TableHeadProps & React.RefAttributes<HTMLTableSectionElement>>;
declare const TableBody: React.ForwardRefExoticComponent<TableBodyProps & React.RefAttributes<HTMLTableSectionElement>>;
interface TableVirtualBodyProps extends Omit<React.HTMLAttributes<HTMLTableSectionElement>, "children"> {
    count: number;
    renderRow: (index: number) => React.ReactElement;
    itemKey?: (index: number) => React.Key;
    estimatedRowHeight?: number;
    overscan?: number;
}
declare const TableVirtualBody: React.ForwardRefExoticComponent<TableVirtualBodyProps & React.RefAttributes<HTMLTableSectionElement>>;
declare const TableFoot: React.ForwardRefExoticComponent<TableFootProps & React.RefAttributes<HTMLTableSectionElement>>;
declare const TableRow: React.ForwardRefExoticComponent<TableRowProps & React.RefAttributes<HTMLTableRowElement>>;
declare const TableSelectCell: React.ForwardRefExoticComponent<TableSelectCellProps & React.RefAttributes<HTMLInputElement>>;
declare const TableHeaderCell: React.ForwardRefExoticComponent<TableHeaderCellProps & React.RefAttributes<HTMLTableCellElement>>;
declare const TableCell: React.ForwardRefExoticComponent<TableCellProps & React.RefAttributes<HTMLTableCellElement>>;
declare const TableActionBar: React.ForwardRefExoticComponent<TableActionBarProps & React.RefAttributes<HTMLDivElement>>;
