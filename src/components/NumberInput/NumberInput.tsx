"use client";
import * as React from "react";
import { cn, domId, isInvalid, omit, oneOf, SIZES } from "../../internal/cn";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";
import { pressFocuses, useAffixes } from "../../internal/affix";
import { Icon } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import type { InputProps } from "../Input/Input";
import { component } from "../../internal/component";
import { useFieldControl } from "../../internal/field";
import { isComposing } from "../../internal/ime";
import { formatNumber, parseNumber } from "../../internal/numbers";
import { gridPlaces, roundTo } from "../../internal/step";
import { useLocale, useOwnLang, useSettings } from "../../internal/provider";
import { minorDigits, pinCurrencyDigits } from "../../internal/currency";
import { useFormReset } from "../../internal/useFormReset";
import { reject } from "../../internal/rejectInput";
import * as icons from "../../material/builtin";
import { en as NumberInputWords } from "./labels";
import { en as DatePickerWords } from "../DatePicker/labels";
// This component's words and the ones it shares with DatePicker.
const words = /* @__PURE__ */ Object.assign({}, NumberInputWords, DatePickerWords);

export interface NumberInputProps extends Omit<InputProps, "type" | "showCount" | "value" | "defaultValue" | "rightIcon" | "min" | "max" | "step"> {
  /** The number (controlled), or null when the field is empty. Use with onValueChange. */
  value?: number | null;
  /** The number at first (uncontrolled). */
  defaultValue?: number | null;
  /** Called with the new number, or null when emptied: as people type (numbers within min..max), on blur (clamped), and from the arrow keys and buttons. */
  onValueChange?: (value: number | null) => void;
  /** Called when typed text isn't kept as it is, with the text and why: "range" when a number outside min..max is
      brought back within them (on blur or Enter), so a form can say "Quantity was reduced to 100"; "unreadable" when
      the text isn't a number and the previous one comes back, which is also said to screen readers. */
  onInvalidInput?: (text: string, reason: "range" | "unreadable") => void;
  /** The smallest allowed number. The field snaps to it when it loses focus. */
  min?: number;
  /** The largest allowed number. */
  max?: number;
  /** How much the arrow keys and buttons change it. Default: 1. Its decimals set how many the value keeps (step 0.25: two). */
  step?: number;
  /** How many steps PageUp, PageDown and Shift with an arrow move. Default: 10. */
  largeStep?: number;
  /** Shows the − and + buttons at the end. Default: true. */
  steppers?: boolean;
  /** The buttons' names. Default: "Decrease" and "Increase". */
  decrementLabel?: string;
  /** The increase button's name. Default: "Increase". */
  incrementLabel?: string;
  /** The locale whose decimal and group marks are read and written ("1.500,25" in id-ID). Default: the nearest SerupaProvider's locale, else the browser's. */
  locale?: string;
  /** How the number is shown, as Intl.NumberFormat options: `{ style: "currency", currency: "IDR" }`, `{ useGrouping: true }`,
      or the percent style (the value is the fraction: 0.15 shows 15%). Default: no grouping and every decimal the value has. */
  formatOptions?: Intl.NumberFormatOptions;
  /** An ISO 4217 code ("IDR", "USD", "JPY"): shows the amount as money, with the symbol where the locale puts it, and keeps
      the currency's decimals (19.99, not 20). Short for formatOptions { style: "currency", currency }; formatOptions still wins. */
  currency?: string;
  /** With currency: value, defaultValue, onValueChange, min, max and step are whole minor units (cents), so 1999 is
      $19.99 and ¥1999 is ¥1,999. Store money this way to avoid floating-point sums. */
  minorUnits?: boolean;
}

// Format options back from their JSON key, so a memo can depend on the options by value.
const keyed = (key: string) => (key ? (JSON.parse(key) as Intl.NumberFormatOptions) : undefined);

/* NumberInput: a field for a number, with − and + buttons at the end. role="spinbutton" with aria-valuenow,
   min and max. ArrowUp and ArrowDown change it by step, PageUp, PageDown and Shift+arrows by largeStep steps,
   Home and End go to min and max. People can type freely, in the locale's marks ("1.500" is 1500 in id-ID); on blur
   the text is parsed, clamped to min..max, rounded to the step's decimals and written back in the locale's form. It uses Input's box and tokens: className and style go to the box; ref and
   every other prop to the <input> (type="text" with inputMode="decimal", so mobile keyboards show digits). */
