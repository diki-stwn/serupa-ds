"use client";
import * as React from "react";
import { pressFocuses } from "../../internal/affix";
import { cn, domId, isInvalid, oneOf, setRef, SIZES, useIsoLayoutEffect } from "../../internal/cn";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";
import { formatTime, parseTime, timePattern, toHHmm, toMinutes, uses12h } from "../../internal/times";
import { reject } from "../../internal/rejectInput";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer";
import { useExit } from "../../internal/useExit";
import { Icon } from "../Icon/Icon";
import { component } from "../../internal/component";
import { useFieldControl } from "../../internal/field";
import { useLocale, useOwnLang, useSettings } from "../../internal/provider";
import { useFormReset } from "../../internal/useFormReset";
import * as icons from "../../material/builtin";
import { isComposing } from "../../internal/ime";
import { en as TimePickerWords } from "./labels";
import { en as DatePickerWords } from "../DatePicker/labels";
import { windowBlur } from "../../internal/focus";
// This component's words and the ones it shares with DatePicker.
const words = /* @__PURE__ */ Object.assign({}, TimePickerWords, DatePickerWords);

export interface TimePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step' | 'children'> {
  /** The chosen time as "HH:mm" (24-hour, controlled), or null. Use with onValueChange. */
  value?: string | null;
  /** The chosen time at first (uncontrolled). */
  defaultValue?: string | null;
  /** Called with the new time as "HH:mm", or null when the field is cleared. */
  onValueChange?: (value: string | null) => void;
  /** Called when typed text is put back on blur or Enter: "unreadable" when it isn't a time, "unavailable" when it
      is one that can't be chosen (outside min..max). The field also says so to screen readers. */
  onInvalidInput?: (text: string, reason: "unreadable" | "unavailable") => void;
  /** The earliest and latest times, as "HH:mm". */
  min?: string;
  /** The latest time, as "HH:mm". */
  max?: string;
  /** Minutes between the times in the list (not seconds, as <input type="time"> counts its step: 15, not 900). Default: 30. Typed times don't have to fall on a step. */
  step?: number;
  /** A BCP 47 locale for how times are written. Default: the nearest SerupaProvider's locale, else the browser's. */
  locale?: string;
  /** 12-hour (AM/PM) or 24-hour. Default: the locale's. */
  hour12?: boolean;
  /** 'sm', 'md' (default) or 'lg', like Input. */
  size?: 'sm' | 'md' | 'lg';
  /** Marks the field invalid (aria-invalid and the error border), as on Input. */
  invalid?: boolean;
  /** The list's name, and the button's. Default: "Choose a time". */
  listLabel?: string;
}

/* TimePicker: a field for a time of day with a list of times. People type a time ("2:30 pm", "14:30", "1430",
   "2p") or pick one from a list every step minutes (default 30) between min and max; the field is an ARIA
   combobox and the list a listbox. ArrowDown or the clock button opens the list at the chosen (or nearest) time;
   arrows, Home, End, PageUp and PageDown move, Enter picks, Escape closes. Typed text is read on blur and Enter;
   text that isn't a time, or one outside min..max, puts back the last good value. Values are "HH:mm", the form
   <input type="time"> uses; with name a hidden input sends it. */
