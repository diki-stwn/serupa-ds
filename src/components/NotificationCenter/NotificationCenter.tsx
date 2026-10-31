"use client";
import * as React from "react";
import { cn, domId, omit, oneOf, useIsoLayoutEffect } from "../../internal/cn";
import { component } from "../../internal/component";
import { useSettings } from "../../internal/provider";
import { Drawer, type DrawerProps } from "../Drawer/Drawer";
import { Button } from "../Button/Button";
import { IconButton } from "../IconButton/IconButton";
import { Icon } from "../Icon/Icon";
import { RelativeTime } from "../RelativeTime/RelativeTime";
import { watchToasts, type ToastTone } from "../Toast/Toast";
import * as icons from "../../material/builtin";
import type { IconData } from "../../material/types";
import { en as words } from "./labels";

/** One notification in the list. */
export interface NotificationItem {
  /** Unique in the list; a toast's id when it came from one. */
  id: string;
  /** The main line. */
  title: React.ReactNode;
  /** A muted line under it. */
  description?: React.ReactNode;
  /** 'neutral' (default, no icon), 'info', 'success', 'warning' or 'danger', as a toast's. */
  tone?: ToastTone;
  /** When it happened, shown as "5 minutes ago". */
  time?: Date | number;
  /** Whether it's been read. Unread ones have a dot, bolder titles and a "Mark as read" button. */
  read?: boolean;
}

// DrawerProps with three of them closed off, not an Omit<>, which costs every project's type check more (types.mjs).
export interface NotificationCenterProps extends DrawerProps {
  /** The drawer's title. Default: "Notifications" (labels.notificationCenter). */
  title?: React.ReactNode;
  /** Not taken: the list is the drawer's content. */
  description?: never;
  /** Not taken: the footer holds "Mark all as read" and "Clear all". */
  footer?: never;
  /** Not taken: the list is the drawer's content. */
  children?: never;
  /** The notifications, newest first: useToastHistory().items, or your own. */
  items: NotificationItem[];
  /** Called with an unread one's id when its "Mark as read" is chosen. Without it, there's no button. */
  onMarkRead?: (id: string) => void;
  /** Called when "Mark all as read" in the footer is chosen. Without it, there's no button. */
  onMarkAllRead?: () => void;
  /** Called when "Clear all" in the footer is chosen. Without it, there's no button. */
  onClear?: () => void;
  /** What shows with no notifications. Default: "No notifications yet" (labels.noNotifications). */
  empty?: React.ReactNode;
}

export interface ToastHistoryOptions {
  /** The most kept; older ones drop off the end. Default: 50. */
  limit?: number;
}

/** What useToastHistory returns. */
export interface ToastHistory {
  /** The toasts shown since it mounted, newest first, unread until marked read. */
  items: NotificationItem[];
  /** How many are unread, for a badge on the button that opens the NotificationCenter. */
  unread: number;
  /** Marks one read, or every one with no id. */
  markRead: (id?: string) => void;
  /** Empties the list. */
  clear: () => void;
}

/* useToastHistory: every toast() shown while it's mounted, newest first and unread, with the time it was shown. A
   toast replaced by id (toast.promise's "Saving…" → "Saved") stays one entry with the newer words, and a repeat
   ("×3") moves it back to the top, unread. Call it once, in the layout that renders the NotificationCenter. */
/** Records the toasts shown while it's mounted, for a NotificationCenter: { items, unread, markRead, clear }. */
export function useToastHistory(options?: ToastHistoryOptions): ToastHistory {
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const limit = Math.max(1, Math.floor(options && options.limit && options.limit > 0 ? options.limit : 50));
  React.useEffect(() => watchToasts((t) => {
    const time = Date.now();   // when it was shown, not when React gets to the update
    setItems((l) => [{ id: t.id, title: t.title, description: t.description, tone: t.tone, time: time, read: false }, ...l.filter((x) => x.id !== t.id)].slice(0, limit));
  }), [limit]);
  const markRead = React.useCallback((id?: string) => setItems((l) => l.map((x) => (id == null || x.id === id ? Object.assign({}, x, { read: true }) : x))), []);
  const clear = React.useCallback(() => setItems([]), []);
  return { items, unread: items.filter((x) => !x.read).length, markRead, clear };
}

const ICONS: Record<ToastTone, IconData | null> = { neutral: null, info: icons.Info, success: icons.CheckCircle, warning: icons.Warning, danger: icons.Error };
const TONES: readonly ToastTone[] = ["neutral", "info", "success", "warning", "danger"];

/* NotificationCenter: a Drawer listing past notifications, newest first: each with its tone icon, title,
   description and time, and unread ones with a dot, a bolder title and "Mark as read". The footer has "Mark all as
   read" and "Clear all". Feed it useToastHistory() for the toasts already shown, or your own list. */
