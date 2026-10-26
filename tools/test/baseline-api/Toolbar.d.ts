// exports: Toolbar, type ToolbarProps
interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: "horizontal" | "vertical";
    "aria-label"?: string;
    children?: React.ReactNode;
}
declare const Toolbar: React.ForwardRefExoticComponent<ToolbarProps & React.RefAttributes<HTMLDivElement>>;