/** A number field with − and + buttons, arrow keys, min, max and step. */
export const NumberInput = /* @__PURE__ */ component<HTMLInputElement, NumberInputProps>("NumberInput", function NumberInput(props, ref) {
  const nameRef = useNameCheck("NumberInput", NAME_HOW.field);   // warns when it has no accessible name
  props = useFieldControl(props);   // the props a surrounding Field hands it, at any depth
  const sds = useSettings(words);
  const rest = omit(props, { size: 1, invalid: 1, leftIcon: 1, prefix: 1, suffix: 1, className: 1, style: 1, value: 1, defaultValue: 1, onValueChange: 1, onInvalidInput: 1, min: 1, max: 1, step: 1, largeStep: 1, steppers: 1, decrementLabel: 1, incrementLabel: 1, locale: 1, formatOptions: 1, currency: 1, minorUnits: 1 } as const);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  // Without a locale from the prop or a provider: en-US on the server and while hydrating, then the browser's.
  const locale = useLocale(props.locale), lang = useOwnLang(props.locale);
  // A currency's decimals are pinned (pinCurrencyDigits), so the server and every browser write the same amount.
  const given: Intl.NumberFormatOptions | undefined = props.currency ? { style: "currency", currency: props.currency, ...props.formatOptions } : props.formatOptions;
  const formatOptions = given && pinCurrencyDigits(given);
  // With minorUnits, the props are whole cents (1999) and the field works in the currency's units (19.99).
  const factor = props.minorUnits && formatOptions?.style === "currency" && formatOptions.currency ? 10 ** minorDigits(formatOptions.currency) : 1;
  const major = (n: number | null | undefined) => (n == null || factor === 1 ? n : n / factor);
  const step = Number(props.step) > 0 ? Number(props.step) / factor : 1;
  const large = Number(props.largeStep) > 0 ? Number(props.largeStep) : 10;
  const min = props.min != null && isFinite(props.min) ? (major(props.min) as number) : undefined;
  const max = props.max != null && isFinite(props.max) ? (major(props.max) as number) : undefined;
  // Money keeps the decimals it's shown with (19.99 with a step of 1), so what people see is the value.
  // formatOptions by value: the memos read the options back from their key (keyed), so an inline object doesn't redo them.
  const optionsKey = formatOptions ? JSON.stringify(formatOptions) : "";
  const shownPlaces = React.useMemo(() => { const o = keyed(optionsKey); return o?.style === "currency" ? new Intl.NumberFormat(locale, o).resolvedOptions().maximumFractionDigits ?? 0 : 0; },
    [locale, optionsKey]);
  const places = Math.max(gridPlaces(min, step), shownPlaces);
  // What the shown number is multiplied by: 100 for the percent style, 1 otherwise.
  const scale = React.useMemo(() => { const o = keyed(optionsKey); return o ? parseNumber(formatNumber(1, locale, o), locale) || 1 : 1; },
    [locale, optionsKey]);
  const show = (v: number | null) => (v == null ? "" : formatNumber(v, locale, formatOptions));
  // A value is taken as it's shown (GR47): one with more decimals than the format writes (19.995 as US$20,00) is the
  // number shown, so the form sends what people see, and leaving the field without an edit changes nothing.
  const asShown = (v: number | null | undefined): number | null => {
    if (v == null || !formatOptions) return v ?? null;
    const n = parseNumber(show(v), locale);
    return typeof n === "number" ? n / scale : v;
  };
  const controlled = props.value !== undefined;
  const [ownValue, setOwnValue] = React.useState<number | null>(() => asShown(major(props.defaultValue)));
  const value = controlled ? asShown(major(props.value)) : ownValue;
  const shown = show(value);
  const [text, setText] = React.useState(shown);
  const typing = React.useRef(false);
  // A new value, locale or format from outside rewrites the field, unless people are typing in it. After a step, a
  // blur or Enter it's rewritten from the value too (synced), so a controlled field whose parent kept its value, or
  // changed it, shows that value and not what was typed.
  const [synced, resync] = React.useState(0);
  React.useEffect(() => { if (!typing.current) setText(shown); }, [shown, synced]);
  const el = React.useRef<HTMLInputElement | null>(null);
  // The form gets the number itself ("1500000", or cents with minorUnits) from a hidden input, not the shown text
  // ("Rp 1.500.000"), so the visible field has no name. form (the attribute) goes to both, so a field outside its form works.
  const name = rest.name;
  delete rest.name;
  const raw = React.useRef<HTMLInputElement | null>(null);
  // A form reset puts the default back (uncontrolled) and rewrites the text, which the browser reset to its first value.
  const [, rerender] = React.useState(0);
  useFormReset(name ? raw : el, () => {
    typing.current = false;
    const v = controlled ? value : asShown(major(props.defaultValue));
    if (!controlled) setOwnValue(v);
    setText(show(v));
    rerender((n) => n + 1);
  });
  const locked = !!rest.disabled || !!rest.readOnly;

  const fit = (v: number) => {
    let n = roundTo(v, places);
    if (min !== undefined && n < min) n = min;
    if (max !== undefined && n > max) n = max;
    return n;
  };
  const parse = (s: string): number | null | undefined => {   // undefined: not a number (yet)
    const n = parseNumber(s, locale);
    return n != null && scale !== 1 ? n / scale : n;
  };
  const commit = (v: number | null) => {
    if (!controlled) setOwnValue(v);
    if (v !== value && props.onValueChange) props.onValueChange(v == null || factor === 1 ? v : Math.round(v * factor));
  };
  const put = (v: number | null) => {   // a finished change: the field shows the value
    typing.current = false;
    setText(show(v)); commit(v); resync((n) => n + 1);
  };
  const nudge = (by: number) => {
    if (locked) return;
    const base = parse(text);
    const from = typeof base === "number" ? base : (value ?? (min !== undefined && min > 0 ? min - step : max !== undefined && max < 0 ? max + step : 0));
    // From a typed value off the grid of min and step, the first step lands on the grid point in that direction, as
    // the native field and Slider do: 0.1 and ↑ with step 0.25 gives 0.25, not 0.35. Money shown with finer decimals
    // than its step ($19.99 with a step of $1) keeps them, so ↑ is $20.99.
    const origin = min ?? 0, k = roundTo((from - origin) / step, 9);
    const onGrid = Number.isInteger(k) || places > gridPlaces(min, step);
    const to = onGrid ? k + by : by > 0 ? Math.floor(k) + by : Math.ceil(k) + by;
    put(fit(origin + to * step));
  };
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value); typing.current = true;
    const n = parse(e.target.value);   // a number out of range waits for blur, which clamps it
    if (n === null || (n !== undefined && (min === undefined || n >= min) && (max === undefined || n <= max))) commit(n);
    if (rest.onChange) rest.onChange(e);
  };
  const outside = (n: number) => (min !== undefined && n < min) || (max !== undefined && n > max);
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const n = parse(text), typed = typing.current;
    const v = n == null ? null : fit(n === undefined ? (value ?? 0) : n);
    const out = n === undefined ? value : v;
    put(out);
    if (n === undefined && typed) reject(text, "unreadable", props.onInvalidInput, sds.labels.inputNotAccepted);
    else if (n != null && outside(n) && props.onInvalidInput) props.onInvalidInput(text.trim(), "range");
    if (rest.onBlur) rest.onBlur(e);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (rest.onKeyDown) rest.onKeyDown(e);
    if (e.defaultPrevented || isComposing(e)) return;
    const k = e.key, big = e.shiftKey ? large : 1;
    if (k === "ArrowUp") nudge(big);
    else if (k === "ArrowDown") nudge(-big);
    else if (k === "PageUp") nudge(large);
    else if (k === "PageDown") nudge(-large);
    else if (k === "Home" && min !== undefined && !locked) put(min);
    else if (k === "End" && max !== undefined && !locked) put(max);
    else if (k === "Enter") {
      const n = parse(text);
      if (n != null) { put(fit(n)); if (outside(n) && props.onInvalidInput) props.onInvalidInput(text.trim(), "range"); }
      return;
    }
    else return;
    e.preventDefault();
  };
  const current = parse(text);
  const now = typeof current === "number" ? current : value;
  const left = asIcon(props.leftIcon);
  const affix = useAffixes(props.prefix, props.suffix, domId("dk-ni", React.useId()), el);
  const press = (by: number) => { nudge(by); if (el.current && document.activeElement !== el.current) el.current.focus({ preventScroll: true }); };
  // Holding − or + repeats: one step on the press, then after 400ms one every 50ms, until the pointer goes up or
  // leaves the button, Escape, or the end of the range. The press already stepped, so its click doesn't; a click with
  // no press behind it (a screen reader's) is one step.
  const latest = React.useRef(nudge); latest.current = nudge;
  const hold = React.useRef<{ by: number; timer: number } | null>(null);
  const stop = React.useCallback(() => { const h = hold.current; if (h) { window.clearTimeout(h.timer); window.clearInterval(h.timer); h.timer = 0; } }, []);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") stop(); };
    // The press's click comes right after pointerup, if at all (not when it ended off the button): forget the press after it.
    const up = () => { stop(); window.setTimeout(() => { hold.current = null; }, 0); };
    window.addEventListener("pointerup", up); window.addEventListener("pointercancel", stop); window.addEventListener("blur", stop); window.addEventListener("keydown", onKey);
    return () => { stop(); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", stop); window.removeEventListener("blur", stop); window.removeEventListener("keydown", onKey); };
  }, [stop]);
  const atEnd = (by: number) => locked || (by < 0 ? min !== undefined && now != null && now <= min : max !== undefined && now != null && now >= max);
  // every render: the end of the range disables the button, and a disabled button gets no pointerup, so a hold stops there.
  React.useEffect(() => { const h = hold.current; if (h && h.timer && atEnd(h.by)) stop(); });
  const stepper = (by: number) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();   // focus stays in the field, for any button
      if (e.button !== 0) return;
      stop(); press(by);
      const h = { by: by, timer: 0 };
      h.timer = window.setTimeout(() => { if (hold.current === h) h.timer = window.setInterval(() => latest.current(by), 50); }, 400);
      hold.current = h;
    },
    onPointerLeave: stop,
    onContextMenu: (e: React.MouseEvent) => { if (hold.current && hold.current.timer) e.preventDefault(); },   // a long touch
    onClick: () => { if (hold.current) hold.current = null; else press(by); },
  });
  return (
    <span className={cn("dk-input dk-number-input", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.steppers !== false && "dk-number-input--steppers", props.className)}
      style={props.style} data-component="number-input" data-size={size} onMouseDown={pressFocuses(el)}>
      {left != null && left !== false ? <span className="dk-input__icon dk-input__icon--left" aria-hidden>{left}</span> : null}
      {affix.prefix}
      <input {...rest} ref={(n) => { el.current = n; nameRef(n); if (typeof ref === "function") ref(n); else if (ref) ref.current = n; }}
        lang={rest.lang ?? lang} type="text" inputMode={rest.inputMode || (places > 0 || (min !== undefined && min < 0) || min === undefined ? "decimal" : "numeric")}
        role="spinbutton" aria-valuenow={now ?? undefined} aria-valuetext={formatOptions && now != null ? formatNumber(now, locale, formatOptions) : undefined} aria-valuemin={min} aria-valuemax={max}
        autoComplete={rest.autoComplete || "off"} className="dk-input__field" value={text}
        aria-describedby={cn(rest["aria-describedby"], affix.ids) || undefined}
        onChange={onChange} onBlur={onBlur} onKeyDown={onKeyDown} onFocus={rest.onFocus} />
      {affix.suffix}
      {name ? <input type="hidden" ref={raw} name={name} form={rest.form} disabled={rest.disabled} value={value == null ? "" : String(factor === 1 ? value : Math.round(value * factor))} /> : null}
      {props.steppers !== false ? (
        <span className="dk-number-input__steppers">
          <button type="button" tabIndex={-1} className="dk-number-input__step" aria-label={props.decrementLabel || sds.labels.decrease} aria-controls={rest.id}
            disabled={atEnd(-1)} {...stepper(-1)}>
            <Icon icon={icons.Remove} />
          </button>
          <button type="button" tabIndex={-1} className="dk-number-input__step" aria-label={props.incrementLabel || sds.labels.increase} aria-controls={rest.id}
            disabled={atEnd(1)} {...stepper(1)}>
            <Icon icon={icons.Add} />
          </button>
        </span>
      ) : null}
    </span>
  );
});
