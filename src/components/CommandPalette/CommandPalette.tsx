"use client";
import * as React from "react";
import { cn, domId, omit } from "../../internal/cn";
import { component } from "../../internal/component";
import { useSettings } from "../../internal/provider";
import { announce } from "../../internal/announce";
import { isComposing } from "../../internal/ime";
import { fold } from "../../internal/fold";
import { announcePause } from "../../internal/timing";
import type { OpenChangeDetails } from "../../internal/openChange";
import type { IconData } from "../../material/types";
import { asIcon } from "../Icon/asIcon";
import { Dialog, type DialogProps } from "../Dialog/Dialog";
import { Highlight } from "../Highlight/Highlight";
import { Kbd } from "../Kbd/Kbd";
import { useShortcut } from "../KeyboardShortcuts/KeyboardShortcuts";
import { en as words } from "./labels";

/** One command or page in the palette. */
export interface Command {
  /** Unique among the commands. */
  id: string;
  /** What it does or where it goes, in a few words ("New project", "Settings"). What's typed is matched against it. */
  label: string;
  /** The heading it's listed under ("Pages", "Actions"), in the order groups first appear. Default: "Commands". */
  group?: string;
  /** More words that find it, not shown ("preferences" for Settings). */
  keywords?: string[];
  /** An icon before the label: a name or an icon from serupa-ds/icons. */
  icon?: React.ReactNode | IconData;
  /** Keys shown after the label in Kbd (["mod", "N"]). Shown only: set the shortcut itself up with useShortcut. */
  shortcut?: string[];
  /** A page to go to when it's chosen, with no onSelect. */
  href?: string;
  /** Shown but can't be chosen. */
  disabled?: boolean;
  /** Runs when it's chosen, after the palette has closed. */
  onSelect?: () => void;
}

export interface CommandPaletteProps extends Omit<DialogProps, "title" | "description" | "footer" | "alert" | "children" | "size" | "fullScreen" | "initialFocus" | "closeButton" | "closeLabel" | "onSelect" | "unsaved"> {
  /** The commands and pages it searches, in the order they're listed before anything is typed. */
  commands: Command[];
  /** Runs for any command chosen, after the palette has closed and after the command's own onSelect. */
  onSelect?: (command: Command) => void;
  /** The keys that open it anywhere on the page (default ["mod", "K"]: ⌘K on Apple devices, Ctrl+K elsewhere); false for none. */
  hotkey?: string[] | false;
  /** The search field's placeholder and name. Default: "Search commands and pages" (labels.searchCommands). */
  placeholder?: string;
  /** Shown when nothing matches. Default: "No matching commands" (labels.noCommands). */
  emptyText?: React.ReactNode;
  /** How many it lists at most while searching, the best matches first. Default: 50. */
  limit?: number;
}

interface Row { c: Command; i: number; s: number }

// How well a command matches the folded query: 0 for no match; a label that starts with it beats one with a word that
// does, which beats one that has it inside, which beats a keyword.
function score(c: Command, q: string): number {
  if (!q) return 1;
  const label = fold(c.label);
  if (label.startsWith(q)) return 4;
  const at = label.indexOf(q);
  if (at > 0 && /[\s\-_/.:]/.test(label[at - 1])) return 3;
  if (at > 0) return 2;
  return (c.keywords || []).some((k) => fold(k).includes(q)) ? 1 : 0;
}

/* CommandPalette: a Dialog with a search field over a list of commands and pages, opened with ⌘K or Ctrl+K (hotkey)
   from anywhere on the page. Typing filters the list (ignoring case and accents, best matches first) and marks what
   matched; ArrowUp and ArrowDown move through it while focus stays in the field (role="combobox" with
   aria-activedescendant over a role="listbox"), Enter or a click chooses. Choosing closes the palette, then runs the
   command's onSelect (or goes to its href) and onSelect. The number of matches is said once typing stops. Other props
   and ref go to the Dialog's <dialog>. */
/** A ⌘K search over commands and pages in a dialog: type to filter, arrows to move, Enter to run.
 *  @beta New: its API may still change in a minor release. Take this tag off once it has shipped with its bug bash done (CONTRIBUTING.md). */
