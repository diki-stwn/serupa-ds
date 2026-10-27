"use client";

// src/components/Toast/Toast.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import { cn, oneOf, useIsoLayoutEffect } from "../../internal/cn.js";
import { announce, ensureAnnouncer } from "../../internal/announce.js";
import { warnOnce } from "../../internal/warn.js";
import { Icon } from "../Icon/Icon.js";
import { Button } from "../Button/Button.js";
import { IconButton } from "../IconButton/IconButton.js";
import { named } from "../../internal/component.js";
import { useSettings } from "../../internal/provider.js";
import { onModalChange, topModal } from "../../internal/layers.js";
import { settleTime, speed, track } from "../../internal/fling.js";
import * as icons from "../../material/builtin.js";
import { en as ownWords } from "./labels.js";
var items = [];
var listeners = /* @__PURE__ */ new Set();
var next = 0;
var emit = () => {
  let left = listeners.size;
  listeners.forEach((l) => l(--left ? [] : items));
};
var text = (n) => typeof n === "string" || typeof n === "number" ? String(n) : "";
var TONES = ["neutral", "info", "success", "warning", "danger"];
var HOTKEY = "F8";
var hint = "";
var hinted = false;
var REPEAT_QUIET = 1e3;
var repeated = null;
var repeatTimers = /* @__PURE__ */ new Map();
var watchers = /* @__PURE__ */ new Set();
function watchToasts(fn) {
  watchers.add(fn);
  return () => {
    watchers.delete(fn);
  };
}
var tell = (t) => watchers.forEach((w) => w({ id: t.id, title: t.title, description: t.description, tone: t.tone, count: t.count }));
var said = (o) => o.announcement != null ? o.announcement : [text(o.title), text(o.description)].filter(Boolean).join(". ");
function show(options) {
  const o = typeof options === "string" ? { title: options } : options;
  const tone = oneOf(TONES, o.tone, "neutral");
  const same = o.id || o.action ? -1 : items.findIndex((x) => !x.action && x.tone === tone && text(x.title) !== "" && text(x.title) === text(o.title) && text(x.description) === text(o.description));
  if (same >= 0) {
    items = items.map((x, i) => i === same ? Object.assign({}, x, { count: x.count + 1 }) : x);
    emit();
    tell(items[same]);
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
  tell(item);
  let say = said(o);
  if (say && o.action && hint && !hinted) {
    say += ". " + hint;
    hinted = true;
  }
  if (say) announce(say, { assertive: item.tone === "danger" });
  return id;
}
var onClose = /* @__PURE__ */ new Map();
function dismiss(id) {
  const gone = id == null ? items : items.filter((x) => x.id === id);
  items = id == null ? [] : items.filter((x) => x.id !== id);
  emit();
  for (const x of gone) {
    const then = onClose.get(x.id);
    if (then) {
      onClose.delete(x.id);
      then();
    }
  }
}
var asOptions = (m) => typeof m === "string" ? { title: m } : m;
function promise(work, messages) {
  const p = typeof work === "function" ? work() : work;
  const id = "dk-toast-" + ++next;
  show(Object.assign({ autoDismiss: false }, asOptions(messages.loading), { id }));
  const settle = (m, arg, tone) => {
    const o = asOptions(typeof m === "function" ? m(arg) : m);
    show(Object.assign({ tone }, o, { id }));
  };
  p.then((v) => settle(messages.success, v, "success"), (e) => settle(messages.error, e, "danger"));
  return p;
}
var undoWord = "";
function undo(options) {
  const { commit, onUndo, undoLabel, ...rest } = options;
  let settled = false;
  const once = (f) => () => {
    if (settled) return;
    settled = true;
    window.removeEventListener("pagehide", keep);
    if (f) f();
  };
  const keep = once(commit), back = once(onUndo);
  const id = show(Object.assign({}, rest, { action: { label: undoLabel || undoWord || ownWords.undo, onClick: back }, autoDismiss: true }));
  onClose.set(id, keep);
  window.addEventListener("pagehide", keep);
  return id;
}
var toast = /* @__PURE__ */ Object.assign(show, { dismiss, promise, undo });
var POSITIONS = ["top-start", "top-center", "top-end", "bottom-start", "bottom-center", "bottom-end"];
var ICONS = { neutral: null, info: icons.Info, success: icons.CheckCircle, warning: icons.Warning, danger: icons.Error };
var Toaster = /* @__PURE__ */ named("Toaster", function Toaster2(props) {
  const sds = useSettings(ownWords);
  const { position, label, dismissLabel, limit, duration, autoDismiss, className, ...rest } = props;
  const [list, setList] = React.useState([]);
  const self = React.useRef(null);
  const before = React.useRef(null);
  const snap = () => {
    const region2 = self.current;
    if (!region2 || before.current) return;
    before.current = new Map([...region2.querySelectorAll(MOVES)].map((e) => [e.dataset.toast || "more", e.getBoundingClientRect().top]));
  };
  const early = React.useRef(/* @__PURE__ */ new Set()), arriving = React.useRef(true);
  React.useEffect(() => {
    ensureAnnouncer();
    hinted = false;
    if (process.env.NODE_ENV !== "production" && listeners.size) warnOnce("toaster-twice", "Toaster: another Toaster is already mounted, so only this newer one shows toasts. Render one Toaster, once, near the root.");
    const take = (l) => {
      snap();
      if (arriving.current) l.forEach((x) => early.current.add(x.id));
      setList(l);
    };
    arriving.current = true;
    listeners.add(take);
    emit();
    void Promise.resolve().then(() => {
      arriving.current = false;
    });
    return () => {
      listeners.delete(take);
      emit();
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
  const undoText = sds.labels.undo;
  React.useEffect(() => {
    undoWord = undoText;
    return () => {
      undoWord = "";
    };
  }, [undoText]);
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
        const toasts = region2.querySelectorAll("[data-toast]:not([data-leaving])");
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
    if (t && self.current) held.current = { toast: t, at: [...self.current.querySelectorAll("[data-toast]:not([data-leaving])")].indexOf(t), keys: e.target.matches(":focus-visible") };
  };
  const onPointerDown = (e) => {
    if (rest.onPointerDown) rest.onPointerDown(e);
    if (held.current) held.current.keys = false;
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
    if (!h || h.toast.isConnected && !h.toast.hasAttribute("data-leaving") || !region2) return;
    held.current = null;
    if (!h.keys) return;
    const now = document.activeElement;
    if (now && now !== document.body && now.isConnected && !h.toast.contains(now)) return;
    const b = back.current, toasts = region2.querySelectorAll("[data-toast]:not([data-leaving])");
    if (b && b.isConnected) {
      back.current = null;
      b.focus();
    } else if (toasts.length) toasts[Math.min(h.at, toasts.length - 1)].focus();
  }, [list]);
  const max = Math.max(1, Math.floor(limit != null && limit > 0 ? limit : 3));
  const shown = list.slice(-max), waiting = list.length - shown.length;
  const [moreWas, setMoreWas] = React.useState({ waiting: 0, words: "" });
  const words = waiting > 0 ? sds.labels.moreToasts(waiting) : moreWas.words;
  if (waiting !== moreWas.waiting || waiting > 0 && words !== moreWas.words) setMoreWas({ waiting, words: waiting > 0 ? words : moreWas.words });
  const moreRef = React.useRef(null);
  const moreLeaving = waiting === 0 && words !== "";
  useIsoLayoutEffect(() => {
    const e = moreRef.current;
    if (!moreLeaving || !e) return;
    const runs = typeof e.getAnimations === "function" ? e.getAnimations().filter((a) => a.id !== "dk-toast-move") : [];
    const end = () => {
      snap();
      setMoreWas((m) => m.waiting ? m : { waiting: 0, words: "" });
    };
    if (!runs.length) {
      end();
      return;
    }
    let on = true;
    void Promise.all(runs.map((a) => a.finished.catch(() => {
    }))).then(() => {
      if (on) end();
    });
    return () => {
      on = false;
    };
  }, [moreLeaving]);
  const moreInstant = list.slice(0, waiting).every((x) => early.current.has(x.id));
  const more = words ? /* @__PURE__ */ React.createElement("li", { key: "more", ref: moreRef, className: "dk-toaster__more", "data-leaving": moreLeaving ? "" : void 0, "data-instant": moreInstant ? "" : void 0, "aria-hidden": moreLeaving || void 0 }, words) : null;
  const ordered = pos.startsWith("top") ? shown.slice().reverse() : shown;
  const [gone, setGone] = React.useState([]);
  const [last, setLast] = React.useState([]);
  const key = ordered.map((t) => t.id).join(" ");
  if (key !== last.map((t) => t.id).join(" ")) {
    const ids = new Set(ordered.map((t) => t.id)), held2 = new Set(list.map((t) => t.id));
    setGone(gone.filter((g) => !ids.has(g.item.id)).concat(last.flatMap((t, at) => ids.has(t.id) ? [] : [{ item: t, at, after: at ? last[at - 1].id : null, queued: held2.has(t.id) }])));
    setLast(ordered);
  }
  const rows = ordered.map((t) => ({ item: t, leaving: false }));
  for (const g of gone) {
    const i = g.after == null ? -1 : rows.findIndex((r) => r.item.id === g.after);
    rows.splice(g.after == null ? 0 : i >= 0 ? i + 1 : Math.min(g.at, rows.length), 0, { item: g.item, leaving: g.queued ? "queued" : "closed" });
  }
  const clocks = React.useRef(/* @__PURE__ */ new Map());
  React.useEffect(() => {
    const ids = new Set(list.map((t) => t.id));
    for (const id of clocks.current.keys()) if (!ids.has(id)) clocks.current.delete(id);
    const run = list.slice(0, waiting).flatMap((t) => {
      const c = clocks.current.get(t.id);
      if (!c || c.item !== t || !(c.left > 0)) return [];
      c.since = Date.now();
      return [{ c, timer: window.setTimeout(() => toast.dismiss(t.id), c.left) }];
    });
    return () => {
      for (const r of run) {
        window.clearTimeout(r.timer);
        r.c.left = timeLeft(r.c);
        r.c.since = null;
      }
    };
  }, [list, waiting]);
  const done = React.useCallback((id) => {
    snap();
    setGone((l) => l.filter((g) => g.item.id !== id));
  }, []);
  useIsoLayoutEffect(() => {
    const was = before.current, region2 = self.current;
    before.current = null;
    if (!was || !region2 || typeof window.matchMedia !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cs = getComputedStyle(region2), ms = parseFloat(cs.getPropertyValue("--dk-toast-move")) || 0;
    if (!ms) return;
    for (const e of region2.querySelectorAll(MOVES)) {
      const from = was.get(e.dataset.toast || "more");
      if (from == null || typeof e.animate !== "function") continue;
      for (const a of e.getAnimations()) if (a.id === "dk-toast-move") a.cancel();
      const dy = from - e.getBoundingClientRect().top;
      if (Math.abs(dy) < 0.5) continue;
      e.animate([{ translate: "0 " + dy + "px" }, { translate: "0 0" }], { duration: ms, easing: cs.getPropertyValue("--dk-toast-move-ease").trim() || "ease", id: "dk-toast-move" });
    }
  });
  const modal = React.useSyncExternalStore(onModalChange, topModal, () => null);
  const region = /* @__PURE__ */ React.createElement("section", { ...rest, ref: self, onFocus, onBlur, onPointerDown, "aria-label": label || sds.labels.notifications, className: cn("dk-toaster", "dk-toaster--" + pos, className), "data-component": "toaster", "data-position": pos }, /* @__PURE__ */ React.createElement("ol", { className: "dk-toaster__list", role: "list" }, pos.startsWith("top") ? null : more, rows.map((r) => /* @__PURE__ */ React.createElement(ToastView, { key: r.item.id, item: r.item, leaving: r.leaving, clocks: clocks.current, instant: early.current.has(r.item.id), onGone: done, dismissLabel: dismissLabel || sds.labels.dismiss, time: r.item.autoDismiss ?? autoDismiss ?? true ? Math.max(0, r.item.duration ?? duration ?? 5e3) : 0 })), pos.startsWith("top") ? more : null));
  return modal ? createPortal(region, modal) : region;
});
var timeLeft = (c) => c.left - (c.since == null ? 0 : Date.now() - c.since);
var MOVES = "[data-toast], .dk-toaster__more";
function ToastView(props) {
  const t = props.item;
  const self = React.useRef(null);
  const { leaving, onGone } = props;
  useIsoLayoutEffect(() => {
    const e = self.current;
    if (!leaving || !e) return;
    if (!e.hasAttribute("data-gone")) {
      e.style.top = e.offsetTop + "px";
      e.setAttribute("data-gone", "");
    }
    const runs = typeof e.getAnimations === "function" ? e.getAnimations().filter((a) => a.id !== "dk-toast-move") : [];
    if (!runs.length) {
      onGone(t.id);
      return;
    }
    let on = true;
    void Promise.all(runs.map((a) => a.finished.catch(() => {
    }))).then(() => {
      if (on) onGone(t.id);
    });
    return () => {
      on = false;
    };
  }, [leaving]);
  const sds = useSettings(ownWords);
  const duration = props.time;
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [held, setHeld] = React.useState(false);
  const paused = hovered || focused || hidden || held;
  const { clocks } = props;
  const [kept] = React.useState(() => clocks.get(t.id));
  const left = React.useRef(kept && kept.item === t ? Math.max(0, timeLeft(kept)) : duration);
  const shown = React.useRef(t);
  React.useEffect(() => {
    if (shown.current !== t) {
      shown.current = t;
      left.current = duration;
    }
  }, [t, duration]);
  React.useEffect(() => {
    if (leaving) return;
    clocks.set(t.id, { item: t, left: left.current, since: null });
    if (!duration || paused) return;
    const start = Date.now();
    const timer = window.setTimeout(() => toast.dismiss(t.id), left.current);
    return () => {
      window.clearTimeout(timer);
      left.current -= Date.now() - start;
      clocks.set(t.id, { item: t, left: left.current, since: null });
    };
  }, [paused, t, duration, leaving, clocks]);
  React.useEffect(() => {
    const vis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, []);
  const drag = React.useRef(null);
  const onSwipeDown = (e) => {
    if (leaving || e.pointerType !== "touch" || !e.isPrimary || e.target.closest("button, a, input, textarea, select")) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, d: 0, on: false, s: [{ t: e.timeStamp, p: 0 }] };
  };
  const onSwipeMove = (e) => {
    const g = drag.current;
    if (!g || e.pointerId !== g.id) return;
    const d = e.clientX - g.x, across = Math.abs(e.clientY - g.y), el = e.currentTarget;
    if (!g.on) {
      if (across > 10 && across > Math.abs(d)) {
        drag.current = null;
        return;
      }
      if (Math.abs(d) < 10) return;
      g.on = true;
      setHeld(true);
      el.setAttribute("data-dragging", "");
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
      }
    }
    g.d = d;
    track(g.s, e.timeStamp, d);
    el.style.translate = d + "px 0";
    el.style.opacity = String(Math.max(0, 1 - Math.abs(d) / el.offsetWidth));
  };
  const onSwipeEnd = (e) => {
    const g = drag.current;
    if (!g || e.pointerId !== g.id) return;
    drag.current = null;
    const el = e.currentTarget, w = el.offsetWidth, v = speed(g.s), dir = Math.sign(g.d);
    el.removeAttribute("data-dragging");
    setHeld(false);
    if (!g.on) return;
    const away = v * dir;
    const out = e.type === "pointerup" && (away > 0.5 || Math.abs(g.d) > w / 3 && away > -0.1);
    if (out && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.transition = ["translate", "opacity"].map((p) => p + " " + settleTime(w - Math.abs(g.d), Math.max(0, away)) + "ms var(--ease-fling)").join(", ");
      el.style.translate = dir * w + "px 0";
      el.style.opacity = "0";
    } else el.style.translate = el.style.opacity = "";
    if (!out) return;
    toast.dismiss(t.id);
  };
  const titleId = t.id + "-title", descId = t.id + "-desc";
  const icon = ICONS[t.tone];
  return /* @__PURE__ */ React.createElement(
    "li",
    {
      ref: self,
      tabIndex: -1,
      className: cn("dk-toast", "dk-toast--" + t.tone),
      "data-tone": t.tone,
      "data-toast": t.id,
      "data-leaving": leaving ? leaving === "queued" ? "queued" : "" : void 0,
      "data-instant": props.instant ? "" : void 0,
      inert: leaving ? true : void 0,
      "aria-labelledby": titleId,
      "aria-describedby": t.description != null ? descId : void 0,
      onPointerDown: onSwipeDown,
      onPointerMove: onSwipeMove,
      onPointerUp: onSwipeEnd,
      onPointerCancel: onSwipeEnd,
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
  toast,
  watchToasts
};
//# sourceMappingURL=Toast.js.map
