"use client";
import * as React from "react";
import { cn, omit } from "../../internal/cn";
import { component } from "../../internal/component";
import { useSettings } from "../../internal/provider";
import { isComposing } from "../../internal/ime";
import { warnOnce } from "../../internal/warn";
import { topModal } from "../../internal/layers";
import type { OpenChangeDetails } from "../../internal/openChange";
import { Dialog, type DialogProps } from "../Dialog/Dialog";
import { Kbd, isApple } from "../Kbd/Kbd";
import { en as words } from "./labels";

/** One shortcut in the help dialog. */
export interface Shortcut {
  /** The keys, pressed together, as Kbd takes them: ['mod', 'K'], ['?']. */
  keys: string[];
  /** What it does, in a few words ("Search", "New message"). */
  description: string;
  /** The heading it's listed under. Default: "General". */
  group?: string;
}

export interface ShortcutOptions {
  /** What it does, listed in <KeyboardShortcuts>'s dialog. Without it, the shortcut works but isn't listed. */
  description?: string;
  /** The heading it's listed under. Default: "General". */
  group?: string;
  /** false turns it off for now (default true). */
  enabled?: boolean;
  /** Also fire while typing in a text field. Shortcuts with mod, ctrl or cmd always do; others don't by default,
   *  so "/" or "N" can still be typed. */
  inInputs?: boolean;
}

export interface KeyboardShortcutsProps extends Omit<DialogProps, "title" | "description" | "footer" | "alert" | "children" | "size" | "fullScreen" | "initialFocus" | "finalFocus" | "closeButton" | "closeOnBackdrop" | "closeLabel"> {
  /** The dialog's title. Default: "Keyboard shortcuts" (labels.keyboardShortcuts). */
  title?: React.ReactNode;
  /** Shortcuts to list that aren't set up with useShortcut, such as the browser's or another library's. */
  shortcuts?: Shortcut[];
  /** The keys that open it (default ['?']); false for none, when you open it yourself. */
  helpKeys?: string[] | false;
}

// A combination, parsed: the modifiers it needs and its key as KeyboardEvent.key reports it (letters in lower case).
interface Combo { key: string; mod: boolean; ctrl: boolean; meta: boolean; alt: boolean; shift: boolean }
interface Registered extends Combo { keys: string[]; run: { current: (e: KeyboardEvent) => void }; description?: string; group?: string; inInputs: boolean; apple: boolean }

const NAMED: Record<string, string> = {
  esc: "Escape", escape: "Escape", enter: "Enter", return: "Enter", space: " ", tab: "Tab", backspace: "Backspace",
  delete: "Delete", up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", home: "Home", end: "End",
  pageup: "PageUp", pgup: "PageUp", pagedown: "PageDown", pgdn: "PageDown", insert: "Insert", ins: "Insert",
};
const MODIFIER: Record<string, keyof Omit<Combo, "key">> = {
  mod: "mod", cmd: "meta", meta: "meta", ctrl: "ctrl", control: "ctrl", alt: "alt", option: "alt", shift: "shift",
};
// null unless there's exactly one key besides the modifiers: ["G", "I"] can't be pressed together, and matching only
// its last key ran it on a lone "I" (GQ3).
function parse(keys: string[]): Combo | null {
  const c: Combo = { key: "", mod: false, ctrl: false, meta: false, alt: false, shift: false };
  let n = 0;
  for (const k of keys) {
    const name = k.length > 1 ? k.toLowerCase().replace(/[\s_-]/g, "") : k.toLowerCase();
    const m = MODIFIER[name];
    if (m) c[m] = true;
    else { c.key = NAMED[name] || (k.length === 1 ? k.toLowerCase() : k); n++; }
  }
  return n === 1 ? c : null;
}
function matches(c: Combo, e: KeyboardEvent, apple: boolean): boolean {
  if (e.ctrlKey !== (c.ctrl || (c.mod && !apple)) || e.metaKey !== (c.meta || (c.mod && apple)) || e.altKey !== c.alt) return false;
  // "?" and other symbols need Shift on some layouts and not others, so Shift isn't checked for them.
  const symbol = c.key.length === 1 && !/[a-z0-9 ]/.test(c.key);
  if (!symbol && e.shiftKey !== c.shift) return false;
  if ((e.key.length === 1 ? e.key.toLowerCase() : e.key) === c.key) return true;
  // Option changes the character a letter types on a Mac (⌥K is "˚"), and a Cyrillic or Greek layout types "л" there,
  // so letters and digits also match by position. Not when the key typed another Latin character: on AZERTY the key
  // in Q's place types "a", and Ctrl+A was running a Ctrl+Q shortcut (L8E16).
  return /^[a-z]$/.test(c.key) ? !/^[\x20-\x7e]$/.test(e.key) && e.code === "Key" + c.key.toUpperCase() : /^[0-9]$/.test(c.key) ? e.code === "Digit" + c.key : false;
}
const NOT_TYPED = /^(checkbox|radio|button|submit|reset|range|color|file|image)$/;
const typing = (t: EventTarget | null): boolean =>
  t instanceof HTMLElement && (t.isContentEditable || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || (t.tagName === "INPUT" && !NOT_TYPED.test((t as HTMLInputElement).type)));

