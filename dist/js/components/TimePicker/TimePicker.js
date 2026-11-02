"use client";

// src/components/TimePicker/TimePicker.tsx
import * as React from "react";
import { pressFocuses } from "../../internal/affix.js";
import { cn, domId, isInvalid, oneOf, setRef, SIZES, useIsoLayoutEffect } from "../../internal/cn.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { formatTime, parseTime, timePattern, toHHmm, toMinutes, uses12h } from "../../internal/times.js";
import { reject } from "../../internal/rejectInput.js";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer.js";
import { useExit } from "../../internal/useExit.js";
import { Icon } from "../Icon/Icon.js";
import { component } from "../../internal/component.js";
import { useFieldControl } from "../../internal/field.js";
import { useLocale, useOwnLang, useSettings } from "../../internal/provider.js";
import { useFormReset } from "../../internal/useFormReset.js";
import * as icons from "../../material/builtin.js";
import { isComposing } from "../../internal/ime.js";
import { en as TimePickerWords } from "./labels.js";
import { en as DatePickerWords } from "../DatePicker/labels.js";
import { windowBlur } from "../../internal/focus.js";
var words = /* @__PURE__ */ Object.assign({}, TimePickerWords, DatePickerWords);
var TimePicker = /* @__PURE__ */ component("TimePicker", function TimePicker2(props, ref) {
  const nameRef = useNameCheck("TimePicker", NAME_HOW.field);
  props = useFieldControl(props);
  const sds = useSettings(words);
  const { value: _v, defaultValue: _d, onValueChange, onInvalidInput, min, max, step: _st, locale: localeProp, hour12: _h, size: _s, invalid: _i, listLabel, className, style, name, placeholder, disabled, readOnly, onBlur, onKeyDown, ...rest } = props;
  const locale = useLocale(localeProp), lang = useOwnLang(localeProp);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  const h12 = props.hour12 ?? uses12h(locale);
  const step = props.step && Math.round(props.step) >= 1 ? Math.round(props.step) : 30;
  const lo = toMinutes(min) ?? 0, hi = toMinutes(max) ?? 24 * 60 - 1;
  const controlled = props.value !== void 0;
  const [own, setOwn] = React.useState(toMinutes(props.defaultValue));
  const value = controlled ? toMinutes(props.value) : own;
  const fmt = (n) => n == null ? "" : formatTime(n, locale, h12);
  const [text, setText] = React.useState(fmt(value));
  const shown = React.useRef(value);
  const shownFmt = React.useRef(locale + "|" + h12);
  if (value !== shown.current || shownFmt.current !== locale + "|" + h12) {
    shown.current = value;
    shownFmt.current = locale + "|" + h12;
    if (fmt(value) !== text) setText(fmt(value));
  }
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const id = domId("dk-tp", React.useId());
  const box = React.useRef(null);
  const field = React.useRef(null);
  useFormReset(field, () => {
    if (controlled) return;
    const n = toMinutes(props.defaultValue);
    shown.current = n;
    setOwn(n);
    setText(fmt(n));
    setOpen(false);
  });
  const list = React.useRef(null);
  const typed = React.useRef(false);
  const times = React.useMemo(() => {
    const out = [];
    for (let n = lo; n <= hi; n += step) out.push(n);
    return out;
  }, [lo, hi, step]);
  const nearest = (n) => {
    if (n == null || !times.length) return 0;
    let best = 0;
    times.forEach((x, i) => {
      if (Math.abs(x - n) < Math.abs(times[best] - n)) best = i;
    });
    return best;
  };
  const commit = (n) => {
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
  const show = () => {
    if (disabled || readOnly || !times.length) return;
    const n = parseTime(text, locale);
    setActive(nearest(n != null ? n : value));
    typed.current = false;
    setOpen(true);
  };
  useIsoLayoutEffect(() => {
    if (open && list.current && box.current) list.current.style.minWidth = box.current.offsetWidth + "px";
  }, [open]);
  const exit = useExit(open, list);
  useAnchoredLayer(open, list, box, { placement: "bottom-start", offsetVar: "--dk-tp-offset", onOutside: () => setOpen(false), inside: box });
  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (!open) {
      wasOpen.current = false;
      return;
    }
    const opening = !wasOpen.current;
    wasOpen.current = true;
    const l = list.current, o = l ? l.children[active] : void 0;
    if (!l || !o) return;
    if (opening) l.scrollTop = Math.max(0, o.offsetTop - o.offsetHeight);
    else if (o.offsetTop < l.scrollTop) l.scrollTop = o.offsetTop;
    else if (o.offsetTop + o.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = o.offsetTop + o.offsetHeight - l.clientHeight;
  }, [open, active]);
  const pick = (n) => {
    commit(n);
    setOpen(false);
    if (field.current) field.current.focus();
  };
  const keys = (e) => {
    if (onKeyDown) onKeyDown(e);
    if (e.defaultPrevented || isComposing(e)) return;
    if ((e.ctrlKey || e.metaKey) && /^(Arrow|Page)/.test(e.key)) return;
    const last = times.length - 1, page = 4;
    const move = (i) => {
      e.preventDefault();
      typed.current = false;
      setActive(i);
    };
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        show();
      } else if (e.key === "Enter") read();
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        move(Math.min(last, active + 1));
        break;
      case "ArrowUp":
        move(Math.max(0, active - 1));
        break;
      case "PageDown":
        move(Math.min(last, active + page));
        break;
      case "PageUp":
        move(Math.max(0, active - page));
        break;
      case "Home":
        if (e.altKey || e.ctrlKey) move(0);
        break;
      case "End":
        if (e.altKey || e.ctrlKey) move(last);
        break;
      case "Enter":
        e.preventDefault();
        if (typed.current) {
          read();
          setOpen(false);
        } else pick(times[active]);
        break;
      // what was typed wins over the highlight
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };
  const label = listLabel || sds.labels.chooseTime;
  return /* @__PURE__ */ React.createElement("span", { ref: box, className: cn("dk-input", "dk-input--size-" + size, "dk-time-picker", invalid && "dk-input--invalid", disabled && "dk-input--disabled", readOnly && "dk-input--readonly", className), style, "data-component": "time-picker", "data-state": open ? "open" : "closed", "data-size": size, onMouseDown: pressFocuses(field) }, /* @__PURE__ */ React.createElement(
    "input",
    {
      ...rest,
      ref: (n) => {
        field.current = n;
        nameRef(n);
        setRef(ref, n);
      },
      lang: rest.lang ?? lang,
      type: "text",
      role: "combobox",
      autoComplete: rest.autoComplete || "off",
      spellCheck: rest.spellCheck ?? false,
      autoCorrect: rest.autoCorrect ?? "off",
      autoCapitalize: rest.autoCapitalize ?? "off",
      className: "dk-input__field",
      value: text,
      disabled,
      readOnly,
      placeholder: placeholder != null ? placeholder : timePattern(locale, h12),
      "aria-invalid": invalid || void 0,
      "aria-describedby": cn(rest["aria-describedby"], id + "-format"),
      "aria-expanded": open,
      "aria-controls": id,
      "aria-autocomplete": "none",
      "aria-haspopup": "listbox",
      "aria-activedescendant": open ? `${id}-${active}` : void 0,
      onChange: (e) => {
        setText(e.target.value);
        if (open) {
          typed.current = true;
          const n = parseTime(e.target.value, locale);
          if (n != null) setActive(nearest(n));
        }
      },
      onBlur: (e) => {
        if (!windowBlur(e)) read();
        if (onBlur) onBlur(e);
      },
      onKeyDown: keys
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      tabIndex: -1,
      className: "dk-time-picker__button",
      "aria-label": label,
      "aria-controls": id,
      "aria-expanded": open,
      disabled: !!disabled || !!readOnly,
      onMouseDown: (e) => e.preventDefault(),
      onClick: () => {
        if (open) setOpen(false);
        else show();
        if (field.current) field.current.focus();
      }
    },
    /* @__PURE__ */ React.createElement(Icon, { icon: icons.Schedule })
  ), /* @__PURE__ */ React.createElement("span", { id: id + "-format", hidden: true }, sds.labels.formatHint(timePattern(locale, h12))), name ? /* @__PURE__ */ React.createElement("input", { type: "hidden", name, form: rest.form, value: value == null ? "" : toHHmm(value), disabled }) : null, /* @__PURE__ */ React.createElement("ul", { ref: list, id, role: "listbox", "aria-label": label, ...{ popover: "manual" }, hidden: !open || void 0, inert: !open || void 0, "data-instant": exit.instant ? "" : void 0, className: "dk-time-picker__list" }, open || exit.leaving ? times.map((n, i) => /* @__PURE__ */ React.createElement(
    "li",
    {
      key: n,
      id: `${id}-${i}`,
      lang,
      role: "option",
      "aria-selected": n === value,
      "data-value": toHHmm(n),
      className: cn("dk-time-picker__option", i === active && "dk-time-picker__option--active", n === value && "dk-time-picker__option--selected"),
      onMouseDown: (e) => e.preventDefault(),
      onMouseMove: () => {
        if (i !== active) {
          typed.current = false;
          setActive(i);
        }
      },
      onClick: () => pick(n)
    },
    /* @__PURE__ */ React.createElement("span", { className: "dk-time-picker__time" }, fmt(n)),
    n === value ? /* @__PURE__ */ React.createElement(Icon, { icon: icons.Check, className: "dk-time-picker__check" }) : null
  )) : null));
});
export {
  TimePicker
};
//# sourceMappingURL=TimePicker.js.map
