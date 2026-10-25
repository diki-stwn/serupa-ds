"use client";

// src/components/Toast/Toast.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import { cn, oneOf, useIsoLayoutEffect } from "../../internal/cn.js";
import { announce, ensureAnnouncer } from "../../internal/announce.js";
import { Icon } from "../Icon/Icon.js";
import { Button } from "../Button/Button.js";
import { IconButton } from "../IconButton/IconButton.js";
import { named } from "../../internal/component.js";
import { useSerupa } from "../../internal/provider.js";
import { onModalChange, topModal } from "../../internal/layers.js";
import * as icons from "../../material/builtin.js";
var items = [];
var listeners = /* @__PURE__ */ new Set();
var next = 0;
var emit = () => listeners.forEach((l) => l(items));
var text = (n) => typeof n === "string" || typeof n === "number" ? String(n) : "";
var TONES = ["neutral", "info", "success", "warning", "danger"];
var HOTKEY = "F8";
var hint = "";
var hinted = false;
var REPEAT_QUIET = 1e3;
var repeated = null;
var repeatTimers = /* @__PURE__ */ new Map();
var said = (o) => o.announcement != null ? o.announcement : [text(o.title), text(o.description)].filter(Boolean).join(". ");
function show(options) {
  const o = typeof options === "string" ? { title: options } : options;
  const tone = oneOf(TONES, o.tone, "neutral");
  const same = o.id || o.action ? -1 : items.findIndex((x) => !x.action && x.tone === tone && text(x.title) !== "" && text(x.title) === text(o.title) && text(x.description) === text(o.description));
  if (same >= 0) {
    items = items.map((x, i) => i === same ? Object.assign({}, x, { count: x.count + 1 }) : x);
    emit();
    const rid = items[same].id;
    const wait = repeatTimers.get(rid);
    if (wait) clearTimeout(wait);
    repeatTimers.set(rid, setTimeout(() => {
      repeatTimers.delete(rid);
      const now = items.find((x) => x.id === rid), say2 = now ? said(now) : "";
      if (now && say2 && repeated) announce(say2 + ". " + repeated(now.count) + ".", { assertive: now.tone === "danger" });
    }, REPEAT_QUIET));
    return rid;
  }
  const id = o.id || "dk-toast-" + ++next;
  const item = Object.assign({}, o, { id, tone, count: 1 });
  const at = items.findIndex((x) => x.id === id);
  items = at >= 0 ? items.map((x, i) => i === at ? item : x) : items.concat(item);
  emit();
  let say = said(o);
  if (say && o.action && hint && !hinted) {
    say += ". " + hint;
    hinted = true;
  }
  if (say) announce(say, { assertive: item.tone === "danger" });
  return id;
}
function dismiss(id) {
  items = id == null ? [] : items.filter((x) => x.id !== id);
  emit();
}
var toast = /* @__PURE__ */ Object.assign(show, { dismiss });
var POSITIONS = ["top-start", "top-center", "top-end", "bottom-start", "bottom-center", "bottom-end"];
var ICONS = { neutral: null, info: icons.Info, success: icons.CheckCircle, warning: icons.Warning, danger: icons.Error };
var Toaster = /* @__PURE__ */ named("Toaster", function Toaster2(props) {
  const sds = useSerupa();
  const { position, label, dismissLabel, limit, className, ...rest } = props;
  const [list, setList] = React.useState([]);
  React.useEffect(() => {
    ensureAnnouncer();
    hinted = false;
    listeners.add(setList);
    setList(items);
    return () => {
      listeners.delete(setList);
    };
  }, []);
  const pos = oneOf(POSITIONS, position, "bottom-end");
  const shortcut = sds.labels.toastShortcut(HOTKEY);
  React.useEffect(() => {
    hint = shortcut;
    return () => {
      hint = "";
    };
  }, [shortcut]);
  const times = sds.labels.toastRepeated;
  React.useEffect(() => {
    repeated = times;
    return () => {
      repeated = null;
    };
  }, [times]);
  const self = React.useRef(null);
  const back = React.useRef(null);
  React.useEffect(() => {
    const away = () => {
      const b = back.current;
      back.current = null;
      if (b && b.isConnected) b.focus();
    };
    const onKey = (e) => {
      const region2 = self.current;
      if (!region2 || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const inside = region2.contains(document.activeElement);
      if (e.key === HOTKEY) {
        const toasts = region2.querySelectorAll(".dk-toast");
        if (inside) {
          e.preventDefault();
          away();
          return;
        }
        if (!toasts.length) return;
        e.preventDefault();
        back.current = document.activeElement;
        toasts[pos.startsWith("top") ? 0 : toasts.length - 1].focus();
      } else if (e.key === "Escape" && inside && back.current) {
        e.preventDefault();
        away();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pos]);
  const held = React.useRef(null);
  const onFocus = (e) => {
    if (rest.onFocus) rest.onFocus(e);
    const t = e.target.closest(".dk-toast");
    if (t && self.current) held.current = { toast: t, at: [...self.current.querySelectorAll(".dk-toast")].indexOf(t) };
  };
  const onBlur = (e) => {
    if (rest.onBlur) rest.onBlur(e);
    const h = held.current, to = e.relatedTarget;
    if (to && self.current && !self.current.contains(to)) held.current = null;
    else if (!to && h) window.setTimeout(() => {
      if (held.current === h && h.toast.isConnected && !h.toast.contains(document.activeElement)) held.current = null;
    }, 0);
  };
  useIsoLayoutEffect(() => {
    const h = held.current, region2 = self.current;
    if (!h || h.toast.isConnected || !region2) return;
    held.current = null;
    const now = document.activeElement;
    if (now && now !== document.body && now.isConnected) return;
    const b = back.current, toasts = region2.querySelectorAll(".dk-toast");
    if (b && b.isConnected) {
      back.current = null;
      b.focus();
    } else if (toasts.length) toasts[Math.min(h.at, toasts.length - 1)].focus();
  }, [list]);
  const max = Math.max(1, Math.floor(limit != null && limit > 0 ? limit : 3));
  const shown = list.slice(-max), waiting = list.length - shown.length;
  const more = waiting > 0 ? /* @__PURE__ */ React.createElement("li", { key: "more", className: "dk-toaster__more" }, sds.labels.moreToasts(waiting)) : null;
  const ordered = pos.startsWith("top") ? shown.slice().reverse() : shown;
  const modal = React.useSyncExternalStore(onModalChange, topModal, () => null);
  const region = /* @__PURE__ */ React.createElement("section", { ...rest, ref: self, onFocus, onBlur, "aria-label": label || sds.labels.notifications, className: cn("dk-toaster", "dk-toaster--" + pos, className), "data-component": "toaster", "data-position": pos }, /* @__PURE__ */ React.createElement("ol", { className: "dk-toaster__list" }, pos.startsWith("top") ? null : more, ordered.map((t) => /* @__PURE__ */ React.createElement(ToastView, { key: t.id, item: t, dismissLabel: dismissLabel || sds.labels.dismiss })), pos.startsWith("top") ? more : null));
  return modal ? createPortal(region, modal) : region;
});
function ToastView(props) {
  const t = props.item;
  const sds = useSerupa();
  const duration = t.duration == null ? t.action ? 0 : 5e3 : t.duration;
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const paused = hovered || focused || hidden;
  const left = React.useRef(duration);
  React.useEffect(() => {
    left.current = duration;
  }, [t, duration]);
  React.useEffect(() => {
    if (!duration || paused) return;
    const start = Date.now();
    const timer = window.setTimeout(() => toast.dismiss(t.id), left.current);
    return () => {
      window.clearTimeout(timer);
      left.current -= Date.now() - start;
    };
  }, [paused, t, duration]);
  React.useEffect(() => {
    const vis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, []);
  const titleId = t.id + "-title", descId = t.id + "-desc";
  const icon = ICONS[t.tone];
  return /* @__PURE__ */ React.createElement(
    "li",
    {
      tabIndex: -1,
      className: cn("dk-toast", "dk-toast--" + t.tone),
      "data-tone": t.tone,
      "aria-labelledby": titleId,
      "aria-describedby": t.description != null ? descId : void 0,
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      onFocus: () => setFocused(true),
      onBlur: (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }
    },
    icon ? /* @__PURE__ */ React.createElement("span", { className: "dk-toast__icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { icon })) : null,
    /* @__PURE__ */ React.createElement("div", { className: "dk-toast__content" }, /* @__PURE__ */ React.createElement("p", { className: "dk-toast__title", id: titleId }, t.title, t.count > 1 ? /* @__PURE__ */ React.createElement("span", { className: "dk-toast__count" }, /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\xD7" + t.count), /* @__PURE__ */ React.createElement("span", { className: "dk-visually-hidden" }, ", " + sds.labels.toastRepeated(t.count))) : null), t.description != null ? /* @__PURE__ */ React.createElement("p", { className: "dk-toast__description", id: descId }, t.description) : null),
    t.action ? /* @__PURE__ */ React.createElement(Button, { className: "dk-toast__action", size: "sm", variant: "secondary", onClick: () => {
      t.action.onClick();
      toast.dismiss(t.id);
    } }, t.action.label) : null,
    /* @__PURE__ */ React.createElement(IconButton, { className: "dk-toast__close", icon: icons.Close, label: props.dismissLabel, size: "sm", noTitle: true, onClick: () => toast.dismiss(t.id) })
  );
}
export {
  Toaster,
  toast
};
//# sourceMappingURL=Toast.js.map
