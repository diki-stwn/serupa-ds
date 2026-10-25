// exports: toast, Toaster, type ToasterPosition, type ToasterProps, type ToastOptions, type ToastPromiseMessages, type ToastTone
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
type Message<A> = ((arg: A) => string | ToastOptions) | string | ToastOptions;
interface ToastPromiseMessages<T> {
    loading: string | ToastOptions;
    success: Message<T>;
    error: Message<unknown>;
}
declare function promise<T>(work: (() => Promise<T>) | Promise<T>, messages: ToastPromiseMessages<T>): Promise<T>;
declare const toast: typeof show & {
    dismiss: typeof dismiss;
    promise: typeof promise;
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
