// exports: SortableList, type SortableListProps
interface SortableListLabels {
    reorder: string;
    reorderInstructions: string;
    reorderGrabbed: (item: string, position: number, total: number) => string;
    reorderMoved: (item: string, position: number, total: number) => string;
    reorderDropped: (item: string, position: number, total: number) => string;
    reorderCancelled: (item: string, position: number, total: number) => string;
}
interface SortableListProps<T> extends Omit<React.HTMLAttributes<HTMLUListElement>, "children" | "onChange"> {
    items: readonly T[];
    getKey: (item: T) => number | string;
    getLabel: (item: T) => string;
    renderItem: (item: T, state: {
        index: number;
        dragging: boolean;
    }) => React.ReactNode;
    onReorder: (items: T[], move: {
        from: number;
        to: number;
    }) => void;
    disabled?: boolean;
    reorderLabel?: string;
    orientation?: "horizontal" | "vertical";
}
declare const SortableList: <T>(props: SortableListProps<T> & {
    ref?: React.Ref<HTMLUListElement>;
}) => React.ReactElement;
