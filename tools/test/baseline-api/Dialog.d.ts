// exports: Dialog, type DialogProps
interface DialogProps extends Omit<React.DialogHTMLAttributes<HTMLDialogElement>, "open" | "title"> {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    footer?: React.ReactNode;
    size?: "lg" | "md" | "sm";
    alert?: boolean;
    closeButton?: boolean;
    closeLabel?: string;
    closeOnBackdrop?: boolean;
    fullScreen?: "mobile" | boolean;
    initialFocus?: React.RefObject<HTMLElement | null>;
}
declare const Dialog: React.ForwardRefExoticComponent<DialogProps & React.RefAttributes<HTMLDialogElement>>;