/** A time field: type a time or pick one from a list. Values are "HH:mm". */
export const TimePicker = /* @__PURE__ */ component<HTMLInputElement, TimePickerProps>("TimePicker", function TimePicker(props, ref) {
  const nameRef = useNameCheck("TimePicker", NAME_HOW.field);   // warns when it has no accessible name
  props = useFieldControl(props);   // the props a surrounding Field hands it, at any depth
  const sds = useSettings(words);
  const { value: _v, defaultValue: _d, onValueChange, onInvalidInput, min, max, step: _st, locale: localeProp, hour12: _h, size: _s, invalid: _i, listLabel, className, style, name, placeholder, disabled, readOnly, onBlur, onKeyDown, ...rest } = props;
  const locale = useLocale(localeProp), lang = useOwnLang(localeProp);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  const h12 = props.hour12 ?? uses12h(locale);
  const step = props.step && Math.round(props.step) >= 1 ? Math.round(props.step) : 30;
  const lo = toMinutes(min) ?? 0, hi = toMinutes(max) ?? 24 * 60 - 1;
  const controlled = props.value !== undefined;
  const [own, setOwn] = React.useState<number | null>(toMinutes(props.defaultValue));
  const value = controlled ? toMinutes(props.value) : own;
  const fmt = (n: number | null) => (n == null ? "" : formatTime(n, locale, h12));
  const [text, setText] = React.useState(fmt(value));
  const shown = React.useRef(value);
  const shownFmt = React.useRef(locale + "|" + h12);
  if (value !== shown.current || shownFmt.current !== locale + "|" + h12) {   // a new value, or a new locale or hour12
    shown.current = value; shownFmt.current = locale + "|" + h12;
    if (fmt(value) !== text) setText(fmt(value));
  }
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const id = domId("dk-tp", React.useId());
  const box = React.useRef<HTMLSpanElement | null>(null);
  const field = React.useRef<HTMLInputElement | null>(null);
  useFormReset(field, () => {
    if (controlled) return;
    const n = toMinutes(props.defaultValue);
    shown.current = n; setOwn(n); setText(fmt(n)); setOpen(false);
  });
  const list = React.useRef<HTMLUListElement | null>(null);
  const typed = React.useRef(false);   // text typed since the list opened or the active time last moved

  const times = React.useMemo(() => { const out: number[] = []; for (let n = lo; n <= hi; n += step) out.push(n); return out; }, [lo, hi, step]);
  const nearest = (n: number | null) => {
    if (n == null || !times.length) return 0;
    let best = 0;
    times.forEach((x, i) => { if (Math.abs(x - n) < Math.abs(times[best] - n)) best = i; });
    return best;
  };
  const commit = (n: number | null) => {
    shown.current = n;
    setText(fmt(n));
    if (n === value) return;
    if (!controlled) setOwn(n);
    if (onValueChange) onValueChange(n == null ? null : toHHmm(n));
  };
  const read = () => {
    if (text.trim() === "") return commit(null);
    const n = parseTime(text, locale);
    if (n != null && n >= lo && n <= hi) return commit(n);
    reject(text, n != null ? "unavailable" : "unreadable", onInvalidInput, sds.labels.inputNotAccepted);
    commit(value);
  };
  const show = () => { if (disabled || readOnly || !times.length) return; const n = parseTime(text, locale); setActive(nearest(n != null ? n : value)); typed.current = false; setOpen(true); };
  // The list is at least as wide as the field.
  useIsoLayoutEffect(() => { if (open && list.current && box.current) list.current.style.minWidth = box.current.offsetWidth + "px"; }, [open]);
  // Closing: the times stay (inert) while the list fades out, as Menu's and DatePicker's do (GK1).
  const exit = useExit(open, list);
  useAnchoredLayer(open, list, box, { placement: "bottom-start", offsetVar: "--dk-tp-offset", onOutside: () => setOpen(false), inside: box });
  // On open, the active time sits near the top; after that, moving keeps it in view.
  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (!open) { wasOpen.current = false; return; }
    const opening = !wasOpen.current;
    wasOpen.current = true;
    const l = list.current, o = l ? (l.children[active] as HTMLElement | undefined) : undefined;
    if (!l || !o) return;
    if (opening) l.scrollTop = Math.max(0, o.offsetTop - o.offsetHeight);
    else if (o.offsetTop < l.scrollTop) l.scrollTop = o.offsetTop;
    else if (o.offsetTop + o.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = o.offsetTop + o.offsetHeight - l.clientHeight;
  }, [open, active]);

  const pick = (n: number) => { commit(n); setOpen(false); if (field.current) field.current.focus(); };
  const keys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown) onKeyDown(e);
    if (e.defaultPrevented || isComposing(e)) return;
    // With Ctrl or ⌘ the arrows and Page keys are the system's or the browser's (⌘+↓ ends the line, Ctrl+PageDown
    // switches tabs): leave them. Alt+↓ stays the popup's, as the combobox pattern asks (L8E35).
    if ((e.ctrlKey || e.metaKey) && /^(Arrow|Page)/.test(e.key)) return;
    const last = times.length - 1, page = 4;
    const move = (i: number) => { e.preventDefault(); typed.current = false; setActive(i); };
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); show(); }
      else if (e.key === "Enter") read();
      return;
    }
    switch (e.key) {
      case "ArrowDown": move(Math.min(last, active + 1)); break;
      case "ArrowUp": move(Math.max(0, active - 1)); break;
      case "PageDown": move(Math.min(last, active + page)); break;
      case "PageUp": move(Math.max(0, active - page)); break;
      case "Home": if (e.altKey || e.ctrlKey) move(0); break;
      case "End": if (e.altKey || e.ctrlKey) move(last); break;
      case "Enter": e.preventDefault(); if (typed.current) { read(); setOpen(false); } else pick(times[active]); break;   // what was typed wins over the highlight
      case "Escape": e.preventDefault(); e.stopPropagation(); setOpen(false); break;
      case "Tab": setOpen(false); break;
    }
  };
  const label = listLabel || sds.labels.chooseTime;
  return (
    <span ref={box} className={cn("dk-input", "dk-input--size-" + size, "dk-time-picker", invalid && "dk-input--invalid", disabled && "dk-input--disabled", readOnly && "dk-input--readonly", className)} style={style} data-component="time-picker" data-size={size} onMouseDown={pressFocuses(field)}>
      <input {...rest} ref={(n) => { field.current = n; nameRef(n); setRef(ref, n); }}
        lang={rest.lang ?? lang} type="text" role="combobox" autoComplete={rest.autoComplete || "off"} spellCheck={rest.spellCheck ?? false} autoCorrect={rest.autoCorrect ?? "off"} autoCapitalize={rest.autoCapitalize ?? "off"} className="dk-input__field" value={text} disabled={disabled} readOnly={readOnly}
        placeholder={placeholder != null ? placeholder : timePattern(locale, h12)} aria-invalid={invalid || undefined} aria-describedby={cn(rest["aria-describedby"], id + "-format")}
        aria-expanded={open} aria-controls={id} aria-autocomplete="none" aria-haspopup="listbox" aria-activedescendant={open ? `${id}-${active}` : undefined}
        onChange={(e) => {
          setText(e.target.value);
          if (open) { typed.current = true; const n = parseTime(e.target.value, locale); if (n != null) setActive(nearest(n)); }   // the highlight follows what's typed
        }} onBlur={(e) => { if (!windowBlur(e)) read(); if (onBlur) onBlur(e); }} onKeyDown={keys} />
      <button type="button" tabIndex={-1} className="dk-time-picker__button" aria-label={label} aria-controls={id} aria-expanded={open} disabled={!!disabled || !!readOnly}
        onMouseDown={(e) => e.preventDefault()} onClick={() => { if (open) setOpen(false); else show(); if (field.current) field.current.focus(); }}>
        <Icon icon={icons.Schedule} />
      </button>
      {/* The format to type, read after the field's name (a placeholder is gone once something is typed). */}
      <span id={id + "-format"} hidden>{sds.labels.formatHint(timePattern(locale, h12))}</span>
      {name ? <input type="hidden" name={name} form={rest.form} value={value == null ? "" : toHHmm(value)} disabled={disabled} /> : null}
      <ul ref={list} id={id} role="listbox" aria-label={label} {...{ popover: "manual" }} hidden={!open || undefined} inert={!open || undefined} className="dk-time-picker__list">
        {open || exit.leaving ? times.map((n, i) => (
          <li key={n} id={`${id}-${i}`} lang={lang} role="option" aria-selected={n === value} data-value={toHHmm(n)}
            className={cn("dk-time-picker__option", i === active && "dk-time-picker__option--active", n === value && "dk-time-picker__option--selected")}
            onMouseDown={(e) => e.preventDefault()} onMouseMove={() => { if (i !== active) { typed.current = false; setActive(i); } }} onClick={() => pick(n)}>
            <span className="dk-time-picker__time">{fmt(n)}</span>
            {n === value ? <Icon icon={icons.Check} className="dk-time-picker__check" /> : null}
          </li>
        )) : null}
      </ul>
    </span>
  );
});
