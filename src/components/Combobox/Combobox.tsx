"use client";
import * as React from "react";
import { cn, domId, isInvalid, omit, oneOf, SIZES } from "../../internal/cn";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer";
import { Icon } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { Loader } from "../Loader/Loader";
import type { InputProps } from "../Input/Input";
import { component } from "../../internal/component";
import { FieldContext, useFieldControl } from "../../internal/field";
import { useSerupa } from "../../internal/provider";
import { useFormReset } from "../../internal/useFormReset";
import { isComposing } from "../../internal/ime";
import { fieldName } from "../../internal/fieldName";
import * as icons from "../../material/builtin";
import { fold } from "../../internal/fold";
import { announce } from "../../internal/announce";

export type ComboboxOption = string | { value: string; label: string; description?: React.ReactNode; disabled?: boolean };
export interface ComboboxProps extends Omit<InputProps, "type" | "showCount" | "value" | "defaultValue" | "rightIcon" | "onChange"> {
  /** The choices: strings, or { value, label, description, disabled }. The label is what's typed to find it and shown once picked. */
  options: ComboboxOption[];
  /** The selected value (controlled), or null. Use with onValueChange. */
  value?: string | null;
  /** The value selected at first (uncontrolled). */
  defaultValue?: string | null;
  /** Called with the picked value, or null when the field is emptied or cleared. */
  onValueChange?: (value: string | null) => void;
  /** Called with the text as it's typed: for loading options from a server (with filter={false} and loading). */
  onInputChange?: (text: string) => void;
  /** How typing narrows the list. Default: options whose label contains the text, ignoring case, accents and width ("lodz" finds "Łódź", "strasse" finds "Straße"). false shows every option (filter them yourself). */
  filter?: false | ((option: { value: string; label: string }, text: string) => boolean);
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

interface Opt { value: string; label: string; description?: React.ReactNode; disabled?: boolean; i: number }

/* Combobox: a text field with a list of options that narrows as you type: pick a country, an assignee, a
   project. Follows the ARIA combobox pattern: the field is role="combobox" (aria-expanded, aria-controls,
   aria-activedescendant) and focus stays in it while ArrowDown and ArrowUp move through a role="listbox" in the
   top layer. Enter or a click picks, Escape closes and puts back the picked label, and leaving the field does
   the same (emptying it clears the selection). Text that is exactly one option's label (any case or accents)
   picks that option on leaving the field. Only listed options can be picked. It uses Input's box and
   tokens: className and style go to the box; ref and every other prop to the <input>. */
/** A text field with a list of options that narrows as you type; picks one listed option. */
export const Combobox = /* @__PURE__ */ component<HTMLInputElement, ComboboxProps>("Combobox", function Combobox(props, ref) {
  props = useFieldControl(props);   // the props a surrounding Field hands it, at any depth
  const fieldLabel = React.useContext(FieldContext)?.labelId;   // names the listbox when a Field's <label for> names the field
  const sds = useSerupa();
  const rest = omit(props, { size: 1, invalid: 1, leftIcon: 1, className: 1, style: 1, options: 1, value: 1, defaultValue: 1, onValueChange: 1, onInputChange: 1, filter: 1, clearable: 1, loading: 1, emptyText: 1, loadingText: 1, toggleLabel: 1, clearLabel: 1, name: 1 } as const);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  const base = domId("dk-cbx", React.useId());
  const opts: Opt[] = (props.options || []).map((o, i) => (typeof o === "string" ? { value: o, label: o, i } : { value: String(o.value), label: String(o.label ?? o.value), description: o.description, disabled: !!o.disabled, i }));
  const controlled = props.value !== undefined;
  const [ownValue, setOwnValue] = React.useState<string | null>(props.defaultValue ?? null);
  const value = controlled ? (props.value ?? null) : ownValue;
  const selected = opts.find((o) => o.value === value) || null;
  const [text, setText] = React.useState(selected ? selected.label : "");
  const [typed, setTyped] = React.useState(false);   // false: show every option (just opened); true: filter by the text
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);    // index into opts
  const box = React.useRef<HTMLSpanElement | null>(null);
  const input = React.useRef<HTMLInputElement | null>(null);
  const pop = React.useRef<HTMLDivElement | null>(null);
  const locked = !!rest.disabled || !!rest.readOnly;
  const showClear = !!props.clearable && value != null && !locked;
  const [name, setName] = React.useState("");   // the field's label, read from the page once the × shows
  React.useEffect(() => { if (showClear) setName(fieldName(input.current)); }, [showClear]);
  useFormReset(input, () => {
    if (controlled) return;
    const v = props.defaultValue ?? null, o = opts.find((x) => x.value === v);
    setOwnValue(v); setText(o ? o.label : ""); setTyped(false); setOpen(false);
  });

  // A new value (or a new label for it) puts its label in the field, unless the person is typing. Done while
  // rendering, not in an effect, so the field never shows the old label for a frame.
  const label = selected ? selected.label : "";
  const [shownFor, setShownFor] = React.useState<[string | null, string]>([value, label]);
  if (shownFor[0] !== value || shownFor[1] !== label) {
    setShownFor([value, label]);
    if (!open || !typed) setText(label);
  }

  const matches = (o: Opt) => {
    if (!typed || props.filter === false) return true;
    if (typeof props.filter === "function") return props.filter({ value: o.value, label: o.label }, text);
    return fold(o.label).includes(fold(text.trim()));
  };
  const shown = opts.filter(matches);
  const usable = shown.filter((o) => !o.disabled);

  const commit = (v: string | null) => {
    if (!controlled) setOwnValue(v);
    if (v !== value && props.onValueChange) props.onValueChange(v);
  };
  const show = (to?: "first" | "last" | "selected") => {
    if (locked) return;
    setOpen(true);
    const list = opts.filter((o) => !o.disabled);
    const sel = selected && !selected.disabled ? selected.i : -1;
    setActive(to === "last" ? (sel >= 0 ? sel : list.length ? list[list.length - 1].i : -1) : to === "first" ? (sel >= 0 ? sel : list.length ? list[0].i : -1) : sel);
  };
  const hide = (revert = true) => {
    setOpen(false); setActive(-1); setTyped(false);
    if (revert) setText(selected ? selected.label : "");
  };
  const pick = (o: Opt) => {
    if (o.disabled) return;
    commit(o.value); setText(o.label); setOpen(false); setActive(-1); setTyped(false);
    if (props.onInputChange && o.label !== text) props.onInputChange(o.label);
  };
  // The one enabled option whose label is the typed text (any case and accents): leaving the field or Enter picks it.
  const exact = () => {
    const t = fold(text.trim());
    const same = typed && t ? opts.filter((o) => !o.disabled && fold(o.label) === t) : [];
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
    const first = opts.filter((o) => !o.disabled && (props.filter === false || (typeof props.filter === "function" ? props.filter({ value: o.value, label: o.label }, t) : fold(o.label).includes(fold(t.trim())))))[0];
    setActive(t.trim() && first ? first.i : -1);
    if (props.onInputChange) props.onInputChange(t);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (rest.onKeyDown) rest.onKeyDown(e);
    if (e.defaultPrevented || locked || isComposing(e)) return;
    if (e.key === "ArrowDown") { e.preventDefault(); if (!open) show(e.altKey ? "selected" : "first"); else move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (!open) show("last"); else move(-1); }
    else if (e.key === "Enter" && open) { e.preventDefault(); const o = opts[active]; if (o && shown.includes(o)) pick(o); else { const x = exact(); if (x) pick(x); else hide(); } }
    else if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); hide(); }
    else if ((e.key === "PageDown" || e.key === "PageUp") && open) { e.preventDefault(); page(e.key === "PageDown" ? 1 : -1); }
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (rest.onBlur) rest.onBlur(e);
    const x = exact();
    if (text.trim() === "" && value != null) { commit(null); setOpen(false); setActive(-1); setTyped(false); setText(""); }
    else if (x) pick(x);
    else hide();
  };
  const clear = () => {
    commit(null); setText(""); setTyped(false); setActive(-1);
    if (props.onInputChange) props.onInputChange("");
    if (input.current) input.current.focus();
  };

  // While typing, how many options match is said once the typing stops (a role=status row already says "No results").
  const count = usable.length;
  React.useEffect(() => {
    if (!open || !typed || props.loading || !count) return;
    const t = setTimeout(() => announce(sds.labels.resultsCount(count)), 700);
    return () => clearTimeout(t);
  }, [open, typed, props.loading, count, text, sds.labels]);

  // Place the list under the field, in the top layer, as wide as the field at least.
  useAnchoredLayer(open, pop, box, { placement: "bottom-start", offsetVar: "--dk-combobox-offset", matchWidth: true });
  React.useEffect(() => {
    if (!open || active < 0 || !pop.current) return;
    const el = pop.current.querySelector<HTMLElement>("#" + base + "-opt-" + active);
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
  }, [active, open, base]);

  const left = asIcon(props.leftIcon);
  const keep = (e: React.MouseEvent) => e.preventDefault();   // presses in the list and buttons keep focus in the field
  const listId = base + "-list";
  const activeShown = active >= 0 && shown.some((o) => o.i === active);
  return (
    <span ref={box} className={cn("dk-input dk-combobox", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.className)}
      style={props.style} data-component="combobox" data-size={size} data-state={open ? "open" : "closed"}>
      {left != null && left !== false ? <span className="dk-input__icon dk-input__icon--left" aria-hidden>{left}</span> : null}
      <input {...rest} ref={(n) => { input.current = n; if (typeof ref === "function") ref(n); else if (ref) ref.current = n; }}
        type="text" role="combobox" aria-expanded={open} aria-controls={open ? listId : undefined} aria-autocomplete="list" aria-haspopup="listbox"
        aria-activedescendant={open && activeShown ? base + "-opt-" + active : undefined}
        autoComplete="off" autoCorrect="off" spellCheck={false} className="dk-input__field" value={text}
        onChange={onChange} onKeyDown={onKeyDown} onBlur={onBlur}
        onClick={(e) => { if (rest.onClick) rest.onClick(e); if (!open) show("selected"); }} />
      {showClear ? (
        <button type="button" tabIndex={-1} className="dk-combobox__button dk-combobox__clear" aria-label={props.clearLabel || sds.labels.clearValue(name || "")} onMouseDown={keep} onClick={clear}>
          <Icon icon={icons.Close} />
        </button>
      ) : null}
      <button type="button" tabIndex={-1} className="dk-combobox__button dk-combobox__toggle" aria-label={props.toggleLabel || sds.labels.showOptions} aria-expanded={open} aria-controls={open ? listId : undefined}
        disabled={locked} onMouseDown={keep} onClick={() => { if (open) hide(); else show("selected"); if (input.current) input.current.focus(); }}>
        <Icon icon={icons.ExpandMore} />
      </button>
      <div ref={pop} className="dk-combobox__popup" {...{ popover: "manual" }} hidden={!open || undefined} onMouseDown={keep}>
        {props.loading ? <div className="dk-combobox__message" role="status"><Loader size="sm" delay={0} label="" />{props.loadingText || sds.labels.loadingResults}</div> : null}
        <div id={listId} role="listbox" className="dk-combobox__listbox" aria-labelledby={rest["aria-labelledby"] || (rest["aria-label"] ? undefined : fieldLabel)} aria-label={rest["aria-labelledby"] ? undefined : rest["aria-label"]}>
          {shown.map((o) => (
            <div key={o.value} id={base + "-opt-" + o.i} role="option" aria-selected={o.value === value} aria-disabled={o.disabled || undefined}
              aria-description={typeof o.description === "string" && o.description ? o.description : undefined}
              className={cn("dk-combobox__option", o.i === active && "dk-combobox__option--active", o.value === value && "dk-combobox__option--selected")}
              onMouseMove={() => { if (!o.disabled && active !== o.i) setActive(o.i); }} onClick={() => pick(o)}>
              <span className="dk-combobox__text">
                <span className="dk-combobox__label">{o.label}</span>
                {o.description != null && o.description !== "" ? <span className="dk-combobox__description" aria-hidden={typeof o.description === "string" || undefined}>{o.description}</span> : null}
              </span>
              {o.value === value ? <Icon icon={icons.Check} className="dk-combobox__check" /> : null}
            </div>
          ))}
        </div>
        {!props.loading && shown.length === 0 ? <div className="dk-combobox__message" role="status">{props.emptyText ?? sds.labels.noResults}</div> : null}
      </div>
      {props.name ? <input type="hidden" name={props.name} form={rest.form} value={value ?? ""} disabled={rest.disabled} /> : null}
    </span>
  );
});
