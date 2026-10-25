// exports: type SortDirection, Table, TableBody, TableCell, type TableCellProps, TableFoot, TableHead, TableHeaderCell, type TableHeaderCellProps, type TableProps, TableRow, type TableRowProps, TableSelectCell, type TableSelectCellProps
interface TableLabels {
    table: string;
    tableSorted: (column: string, direction: "ascending" | "descending") => string;
}
interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    size?: "md" | "sm";
    striped?: boolean;
    stickyHeader?: boolean;
    caption?: React.ReactNode;
    captionHidden?: boolean;
    containerProps?: React.HTMLAttributes<HTMLDivElement>;
}
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    selected?: boolean;
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
}
declare const Table: React.ForwardRefExoticComponent<TableProps & React.RefAttributes<HTMLTableElement>>;
declare const TableHead: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElement>>;
declare const TableBody: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElement>>;
declare const TableFoot: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElement>>;
declare const TableRow: React.ForwardRefExoticComponent<TableRowProps & React.RefAttributes<HTMLTableRowElement>>;
declare const TableSelectCell: React.ForwardRefExoticComponent<TableSelectCellProps & React.RefAttributes<HTMLInputElement>>;
declare const TableHeaderCell: React.ForwardRefExoticComponent<TableHeaderCellProps & React.RefAttributes<HTMLTableCellElement>>;
declare const TableCell: React.ForwardRefExoticComponent<TableCellProps & React.RefAttributes<HTMLTableCellElement>>;
