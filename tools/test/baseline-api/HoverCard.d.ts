// exports: HoverCard, type HoverCardProps
interface HoverCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "content"> {
    trigger: React.ReactElement;
    children: React.ReactNode;
    placement?: Placement;
    openDelay?: number;
    closeDelay?: number;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
}
declare const HoverCard: React.ForwardRefExoticComponent<HoverCardProps & React.RefAttributes<HTMLDivElement>>;
