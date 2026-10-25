"use client";
import * as React from "react";
import { cn, isInvalid, omit, oneOf, SIZES } from "../../internal/cn";
import { Icon } from "../Icon/Icon";
import type { InputProps } from "../Input/Input";
import { component } from "../../internal/component";
import { useFieldControl } from "../../internal/field";
import { useLocale, useSerupa } from "../../internal/provider";
import * as icons from "../../material/builtin";
import { warnOnce } from "../../internal/warn";
import { useFormReset } from "../../internal/useFormReset";
import { PHONE_COUNTRIES, formatNational, isPhoneComplete, parsePhone, phoneCountry, stripTrunk, toE164, type PhoneCountry } from "./phone";

/** What onValueChange reports with the E.164 number. */
export interface PhoneValueDetails {
  /** The picked country's ISO code, such as "ID". */
  country: string;
  /** The national number, digits only, without the trunk prefix. */
  national: string;
  /** Whether the number has a length the country uses. */
  complete: boolean;
}

export interface PhoneInputProps extends Omit<InputProps, "type" | "showCount" | "value" | "defaultValue" | "onChange" | "leftIcon" | "rightIcon"> {
  /** The number in E.164, such as "+6281234567890", or "" (controlled). Use with onValueChange. */
  value?: string;
  /** The number at first (uncontrolled), in E.164. */
  defaultValue?: string;
  /** Called with the E.164 number ("" when empty) as people type, paste or change the country. */
  onValueChange?: (value: string, details: PhoneValueDetails) => void;
  /** The picked country, an ISO code such as "ID" (controlled). Use with onCountryChange. */
  country?: string;
  /** The country at first (uncontrolled). Default: the locale's region when it's known, else "US". */
  defaultCountry?: string;
  /** Called with the ISO code when the country changes, from the menu or a pasted "+…" number. */
  onCountryChange?: (country: string) => void;
  /** The countries in the menu, as ISO codes or your own PhoneCountry rows (which replace the built-in row with the same code); the menu sorts them by name. Default: every country PhoneInput knows. */
  countries?: Array<string | PhoneCountry>;
  /** The country menu's name. Default: "Country". */
  countryLabel?: string;
  /** Submits the E.164 number under this name in a hidden input. */
  name?: string;
}

const own = { size: 1, invalid: 1, className: 1, style: 1, value: 1, defaultValue: 1, onValueChange: 1, country: 1, defaultCountry: 1,
  onCountryChange: 1, countries: 1, countryLabel: 1, name: 1, onKeyDown: 1 } as const;

const regionOf = (locale: string): string | undefined => {
  try { return new Intl.Locale(locale).maximize().region; } catch { return undefined; }
};

// Where the caret goes after formatting: just after the n-th digit (or at the start for none).
const caretAfter = (text: string, n: number): number => {
  if (n <= 0) return 0;
  for (let i = 0, seen = 0; i < text.length; i++) if (/\d/.test(text[i]) && ++seen === n) return i + 1;
  return text.length;
};

/* PhoneInput: Input's box with a country menu at the start (a native <select> under a "+62" label) and a tel field
   that groups the national number as people type ("812-3456-7890"). onValueChange reports E.164 ("+6281234567890").
   Pasting or typing "+…" picks the country from the calling code; a typed trunk "0" is dropped. className and
   style go to the box; ref and the other input props to the tel <input>. */
