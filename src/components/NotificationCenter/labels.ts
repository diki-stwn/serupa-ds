// NotificationCenter's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface NotificationCenterLabels {
  /** NotificationCenter: the drawer's title. */
  notificationCenter: string;
  /** NotificationCenter: what shows when there are none. */
  noNotifications: string;
  /** NotificationCenter: read before an unread one's title. */
  unreadNotification: string;
  /** NotificationCenter: the button on an unread one. */
  markRead: string;
  /** NotificationCenter: the footer button that marks every one read. */
  markAllRead: string;
  /** NotificationCenter: the footer button that empties the list. */
  clearNotifications: string;
}
export const en: NotificationCenterLabels = {
  notificationCenter: "Notifications",
  noNotifications: "No notifications yet",
  unreadNotification: "Unread",
  markRead: "Mark as read",
  markAllRead: "Mark all as read",
  clearNotifications: "Clear all",
};
export const id: NotificationCenterLabels = {
  notificationCenter: "Notifikasi",
  noNotifications: "Belum ada notifikasi",
  unreadNotification: "Belum dibaca",
  markRead: "Tandai sudah dibaca",
  markAllRead: "Tandai semua sudah dibaca",
  clearNotifications: "Hapus semua",
};
