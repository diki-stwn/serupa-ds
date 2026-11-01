// exports: ContextMenu, type ContextMenuProps, Menu, MenuCheckboxItem, type MenuCheckboxItemProps, MenuGroup, type MenuGroupProps, MenuItem, type MenuItemOwnProps, type MenuItemProps, type MenuProps, MenuRadioGroup, type MenuRadioGroupProps, MenuRadioItem, type MenuRadioItemProps, MenuSeparator, type MenuSeparatorProps, MenuSub, type MenuSubProps
interface MenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "role"> {
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
declare const Menu: React.ForwardRefExoticComponent<MenuProps & React.RefAttributes<HTMLDivElement>>;
interface ContextMenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "role"> {
    target: React.ReactElement;
    children: React.ReactNode;
    "aria-label": string;
    open?: boolean;
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
}
declare const ContextMenu: React.ForwardRefExoticComponent<ContextMenuProps & React.RefAttributes<HTMLDivElement>>;
interface MenuItemOwnProps {
    onSelect?: (event: React.SyntheticEvent) => void;
    icon?: IconSource;
    shortcut?: string;
    destructive?: boolean;
    disabled?: boolean;
}
declare const MenuItem: {
    <C extends React.ElementType = "a">(props: MenuItemProps<C> & {
        ref?: React.Ref<HTMLElement>;
    }): null | React.ReactElement;
    displayName?: string;
};
type MenuItemProps<C extends React.ElementType = "a"> = MenuItemOwnProps & {
    as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, "as" | keyof MenuItemOwnProps>;
type CheckableProps = Omit<ItemProps, "aria-checked" | "as" | "destructive" | "href" | "rel" | "role" | "target">;
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
type MenuSeparatorProps = React.HTMLAttributes<HTMLDivElement>;
declare const MenuSeparator: React.ForwardRefExoticComponent<MenuSeparatorProps & React.RefAttributes<HTMLDivElement>>;