/** A phone number field: a country menu and a tel field that groups the number as people type, reporting E.164 ("+6281234567890"). */
export const PhoneInput = /* @__PURE__ */ component<HTMLInputElement, PhoneInputProps>("PhoneInput", function PhoneInput(props, ref) {
  props = useFieldControl(props);   // the props a surrounding Field hands it, at any depth
  const sds = useSerupa();
  const locale = useLocale();
  const rest = omit(props, own);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;

  // The rows this field knows: the built-in ones, with any rows passed in countries in place of the same code.
  const table = React.useMemo(function () {
    const mine = (props.countries || []).filter((c): c is PhoneCountry => typeof c === "object" && !!c && !!c.code);
    if (!mine.length) return PHONE_COUNTRIES;
    const codes = new Set(mine.map((c) => c.code.toUpperCase()));
    return mine.map((c) => ({ ...c, code: c.code.toUpperCase() })).concat(PHONE_COUNTRIES.filter((c) => !codes.has(c.code)));
  }, [props.countries]);
  const find = (code: string | undefined) => (code ? table.find((c) => c.code === code.toUpperCase()) : undefined);
  const list = React.useMemo(function () {
    const pick = (code: string | undefined) => (code ? table.find((c) => c.code === code.toUpperCase()) : undefined);
    const picked = props.countries ? props.countries.map((c) => pick(typeof c === "string" ? c : c && c.code)).filter((c): c is PhoneCountry => !!c) : table.slice();
    let names: Intl.DisplayNames | undefined;
    try { names = new Intl.DisplayNames([locale], { type: "region" }); } catch { names = undefined; }
    return picked.map((c) => ({ c, name: (names && names.of(c.code)) || c.code })).sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [props.countries, table, locale]);
  const fallback = find(props.defaultCountry) || find(regionOf(locale)) || find("US") || phoneCountry("US")!;
  const start = parsePhone(props.value ?? props.defaultValue ?? "", props.country ?? props.defaultCountry, table);

  const [ownCountry, setOwnCountry] = React.useState<string>(() => (start ? start.country.code : fallback.code));
  const country = find(props.country) || find(ownCountry) || fallback;
  const [national, setNational] = React.useState(() => (start ? start.national : ""));
  // A controlled value that changed from outside (not the one this field just reported) is read again.
  const reported = React.useRef(start ? toE164(start.national, start.country) : "");
  let shown = national;
  if (props.value !== undefined && props.value !== reported.current) {
    const p = parsePhone(props.value, country.code, table);
    shown = p ? p.national : "";
    reported.current = props.value;
    if (shown !== national) setNational(shown);
    if (p && p.country.code !== country.code && props.country === undefined) setOwnCountry(p.country.code);
  }

  const input = React.useRef<HTMLInputElement | null>(null);
  const setRef = React.useCallback(function (node: HTMLInputElement | null) {
    input.current = node;
    if (typeof ref === "function") ref(node); else if (ref) ref.current = node;
  }, [ref]);
  // A form reset puts the default number and country back (uncontrolled), in the field and in what the form sends; a
  // controlled field shows its value again (the browser reset the text to its first value).
  const [, rerender] = React.useState(0);
  useFormReset(input, () => {
    if (props.value === undefined) {
      const d = parsePhone(props.defaultValue ?? "", props.defaultCountry, table);
      setNational(d ? d.national : "");
      if (props.country === undefined) setOwnCountry(d ? d.country.code : fallback.code);
      reported.current = d ? toE164(d.national, d.country) : "";
    }
    rerender((n) => n + 1);
  });
  const caret = React.useRef<number | null>(null);
  const text = formatNational(shown, country);
  // every render: an edit that reformats the number asks for the caret back, and the new text is there only after the render.
  React.useLayoutEffect(function () {
    if (caret.current == null || !input.current || document.activeElement !== input.current) return;
    input.current.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });

  const commit = function (digits: string, c: PhoneCountry) {
    digits = digits.slice(0, c.max);
    setNational(digits);
    if (c.code !== country.code) {
      if (props.country === undefined) setOwnCountry(c.code);
      props.onCountryChange?.(c.code);
    }
    const e164 = toE164(digits, c);
    if (e164 !== reported.current || c.code !== country.code) {
      reported.current = e164;
      props.onValueChange?.(e164, { country: c.code, national: digits, complete: isPhoneComplete(digits, c) });
    }
    return digits;
  };

  const onChange = function (e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value, at = e.target.selectionStart ?? raw.length;
    let before = raw.slice(0, at).replace(/\D/g, "").length;
    if (/^\s*(\+|00)/.test(raw)) {
      const p = parsePhone(raw, country.code, table);
      if (p) { const d = commit(p.national, p.country); caret.current = formatNational(d, p.country).length; return; }
      if (raw.replace(/\D/g, "").length > 3) warnOnce("phone-code", `PhoneInput: "${raw.trim()}" starts with a calling code PhoneInput doesn't know, so its digits are read as a number in ${country.code}. Pass the country's row in countries.`);
    }
    const all = raw.replace(/\D/g, "");
    let digits = stripTrunk(all, country);
    // Too long for a national number but starts with the calling code ("62 812…" typed with Indonesia picked): the
    // code was typed without "+", so it's dropped rather than written twice.
    if (digits.length > country.max && all.startsWith(country.dial)) digits = stripTrunk(all.slice(country.dial.length), country);
    if (digits.length < all.length) before = Math.max(0, before - (all.length - digits.length));
    const d = commit(digits, country);
    caret.current = caretAfter(formatNational(d, country), Math.min(before, d.length));
  };

  // Backspace or Delete next to a separator ("812-|3456") removes the digit beyond it, not only the separator.
  const onKeyDown = function (e: React.KeyboardEvent<HTMLInputElement>) {
    props.onKeyDown?.(e);
    const el = e.currentTarget, s = el.selectionStart, end = el.selectionEnd;
    if (e.defaultPrevented || s == null || s !== end || (e.key !== "Backspace" && e.key !== "Delete")) return;
    const back = e.key === "Backspace";
    let i = back ? s - 1 : s;
    if (i < 0 || i >= text.length || /\d/.test(text[i])) return;
    while (i >= 0 && i < text.length && !/\d/.test(text[i])) i += back ? -1 : 1;
    if (i < 0 || i >= text.length) return;
    e.preventDefault();
    const n = text.slice(0, i).replace(/\D/g, "").length;   // digits before the one removed
    commit(shown.slice(0, n) + shown.slice(n + 1), country);
    caret.current = caretAfter(formatNational(shown.slice(0, n) + shown.slice(n + 1), country), n);
  };

  const onCountry = function (e: React.ChangeEvent<HTMLSelectElement>) {
    const c = find(e.target.value);
    if (c) commit(shown, c);
  };

  return (
    <span className={cn("dk-input dk-phone-input", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.className)}
      style={props.style} data-component="phone-input" data-size={size}>
      <span className="dk-phone-input__country">
        <span className="dk-phone-input__dial" aria-hidden>+{country.dial}</span>
        <Icon icon={icons.ExpandMore} className="dk-phone-input__chevron" />
        <select className="dk-phone-input__select" value={country.code} onChange={onCountry} disabled={rest.disabled || rest.readOnly}
          aria-label={props.countryLabel || sds.labels.country}>
          {list.map(({ c, name }) => <option key={c.code} value={c.code}>{name + " (+" + c.dial + ")"}</option>)}
        </select>
      </span>
      <input autoComplete="tel-national" {...rest} ref={setRef} type="tel" inputMode="tel" className="dk-input__field" value={text} onChange={onChange} onKeyDown={onKeyDown} />
      {props.name ? <input type="hidden" name={props.name} form={props.form} value={toE164(shown, country)} disabled={rest.disabled} /> : null}
    </span>
  );
});
