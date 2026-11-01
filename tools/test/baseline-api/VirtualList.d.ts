// exports: VirtualList, type VirtualListProps
interface VirtualListProps extends Omit<React.HTMLAttributes<HTMLUListElement>, "children"> {
    count: number;
    renderItem: (index: number) => React.ReactElement;
    itemKey?: (index: number) => React.Key;
    estimatedItemHeight?: number;
    overscan?: number;
    variant?: "card" | "plain";
    divided?: boolean;
    as?: "ol" | "ul";
}
declare const VirtualList: React.ForwardRefExoticComponent<VirtualListProps & React.RefAttributes<HTMLUListElement>>;
