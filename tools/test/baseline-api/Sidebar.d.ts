// exports: Sidebar, SidebarItem, type SidebarItemOwnProps, type SidebarItemProps, type SidebarProps, SidebarSection, type SidebarSectionProps
interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
    children?: React.ReactNode;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    collapsed?: boolean;
    "aria-label"?: string;
}
interface SidebarSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    title?: React.ReactNode;
    children?: React.ReactNode;
}
interface SidebarItemOwnProps {
    label: React.ReactNode;
    icon?: IconSource;
    active?: boolean;
    badge?: React.ReactNode;
    children?: React.ReactNode;
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
}
type SidebarItemProps<C extends React.ElementType = "a"> = SidebarItemOwnProps & {
    as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, "as" | keyof SidebarItemOwnProps>;
declare const Sidebar: React.ForwardRefExoticComponent<SidebarProps & React.RefAttributes<HTMLElement>>;
declare const SidebarSection: React.ForwardRefExoticComponent<SidebarSectionProps & React.RefAttributes<HTMLDivElement>>;
declare const SidebarItem: {
    <C extends React.ElementType = "a">(props: SidebarItemProps<C> & {
        ref?: React.Ref<HTMLElement>;
    }): null | React.ReactElement;
    displayName?: string;
};
