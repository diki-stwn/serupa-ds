// exports: Breadcrumb, BreadcrumbItem, type BreadcrumbItemProps, type BreadcrumbProps
interface BreadcrumbLabels {
    breadcrumb: string;
    showHiddenPages: string;
    morePages: string;
}
interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
    children?: React.ReactNode;
    separator?: "chevron" | "slash";
    maxItems?: number;
    collapse?: "inline" | "menu";
    "aria-label"?: string;
    expandLabel?: string;
}
interface BreadcrumbItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href?: string;
    icon?: IconSource;
    as?: React.ElementType;
    current?: boolean;
}
declare const BreadcrumbItem: React.ForwardRefExoticComponent<BreadcrumbItemProps & React.RefAttributes<HTMLAnchorElement>>;
declare const Breadcrumb: React.ForwardRefExoticComponent<BreadcrumbProps & React.RefAttributes<HTMLElement>>;
