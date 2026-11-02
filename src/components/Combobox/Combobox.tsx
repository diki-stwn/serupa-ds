"use client";
import * as React from "react";
import { pressFocuses } from "../../internal/affix";
import { cn, domId, isInvalid, omit, oneOf, SIZES } from "../../internal/cn";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer";
import { useExit } from "../../internal/useExit";
import { Icon } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { Loader } from "../Loader/Loader";
import type { InputProps } from "../Input/Input";
import { component } from "../../internal/component";
import { FieldContext, useFieldControl } from "../../internal/field";
import { useSettings } from "../../internal/provider";
import { useFormReset } from "../../internal/useFormReset";
import { isComposing } from "../../internal/ime";
import { fieldName } from "../../internal/fieldName";
import * as icons from "../../material/builtin";
import { fold } from "../../internal/fold";
import { announce } from "../../internal/announce";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";
import { Badge } from "../Badge/Badge";
import { Highlight } from "../Highlight/Highlight";
import { en as words } from "./labels";
import { windowBlur } from "../../internal/focus";
import { announcePause, typingPause } from "../../internal/timing";

/** V is the options' values, inferred from options or given, such as Combobox<"red" | "green">. */
export type ComboboxOption<V extends string = string> = V | { value: V; label: string; description?: React.ReactNode; disabled?: boolean };
interface ComboboxBaseProps<V extends string = string> extends Omit<InputProps, "type" | "showCount" | "prefix" | "suffix" | "value" | "defaultValue" | "rightIcon" | "onChange"> {
  /** The choices: strings, or { value, label, description, disabled }. The label is what's typed to find it and shown once picked.
      With loadOptions, the ones shown before anything has loaded (or leave it out). */
  options?: readonly ComboboxOption<V>[];
  /** Loads the options for the typed text, such as from a server: called after typing pauses (debounce), and with ""
      when the list first opens. The signal aborts when newer text is typed or the field goes away, so a slow answer
      for "ca" never replaces the one for "can". The list shows the loading row while it waits and the loadFailed
      message if it rejects; filtering is then yours (filter is ignored). */
  loadOptions?: (text: string, context: { signal: AbortSignal }) => Promise<readonly ComboboxOption<V>[]>;
  /** With loadOptions, how long typing must pause before loading, in ms. Default: 250. */
  debounce?: number;
  /** Called with the text as it's typed: for loading options from a server (with filter={false} and loading). */
  onInputChange?: (text: string) => void;
  /** How typing narrows the list. Default: options whose label contains the text, ignoring case, accents and width ("lodz" finds "Łódź", "strasse" finds "Straße"). false shows every option (filter them yourself). */
  filter?: false | ((option: { value: V; label: string }, text: string) => boolean);
  /** Shows a × that clears the selection once something is picked. Default: false. */
  clearable?: boolean;
  /** Shows a loading row in the list. Default: false. */
  loading?: boolean;
  /** Shown when nothing matches. Default: "No results". */
  emptyText?: React.ReactNode;
  /** Shown while loading. Default: "Loading…". */
  loadingText?: string;
  /** The chevron button's name. Default: the showOptions label ("Show options"). */
  toggleLabel?: string;
  /** The × button's name. Default: the clearValue label, "Clear" and the field's label ("Clear Country"), or "Clear" when it has none. */
  clearLabel?: string;
}
/** Picks one option. */
export interface ComboboxSingleProps<V extends string = string> extends ComboboxBaseProps<V> {
  /** Picks one option (default); true picks any number, as tags. */
  multiple?: false;
  /** The selected value (controlled), or null. Use with onValueChange. */
  value?: V | null;
  /** The value selected at first (uncontrolled). */
  defaultValue?: V | null;
  /** Called with the picked value, or null when the field is emptied or cleared. */
  onValueChange?: (value: V | null) => void;
}
/** Picks any number of options, each shown as a tag in the field. */
export interface ComboboxMultipleProps<V extends string = string> extends ComboboxBaseProps<V> {
  /** Picks any number of options: each shows as a removable tag before the text, picking toggles an option and keeps
      the list open, and Backspace in the empty field removes the last tag. */
  multiple: true;
  /** The selected values in order (controlled). Use with onValueChange. */
  value?: readonly V[];
  /** The values selected at first (uncontrolled). */
  defaultValue?: readonly V[];
  /** Called with every selected value, in the order they were picked. */
  onValueChange?: (value: V[]) => void;
}
export type ComboboxProps<V extends string = string> = ComboboxSingleProps<V> | ComboboxMultipleProps<V>;
type AnyProps = ComboboxBaseProps & { multiple?: boolean; value?: string | string[] | null; defaultValue?: string | string[] | null; onValueChange?: unknown };
const list = (v: string | string[] | null | undefined): string[] => (Array.isArray(v) ? v : []);

