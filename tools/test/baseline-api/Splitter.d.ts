// exports: Splitter, type SplitterProps
interface SplitterLabels {
    resizePanes: string;
}
interface SplitterProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "defaultValue"> {
    children: [
        React.ReactNode,
        React.ReactNode
    ];
    direction?: "horizontal" | "vertical";
    size?: number;
    defaultSize?: number;
    onSizeChange?: (size: number) => void;
    min?: number;
    max?: number;
    step?: number;
    collapsible?: boolean;
    storageKey?: string;
    separatorLabel?: string;
}
declare const Splitter: React.ForwardRefExoticComponent<SplitterProps & React.RefAttributes<HTMLDivElement>>;
