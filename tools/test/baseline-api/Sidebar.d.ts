// exports: Sidebar, SidebarItem, type SidebarItemProps, type SidebarProps, SidebarSection, type SidebarSectionProps
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
interface SidebarItemProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
    label: React.ReactNode;
    icon?: IconSource;
    active?: boolean;
    badge?: React.ReactNode;
    children?: React.ReactNode;
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
    as?: React.ElementType;
}
declare const Sidebar: React.ForwardRefExoticComponent<SidebarProps & React.RefAttributes<HTMLElement>>;
declare const SidebarSection: React.ForwardRefExoticComponent<SidebarSectionProps & React.RefAttributes<HTMLDivElement>>;
declare const SidebarItem: React.ForwardRefExoticComponent<SidebarItemProps & React.RefAttributes<HTMLAnchorElement>>;
