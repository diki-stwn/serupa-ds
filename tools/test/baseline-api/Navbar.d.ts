// exports: Navbar, NavbarLink, type NavbarLinkOwnProps, type NavbarLinkProps, type NavbarProps
interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
    brand?: React.ReactNode;
    children?: React.ReactNode;
    actions?: React.ReactNode;
    sticky?: boolean;
    size?: ContainerSize;
    "aria-label"?: string;
    menuLabel?: string;
}
interface NavbarLinkOwnProps {
    active?: boolean;
}
type NavbarLinkProps<C extends React.ElementType = "a"> = NavbarLinkOwnProps & {
    as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, "as" | keyof NavbarLinkOwnProps>;
declare const Navbar: React.ForwardRefExoticComponent<NavbarProps & React.RefAttributes<HTMLElement>>;
declare const NavbarLink: {
    <C extends React.ElementType = "a">(props: NavbarLinkProps<C> & {
        ref?: React.Ref<React.ComponentRef<C>>;
    }): null | React.ReactElement;
    displayName?: string;
};
