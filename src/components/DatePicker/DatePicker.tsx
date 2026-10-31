"use client";
import * as React from "react";
import { pressFocuses } from "../../internal/affix";
import { cn, domId, isInvalid, oneOf, SIZES } from "../../internal/cn";
import { compare, datePattern, formatDate, isoDate, parseDate, toDay } from "../../internal/dates";
import { reject } from "../../internal/rejectInput";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer";
import { useExit } from "../../internal/useExit";
import { Calendar } from "../Calendar/Calendar";
import { Icon } from "../Icon/Icon";
import { component } from "../../internal/component";
import { useFieldControl } from "../../internal/field";
import { useLocale, useOwnLang, useSettings } from "../../internal/provider";
import { useFormReset } from "../../internal/useFormReset";
import * as icons from "../../material/builtin";
import { isComposing } from "../../internal/ime";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";
import { en as words } from "./labels";
import { windowBlur } from "../../internal/focus";

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'children'> {
  /** The chosen day (controlled), or null. Use with onValueChange. A "yyyy-mm-dd" string is that day, wherever the
      browser is (a Date made from one is UTC midnight, the day before west of Greenwich). */
  value?: Date | string | null;
  /** The chosen day at first (uncontrolled), as a Date or "yyyy-mm-dd". */
  defaultValue?: Date | string | null;
  /** Called with the new day (local midnight) and the same day as "yyyy-mm-dd", or null and null when the field is cleared. */
  onValueChange?: (value: Date | null, iso: string | null) => void;
  /** Called when typed text is put back on blur or Enter: "unreadable" when it isn't a date, "unavailable" when it
      is one that can't be chosen (outside min..max, or isDateDisabled). The field also says so to screen readers. */
  onInvalidInput?: (text: string, reason: "unreadable" | "unavailable") => void;
  /** The earliest and latest days that can be chosen, as Dates or "yyyy-mm-dd". */
  min?: Date | string;
  /** The latest day that can be chosen, as a Date or "yyyy-mm-dd". */
  max?: Date | string;
  /** Days that can't be chosen, such as weekends. */
  isDateDisabled?: (date: Date) => boolean;
  /** A BCP 47 locale for the typed format, names and first day of the week. Default: the nearest SerupaProvider's locale, else the browser's. */
  locale?: string;
  /** 0 Sunday … 6 Saturday. Default: the locale's. */
  weekStartsOn?: number;
  /** 'sm', 'md' (default) or 'lg', like Input. */
  size?: 'sm' | 'md' | 'lg';
  /** A danger border and aria-invalid, like Input. */
  invalid?: boolean;
  /** The calendar button's name. Default: "Choose a date". */
  buttonLabel?: string;
}

/* DatePicker: a text field for a date with a calendar button. People type a date in the locale's numeric order
   (mm/dd/yyyy in en-US, dd.mm.yyyy in de-DE, or yyyy-mm-dd anywhere) or pick one in a Calendar in a popover
   dialog. Typed text is read on blur and on Enter: a date it can't read, or one outside min..max, puts back the
   last good value. The popover opens on the button (or Alt+ArrowDown in the field) with focus on the chosen day,
   and closes on a pick, Escape (returning focus to the field), a click outside or focus moving past it. With name, a hidden input sends
   yyyy-mm-dd. ref goes to the text field. */
