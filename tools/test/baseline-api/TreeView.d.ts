// exports: TreeView, type TreeViewProps
interface TreeViewItem {
    id: string;
    label: React.ReactNode;
    textValue?: string;
    icon?: IconSource;
    children?: TreeViewItem[];
    disabled?: boolean;
}
interface TreeViewProps extends Omit<React.HTMLAttributes<HTMLUListElement>, "defaultValue" | "onChange"> {
    items: TreeViewItem[];
    selectionMode?: "multiple" | "none" | "single";
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    expanded?: string[];
    defaultExpanded?: string[];
    onExpandedChange?: (expanded: string[]) => void;
    "aria-label"?: string;
}
declare const TreeView: React.ForwardRefExoticComponent<TreeViewProps & React.RefAttributes<HTMLUListElement>>;
