// exports: Popover, type PopoverProps
interface PopoverProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "role" | "title"> {
    trigger: React.ReactElement;
    children: ((close: () => void) => React.ReactNode) | React.ReactNode;
    title?: React.ReactNode;
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    placement?: Placement;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
    "aria-label"?: string;
    initialFocus?: "first" | "panel";
    className?: string;
    style?: React.CSSProperties;
}
declare const Popover: React.ForwardRefExoticComponent<PopoverProps & React.RefAttributes<HTMLDivElement>>;
