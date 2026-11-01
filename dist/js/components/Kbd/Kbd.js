"use client";

// src/components/Kbd/Kbd.tsx
import * as React from "react";
import { cn, omit } from "../../internal/cn.js";
import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden.js";
import { component } from "../../internal/component.js";
import { useSettings } from "../../internal/provider.js";
import { en as words } from "./labels.js";
var NAMED = {
  mod: ["\u2318", "Command", "Ctrl", "Control"],
  cmd: ["\u2318", "Command", "\u229E", "Windows"],
  meta: ["\u2318", "Command", "\u229E", "Windows"],
  ctrl: ["\u2303", "Control", "Ctrl", "Control"],
  control: ["\u2303", "Control", "Ctrl", "Control"],
  alt: ["\u2325", "Option", "Alt", "Alt"],
  option: ["\u2325", "Option", "Alt", "Alt"],
  shift: ["\u21E7", "Shift", "Shift", "Shift"],
  enter: ["\u21B5", "Enter", "Enter", "Enter"],
  return: ["\u21B5", "Return", "Enter", "Enter"],
  backspace: ["\u232B", "Backspace", "Backspace", "Backspace"],
  delete: ["\u2326", "Delete", "Del", "Delete"],
  esc: ["Esc", "Escape", "Esc", "Escape"],
  escape: ["Esc", "Escape", "Esc", "Escape"],
  tab: ["\u21E5", "Tab", "Tab", "Tab"],
  space: ["Space", "Space", "Space", "Space"],
  up: ["\u2191", "Up arrow", "\u2191", "Up arrow"],
  down: ["\u2193", "Down arrow", "\u2193", "Down arrow"],
  left: ["\u2190", "Left arrow", "\u2190", "Left arrow"],
  right: ["\u2192", "Right arrow", "\u2192", "Right arrow"],
  // KeyboardEvent.key's names, as useShortcut takes them (L8E57).
  arrowup: ["\u2191", "Up arrow", "\u2191", "Up arrow"],
  arrowdown: ["\u2193", "Down arrow", "\u2193", "Down arrow"],
  arrowleft: ["\u2190", "Left arrow", "\u2190", "Left arrow"],
  arrowright: ["\u2192", "Right arrow", "\u2192", "Right arrow"],
  home: ["\u2196", "Home", "Home", "Home"],
  end: ["\u2198", "End", "End", "End"],
  pageup: ["\u21DE", "Page Up", "PgUp", "Page Up"],
  pgup: ["\u21DE", "Page Up", "PgUp", "Page Up"],
  pagedown: ["\u21DF", "Page Down", "PgDn", "Page Down"],
  pgdn: ["\u21DF", "Page Down", "PgDn", "Page Down"],
  capslock: ["\u21EA", "Caps Lock", "Caps Lock", "Caps Lock"],
  insert: ["Ins", "Insert", "Ins", "Insert"],
  ins: ["Ins", "Insert", "Ins", "Insert"],
  fn: ["fn", "Function", "Fn", "Function"]
};
var isApple = () => typeof navigator !== "undefined" && [navigator.userAgentData?.platform, navigator.platform, navigator.userAgent].some((s) => /Mac|iPhone|iPad|iPod/.test(s || ""));
function Key({ k, apple, say }) {
  const n = NAMED[k === " " ? "space" : k.length > 1 ? k.toLowerCase().replace(/[\s_-]/g, "") : k.toLowerCase()];
  if (!n) return /* @__PURE__ */ React.createElement("kbd", { className: "dk-kbd__key" }, k.length === 1 ? k.toUpperCase() : k);
  const shown = apple ? n[0] : n[2], name = say(apple ? n[1] : n[3]);
  return /* @__PURE__ */ React.createElement("kbd", { className: "dk-kbd__key", title: shown === name ? void 0 : name }, shown === name ? shown : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { "aria-hidden": true }, shown), /* @__PURE__ */ React.createElement(VisuallyHidden, null, name)));
}
var Kbd = /* @__PURE__ */ component("Kbd", function Kbd2(props, ref) {
  const rest = omit(props, { keys: 1, size: 1, className: 1, children: 1 });
  const sds = useSettings(words), say = sds.labels.keyName;
  const [found, setFound] = React.useState(false);
  React.useEffect(() => {
    if (!sds.platform) setFound(isApple());
  }, [sds.platform]);
  const apple = sds.platform ? sds.platform === "apple" : found;
  const size = props.size === "sm" ? "sm" : "md";
  const keys = props.keys && props.keys.length ? props.keys : typeof props.children === "string" ? [props.children] : null;
  const cls = cn("dk-kbd", "dk-kbd--size-" + size, props.className);
  if (!keys) return /* @__PURE__ */ React.createElement("kbd", { ...rest, ref, className: cn(cls, "dk-kbd--single"), "data-component": "kbd", "data-size": size }, /* @__PURE__ */ React.createElement("kbd", { className: "dk-kbd__key" }, props.children));
  return /* @__PURE__ */ React.createElement("kbd", { ...rest, ref, className: cn(cls, keys.length === 1 && "dk-kbd--single"), "data-component": "kbd", "data-size": size }, keys.map((k, i) => /* @__PURE__ */ React.createElement(React.Fragment, { key: i }, i > 0 ? /* @__PURE__ */ React.createElement("span", { className: "dk-kbd__plus", "aria-hidden": true }, "+") : null, /* @__PURE__ */ React.createElement(Key, { k, apple, say }))));
});
export {
  Kbd,
  isApple
};
//# sourceMappingURL=Kbd.js.map
