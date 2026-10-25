// exports: Tooltip, type TooltipProps
interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactElement;
    placement?: Placement;
    delay?: number;
    role?: "description" | "label";
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
}
declare const Tooltip: ((props: TooltipProps) => React.ReactElement) & {
    displayName: string;
};