const CAP = 100;   // the most option rows the list puts in the page at once

interface Opt { value: string; label: string; description?: React.ReactNode; disabled?: boolean; i: number; folded: string }

/* One option row. Memoised, so moving the active option re-renders the two rows that change, not the whole list. */
const Row = /* @__PURE__ */ React.memo(function Row(p: { o: Opt; id: string; active: boolean; selected: boolean; pos: number; size: number; query: string; onMove: (i: number) => void; onPick: (i: number) => void }) {
  const o = p.o;
  return (
    <div id={p.id} role="option" aria-selected={p.selected} aria-posinset={p.pos} aria-setsize={p.size} aria-disabled={o.disabled || undefined}
      aria-description={typeof o.description === "string" && o.description ? o.description : undefined}
      className={cn("dk-combobox__option", p.active && "dk-combobox__option--active", p.selected && "dk-combobox__option--selected")}
      onMouseMove={() => { if (!o.disabled && !p.active) p.onMove(o.i); }} onClick={() => p.onPick(o.i)}>
      <span className="dk-combobox__text">
        <span className="dk-combobox__label">{p.query ? <Highlight query={p.query}>{o.label}</Highlight> : o.label}</span>
        {o.description != null && o.description !== "" ? <span className="dk-combobox__description" aria-hidden={typeof o.description === "string" || undefined}>{o.description}</span> : null}
      </span>
      {p.selected ? <Icon icon={icons.Check} className="dk-combobox__check" /> : null}
    </div>
  );
});

/* Combobox: a text field with a list of options that narrows as you type: pick a country, an assignee, a
   project. Follows the ARIA combobox pattern: the field is role="combobox" (aria-expanded, aria-controls,
   aria-activedescendant) and focus stays in it while ArrowDown and ArrowUp move through a role="listbox" in the
   top layer. Enter or a click picks, Escape closes and puts back the picked label, and leaving the field does
   the same (emptying it clears the selection). Text that is exactly one option's label (any case or accents)
   picks that option on leaving the field. Only listed options can be picked. It uses Input's box and
   tokens: className and style go to the box; ref and every other prop to the <input>. With multiple, the picked
   options are tags (Badges with a remove button) before the text, the listbox is aria-multiselectable, and picking
   toggles an option and keeps the list open; the text is only for searching, so leaving the field empties it. */
