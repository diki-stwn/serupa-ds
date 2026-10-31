// exports: Pagination, type PaginationProps, paginationRange
interface PaginationLabels {
    pagination: string;
    previousPage: string;
    nextPage: string;
    itemsOf: (first: string, last: string, total: string) => string;
}
type Entry = "end-ellipsis" | "start-ellipsis" | number;
declare function paginationRange(page: number, count: number, siblings?: number, boundaries?: number): Entry[];
interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
    count: number;
    page?: number;
    defaultPage?: number;
    onPageChange?: (page: number) => void;
    getHref?: (page: number) => string;
    linkAs?: React.ElementType;
    siblings?: number;
    boundaries?: number;
    size?: "md" | "sm";
    "aria-label"?: string;
    previousLabel?: string;
    nextLabel?: string;
    pageLabel?: (page: number) => string;
    total?: number;
    pageSize?: number;
}
declare const Pagination: React.ForwardRefExoticComponent<PaginationProps & React.RefAttributes<HTMLElement>>;
