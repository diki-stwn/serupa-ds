"use client";

// src/components/PhoneInput/PhoneInput.tsx
import * as React from "react";
import { pressFocuses } from "../../internal/affix.js";
import { cn, isInvalid, omit, oneOf, SIZES } from "../../internal/cn.js";
import { Icon } from "../Icon/Icon.js";
import { component } from "../../internal/component.js";
import { activeIn } from "../../internal/root.js";
import { useFieldControl } from "../../internal/field.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { useLocale, useSettings } from "../../internal/provider.js";
import { collatorFor } from "../../internal/collator.js";
import * as icons from "../../material/builtin.js";
import { warnOnce } from "../../internal/warn.js";
import { useFormReset } from "../../internal/useFormReset.js";
import { latinDigits } from "../../internal/digits.js";
import { PHONE_COUNTRIES, formatNational, isPhoneComplete, parsePhone, phoneCountry, stripTrunk, toE164 } from "./phone.js";
import { en as words } from "./labels.js";
var own = {
  size: 1,
  invalid: 1,
  className: 1,
  style: 1,
  value: 1,
  defaultValue: 1,
  onValueChange: 1,
  country: 1,
  defaultCountry: 1,
  onCountryChange: 1,
  countries: 1,
  countryLabel: 1,
  name: 1,
  onKeyDown: 1
};
var never = () => () => {
};
var yes = () => true;
var no = () => false;
var regionOf = (locale) => {
  try {
    return new Intl.Locale(locale).maximize().region;
  } catch {
    return void 0;
  }
};
var caretAfter = (text, n) => {
  if (n <= 0) return 0;
  for (let i = 0, seen = 0; i < text.length; i++) if (/\d/.test(text[i]) && ++seen === n) return i + 1;
  return text.length;
};
var PhoneInput = /* @__PURE__ */ component("PhoneInput", function PhoneInput2(props, ref) {
  props = useFieldControl(props);
  const nameRef = useNameCheck("PhoneInput", NAME_HOW.field);
  const sds = useSettings(words);
  const locale = useLocale();
  const rest = omit(props, own);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  const table = React.useMemo(function() {
    const mine = (props.countries || []).filter((c) => typeof c === "object" && !!c && !!c.code);
    if (!mine.length) return PHONE_COUNTRIES;
    const codes = new Set(mine.map((c) => c.code.toUpperCase()));
    return mine.map((c) => ({ ...c, code: c.code.toUpperCase() })).concat(PHONE_COUNTRIES.filter((c) => !codes.has(c.code)));
  }, [props.countries]);
  const find = (code) => code ? table.find((c) => c.code === code.toUpperCase()) : void 0;
  const hydrated = React.useSyncExternalStore(never, yes, no);
  const list = React.useMemo(function() {
    const pick = (code) => code ? table.find((c) => c.code === code.toUpperCase()) : void 0;
    const picked = props.countries ? props.countries.map((c) => pick(typeof c === "string" ? c : c && c.code)).filter((c) => !!c) : table.slice();
    const order = collatorFor(locale);
    let names;
    try {
      names = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      names = void 0;
    }
    return picked.map((c) => ({ c, name: names && names.of(c.code) || c.code })).sort((a, b) => order.compare(a.name, b.name));
  }, [props.countries, table, locale]);
  const fallback = find(props.defaultCountry) || find(regionOf(locale)) || find("US") || phoneCountry("US");
  const start = parsePhone(props.value ?? props.defaultValue ?? "", props.country ?? props.defaultCountry, table);
  const [ownCountry, setOwnCountry] = React.useState(() => start ? start.country.code : fallback.code);
  const country = find(props.country) || find(ownCountry) || fallback;
  const [national, setNational] = React.useState(() => start ? start.national : "");
  const [lead, setLead] = React.useState(null);
  const typed = React.useRef(national);
  const reported = React.useRef(start ? toE164(start.national, start.country) : "");
  let shown = national;
  if (props.value !== void 0 && props.value !== reported.current) {
    const p = parsePhone(props.value, country.code, table);
    shown = p ? p.national : "";
    reported.current = props.value;
    if (shown !== national) {
      setNational(shown);
      typed.current = shown;
    }
    if (p && p.country.code !== country.code && props.country === void 0) setOwnCountry(p.country.code);
  }
  const input = React.useRef(null);
  const setRef = React.useCallback(function(node) {
    input.current = node;
    nameRef(node);
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  }, [ref, nameRef]);
  const [, rerender] = React.useState(0);
  useFormReset(input, () => {
    setLead(null);
    if (props.value === void 0) {
      const d = parsePhone(props.defaultValue ?? "", props.defaultCountry, table);
      setNational(d ? d.national : "");
      typed.current = d ? d.national : "";
      if (props.country === void 0) setOwnCountry(d ? d.country.code : fallback.code);
      reported.current = d ? toE164(d.national, d.country) : "";
    }
    rerender((n) => n + 1);
    setTimeout(() => rerender((n) => n + 1), 0);
  });
  const select = React.useRef(null);
  React.useLayoutEffect(function() {
    if (select.current && select.current.value !== country.code) select.current.value = country.code;
  });
  const caret = React.useRef(null);
  const text = lead != null && !shown ? lead : formatNational(shown, country);
  React.useLayoutEffect(function() {
    if (caret.current == null || !input.current || activeIn(input.current) !== input.current) return;
    input.current.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });
  const commit = function(digits, c, picked) {
    digits = digits.slice(0, c.max);
    setLead(null);
    if (!picked) typed.current = digits;
    setNational(digits);
    if (c.code !== country.code) {
      if (props.country === void 0) setOwnCountry(c.code);
      props.onCountryChange?.(c.code);
    }
    const e164 = toE164(digits, c);
    if (e164 !== reported.current || c.code !== country.code) {
      reported.current = e164;
      props.onValueChange?.(e164, { country: c.code, national: digits, complete: isPhoneComplete(digits, c) });
    }
    return digits;
  };
  const onChange = function(e) {
    const raw = latinDigits(e.target.value.normalize("NFKC")), at = e.target.selectionStart ?? raw.length;
    let before = raw.slice(0, at).replace(/\D/g, "").length;
    if (raw.trim() === "0") {
      commit("", country);
      setLead("0");
      caret.current = 1;
      return;
    }
    if (/^\s*(\+|00)/.test(raw)) {
      const p = parsePhone(raw, country.code, table);
      if (p) {
        const d2 = commit(p.national, p.country);
        caret.current = formatNational(d2, p.country).length;
        return;
      }
      const code = raw.trim();
      if (/^(\+|00)\d{0,3}$/.test(code)) {
        commit("", country);
        setLead(code);
        caret.current = code.length;
        return;
      }
      if (process.env.NODE_ENV !== "production" && raw.replace(/\D/g, "").length > 3) warnOnce("phone-code", `PhoneInput: "${raw.trim()}" starts with a calling code PhoneInput doesn't know, so its digits are read as a number in ${country.code}. Pass the country's row in countries.`);
    }
    const all = raw.replace(/\D/g, "");
    let digits = stripTrunk(all, country);
    if (digits.length > country.max && all.startsWith(country.dial)) digits = stripTrunk(all.slice(country.dial.length), country);
    if (digits.length < all.length) before = Math.max(0, before - (all.length - digits.length));
    const d = commit(digits, country);
    caret.current = caretAfter(formatNational(d, country), Math.min(before, d.length));
  };
  const onKeyDown = function(e) {
    props.onKeyDown?.(e);
    const el = e.currentTarget, s = el.selectionStart, end = el.selectionEnd;
    if (e.defaultPrevented || el.readOnly || e.altKey || e.ctrlKey || e.metaKey || s == null || s !== end || e.key !== "Backspace" && e.key !== "Delete") return;
    const back = e.key === "Backspace";
    let i = back ? s - 1 : s;
    if (i < 0 || i >= text.length || /\d/.test(text[i])) return;
    while (i >= 0 && i < text.length && !/\d/.test(text[i])) i += back ? -1 : 1;
    if (i < 0 || i >= text.length) return;
    e.preventDefault();
    const n = text.slice(0, i).replace(/\D/g, "").length;
    commit(shown.slice(0, n) + shown.slice(n + 1), country);
    caret.current = caretAfter(formatNational(shown.slice(0, n) + shown.slice(n + 1), country), n);
  };
  const onCountry = function(e) {
    const c = find(e.target.value);
    if (c) commit(typed.current, c, true);
  };
  const options = React.useMemo(() => list.map(({ c, name }) => /* @__PURE__ */ React.createElement("option", { key: (hydrated ? "" : "server-") + c.code, value: c.code, suppressHydrationWarning: true }, name + " (\u2066+" + c.dial + "\u2069)")), [list, hydrated]);
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      className: cn("dk-input dk-phone-input", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.className),
      style: props.style,
      "data-component": "phone-input",
      "data-size": size,
      onMouseDown: pressFocuses(input)
    },
    /* @__PURE__ */ React.createElement("span", { className: "dk-phone-input__country" }, /* @__PURE__ */ React.createElement("span", { className: "dk-phone-input__dial", "aria-hidden": true }, "+", country.dial), /* @__PURE__ */ React.createElement(Icon, { icon: icons.ExpandMore, className: "dk-phone-input__chevron" }), /* @__PURE__ */ React.createElement(
      "select",
      {
        ref: select,
        className: "dk-phone-input__select",
        value: country.code,
        onChange: onCountry,
        disabled: rest.disabled || rest.readOnly,
        "aria-label": props.countryLabel || sds.labels.country
      },
      options
    )),
    /* @__PURE__ */ React.createElement("input", { autoComplete: "tel-national", ...rest, ref: setRef, type: "tel", inputMode: "tel", className: "dk-input__field", value: text, onChange, onKeyDown }),
    props.name ? /* @__PURE__ */ React.createElement("input", { type: "hidden", name: props.name, form: props.form, value: toE164(shown, country), disabled: rest.disabled }) : null
  );
});
export {
  PhoneInput
};
//# sourceMappingURL=PhoneInput.js.map
