// exports: Drawer, type DrawerProps
interface DrawerProps extends Omit<React.DialogHTMLAttributes<HTMLDialogElement>, "open" | "title"> {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
    side?: "bottom" | "left" | "right" | "top";
    size?: "lg" | "md" | "sm";
    title?: React.ReactNode;
    description?: React.ReactNode;
    footer?: React.ReactNode;
    closeButton?: boolean;
    closeLabel?: string;
    closeOnBackdrop?: boolean;
    modal?: boolean;
    swipeToClose?: boolean;
}
declare const Drawer: React.ForwardRefExoticComponent<DrawerProps & React.RefAttributes<HTMLDialogElement>>;
