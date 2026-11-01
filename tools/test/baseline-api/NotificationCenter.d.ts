// exports: NotificationCenter, type NotificationCenterProps, type NotificationItem, type ToastHistory, type ToastHistoryOptions, useToastHistory
interface NotificationCenterLabels {
    notificationCenter: string;
    noNotifications: string;
    unreadNotification: string;
    markRead: string;
    markAllRead: string;
    clearNotifications: string;
}
interface NotificationItem {
    id: string;
    title: React.ReactNode;
    description?: React.ReactNode;
    tone?: ToastTone;
    time?: Date | number;
    read?: boolean;
}
interface NotificationCenterProps extends DrawerProps {
    title?: React.ReactNode;
    description?: never;
    footer?: never;
    children?: never;
    unsaved?: never;
    items: NotificationItem[];
    onMarkRead?: (id: string) => void;
    onMarkAllRead?: () => void;
    onClear?: () => void;
    empty?: React.ReactNode;
}
interface ToastHistoryOptions {
    limit?: number;
}
interface ToastHistory {
    items: NotificationItem[];
    unread: number;
    markRead: (id?: string) => void;
    clear: () => void;
}
declare function useToastHistory(options?: ToastHistoryOptions): ToastHistory;
declare const NotificationCenter: React.ForwardRefExoticComponent<NotificationCenterProps & React.RefAttributes<HTMLDialogElement>>;
