// exports: IconButton, type IconButtonProps
type Without<T> = T extends unknown ? Omit<T, "aria-label" | "children" | "icon" | "leftIcon" | "rightIcon"> : never;
interface IconButtonOwnProps {
    icon: IconSource;
    label: string;
    shape?: "round" | "square";
    noTitle?: boolean;
}
type IconButtonProps = (Without<ButtonAsButtonProps> & IconButtonOwnProps) | (Without<ButtonAsLinkProps> & IconButtonOwnProps);
type IconButtonElement = HTMLAnchorElement | HTMLButtonElement;
declare const IconButton: React.ForwardRefExoticComponent<IconButtonProps & React.RefAttributes<IconButtonElement>>;