// module state: browser only: the shortcuts set up now, newest last; replaced (not changed) so it's a stable snapshot.
let entries: Registered[] = [];
const watchers = new Set<() => void>();
const NONE: Registered[] = [];
const changed = () => watchers.forEach((w) => w());
function onKey(e: KeyboardEvent): void {
  // A modal makes the page behind it inert, so the page's shortcuts wait until it closes.
  if (e.defaultPrevented || isComposing(e) || topModal()) return;
  // The newest wins, so a panel's shortcut overrides the page's while the panel is open.
  for (let i = entries.length - 1; i >= 0; i--) {
    const x = entries[i];
    if (!matches(x, e, x.apple)) continue;
    // The field itself, not its web component's host: a keydown from a shadow root's <input> reaches the document
    // retargeted to the host element, and a lone "g" typed there ran the page's "g" (L8E43).
    if (typing(e.composedPath()[0] || e.target) && !x.inInputs && !x.mod && !x.ctrl && !x.meta) continue;
    e.preventDefault();
    x.run.current(e);
    return;
  }
}
function add(x: Registered): () => void {
  if (!entries.length) document.addEventListener("keydown", onKey);
  entries = entries.concat(x);
  changed();
  return () => {
    entries = entries.filter((y) => y !== x);
    if (!entries.length) document.removeEventListener("keydown", onKey);
    changed();
  };
}
const watch = (w: () => void) => { watchers.add(w); return () => { watchers.delete(w); }; };
const current = () => entries;
const none = () => NONE;

/* useShortcut: runs handler when the keys are pressed anywhere on the page, while the component is mounted. Keys are
   as Kbd takes them ("mod" is ⌘ on Apple devices and Ctrl elsewhere). It doesn't fire while typing in a text field
   unless it has mod, ctrl or cmd (or inInputs), while an IME is composing, while a modal is open, or when something
   else already handled the key. When two set up the same keys, the newest wins. With a description, it's listed in
   <KeyboardShortcuts>. */
/** Runs handler when the keys are pressed (["mod", "K"]: one key and its modifiers), and lists it in <KeyboardShortcuts> when it has a description. */
export function useShortcut(keys: string | string[], handler: (event: KeyboardEvent) => void, options?: ShortcutOptions): void {
  const sds = useSettings(words);
  const run = React.useRef(handler);
  // every render: the newest handler runs, without setting the shortcut up again.
  React.useEffect(() => { run.current = handler; });
  const list = typeof keys === "string" ? [keys] : keys;
  const id = JSON.stringify(list);
  const { description, group, enabled = true, inInputs = false } = options || {};
  const apple = sds.platform ? sds.platform === "apple" : null;
  React.useEffect(() => {
    if (!enabled) return;
    const k = JSON.parse(id) as string[], combo = parse(k);
    if (!combo) {
      if (process.env.NODE_ENV !== "production") warnOnce("shortcut-keys", `useShortcut: ${id} isn't one key with its modifiers, so it's not set up. Give one key, plus mod, ctrl, cmd, alt or shift if it needs them, such as ["mod", "K"].`, "shortcut-keys" + id);
      return;
    }
    return add(Object.assign(combo, { keys: k, run, description, group, inInputs, apple: apple != null ? apple : isApple() }));
  }, [id, description, group, enabled, inInputs, apple]);
}

/* KeyboardShortcuts: the help dialog that lists the page's keyboard shortcuts, opened with "?" (helpKeys). It lists
   every useShortcut with a description, plus shortcuts, by group (in the order they first appear), each with its keys
   in Kbd. Put one in the app's layout. Open it yourself too (open and onOpenChange), from a help menu, so people who
   don't know "?" find it. Other props go to the Dialog. */
/** The help dialog listing the page's keyboard shortcuts in Kbd, opened with "?"; set them up with useShortcut. */
export const KeyboardShortcuts = /* @__PURE__ */ component<HTMLDialogElement, KeyboardShortcutsProps>("KeyboardShortcuts", function KeyboardShortcuts(props, ref) {
  const sds = useSettings(words), labels = sds.labels;
  const rest = omit(props, { title: 1, shortcuts: 1, helpKeys: 1, open: 1, defaultOpen: 1, onOpenChange: 1, className: 1 } as const);
  const [own, setOwn] = React.useState(!!props.defaultOpen);
  const open = props.open != null ? props.open : own;
  const { onOpenChange } = props;
  const change = React.useCallback((next: boolean, details: OpenChangeDetails) => {
    setOwn(next);
    if (onOpenChange) onOpenChange(next, details);
  }, [onOpenChange]);
  const help = props.helpKeys === false ? null : props.helpKeys && props.helpKeys.length ? props.helpKeys : ["?"];
  useShortcut(help || [], () => change(true, { reason: "trigger" }), { description: labels.showShortcuts, enabled: !!help && !open });
  const live = React.useSyncExternalStore(watch, current, none);
  // By group, in the order each first appears; the same keys and words listed once.
  const groups = new Map<string, Shortcut[]>();
  const seen = new Set<string>();
  for (const s of [...(props.shortcuts || []), ...live.filter((x) => x.description), ...(help && open ? [{ keys: help, description: labels.showShortcuts }] : [])]) {
    const name = s.group || labels.generalShortcuts, key = JSON.stringify([name, s.keys, s.description]);
    if (seen.has(key)) continue;
    seen.add(key);
    groups.set(name, (groups.get(name) || []).concat({ keys: s.keys, description: s.description || "" }));
  }
  return (
    <Dialog {...rest} ref={ref} className={cn("dk-keyboard-shortcuts", props.className)}
      title={props.title != null ? props.title : labels.keyboardShortcuts} open={open} onOpenChange={change}>
      {[...groups].map(([name, items]) => (
        <section key={name} className="dk-keyboard-shortcuts__group">
          {groups.size > 1 ? <h3 className="dk-keyboard-shortcuts__heading">{name}</h3> : null}
          <dl className="dk-keyboard-shortcuts__list">
            {items.map((s, i) => (
              <div key={i} className="dk-keyboard-shortcuts__row">
                <dt className="dk-keyboard-shortcuts__description">{s.description}</dt>
                <dd className="dk-keyboard-shortcuts__keys"><Kbd keys={s.keys} size="sm" /></dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </Dialog>
  );
});
