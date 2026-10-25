// exports: Popover, type PopoverProps
interface PopoverProps {
    trigger: React.ReactElement;
    children: ((close: () => void) => React.ReactNode) | React.ReactNode;
    title?: React.ReactNode;
    placement?: Placement;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    "aria-label"?: string;
    initialFocus?: "first" | "panel";
    className?: string;
    style?: React.CSSProperties;
}
declare const Popover: ((props: PopoverProps) => React.ReactElement) & {
    displayName: string;
};
