"use client";

// src/components/KeyboardShortcuts/KeyboardShortcuts.tsx
import * as React from "react";
import { cn, omit } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useSettings } from "../../internal/provider.js";
import { isComposing } from "../../internal/ime.js";
import { warnOnce } from "../../internal/warn.js";
import { topModal } from "../../internal/layers.js";
import { Dialog } from "../Dialog/Dialog.js";
import { Kbd, isApple } from "../Kbd/Kbd.js";
import { en as words } from "./labels.js";
var NAMED = {
  esc: "Escape",
  escape: "Escape",
  enter: "Enter",
  return: "Enter",
  space: " ",
  tab: "Tab",
  backspace: "Backspace",
  delete: "Delete",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pgup: "PageUp",
  pagedown: "PageDown",
  pgdn: "PageDown",
  insert: "Insert",
  ins: "Insert"
};
var MODIFIER = {
  mod: "mod",
  cmd: "meta",
  meta: "meta",
  ctrl: "ctrl",
  control: "ctrl",
  alt: "alt",
  option: "alt",
  shift: "shift"
};
function parse(keys) {
  const c = { key: "", mod: false, ctrl: false, meta: false, alt: false, shift: false };
  let n = 0;
  for (const k of keys) {
    const name = k.length > 1 ? k.toLowerCase().replace(/[\s_-]/g, "") : k.toLowerCase();
    const m = MODIFIER[name];
    if (m) c[m] = true;
    else {
      c.key = NAMED[name] || (k.length === 1 ? k.toLowerCase() : k);
      n++;
    }
  }
  return n === 1 ? c : null;
}
function matches(c, e, apple) {
  if (e.ctrlKey !== (c.ctrl || c.mod && !apple) || e.metaKey !== (c.meta || c.mod && apple) || e.altKey !== c.alt) return false;
  const symbol = c.key.length === 1 && !/[a-z0-9 ]/.test(c.key);
  if (!symbol && e.shiftKey !== c.shift) return false;
  if ((e.key.length === 1 ? e.key.toLowerCase() : e.key) === c.key) return true;
  return /^[a-z]$/.test(c.key) ? !/^[\x20-\x7e]$/.test(e.key) && e.code === "Key" + c.key.toUpperCase() : /^[0-9]$/.test(c.key) ? e.code === "Digit" + c.key : false;
}
var NOT_TYPED = /^(checkbox|radio|button|submit|reset|range|color|file|image)$/;
var typing = (t) => t instanceof HTMLElement && (t.isContentEditable || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.tagName === "INPUT" && !NOT_TYPED.test(t.type));
var entries = [];
var watchers = /* @__PURE__ */ new Set();
var NONE = [];
var changed = () => watchers.forEach((w) => w());
function onKey(e) {
  if (e.defaultPrevented || isComposing(e) || topModal()) return;
  for (let i = entries.length - 1; i >= 0; i--) {
    const x = entries[i];
    if (!matches(x, e, x.apple)) continue;
    if (typing(e.composedPath()[0] || e.target) && !x.inInputs && !x.mod && !x.ctrl && !x.meta) continue;
    e.preventDefault();
    x.run.current(e);
    return;
  }
}
function add(x) {
  if (!entries.length) document.addEventListener("keydown", onKey);
  entries = entries.concat(x);
  changed();
  return () => {
    entries = entries.filter((y) => y !== x);
    if (!entries.length) document.removeEventListener("keydown", onKey);
    changed();
  };
}
var watch = (w) => {
  watchers.add(w);
  return () => {
    watchers.delete(w);
  };
};
var current = () => entries;
var none = () => NONE;
function useShortcut(keys, handler, options) {
  const sds = useSettings(words);
  const run = React.useRef(handler);
  React.useEffect(() => {
    run.current = handler;
  });
  const list = typeof keys === "string" ? [keys] : keys;
  const id = JSON.stringify(list);
  const { description, group, enabled = true, inInputs = false } = options || {};
  const apple = sds.platform ? sds.platform === "apple" : null;
  React.useEffect(() => {
    if (!enabled) return;
    const k = JSON.parse(id), combo = parse(k);
    if (!combo) {
      if (process.env.NODE_ENV !== "production") warnOnce("shortcut-keys", `useShortcut: ${id} isn't one key with its modifiers, so it's not set up. Give one key, plus mod, ctrl, cmd, alt or shift if it needs them, such as ["mod", "K"].`, "shortcut-keys" + id);
      return;
    }
    return add(Object.assign(combo, { keys: k, run, description, group, inInputs, apple: apple != null ? apple : isApple() }));
  }, [id, description, group, enabled, inInputs, apple]);
}
var KeyboardShortcuts = /* @__PURE__ */ component("KeyboardShortcuts", function KeyboardShortcuts2(props, ref) {
  const sds = useSettings(words), labels = sds.labels;
  const rest = omit(props, { title: 1, shortcuts: 1, helpKeys: 1, open: 1, defaultOpen: 1, onOpenChange: 1, className: 1 });
  const [own, setOwn] = React.useState(!!props.defaultOpen);
  const open = props.open != null ? props.open : own;
  const { onOpenChange } = props;
  const change = React.useCallback((next, details) => {
    setOwn(next);
    if (onOpenChange) onOpenChange(next, details);
  }, [onOpenChange]);
  const help = props.helpKeys === false ? null : props.helpKeys && props.helpKeys.length ? props.helpKeys : ["?"];
  useShortcut(help || [], () => change(true, { reason: "trigger" }), { description: labels.showShortcuts, enabled: !!help && !open });
  const live = React.useSyncExternalStore(watch, current, none);
  const groups = /* @__PURE__ */ new Map();
  const seen = /* @__PURE__ */ new Set();
  for (const s of [...props.shortcuts || [], ...live.filter((x) => x.description), ...help && open ? [{ keys: help, description: labels.showShortcuts }] : []]) {
    const name = s.group || labels.generalShortcuts, key = JSON.stringify([name, s.keys, s.description]);
    if (seen.has(key)) continue;
    seen.add(key);
    groups.set(name, (groups.get(name) || []).concat({ keys: s.keys, description: s.description || "" }));
  }
  return /* @__PURE__ */ React.createElement(
    Dialog,
    {
      ...rest,
      ref,
      className: cn("dk-keyboard-shortcuts", props.className),
      title: props.title != null ? props.title : labels.keyboardShortcuts,
      open,
      onOpenChange: change
    },
    [...groups].map(([name, items]) => /* @__PURE__ */ React.createElement("section", { key: name, className: "dk-keyboard-shortcuts__group" }, groups.size > 1 ? /* @__PURE__ */ React.createElement("h3", { className: "dk-keyboard-shortcuts__heading" }, name) : null, /* @__PURE__ */ React.createElement("dl", { className: "dk-keyboard-shortcuts__list" }, items.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "dk-keyboard-shortcuts__row" }, /* @__PURE__ */ React.createElement("dt", { className: "dk-keyboard-shortcuts__description" }, s.description), /* @__PURE__ */ React.createElement("dd", { className: "dk-keyboard-shortcuts__keys" }, /* @__PURE__ */ React.createElement(Kbd, { keys: s.keys, size: "sm" })))))))
  );
});
export {
  KeyboardShortcuts,
  useShortcut
};
//# sourceMappingURL=KeyboardShortcuts.js.map