/** A drawer of past notifications with read states: feed it useToastHistory() or your own list. */
export const NotificationCenter = /* @__PURE__ */ component<HTMLDialogElement, NotificationCenterProps>("NotificationCenter", function NotificationCenter(props, ref) {
  const labels = useSettings(words).labels;
  const base = domId("dk-nc", React.useId());
  // The Drawer's own props are named below, so its other attributes (id, aria-*) pass through in rest.
  const rest = omit(props, { title: 1, description: 1, footer: 1, children: 1, items: 1, onMarkRead: 1, onMarkAllRead: 1, onClear: 1, empty: 1, className: 1, open: 1, defaultOpen: 1, onOpenChange: 1,
    side: 1, size: 1, modal: 1, closeButton: 1, closeLabel: 1, closeOnBackdrop: 1, swipeToClose: 1, initialFocus: 1, finalFocus: 1 } as const);
  const { items, onMarkRead, onMarkAllRead, onClear } = props;
  const footer = onMarkAllRead || onClear ? <>
    {onMarkAllRead ? <Button variant="ghost" size="sm" onClick={onMarkAllRead}>{labels.markAllRead}</Button> : null}
    {onClear ? <Button variant="ghost" size="sm" onClick={onClear}>{labels.clearNotifications}</Button> : null}
  </> : null;
  // The row focus is in, if any. When the app takes that row away (an inbox that hides read ones, so "Mark as read"
  // removes the row it just focused), focus goes to the row now in its place, else the last, else the empty line,
  // instead of dropping to the page.
  const list = React.useRef<HTMLUListElement | null>(null);
  const none = React.useRef<HTMLParagraphElement | null>(null);
  const at = React.useRef(-1);
  const rowOf = (t: EventTarget | null) => { const l = list.current, li = t instanceof Element ? t.closest("li") : null; return l && li && li.parentElement === l ? Array.prototype.indexOf.call(l.children, li) : -1; };
  useIsoLayoutEffect(() => {
    if (at.current < 0) return;
    const active = document.activeElement, l = list.current;
    if (active && active !== document.body && active.isConnected) { at.current = rowOf(active); return; }
    const rows = l ? l.children : null;
    const to = (rows && rows.length ? rows[Math.min(at.current, rows.length - 1)] : none.current) as HTMLElement | null;
    at.current = -1;
    if (to) to.focus();
  }, [items]);
  return (
    <Drawer {...rest} ref={ref} className={cn("dk-notification-center", props.className)} open={props.open} defaultOpen={props.defaultOpen} onOpenChange={props.onOpenChange}
      side={props.side} size={props.size} modal={props.modal} closeButton={props.closeButton} closeLabel={props.closeLabel} closeOnBackdrop={props.closeOnBackdrop} swipeToClose={props.swipeToClose} initialFocus={props.initialFocus} finalFocus={props.finalFocus}
      title={props.title != null ? props.title : labels.notificationCenter} footer={footer}>
      {items.length ? (
        <ul role="list" className="dk-notification-center__list" ref={list}
          onFocus={(e) => { at.current = rowOf(e.target); }} onBlur={(e) => { if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) at.current = -1; }}>
          {items.map((n, i) => {
            const tone = oneOf(TONES, n.tone, "neutral"), icon = ICONS[tone], titleId = base + "-" + i;
            return (
              // Focusable from script only: "Mark as read" goes away once chosen, and focus stays on its row.
              <li key={n.id} tabIndex={-1} className={cn("dk-notification-center__item", "dk-notification-center__item--" + tone)} data-tone={tone} data-read={n.read ? "" : undefined}>
                {icon ? <span className="dk-notification-center__icon" aria-hidden="true"><Icon icon={icon} /></span> : null}
                <div className="dk-notification-center__content">
                  <p className="dk-notification-center__title">
                    {n.read ? null : <span className="dk-visually-hidden">{labels.unreadNotification + ": "}</span>}
                    <span id={titleId}>{n.title}</span>
                  </p>
                  {n.description != null ? <p className="dk-notification-center__description">{n.description}</p> : null}
                  {n.time != null ? <RelativeTime className="dk-notification-center__time" date={n.time} format="short" /> : null}
                </div>
                {n.read ? null : <span className="dk-notification-center__dot" aria-hidden="true" />}
                {/* Every unread row has one, so it's described by its row's title: "Mark as read, button, Invoice paid" (TF4).
                    The title tooltip is kept, which IconButton leaves out when it's described. */}
                {!n.read && onMarkRead ? <IconButton icon={icons.Check} label={labels.markRead} title={labels.markRead} aria-describedby={titleId} size="sm" onClick={(e) => { e.currentTarget.closest("li")?.focus(); onMarkRead(n.id); }} /> : null}
              </li>
            );
          })}
        </ul>
      ) : <p className="dk-notification-center__empty" ref={none} tabIndex={-1}>{props.empty != null ? props.empty : labels.noNotifications}</p>}
    </Drawer>
  );
});
