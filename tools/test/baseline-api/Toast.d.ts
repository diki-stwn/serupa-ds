// exports: toast, Toaster, type ToasterPosition, type ToasterProps, type ToastOptions, type ToastTone
interface ToastLabels {
    notifications: string;
    toastShortcut: (key: string) => string;
    moreToasts: (count: number) => string;
    toastRepeated: (count: number) => string;
}
type ToastTone = "danger" | "info" | "neutral" | "success" | "warning";
type ToasterPosition = "bottom-center" | "bottom-end" | "bottom-start" | "top-center" | "top-end" | "top-start";
interface ToastOptions {
    title: React.ReactNode;
    description?: React.ReactNode;
    tone?: ToastTone;
    action?: {
        label: string;
        onClick: () => void;
    };
    duration?: number;
    announcement?: string;
    id?: string;
}
declare function show(options: string | ToastOptions): string;
declare function dismiss(id?: string): void;
declare const toast: typeof show & {
    dismiss: typeof dismiss;
};
interface ToasterProps extends React.HTMLAttributes<HTMLElement> {
    position?: ToasterPosition;
    label?: string;
    dismissLabel?: string;
    limit?: number;
}
declare const Toaster: ((props: ToasterProps) => React.ReactElement) & {
    displayName: string;
};
