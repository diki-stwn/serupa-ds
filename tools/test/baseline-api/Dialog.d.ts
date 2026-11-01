// exports: Dialog, type DialogProps
interface DialogLabels {
    discardTitle: string;
    discardDescription: string;
    discard: string;
    keepEditing: string;
}
interface DialogProps extends Omit<React.DialogHTMLAttributes<HTMLDialogElement>, "open" | "title"> {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
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
    finalFocus?: React.RefObject<HTMLElement | null>;
    unsaved?: boolean;
}
declare const Dialog: React.ForwardRefExoticComponent<DialogProps & React.RefAttributes<HTMLDialogElement>>;
