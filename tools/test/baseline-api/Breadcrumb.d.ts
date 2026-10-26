// exports: Breadcrumb, BreadcrumbItem, type BreadcrumbItemOwnProps, type BreadcrumbItemProps, type BreadcrumbProps
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
interface BreadcrumbItemOwnProps {
    href?: string;
    icon?: IconSource;
    current?: boolean;
}
type BreadcrumbItemProps<C extends React.ElementType = "a"> = BreadcrumbItemOwnProps & {
    as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, "as" | keyof BreadcrumbItemOwnProps>;
declare const BreadcrumbItem: {
    <C extends React.ElementType = "a">(props: BreadcrumbItemProps<C> & {
        ref?: React.Ref<React.ComponentRef<C>>;
    }): null | React.ReactElement;
    displayName?: string;
};
declare const Breadcrumb: React.ForwardRefExoticComponent<BreadcrumbProps & React.RefAttributes<HTMLElement>>;
