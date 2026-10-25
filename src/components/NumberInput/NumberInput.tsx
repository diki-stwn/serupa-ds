"use client";
import * as React from "react";
import { cn, isInvalid, omit, oneOf, SIZES } from "../../internal/cn";
import { Icon } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import type { InputProps } from "../Input/Input";
import { component } from "../../internal/component";
import { useFieldControl } from "../../internal/field";
import { isComposing } from "../../internal/ime";
import { formatNumber, parseNumber } from "../../internal/numbers";
import { gridPlaces, roundTo } from "../../internal/step";
import { useLocale, useSerupa } from "../../internal/provider";
import { minorDigits } from "../../internal/currency";
import { useFormReset } from "../../internal/useFormReset";
import * as icons from "../../material/builtin";

export interface NumberInputProps extends Omit<InputProps, "type" | "showCount" | "value" | "defaultValue" | "rightIcon" | "min" | "max" | "step"> {
  /** The number (controlled), or null when the field is empty. Use with onValueChange. */
  value?: number | null;
  /** The number at first (uncontrolled). */
  defaultValue?: number | null;
  /** Called with the new number, or null when emptied: as people type (numbers within min..max), on blur (clamped), and from the arrow keys and buttons. */
  onValueChange?: (value: number | null) => void;
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

/* NumberInput: a field for a number, with − and + buttons at the end. role="spinbutton" with aria-valuenow,
   min and max. ArrowUp and ArrowDown change it by step, PageUp, PageDown and Shift+arrows by largeStep steps,
   Home and End go to min and max. People can type freely, in the locale's marks ("1.500" is 1500 in id-ID); on blur
   the text is parsed, clamped to min..max, rounded to the step's decimals and written back in the locale's form. It uses Input's box and tokens: className and style go to the box; ref and
   every other prop to the <input> (type="text" with inputMode="decimal", so mobile keyboards show digits). */
/** A number field with − and + buttons, arrow keys, min, max and step. */
export const NumberInput = /* @__PURE__ */ component<HTMLInputElement, NumberInputProps>("NumberInput", function NumberInput(props, ref) {
  props = useFieldControl(props);   // the props a surrounding Field hands it, at any depth
  const sds = useSerupa();
  const rest = omit(props, { size: 1, invalid: 1, leftIcon: 1, className: 1, style: 1, value: 1, defaultValue: 1, onValueChange: 1, min: 1, max: 1, step: 1, largeStep: 1, steppers: 1, decrementLabel: 1, incrementLabel: 1, locale: 1, formatOptions: 1, currency: 1, minorUnits: 1 } as const);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  // Without a locale from the prop or a provider: en-US on the server and while hydrating, then the browser's.
  const locale = useLocale(props.locale);
  const formatOptions: Intl.NumberFormatOptions | undefined = props.currency ? { style: "currency", currency: props.currency, ...props.formatOptions } : props.formatOptions;
  // With minorUnits, the props are whole cents (1999) and the field works in the currency's units (19.99).
  const factor = props.minorUnits && formatOptions?.style === "currency" && formatOptions.currency ? 10 ** minorDigits(formatOptions.currency) : 1;
  const major = (n: number | null | undefined) => (n == null || factor === 1 ? n : n / factor);
  const step = Number(props.step) > 0 ? Number(props.step) / factor : 1;
  const large = Number(props.largeStep) > 0 ? Number(props.largeStep) : 10;
  const min = props.min != null && isFinite(props.min) ? (major(props.min) as number) : undefined;
  const max = props.max != null && isFinite(props.max) ? (major(props.max) as number) : undefined;
  // Money keeps the decimals it's shown with (19.99 with a step of 1), so what people see is the value.
  const optionsKey = formatOptions ? JSON.stringify(formatOptions) : "";
  const shownPlaces = React.useMemo(() => formatOptions?.style === "currency" ? new Intl.NumberFormat(locale, formatOptions).resolvedOptions().maximumFractionDigits ?? 0 : 0,
    [locale, optionsKey]);   // eslint-disable-line react-hooks/exhaustive-deps -- formatOptions by value
  const places = Math.max(gridPlaces(min, step), shownPlaces);
  const controlled = props.value !== undefined;
  const [ownValue, setOwnValue] = React.useState<number | null>(major(props.defaultValue) ?? null);
  const value = controlled ? (major(props.value) ?? null) : ownValue;
  // What the shown number is multiplied by: 100 for the percent style, 1 otherwise.
  const scale = formatOptions ? parseNumber(formatNumber(1, locale, formatOptions), locale) || 1 : 1;
  const show = (v: number | null) => (v == null ? "" : formatNumber(v, locale, formatOptions));
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
    const v = controlled ? value : (major(props.defaultValue) ?? null);
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
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const n = parse(text);
    const v = n == null ? null : fit(n === undefined ? (value ?? 0) : n);
    const out = n === undefined ? value : v;
    put(out);
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
    else if (k === "Enter") { const n = parse(text); if (n != null) put(fit(n)); return; }
    else return;
    e.preventDefault();
  };
  const current = parse(text);
  const now = typeof current === "number" ? current : value;
  const left = asIcon(props.leftIcon);
  const press = (by: number) => () => { nudge(by); if (el.current && document.activeElement !== el.current) el.current.focus({ preventScroll: true }); };
  return (
    <span className={cn("dk-input dk-number-input", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.steppers !== false && "dk-number-input--steppers", props.className)}
      style={props.style} data-component="number-input" data-size={size}>
      {left != null && left !== false ? <span className="dk-input__icon dk-input__icon--left" aria-hidden>{left}</span> : null}
      <input {...rest} ref={(n) => { el.current = n; if (typeof ref === "function") ref(n); else if (ref) ref.current = n; }}
        type="text" inputMode={rest.inputMode || (places > 0 || (min !== undefined && min < 0) || min === undefined ? "decimal" : "numeric")}
        role="spinbutton" aria-valuenow={now ?? undefined} aria-valuetext={formatOptions && now != null ? formatNumber(now, locale, formatOptions) : undefined} aria-valuemin={min} aria-valuemax={max}
        autoComplete={rest.autoComplete || "off"} className="dk-input__field" value={text}
        onChange={onChange} onBlur={onBlur} onKeyDown={onKeyDown} onFocus={rest.onFocus} />
      {name ? <input type="hidden" ref={raw} name={name} form={rest.form} disabled={rest.disabled} value={value == null ? "" : String(factor === 1 ? value : Math.round(value * factor))} /> : null}
      {props.steppers !== false ? (
        <span className="dk-number-input__steppers">
          <button type="button" tabIndex={-1} className="dk-number-input__step" aria-label={props.decrementLabel || sds.labels.decrease} aria-controls={rest.id}
            disabled={locked || (min !== undefined && now != null && now <= min)} onClick={press(-1)} onMouseDown={(e) => e.preventDefault()}>
            <Icon icon={icons.Remove} />
          </button>
          <button type="button" tabIndex={-1} className="dk-number-input__step" aria-label={props.incrementLabel || sds.labels.increase} aria-controls={rest.id}
            disabled={locked || (max !== undefined && now != null && now >= max)} onClick={press(1)} onMouseDown={(e) => e.preventDefault()}>
            <Icon icon={icons.Add} />
          </button>
        </span>
      ) : null}
    </span>
  );
});