/** A text field with a list of options that narrows as you type; picks one listed option. */
export const Combobox = /* @__PURE__ */ component<HTMLInputElement, ComboboxProps>("Combobox", function Combobox(given, ref) {
  let props = given as AnyProps;
  const nameRef = useNameCheck("Combobox", NAME_HOW.field);   // warns when it has no accessible name
  props = useFieldControl(props);   // the props a surrounding Field hands it, at any depth
  const fieldLabel = React.useContext(FieldContext)?.labelId;   // names the listbox when a Field's <label for> names the field
  const sds = useSettings(words);
  const rest = omit(props, { size: 1, invalid: 1, leftIcon: 1, className: 1, style: 1, options: 1, value: 1, defaultValue: 1, onValueChange: 1, onInputChange: 1, filter: 1, clearable: 1, loading: 1, emptyText: 1, loadingText: 1, toggleLabel: 1, clearLabel: 1, name: 1, multiple: 1, loadOptions: 1, debounce: 1 } as const);
  const multi = props.multiple === true;
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  const base = domId("dk-cbx", React.useId());
  // Mapped, with each label folded for matching, once per options array rather than on every render and keystroke.
  // With loadOptions, the options are the latest answer (the options prop until one comes).
  const [loaded, setLoaded] = React.useState<readonly ComboboxOption[] | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const source = props.loadOptions && loaded ? loaded : props.options;
  const opts: Opt[] = React.useMemo(() => (source || []).map((o, i) => {
    const x = typeof o === "string" ? { value: o, label: o, i } : { value: String(o.value), label: String(o.label ?? o.value), description: o.description, disabled: !!o.disabled, i };
    return { ...x, folded: fold(x.label) };
  }), [source]);
  // Every option seen, by value, so a picked one keeps its label when a later answer doesn't include it.
  const seen = React.useRef(new Map<string, string>());
  for (const o of opts) seen.current.set(o.value, o.label);
  // loadOptions: one request at a time. A new one (after the debounce) aborts the one before, and an answer that
  // isn't for the latest request is dropped, so a slow answer never overwrites a newer one.
  const loader = React.useRef<{ timer: number; ctl: AbortController | null; n: number; q: string | null }>({ timer: 0, ctl: null, n: 0, q: null });
  const loadFn = React.useRef(props.loadOptions);
  loadFn.current = props.loadOptions;
  const load = (q: string, wait: number) => {
    const l = loader.current, fn = loadFn.current;
    if (!fn) return;
    window.clearTimeout(l.timer);
    if (l.ctl) l.ctl.abort();
    l.ctl = null; l.q = q;
    setBusy(true); setFailed(false);
    const go = () => {
      const ctl = new AbortController(), n = ++l.n;
      l.ctl = ctl;
      let answer: Promise<readonly ComboboxOption[]>;
      try { answer = Promise.resolve(fn(q, { signal: ctl.signal })); } catch (err) { answer = Promise.reject(err instanceof Error ? err : new Error(String(err))); }
      answer.then((list) => {
        if (n !== l.n || ctl.signal.aborted) return;
        const got: readonly ComboboxOption[] = Array.isArray(list) ? list : [];
        setLoaded(got); setBusy(false);
        setActive(q.trim() ? got.findIndex((o) => typeof o === "string" || !o.disabled) : -1);   // the first match, as typing does
      },
        () => { if (n === l.n && !ctl.signal.aborted) { setFailed(true); setBusy(false); } });
    };
    if (wait > 0) l.timer = window.setTimeout(go, wait); else go();
  };
  React.useEffect(() => () => { const l = loader.current; window.clearTimeout(l.timer); if (l.ctl) l.ctl.abort(); }, []);
  const pause = typeof props.debounce === "number" && props.debounce >= 0 ? props.debounce : typingPause;
  const loading = !!props.loading || busy;
  const controlled = props.value !== undefined;
  const one = (v: string | string[] | null | undefined) => (multi || typeof v !== "string" ? null : v);
  const [ownValue, setOwnValue] = React.useState<string | null>(() => one(props.defaultValue));
  const [ownValues, setOwnValues] = React.useState<string[]>(() => (multi ? list(props.defaultValue) : []));
  const value = multi ? null : controlled ? one(props.value) : ownValue;
  const values = multi ? (controlled ? list(props.value) : ownValues) : [];
  const chosen = new Set(values);
  const selected = multi ? null : opts.find((o) => o.value === value) || null;
  const pickedLabel = selected ? selected.label : value != null ? seen.current.get(value) ?? "" : "";
  const [text, setText] = React.useState(pickedLabel);
  const [typed, setTyped] = React.useState(false);   // false: show every option (just opened); true: filter by the text
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);    // index into opts
  const box = React.useRef<HTMLSpanElement | null>(null);
  const input = React.useRef<HTMLInputElement | null>(null);
  const pop = React.useRef<HTMLDivElement | null>(null);
  const locked = !!rest.disabled || !!rest.readOnly;
  const showClear = !!props.clearable && (multi ? values.length > 0 : value != null) && !locked;
  const [name, setName] = React.useState("");   // the field's label, read from the page once the × shows
  React.useEffect(() => { if (showClear) setName(fieldName(input.current)); }, [showClear]);
  useFormReset(input, () => {
    if (controlled) return;
    const v = one(props.defaultValue), o = opts.find((x) => x.value === v);
    setOwnValue(v); setOwnValues(multi ? list(props.defaultValue) : []); setText(o ? o.label : ""); setTyped(false); setOpen(false);
  });

  // A new value (or a new label for it) puts its label in the field, unless the person is typing. Done while
  // rendering, not in an effect, so the field never shows the old label for a frame.
  const label = pickedLabel;
  const [shownFor, setShownFor] = React.useState<[string | null, string]>([value, label]);
  if (shownFor[0] !== value || shownFor[1] !== label) {
    setShownFor([value, label]);
    if (!open || !typed) setText(label);
  }

  const filter = props.loadOptions ? false : props.filter;
  const shown = React.useMemo(() => {
    if (!typed || filter === false) return opts;
    if (typeof filter === "function") return opts.filter((o) => filter({ value: o.value, label: o.label }, text));
    const q = fold(text.trim());
    return opts.filter((o) => o.folded.includes(q));
  }, [opts, typed, filter, text]);
  // At most CAP rows are in the page (plus the picked one, when it's further down), so typing into a list of
  // thousands stays quick; a line under them says how many more match, and each row's aria-posinset and
  // aria-setsize still count every match. The arrow keys move through the rows that are there.
  const visible = React.useMemo(() => {
    if (shown.length <= CAP) return shown;
    const top = shown.slice(0, CAP);
    return selected && shown.indexOf(selected) >= CAP ? top.concat(selected) : top;
  }, [shown, selected]);
  const more = shown.length - visible.length;
  const usable = visible.filter((o) => !o.disabled);

  const changed = props.onValueChange as ((v: string | null | string[]) => void) | undefined;
  const commit = (v: string | null) => {
    if (!controlled) setOwnValue(v);
    if (v !== value && changed) changed(v);
  };
  // With multiple: the new list of values, and what a screen reader hears (focus stays in the field, so it says
  // which tag was added or removed).
  const commitMany = (next: string[], said?: string) => {
    if (!controlled) setOwnValues(next);
    if (changed) changed(next);
    if (said) announce(said);
  };
  const labelOf = (v: string) => seen.current.get(v) ?? v;
  const remove = (v: string) => commitMany(values.filter((x) => x !== v), sds.labels.valueRemoved(labelOf(v)));
  const show = (to?: "first" | "last" | "selected") => {
    if (locked) return;
    setOpen(true);
    if (loader.current.q !== "") load("", 0);   // opening lists what "" finds, unless that's what's loaded
    const list = (opts.length > CAP ? opts.slice(0, CAP) : opts).filter((o) => !o.disabled);
    const sel = selected && !selected.disabled ? selected.i : -1;
    setActive(to === "last" ? (sel >= 0 ? sel : list.length ? list[list.length - 1].i : -1) : to === "first" ? (sel >= 0 ? sel : list.length ? list[0].i : -1) : sel);
  };
  const hide = (revert = true) => {
    setOpen(false); setActive(-1); setTyped(false);
    if (revert) setText(pickedLabel);
  };
  const pick = (o: Opt) => {
    if (o.disabled) return;
    if (multi) {
      // Toggles it and keeps the list open on it; the search text empties so the next pick starts from every option.
      if (chosen.has(o.value)) remove(o.value);
      else commitMany(values.concat(o.value), sds.labels.valueAdded(o.label));
      setActive(o.i); setTyped(false);
      if (text) { setText(""); if (props.onInputChange) props.onInputChange(""); load("", 0); }
      return;
    }
    commit(o.value); setText(o.label); setOpen(false); setActive(-1); setTyped(false);
    if (props.onInputChange && o.label !== text) props.onInputChange(o.label);
  };
  // The one enabled option whose label is the typed text (any case and accents): leaving the field or Enter picks it.
  const exact = () => {
    const t = fold(text.trim());
    const same = typed && t ? opts.filter((o) => !o.disabled && o.folded === t) : [];
    return same.length === 1 ? same[0] : null;
  };
  const move = (by: number) => {
    if (!usable.length) return;
    const i = usable.findIndex((o) => o.i === active);
    const n = i < 0 ? (by > 0 ? 0 : usable.length - 1) : (i + by + usable.length) % usable.length;
    setActive(usable[n].i);
  };

  // PageDown and PageUp move by what the list shows at once (about seven options at 240px), stopping at the ends.
  const page = (dir: 1 | -1) => {
    if (!usable.length) return;
    const row = pop.current && pop.current.querySelector<HTMLElement>("[role=option]");
    const h = row ? row.offsetHeight : 0;
    const by = h && pop.current ? Math.max(1, Math.floor(pop.current.clientHeight / h)) : 10;
    const i = usable.findIndex((o) => o.i === active);
    const n = i < 0 ? (dir > 0 ? 0 : usable.length - 1) : Math.min(usable.length - 1, Math.max(0, i + dir * by));
    setActive(usable[n].i);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value;
    setText(t); setTyped(true);
    if (!locked) setOpen(true);
    const q = fold(t.trim());
    const first = opts.find((o) => !o.disabled && (filter === false || (typeof filter === "function" ? filter({ value: o.value, label: o.label }, t) : o.folded.includes(q))));
    setActive(t.trim() && first ? first.i : -1);
    if (props.onInputChange) props.onInputChange(t);
    load(t, pause);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (rest.onKeyDown) rest.onKeyDown(e);
    if (e.defaultPrevented || locked || isComposing(e)) return;
    // With Ctrl or ⌘ the arrows and Page keys are the system's or the browser's (⌘+↓ ends the line, Ctrl+PageDown
    // switches tabs): leave them. Alt+↓ stays the popup's, as the combobox pattern asks (L8E35).
    if ((e.ctrlKey || e.metaKey) && /^(Arrow|Page)/.test(e.key)) return;
    if (e.key === "ArrowDown") { e.preventDefault(); if (!open) show(e.altKey ? "selected" : "first"); else move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (!open) show("last"); else move(-1); }
    else if (e.key === "Enter" && open) { e.preventDefault(); const o = opts[active]; if (o && shown.includes(o)) pick(o); else { const x = exact(); if (x) pick(x); else hide(); } }
    else if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); hide(); }
    else if ((e.key === "PageDown" || e.key === "PageUp") && open) { e.preventDefault(); page(e.key === "PageDown" ? 1 : -1); }
    else if (e.key === "Backspace" && multi && text === "" && values.length) remove(values[values.length - 1]);
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (rest.onBlur) rest.onBlur(e);
    if (windowBlur(e)) return;   // switched windows: the typing goes on when they come back
    if (multi) { hide(); if (text && props.onInputChange) props.onInputChange(""); return; }
    const x = exact();
    if (text.trim() === "" && value != null) { commit(null); setOpen(false); setActive(-1); setTyped(false); setText(""); }
    else if (x) pick(x);
    else hide();
  };
  const clear = () => {
    if (multi) commitMany([]); else commit(null);
    setText(""); setTyped(false); setActive(-1);
    if (props.onInputChange) props.onInputChange("");
    if (input.current) input.current.focus();
  };

  // While typing, how many options match is said once the typing stops, and so are "No results" and "Couldn't load"
  // (GR53): a role=status row inserted with its text already in it isn't read by VoiceOver or JAWS, so those rows
  // are plain text and the shared announcer says them, as it says the counts.
  const count = more ? shown.filter((o) => !o.disabled).length : usable.length;
  const empty = typeof props.emptyText === "string" ? props.emptyText : sds.labels.noResults;
  const said = failed ? sds.labels.loadFailed : shown.length === 0 ? empty : count ? sds.labels.resultsCount(count) : "";
  React.useEffect(() => {
    if (!open || !typed || loading || !said) return;
    const t = setTimeout(() => announce(said), announcePause);
    return () => clearTimeout(t);
  }, [open, typed, loading, said, text]);

  // Place the list under the field, in the top layer, as wide as the field at least.
  // Closing: the options stay (inert) while the list fades out, as Menu's and DatePicker's do (GK1).
  const exit = useExit(open, pop), shownList = open || exit.leaving;
  useAnchoredLayer(open, pop, box, { placement: "bottom-start", offsetVar: "--dk-combobox-offset", matchWidth: true });
  React.useEffect(() => {
    if (!open || active < 0 || !pop.current) return;
    const el = pop.current.querySelector<HTMLElement>("#" + base + "-opt-" + active);
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
  }, [active, open, base]);

  const left = asIcon(props.leftIcon);
  const keep = (e: React.MouseEvent) => e.preventDefault();   // presses in the list and buttons keep focus in the field
  const listId = base + "-list";
  // Stable handlers for the memoised rows, reading the latest state through a ref.
  const latest = React.useRef({ pick, opts });
  latest.current = { pick, opts };
  const onMove = React.useCallback((i: number) => setActive(i), []);
  const onPick = React.useCallback((i: number) => { const l = latest.current; const o = l.opts[i]; if (o) l.pick(o); }, []);
  const activeShown = active >= 0 && visible.some((o) => o.i === active);
  const pos = new Map(shown.map((o, n) => [o, n + 1]));
  // The typed text, marked in each option's label as the list narrows (185): only with the default filter, which
  // matches the same way (a custom filter or the server's results may match on something else).
  const mark = typed && filter === undefined ? text.trim() : "";
  const field = (
      <input {...rest} ref={(n) => { input.current = n; nameRef(n); if (typeof ref === "function") ref(n); else if (ref) ref.current = n; }}
        type="text" role="combobox" aria-expanded={open} aria-controls={open ? listId : undefined} aria-autocomplete="list" aria-haspopup="listbox"
        aria-activedescendant={open && activeShown ? base + "-opt-" + active : undefined}
        autoComplete={rest.autoComplete || "off"} autoCorrect="off" autoCapitalize={rest.autoCapitalize ?? "off"} spellCheck={false} className="dk-input__field" value={text}
        // With multiple, the text is empty once tags are picked, so a native required blocked the form with tags in
        // it: the browser's check needs a tag or text, and screen readers still hear "required" (L8E18).
        required={multi && values.length ? false : rest.required} aria-required={rest["aria-required"] ?? (rest.required || undefined)}
        onChange={onChange} onKeyDown={onKeyDown} onBlur={onBlur}
        onClick={(e) => { if (rest.onClick) rest.onClick(e); if (!open) show("selected"); }} />
  );
  return (
    <span ref={box} className={cn("dk-input dk-combobox", multi && "dk-combobox--multiple", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.className)}
      style={props.style} data-component="combobox" data-size={size} data-state={open ? "open" : "closed"} onMouseDown={pressFocuses(input)}>
      {left != null && left !== false ? <span className="dk-input__icon dk-input__icon--left" aria-hidden>{left}</span> : null}
      {multi ? <span className="dk-combobox__values">
        {values.length ? <span className="dk-combobox__tags" onMouseDown={keep}>
          {values.map((v) => <Badge key={v} className="dk-combobox__tag" removeLabel={sds.labels.remove}
            onRemove={locked ? undefined : () => { remove(v); if (input.current) input.current.focus(); }}>{labelOf(v)}</Badge>)}
        </span> : null}
        {field}
      </span> : field}
      {showClear ? (
        <button type="button" tabIndex={-1} className="dk-combobox__button dk-combobox__clear" aria-label={props.clearLabel || sds.labels.clearValue(name || "")} onMouseDown={keep} onClick={clear}>
          <Icon icon={icons.Close} />
        </button>
      ) : null}
      <button type="button" tabIndex={-1} className="dk-combobox__button dk-combobox__toggle" aria-label={props.toggleLabel || sds.labels.showOptions} aria-expanded={open} aria-controls={open ? listId : undefined}
        disabled={locked} onMouseDown={keep} onClick={() => { if (open) hide(); else show("selected"); if (input.current) input.current.focus(); }}>
        <Icon icon={icons.ExpandMore} />
      </button>
      <div ref={pop} className="dk-combobox__popup" {...{ popover: "manual" }} hidden={!open || undefined} inert={!open || undefined} data-instant={exit.instant ? "" : undefined} onMouseDown={keep}>
        {loading ? <div className="dk-combobox__message" role="status"><Loader size="sm" delay={0} label="" />{props.loadingText || sds.labels.loadingResults}</div> : null}
        <div id={listId} role="listbox" className="dk-combobox__listbox" aria-multiselectable={multi || undefined} aria-labelledby={rest["aria-labelledby"] || (rest["aria-label"] ? undefined : fieldLabel)} aria-label={rest["aria-labelledby"] ? undefined : rest["aria-label"]}>
          {/* Only while open (and fading out): a closed Combobox with thousands of options keeps none of them in the page. */}
          {shownList ? visible.map((o) => <Row key={o.value} o={o} id={base + "-opt-" + o.i} active={o.i === active} selected={multi ? chosen.has(o.value) : o.value === value} pos={pos.get(o) || 0} size={shown.length} query={mark} onMove={onMove} onPick={onPick} />) : null}
        </div>
        {shownList && more > 0 ? <div className="dk-combobox__message dk-combobox__more">{sds.labels.moreResults(more)}</div> : null}
        {!loading && failed ? <div className="dk-combobox__message">{sds.labels.loadFailed}</div> : null}
        {!loading && !failed && shown.length === 0 ? <div className="dk-combobox__message">{props.emptyText ?? sds.labels.noResults}</div> : null}
      </div>
      {props.name && multi ? values.map((v) => <input key={v} type="hidden" name={props.name} form={rest.form} value={v} disabled={rest.disabled} />) : null}
      {props.name && !multi ? <input type="hidden" name={props.name} form={rest.form} value={value ?? ""} disabled={rest.disabled} /> : null}
    </span>
  );
}) as (<V extends string = string>(props: ComboboxProps<V> & React.RefAttributes<HTMLInputElement>) => React.ReactElement | null) & { displayName?: string };
