"use client";

// src/components/NumberInput/NumberInput.tsx
import * as React from "react";
import { cn, domId, isInvalid, omit, oneOf, SIZES } from "../../internal/cn.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { pressFocuses, useAffixes } from "../../internal/affix.js";
import { Icon } from "../Icon/Icon.js";
import { asIcon } from "../Icon/asIcon.js";
import { component } from "../../internal/component.js";
import { useFieldControl } from "../../internal/field.js";
import { isComposing } from "../../internal/ime.js";
import { formatNumber, parseNumber } from "../../internal/numbers.js";
import { gridPlaces, roundTo } from "../../internal/step.js";
import { useLocale, useOwnLang, useSettings } from "../../internal/provider.js";
import { minorDigits, pinCurrencyDigits } from "../../internal/currency.js";
import { useFormReset } from "../../internal/useFormReset.js";
import { reject } from "../../internal/rejectInput.js";
import * as icons from "../../material/builtin.js";
import { en as NumberInputWords } from "./labels.js";
import { en as DatePickerWords } from "../DatePicker/labels.js";
import { windowBlur } from "../../internal/focus.js";
import { holdDelay, holdRepeat } from "../../internal/timing.js";
var words = /* @__PURE__ */ Object.assign({}, NumberInputWords, DatePickerWords);
var keyed = (key) => key ? JSON.parse(key) : void 0;
var NumberInput = /* @__PURE__ */ component("NumberInput", function NumberInput2(props, ref) {
  const nameRef = useNameCheck("NumberInput", NAME_HOW.field);
  props = useFieldControl(props);
  const sds = useSettings(words);
  const rest = omit(props, { size: 1, invalid: 1, leftIcon: 1, prefix: 1, suffix: 1, className: 1, style: 1, value: 1, defaultValue: 1, onValueChange: 1, onInvalidInput: 1, min: 1, max: 1, step: 1, largeStep: 1, steppers: 1, decrementLabel: 1, incrementLabel: 1, locale: 1, formatOptions: 1, numberingSystem: 1, currency: 1, minorUnits: 1 });
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  const locale = useLocale(props.locale), lang = useOwnLang(props.locale);
  const given = props.currency ? { style: "currency", currency: props.currency, ...props.formatOptions } : props.formatOptions;
  const formatOptions = given && pinCurrencyDigits(given);
  const factor = props.minorUnits && formatOptions?.style === "currency" && formatOptions.currency ? 10 ** minorDigits(formatOptions.currency) : 1;
  const major = (n) => n == null || factor === 1 ? n : n / factor;
  const step = Number(props.step) > 0 ? Number(props.step) / factor : 1;
  const large = Number(props.largeStep) > 0 ? Number(props.largeStep) : 10;
  const min = props.min != null && isFinite(props.min) ? major(props.min) : void 0;
  const max = props.max != null && isFinite(props.max) ? major(props.max) : void 0;
  const optionsKey = formatOptions ? JSON.stringify(formatOptions) : "";
  const shownPlaces = React.useMemo(
    () => {
      const o = keyed(optionsKey);
      return o?.style === "currency" ? new Intl.NumberFormat(locale, o).resolvedOptions().maximumFractionDigits ?? 0 : 0;
    },
    [locale, optionsKey]
  );
  const places = Math.max(gridPlaces(min, step), shownPlaces);
  const scale = React.useMemo(
    () => {
      const o = keyed(optionsKey);
      return o ? parseNumber(formatNumber(1, locale, o), locale) || 1 : 1;
    },
    [locale, optionsKey]
  );
  const digits = props.numberingSystem || formatOptions?.numberingSystem;
  const shownOptions = React.useMemo(() => ({
    ...keyed(optionsKey) || { useGrouping: false, maximumFractionDigits: 20 },
    numberingSystem: digits || new Intl.NumberFormat(locale).resolvedOptions().numberingSystem
  }), [locale, optionsKey, digits]);
  const show = (v) => v == null ? "" : formatNumber(v, locale, shownOptions);
  const asShown = (v) => {
    if (v == null || !formatOptions) return v ?? null;
    const n = parseNumber(show(v), locale);
    return typeof n === "number" ? n / scale : v;
  };
  const controlled = props.value !== void 0;
  const [ownValue, setOwnValue] = React.useState(() => asShown(major(props.defaultValue)));
  const value = controlled ? asShown(major(props.value)) : ownValue;
  const shown = show(value);
  const [text, setText] = React.useState(shown);
  const typing = React.useRef(false);
  const [synced, resync] = React.useState(0);
  React.useEffect(() => {
    if (!typing.current) setText(shown);
  }, [shown, synced]);
  const el = React.useRef(null);
  const name = rest.name;
  delete rest.name;
  const raw = React.useRef(null);
  const [, rerender] = React.useState(0);
  useFormReset(name ? raw : el, () => {
    typing.current = false;
    const v = controlled ? value : asShown(major(props.defaultValue));
    if (!controlled) setOwnValue(v);
    setText(show(v));
    rerender((n) => n + 1);
  });
  const locked = !!rest.disabled || !!rest.readOnly;
  const fit = (v) => {
    let n = roundTo(v, places);
    if (min !== void 0 && n < min) n = min;
    if (max !== void 0 && n > max) n = max;
    return n;
  };
  const parse = (s) => {
    const n = parseNumber(s, locale);
    return n != null && scale !== 1 ? n / scale : n;
  };
  const commit = (v) => {
    if (!controlled) setOwnValue(v);
    if (v !== value && props.onValueChange) props.onValueChange(v == null || factor === 1 ? v : Math.round(v * factor));
  };
  const put = (v) => {
    typing.current = false;
    setText(show(v));
    commit(v);
    resync((n) => n + 1);
  };
  const nudge = (by) => {
    if (locked) return;
    const base = parse(text);
    const from = typeof base === "number" ? base : value ?? (min !== void 0 && min > 0 ? min - step : max !== void 0 && max < 0 ? max + step : 0);
    const origin = min ?? 0, k = roundTo((from - origin) / step, 9);
    const onGrid = Number.isInteger(k) || places > gridPlaces(min, step);
    const to = onGrid ? k + by : by > 0 ? Math.floor(k) + by : Math.ceil(k) + by;
    put(fit(origin + to * step));
  };
  const onChange = (e) => {
    setText(e.target.value);
    typing.current = true;
    const n = parse(e.target.value);
    if (n === null || n !== void 0 && (min === void 0 || n >= min) && (max === void 0 || n <= max)) commit(n);
    if (rest.onChange) rest.onChange(e);
  };
  const outside = (n) => min !== void 0 && n < min || max !== void 0 && n > max;
  const onBlur = (e) => {
    if (windowBlur(e)) {
      if (rest.onBlur) rest.onBlur(e);
      return;
    }
    const n = parse(text), typed = typing.current;
    const v = n == null ? null : fit(n === void 0 ? value ?? 0 : n);
    const out = n === void 0 ? value : v;
    put(out);
    if (n === void 0 && typed) reject(text, "unreadable", props.onInvalidInput, sds.labels.inputNotAccepted);
    else if (n != null && outside(n) && props.onInvalidInput) props.onInvalidInput(text.trim(), "range");
    if (rest.onBlur) rest.onBlur(e);
  };
  const onKeyDown = (e) => {
    if (rest.onKeyDown) rest.onKeyDown(e);
    if (e.defaultPrevented || isComposing(e)) return;
    const k = e.key, big = e.shiftKey ? large : 1;
    if ((e.altKey || e.ctrlKey || e.metaKey) && k !== "Enter") return;
    if (k === "ArrowUp") nudge(big);
    else if (k === "ArrowDown") nudge(-big);
    else if (k === "PageUp") nudge(large);
    else if (k === "PageDown") nudge(-large);
    else if (k === "Home" && min !== void 0 && !locked) put(min);
    else if (k === "End" && max !== void 0 && !locked) put(max);
    else if (k === "Enter") {
      const n = parse(text);
      if (n != null) {
        put(fit(n));
        if (outside(n) && props.onInvalidInput) props.onInvalidInput(text.trim(), "range");
      }
      return;
    } else return;
    e.preventDefault();
  };
  const current = parse(text);
  const now = typeof current === "number" ? current : value;
  const left = asIcon(props.leftIcon);
  const affix = useAffixes(props.prefix, props.suffix, domId("dk-ni", React.useId()), el);
  const press = (by) => {
    nudge(by);
    if (el.current && document.activeElement !== el.current) el.current.focus({ preventScroll: true });
  };
  const latest = React.useRef(nudge);
  latest.current = nudge;
  const hold = React.useRef(null);
  const stop = React.useCallback(() => {
    const h = hold.current;
    if (h) {
      window.clearTimeout(h.timer);
      window.clearInterval(h.timer);
      h.timer = 0;
    }
  }, []);
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") stop();
    };
    const up = () => {
      stop();
      window.setTimeout(() => {
        hold.current = null;
      }, 0);
    };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", stop);
    window.addEventListener("keydown", onKey);
    return () => {
      stop();
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", stop);
      window.removeEventListener("blur", stop);
      window.removeEventListener("keydown", onKey);
    };
  }, [stop]);
  const atEnd = (by) => locked || (by < 0 ? min !== void 0 && now != null && now <= min : max !== void 0 && now != null && now >= max);
  React.useEffect(() => {
    const h = hold.current;
    if (h && h.timer && atEnd(h.by)) stop();
  });
  const stepper = (by) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      if (e.button !== 0) return;
      stop();
      press(by);
      const h = { by, timer: 0 };
      h.timer = window.setTimeout(() => {
        if (hold.current === h) h.timer = window.setInterval(() => latest.current(by), holdRepeat);
      }, holdDelay);
      hold.current = h;
    },
    onPointerLeave: stop,
    onContextMenu: (e) => {
      if (hold.current && hold.current.timer) e.preventDefault();
    },
    // a long touch
    onClick: () => {
      if (hold.current) hold.current = null;
      else press(by);
    }
  });
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      className: cn("dk-input dk-number-input", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.steppers !== false && "dk-number-input--steppers", props.className),
      style: props.style,
      "data-component": "number-input",
      "data-size": size,
      onMouseDown: pressFocuses(el)
    },
    left != null && left !== false ? /* @__PURE__ */ React.createElement("span", { className: "dk-input__icon dk-input__icon--left", "aria-hidden": true }, left) : null,
    affix.prefix,
    /* @__PURE__ */ React.createElement(
      "input",
      {
        ...rest,
        ref: (n) => {
          el.current = n;
          nameRef(n);
          if (typeof ref === "function") ref(n);
          else if (ref) ref.current = n;
        },
        lang: rest.lang ?? lang,
        type: "text",
        inputMode: rest.inputMode || (places > 0 || min !== void 0 && min < 0 || min === void 0 ? "decimal" : "numeric"),
        role: "spinbutton",
        "aria-valuenow": now ?? void 0,
        "aria-valuetext": formatOptions && now != null ? show(now) : void 0,
        "aria-valuemin": min,
        "aria-valuemax": max,
        autoComplete: rest.autoComplete || "off",
        className: "dk-input__field",
        value: text,
        "aria-describedby": cn(rest["aria-describedby"], affix.ids) || void 0,
        onChange,
        onBlur,
        onKeyDown,
        onFocus: rest.onFocus
      }
    ),
    affix.suffix,
    name ? /* @__PURE__ */ React.createElement("input", { type: "hidden", ref: raw, name, form: rest.form, disabled: rest.disabled, value: value == null ? "" : String(factor === 1 ? value : Math.round(value * factor)) }) : null,
    props.steppers !== false ? /* @__PURE__ */ React.createElement("span", { className: "dk-number-input__steppers" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        tabIndex: -1,
        className: "dk-number-input__step",
        "aria-label": props.decrementLabel || sds.labels.decrease,
        "aria-controls": rest.id,
        disabled: atEnd(-1),
        ...stepper(-1)
      },
      /* @__PURE__ */ React.createElement(Icon, { icon: icons.Remove })
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        tabIndex: -1,
        className: "dk-number-input__step",
        "aria-label": props.incrementLabel || sds.labels.increase,
        "aria-controls": rest.id,
        disabled: atEnd(1),
        ...stepper(1)
      },
      /* @__PURE__ */ React.createElement(Icon, { icon: icons.Add })
    )) : null
  );
});
export {
  NumberInput
};
//# sourceMappingURL=NumberInput.js.map
