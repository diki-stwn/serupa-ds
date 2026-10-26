"use client";
import * as React from "react";
import { cn, omit } from "../../internal/cn";
import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden";
import { component } from "../../internal/component";
import { useSerupa } from "../../internal/provider";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** A combination, one key each: ['mod', 'K'], ['shift', 'enter']. Names below show as symbols on Apple devices. Or pass one key as children. */
  keys?: string[];
  /** 'sm' (20px) or 'md' (24px, default). */
  size?: 'sm' | 'md';
}

/* Named keys: [shown on Apple devices, its name there, shown elsewhere, its name there]. "mod" is ⌘ on Apple
   devices and Ctrl elsewhere, for shortcuts that follow the platform. */
const NAMED: Record<string, [string, string, string, string]> = {
  mod: ["⌘", "Command", "Ctrl", "Control"],
  cmd: ["⌘", "Command", "⊞", "Windows"],
  meta: ["⌘", "Command", "⊞", "Windows"],
  ctrl: ["⌃", "Control", "Ctrl", "Control"],
  control: ["⌃", "Control", "Ctrl", "Control"],
  alt: ["⌥", "Option", "Alt", "Alt"],
  option: ["⌥", "Option", "Alt", "Alt"],
  shift: ["⇧", "Shift", "Shift", "Shift"],
  enter: ["↵", "Enter", "Enter", "Enter"],
  return: ["↵", "Return", "Enter", "Enter"],
  backspace: ["⌫", "Backspace", "Backspace", "Backspace"],
  delete: ["⌦", "Delete", "Del", "Delete"],
  esc: ["Esc", "Escape", "Esc", "Escape"],
  escape: ["Esc", "Escape", "Esc", "Escape"],
  tab: ["⇥", "Tab", "Tab", "Tab"],
  space: ["Space", "Space", "Space", "Space"],
  up: ["↑", "Up arrow", "↑", "Up arrow"],
  down: ["↓", "Down arrow", "↓", "Down arrow"],
  left: ["←", "Left arrow", "←", "Left arrow"],
  right: ["→", "Right arrow", "→", "Right arrow"],
  home: ["↖", "Home", "Home", "Home"],
  end: ["↘", "End", "End", "End"],
  pageup: ["⇞", "Page Up", "PgUp", "Page Up"],
  pgup: ["⇞", "Page Up", "PgUp", "Page Up"],
  pagedown: ["⇟", "Page Down", "PgDn", "Page Down"],
  pgdn: ["⇟", "Page Down", "PgDn", "Page Down"],
  capslock: ["⇪", "Caps Lock", "Caps Lock", "Caps Lock"],
  insert: ["Ins", "Insert", "Ins", "Insert"],
  ins: ["Ins", "Insert", "Ins", "Insert"],
  fn: ["fn", "Function", "Fn", "Function"],
};
const isApple = () => typeof navigator !== "undefined" && [(navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform, navigator.platform, navigator.userAgent].some((s) => /Mac|iPhone|iPad|iPod/.test(s || ""));

function Key({ k, apple, say }: { k: string; apple: boolean; say: (name: string) => string }) {
  // "page_up", "Page Up" and "page-up" all find pageup.
  const n = NAMED[k.length > 1 ? k.toLowerCase().replace(/[\s_-]/g, "") : k.toLowerCase()];
  if (!n) return <kbd className="dk-kbd__key">{k.length === 1 ? k.toUpperCase() : k}</kbd>;
  const shown = apple ? n[0] : n[2], name = say(apple ? n[1] : n[3]);
  return <kbd className="dk-kbd__key" title={shown === name ? undefined : name}>{shown === name ? shown : <><span aria-hidden>{shown}</span><VisuallyHidden>{name}</VisuallyHidden></>}</kbd>;
}

/* Kbd: a keyboard key or shortcut, drawn as keycaps: <Kbd>Esc</Kbd>, <Kbd keys={["mod", "K"]} />. Named keys
   (mod, shift, alt, enter, arrows…) show as symbols on Apple devices and as words elsewhere, each with its name
   for screen readers; "mod" is ⌘ on Apple devices and Ctrl elsewhere. A combination is one <kbd> holding a
   <kbd> per key, as HTML recommends. */
/** A keyboard key or shortcut, drawn as keycaps; "mod" follows the platform (⌘ or Ctrl). */
export const Kbd = /* @__PURE__ */ component<HTMLElement, KbdProps>("Kbd", function Kbd(props, ref) {
  const rest = omit(props, { keys: 1, size: 1, className: 1, children: 1 } as const);
  const sds = useSerupa(), say = sds.labels.keyName;
  // A SerupaProvider's platform decides from the first render (the server's too); without one, Ctrl on the server
  // and the device decides after mount.
  const [found, setFound] = React.useState(false);
  React.useEffect(() => { if (!sds.platform) setFound(isApple()); }, [sds.platform]);
  const apple = sds.platform ? sds.platform === "apple" : found;
  const size = props.size === "sm" ? "sm" : "md";
  const keys = props.keys && props.keys.length ? props.keys : typeof props.children === "string" ? [props.children] : null;
  const cls = cn("dk-kbd", "dk-kbd--size-" + size, props.className);
  if (!keys) return <kbd {...rest} ref={ref} className={cn(cls, "dk-kbd--single")} data-component="kbd" data-size={size}><kbd className="dk-kbd__key">{props.children}</kbd></kbd>;
  return (
    <kbd {...rest} ref={ref} className={cn(cls, keys.length === 1 && "dk-kbd--single")} data-component="kbd" data-size={size}>
      {keys.map((k, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <span className="dk-kbd__plus" aria-hidden>+</span> : null}
          <Key k={k} apple={apple} say={say} />
        </React.Fragment>
      ))}
    </kbd>
  );
});