export const CommandPalette = /* @__PURE__ */ component<HTMLDialogElement, CommandPaletteProps>("CommandPalette", function CommandPalette(props, ref) {
  const sds = useSettings(words), labels = sds.labels;
  const rest = omit(props, { commands: 1, onSelect: 1, hotkey: 1, placeholder: 1, emptyText: 1, limit: 1, open: 1, defaultOpen: 1, onOpenChange: 1, className: 1, closeOnBackdrop: 1, finalFocus: 1 } as const);
  const [own, setOwn] = React.useState(!!props.defaultOpen);
  const controlled = props.open != null;
  const open = controlled ? !!props.open : own;
  const { onOpenChange } = props;
  const change = React.useCallback((next: boolean, details: OpenChangeDetails) => {
    if (!controlled) setOwn(next);
    if (onOpenChange) onOpenChange(next, details);
  }, [onOpenChange, controlled]);
  const keys = props.hotkey === false ? null : props.hotkey && props.hotkey.length ? props.hotkey : ["mod", "K"];
  useShortcut(keys || [], () => change(true, { reason: "trigger" }), { description: labels.commandPalette, enabled: !!keys && !open });

  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  // Each opening starts from an empty field, at the top of the list.
  const [was, setWas] = React.useState(open);
  if (was !== open) { setWas(open); if (open) { setQuery(""); setActive(0); } }

  const q = fold(query.trim());
  const { commands, limit } = props;
  const rows: Row[] = React.useMemo(() => {
    const all = commands.map((c, i) => ({ c, i, s: score(c, q) })).filter((r) => r.s > 0);
    if (!q) return all;
    return all.sort((a, b) => b.s - a.s || a.i - b.i).slice(0, limit && limit > 0 ? limit : 50);
  }, [commands, q, limit]);
  // By group, in the order each first appears among the rows; the rows keep their order inside a group.
  const groups = React.useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of rows) { const g = r.c.group || labels.otherCommands; m.set(g, (m.get(g) || []).concat(r)); }
    return [...m];
  }, [rows, labels.otherCommands]);
  const usable = groups.flatMap(([, rs]) => rs).filter((r) => !r.c.disabled);   // in the order listed, which is the arrows' order
  const current = usable.length ? usable[Math.min(active, usable.length - 1)] : null;

  const base = domId("dk-cmdk", React.useId());
  const optId = (r: Row) => base + "-opt-" + r.i;
  const list = React.useRef<HTMLDivElement | null>(null);
  const field = React.useRef<HTMLInputElement | null>(null);
  const currentId = current ? optId(current) : null;
  React.useEffect(() => {
    if (!open || !currentId || !list.current) return;
    const el = list.current.querySelector<HTMLElement>("#" + currentId);
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
  }, [open, currentId]);

  // How many match, said once typing stops (the rows change in silence otherwise).
  const empty = typeof props.emptyText === "string" ? props.emptyText : labels.noCommands;
  const said = !query.trim() ? "" : usable.length ? labels.commandsCount(usable.length) : empty;
  React.useEffect(() => {
    if (!open || !said) return;
    const t = setTimeout(() => announce(said), announcePause);
    return () => clearTimeout(t);
  }, [open, said, query]);

  // The chosen command runs once the palette has closed and given focus back, so its onSelect can move focus on the
  // page (behind the open modal the page is inert) and its href leaves from the page as it was (GR97). An app that
  // keeps a controlled palette open gets it run at once.
  const [chosen, setChosen] = React.useState<{ c: Command } | null>(null);
  const done = React.useRef(props.onSelect); done.current = props.onSelect;
  React.useEffect(() => {
    if (!chosen) return;
    setChosen(null);
    const c = chosen.c;
    if (c.onSelect) c.onSelect();
    else if (c.href && typeof window !== "undefined") window.location.assign(c.href);
    if (done.current) done.current(c);
  }, [chosen]);
  const choose = (r: Row | null) => {
    if (!r || r.c.disabled) return;
    change(false, { reason: "select" });
    setChosen({ c: r.c });
  };
  const move = (to: number) => { if (usable.length) setActive((to + usable.length) % usable.length); };
  const at = current ? usable.indexOf(current) : 0;
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing(e)) return;
    if (e.key === "ArrowDown") { e.preventDefault(); move(at + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(at - 1); }
    else if (e.key === "PageDown") { e.preventDefault(); move(usable.length - 1); }
    else if (e.key === "PageUp") { e.preventDefault(); move(0); }
    else if (e.key === "Enter") { e.preventDefault(); choose(current); }
  };

  return (
    <Dialog {...rest} ref={ref} className={cn("dk-command-palette", props.className)} aria-label={rest["aria-label"] || labels.commandPalette}
      open={open} onOpenChange={change} closeButton={false} initialFocus={field} closeOnBackdrop={props.closeOnBackdrop} finalFocus={props.finalFocus}>
      <input ref={field} className="dk-command-palette__field" type="text" role="combobox" aria-expanded="true" aria-controls={base + "-list"}
        aria-autocomplete="list" aria-activedescendant={currentId || undefined} aria-label={props.placeholder || labels.searchCommands}
        placeholder={props.placeholder || labels.searchCommands} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        value={query} onChange={(e) => { setQuery(e.currentTarget.value); setActive(0); }} onKeyDown={onKeyDown} />
      <div ref={list} id={base + "-list"} role="listbox" aria-label={labels.commandPalette} className="dk-command-palette__list">
        {groups.map(([name, rs], g) => (
          <div key={name} role="group" aria-labelledby={base + "-g" + g} className="dk-command-palette__group">
            <div id={base + "-g" + g} role="presentation" className="dk-command-palette__heading">{name}</div>
            {rs.map((r) => {
              const on = current === r;
              return (
                // Focus stays in the field (a press doesn't take it); an option focused some other way, as a screen
                // reader can, is chosen with Enter or Space.
                <div key={r.c.id} id={optId(r)} role="option" tabIndex={-1} aria-selected={on} aria-disabled={r.c.disabled || undefined}
                  className={cn("dk-command-palette__option", on && "dk-command-palette__option--active", r.c.disabled && "dk-command-palette__option--disabled")}
                  onMouseDown={(e) => e.preventDefault()} onMouseMove={() => { if (!r.c.disabled && !on) setActive(usable.indexOf(r)); }} onClick={() => choose(r)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(r); } }}>
                  {r.c.icon != null ? <span className="dk-command-palette__icon" aria-hidden>{asIcon(r.c.icon)}</span> : null}
                  <Highlight className="dk-command-palette__label" query={query}>{r.c.label}</Highlight>
                  {r.c.shortcut && r.c.shortcut.length ? <Kbd className="dk-command-palette__keys" keys={r.c.shortcut} size="sm" /> : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {!usable.length && query.trim() ? <p className="dk-command-palette__empty">{props.emptyText != null ? props.emptyText : labels.noCommands}</p> : null}
    </Dialog>
  );
});
