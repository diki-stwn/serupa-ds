"use client";

// src/components/NotificationCenter/NotificationCenter.tsx
import * as React from "react";
import { cn, domId, omit, oneOf, useIsoLayoutEffect } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useSettings } from "../../internal/provider.js";
import { Drawer } from "../Drawer/Drawer.js";
import { Button } from "../Button/Button.js";
import { IconButton } from "../IconButton/IconButton.js";
import { Icon } from "../Icon/Icon.js";
import { RelativeTime } from "../RelativeTime/RelativeTime.js";
import { watchToasts } from "../Toast/Toast.js";
import * as icons from "../../material/builtin.js";
import { en as words } from "./labels.js";
function useToastHistory(options) {
  const [items, setItems] = React.useState([]);
  const limit = Math.max(1, Math.floor(options && options.limit && options.limit > 0 ? options.limit : 50));
  React.useEffect(() => watchToasts((t) => {
    const time = Date.now();
    setItems((l) => [{ id: t.id, title: t.title, description: t.description, tone: t.tone, time, read: false }, ...l.filter((x) => x.id !== t.id)].slice(0, limit));
  }), [limit]);
  const markRead = React.useCallback((id) => setItems((l) => l.map((x) => id == null || x.id === id ? Object.assign({}, x, { read: true }) : x)), []);
  const clear = React.useCallback(() => setItems([]), []);
  return { items, unread: items.filter((x) => !x.read).length, markRead, clear };
}
var ICONS = { neutral: null, info: icons.Info, success: icons.CheckCircle, warning: icons.Warning, danger: icons.Error };
var TONES = ["neutral", "info", "success", "warning", "danger"];
var NotificationCenter = /* @__PURE__ */ component("NotificationCenter", function NotificationCenter2(props, ref) {
  const labels = useSettings(words).labels;
  const base = domId("dk-nc", React.useId());
  const rest = omit(props, {
    title: 1,
    description: 1,
    footer: 1,
    children: 1,
    items: 1,
    onMarkRead: 1,
    onMarkAllRead: 1,
    onClear: 1,
    empty: 1,
    className: 1,
    open: 1,
    defaultOpen: 1,
    onOpenChange: 1,
    side: 1,
    size: 1,
    modal: 1,
    closeButton: 1,
    closeLabel: 1,
    closeOnBackdrop: 1,
    swipeToClose: 1,
    initialFocus: 1,
    finalFocus: 1,
    unsaved: 1
  });
  const { items, onMarkRead, onMarkAllRead, onClear } = props;
  const footer = onMarkAllRead || onClear ? /* @__PURE__ */ React.createElement(React.Fragment, null, onMarkAllRead ? /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", onClick: onMarkAllRead }, labels.markAllRead) : null, onClear ? /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm", onClick: onClear }, labels.clearNotifications) : null) : null;
  const list = React.useRef(null);
  const none = React.useRef(null);
  const at = React.useRef(-1);
  const rowOf = (t) => {
    const l = list.current, li = t instanceof Element ? t.closest("li") : null;
    return l && li && li.parentElement === l ? Array.prototype.indexOf.call(l.children, li) : -1;
  };
  useIsoLayoutEffect(() => {
    if (at.current < 0) return;
    const active = document.activeElement, l = list.current;
    if (active && active !== document.body && active.isConnected) {
      at.current = rowOf(active);
      return;
    }
    const rows = l ? l.children : null;
    const to = rows && rows.length ? rows[Math.min(at.current, rows.length - 1)] : none.current;
    at.current = -1;
    if (to) to.focus();
  }, [items]);
  return /* @__PURE__ */ React.createElement(
    Drawer,
    {
      ...rest,
      ref,
      className: cn("dk-notification-center", props.className),
      open: props.open,
      defaultOpen: props.defaultOpen,
      onOpenChange: props.onOpenChange,
      side: props.side,
      size: props.size,
      modal: props.modal,
      closeButton: props.closeButton,
      closeLabel: props.closeLabel,
      closeOnBackdrop: props.closeOnBackdrop,
      swipeToClose: props.swipeToClose,
      initialFocus: props.initialFocus,
      finalFocus: props.finalFocus,
      title: props.title != null ? props.title : labels.notificationCenter,
      footer
    },
    items.length ? /* @__PURE__ */ React.createElement(
      "ul",
      {
        role: "list",
        className: "dk-notification-center__list",
        ref: list,
        onFocus: (e) => {
          at.current = rowOf(e.target);
        },
        onBlur: (e) => {
          if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) at.current = -1;
        }
      },
      items.map((n, i) => {
        const tone = oneOf(TONES, n.tone, "neutral"), icon = ICONS[tone], titleId = base + "-" + i;
        return (
          // Focusable from script only: "Mark as read" goes away once chosen, and focus stays on its row.
          /* @__PURE__ */ React.createElement("li", { key: n.id, tabIndex: -1, className: cn("dk-notification-center__item", "dk-notification-center__item--" + tone), "data-tone": tone, "data-read": n.read ? "" : void 0 }, icon ? /* @__PURE__ */ React.createElement("span", { className: "dk-notification-center__icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { icon })) : null, /* @__PURE__ */ React.createElement("div", { className: "dk-notification-center__content" }, /* @__PURE__ */ React.createElement("p", { className: "dk-notification-center__title" }, n.read ? null : /* @__PURE__ */ React.createElement("span", { className: "dk-visually-hidden" }, labels.unreadNotification + ": "), /* @__PURE__ */ React.createElement("span", { id: titleId }, n.title)), n.description != null ? /* @__PURE__ */ React.createElement("p", { className: "dk-notification-center__description" }, n.description) : null, n.time != null ? /* @__PURE__ */ React.createElement(RelativeTime, { className: "dk-notification-center__time", date: n.time, format: "short" }) : null), n.read ? null : /* @__PURE__ */ React.createElement("span", { className: "dk-notification-center__dot", "aria-hidden": "true" }), !n.read && onMarkRead ? /* @__PURE__ */ React.createElement(IconButton, { icon: icons.Check, label: labels.markRead, title: labels.markRead, "aria-describedby": titleId, size: "sm", onClick: (e) => {
            e.currentTarget.closest("li")?.focus();
            onMarkRead(n.id);
          } }) : null)
        );
      })
    ) : /* @__PURE__ */ React.createElement("p", { className: "dk-notification-center__empty", ref: none, tabIndex: -1 }, props.empty != null ? props.empty : labels.noNotifications)
  );
});
export {
  NotificationCenter,
  useToastHistory
};
//# sourceMappingURL=NotificationCenter.js.map
