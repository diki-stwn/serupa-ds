// exports: Divider, type DividerProps
interface DividerProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
    orientation?: "horizontal" | "vertical";
    label?: React.ReactNode;
    decorative?: boolean;
}
declare const Divider: React.ForwardRefExoticComponent<DividerProps & React.RefAttributes<HTMLElement>>;
