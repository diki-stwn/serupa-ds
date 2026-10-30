// exports: Badge, type BadgeProps, type BadgeTone, type BadgeVariant
type BadgeVariant = "outline" | "solid" | "subtle";
type BadgeTone = "amber" | "blue" | "cyan" | "danger" | "emerald" | "fuchsia" | "green" | "indigo" | "info" | "lime" | "neutral" | "orange" | "pink" | "primary" | "purple" | "red" | "rose" | "sky" | "success" | "teal" | "violet" | "warning" | "yellow";
interface BadgeProps extends Omit<React.HTMLAttributes<HTMLElement>, "onClick"> {
    variant?: BadgeVariant;
    tone?: BadgeTone;
    dot?: boolean;
    ping?: boolean;
    leftIcon?: IconSource;
    count?: number;
    max?: number;
    showZero?: boolean;
    onRemove?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    removeLabel?: string;
    onClick?: React.MouseEventHandler<HTMLElement>;
    href?: string;
    target?: string;
    rel?: string;
    disabled?: boolean;
    type?: "button" | "reset" | "submit";
    loading?: boolean;
    loadingText?: string;
}
declare const Badge: React.ForwardRefExoticComponent<BadgeProps & React.RefAttributes<HTMLElement>>;
