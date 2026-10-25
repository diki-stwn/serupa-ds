// exports: Button, type ButtonAsButtonProps, type ButtonAsLinkProps, buttonClass, type ButtonProps, type ButtonSize, type ButtonVariant
declare function buttonClass(opts?: {
    variant?: ButtonVariant;
    destructive?: boolean;
    size?: ButtonSize;
    iconOnly?: boolean;
    iconPosition?: "left" | "right";
    className?: string;
}): string;
type ButtonVariant = "ghost" | "link" | "outline" | "primary" | "secondary";
type ButtonSize = "lg" | "md" | "sm";
interface ButtonOwnProps {
    variant?: ButtonVariant;
    destructive?: boolean;
    size?: ButtonSize;
    leftIcon?: IconSource;
    rightIcon?: IconSource;
    icon?: IconSource;
    loading?: boolean;
    loadingText?: string;
    disabledReason?: string;
    successText?: string;
}
interface ButtonAsButtonProps extends ButtonOwnProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type"> {
    href?: undefined;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => unknown;
    type?: "button" | "reset" | "submit";
    popoverTarget?: string;
    popoverTargetAction?: "hide" | "show" | "toggle";
    commandfor?: string;
    command?: string;
}
interface ButtonAsLinkProps extends ButtonOwnProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "type"> {
    href: string;
    disabled?: boolean;
}
type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;
declare const Button: {
    (props: ButtonAsButtonProps & React.RefAttributes<HTMLButtonElement>): null | React.ReactElement;
    (props: ButtonAsLinkProps & React.RefAttributes<HTMLAnchorElement>): null | React.ReactElement;
    displayName?: string;
};