/** A date field: type a date or pick one from a calendar popover. */
export const DatePicker = /* @__PURE__ */ component<HTMLInputElement, DatePickerProps>("DatePicker", function DatePicker(props, ref) {
  const nameRef = useNameCheck("DatePicker", NAME_HOW.field);   // warns when it has no accessible name
  props = useFieldControl(props);   // the props a surrounding Field hands it, at any depth
  const sds = useSettings(words);
  const { value: _v, defaultValue: _d, onValueChange, onInvalidInput, min: minIn, max: maxIn, isDateDisabled, locale: localeProp, weekStartsOn, size: _s, invalid: _i, buttonLabel, className, style, name, placeholder, disabled, readOnly, onBlur, onKeyDown, ...rest } = props;
  const locale = useLocale(localeProp), lang = useOwnLang(localeProp);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  const controlled = props.value !== undefined;
  const [own, setOwn] = React.useState<Date | null>(() => toDay(props.defaultValue, "DatePicker"));
  const value = controlled ? toDay(props.value, "DatePicker") : own;
  const min = toDay(minIn, "DatePicker") || undefined, max = toDay(maxIn, "DatePicker") || undefined;
  const [text, setText] = React.useState(value ? formatDate(value, locale) : "");
  const [open, setOpen] = React.useState(false);
  const id = domId("dk-dp", React.useId());
  const field = React.useRef<HTMLInputElement | null>(null);
  const button = React.useRef<HTMLButtonElement | null>(null);
  const box = React.useRef<HTMLSpanElement | null>(null);
  const panel = React.useRef<HTMLDivElement | null>(null);
  const shown = React.useRef(value ? value.getTime() : null);
  useFormReset(field, () => {
    if (controlled) return;
    const d = toDay(props.defaultValue);
    shown.current = d ? d.getTime() : null; setOwn(d); setText(d ? formatDate(d, locale) : ""); setOpen(false);
  });
  // A new value from outside, or a new locale (the browser's, once a server-rendered page hydrates), rewrites the text.
  const shownLocale = React.useRef(locale);
  if ((value ? value.getTime() : null) !== shown.current || locale !== shownLocale.current) {
    shown.current = value ? value.getTime() : null; shownLocale.current = locale;
    const t = value ? formatDate(value, locale) : ""; if (t !== text) setText(t);
  }

  const allowed = (d: Date) => !(min && compare(d, min) < 0) && !(max && compare(d, max) > 0) && !(isDateDisabled && isDateDisabled(d));
  const commit = (d: Date | null) => {
    shown.current = d ? d.getTime() : null;
    setText(d ? formatDate(d, locale) : "");
    if ((d ? d.getTime() : null) === (value ? value.getTime() : null)) return;
    if (!controlled) setOwn(d);
    if (onValueChange) onValueChange(d, d ? isoDate(d) : null);
  };
  const read = () => {
    if (text.trim() === "") return commit(null);
    const d = parseDate(text, locale);
    if (d && allowed(d)) return commit(d);
    reject(text, d ? "unavailable" : "unreadable", onInvalidInput, sds.labels.inputNotAccepted);
    commit(value);
  };
  const close = (focusField: boolean) => { setOpen(false); if (focusField && field.current) field.current.focus(); };

  // A press outside the calendar and its button, or focus moving past them (Tab), closes it.
  // The calendar stays (inert) while the popup fades out (DZ1).
  const exit = useExit(open, panel);
  useAnchoredLayer(open, panel, box, { placement: "bottom-start", offsetVar: "--dk-dp-offset", onOutside: () => close(false), onFocusOutside: () => close(false), inside: button });

  const typed = parseDate(text, locale);
  const off = !!disabled || !!readOnly;
  return (
    <span ref={box} className={cn("dk-input", "dk-input--size-" + size, "dk-date-picker", invalid && "dk-input--invalid", disabled && "dk-input--disabled", readOnly && "dk-input--readonly", className)} style={style} data-component="date-picker" data-size={size} onMouseDown={pressFocuses(field)}>
      <input {...rest} ref={(n) => { field.current = n; nameRef(n); if (typeof ref === "function") ref(n); else if (ref) ref.current = n; }}
        lang={rest.lang ?? lang} type="text" inputMode="numeric" autoComplete={rest.autoComplete || "off"} className="dk-input__field" value={text} disabled={disabled} readOnly={readOnly}
        placeholder={placeholder != null ? placeholder : datePattern(locale)} aria-invalid={invalid || undefined} aria-describedby={cn(rest["aria-describedby"], id + "-format")}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => { if (!windowBlur(e)) read(); if (onBlur) onBlur(e); }}
        onKeyDown={(e) => {
          if (onKeyDown) onKeyDown(e);
          if (e.defaultPrevented || isComposing(e)) return;
          if (e.key === "Enter") read();
          else if (e.key === "ArrowDown" && e.altKey && !off) { e.preventDefault(); read(); setOpen(true); }
        }} />
      <button ref={button} type="button" className="dk-date-picker__button" aria-label={buttonLabel || sds.labels.chooseDate} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined}
        disabled={off} onClick={() => { if (!open) read(); setOpen(!open); }}>
        <Icon icon={icons.CalendarToday} />
      </button>
      {/* The format to type, read after the field's name: a placeholder is gone once something is typed, and not every screen reader reads it. */}
      <span id={id + "-format"} hidden>{sds.labels.formatHint(datePattern(locale))}</span>
      {name ? <input type="hidden" name={name} form={rest.form} value={value ? isoDate(value) : ""} disabled={disabled} /> : null}
      <div ref={panel} id={id} role="dialog" aria-label={buttonLabel || sds.labels.chooseDate} {...{ popover: "manual" }} hidden={!open || undefined} inert={!open || undefined} className="dk-date-picker__popup"
        onKeyDown={(e) => { if (e.key === "Escape" && !isComposing(e)) { e.preventDefault(); e.stopPropagation(); close(true); } }}>
        {open || exit.leaving ? <Calendar value={value} defaultMonth={(typed && allowed(typed) ? typed : null) || value || undefined} min={min} max={max} isDateDisabled={isDateDisabled} locale={locale} weekStartsOn={weekStartsOn} autoFocus
          onValueChange={(d) => { commit(d); close(true); }} /> : null}
      </div>
    </span>
  );
});
