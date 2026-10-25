// exports: ContextMenu, type ContextMenuProps, Menu, MenuCheckboxItem, type MenuCheckboxItemProps, MenuGroup, type MenuGroupProps, MenuItem, type MenuItemProps, type MenuProps, MenuRadioGroup, type MenuRadioGroupProps, MenuRadioItem, type MenuRadioItemProps, MenuSeparator, MenuSub, type MenuSubProps
interface MenuProps {
    trigger: React.ReactElement;
    children: React.ReactNode;
    placement?: Placement;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
    "aria-label"?: string;
    className?: string;
    style?: React.CSSProperties;
}
declare const Menu: ((props: MenuProps) => React.ReactElement) & {
    displayName: string;
};
interface ContextMenuProps {
    target: React.ReactElement;
    children: React.ReactNode;
    "aria-label": string;
    open?: boolean;
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
}
declare const ContextMenu: ((props: ContextMenuProps) => React.ReactElement) & {
    displayName: string;
};
interface MenuItemProps extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
    onSelect?: (event: React.SyntheticEvent) => void;
    icon?: IconSource;
    shortcut?: string;
    destructive?: boolean;
    disabled?: boolean;
    href?: string;
    as?: React.ElementType;
    target?: string;
    rel?: string;
}
declare const MenuItem: React.ForwardRefExoticComponent<MenuItemProps & React.RefAttributes<HTMLElement>>;
type CheckableProps = Omit<MenuItemProps, "aria-checked" | "as" | "destructive" | "href" | "rel" | "role" | "target">;
interface MenuCheckboxItemProps extends CheckableProps {
    checked: boolean;
    onCheckedChange?: (checked: boolean) => void;
}
declare const MenuCheckboxItem: React.ForwardRefExoticComponent<MenuCheckboxItemProps & React.RefAttributes<HTMLElement>>;
interface MenuRadioGroupProps extends Omit<MenuGroupProps, "defaultValue" | "onChange"> {
    value: string | undefined;
    onValueChange?: (value: string) => void;
}
declare const MenuRadioGroup: React.ForwardRefExoticComponent<MenuRadioGroupProps & React.RefAttributes<HTMLDivElement>>;
interface MenuRadioItemProps extends CheckableProps {
    value: string;
}
declare const MenuRadioItem: React.ForwardRefExoticComponent<MenuRadioItemProps & React.RefAttributes<HTMLElement>>;
interface MenuSubProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
    label: React.ReactNode;
    children: React.ReactNode;
    icon?: IconSource;
    disabled?: boolean;
}
declare const MenuSub: React.ForwardRefExoticComponent<MenuSubProps & React.RefAttributes<HTMLElement>>;
interface MenuGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    label?: React.ReactNode;
}
declare const MenuGroup: React.ForwardRefExoticComponent<MenuGroupProps & React.RefAttributes<HTMLDivElement>>;
declare const MenuSeparator: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
