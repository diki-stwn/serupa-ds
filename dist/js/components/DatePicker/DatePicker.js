"use client";

// src/components/DatePicker/DatePicker.tsx
import * as React from "react";
import { pressFocuses } from "../../internal/affix.js";
import { cn, domId, isInvalid, oneOf, SIZES } from "../../internal/cn.js";
import { compare, datePattern, formatDate, isoDate, parseDate, toDay } from "../../internal/dates.js";
import { reject } from "../../internal/rejectInput.js";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer.js";
import { useExit } from "../../internal/useExit.js";
import { Calendar } from "../Calendar/Calendar.js";
import { Icon } from "../Icon/Icon.js";
import { component } from "../../internal/component.js";
import { useFieldControl } from "../../internal/field.js";
import { useLocale, useOwnLang, useSettings } from "../../internal/provider.js";
import { useFormReset } from "../../internal/useFormReset.js";
import * as icons from "../../material/builtin.js";
import { isComposing } from "../../internal/ime.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { en as words } from "./labels.js";
import { windowBlur } from "../../internal/focus.js";
var DatePicker = /* @__PURE__ */ component("DatePicker", function DatePicker2(props, ref) {
  const nameRef = useNameCheck("DatePicker", NAME_HOW.field);
  props = useFieldControl(props);
  const sds = useSettings(words);
  const { value: _v, defaultValue: _d, onValueChange, onInvalidInput, min: minIn, max: maxIn, isDateDisabled, locale: localeProp, weekStartsOn, size: _s, invalid: _i, buttonLabel, className, style, name, placeholder, disabled, readOnly, onBlur, onKeyDown, ...rest } = props;
  const locale = useLocale(localeProp), lang = useOwnLang(localeProp);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  const controlled = props.value !== void 0;
  const [own, setOwn] = React.useState(() => toDay(props.defaultValue, "DatePicker"));
  const value = controlled ? toDay(props.value, "DatePicker") : own;
  const min = toDay(minIn, "DatePicker") || void 0, max = toDay(maxIn, "DatePicker") || void 0;
  const [text, setText] = React.useState(value ? formatDate(value, locale) : "");
  const [open, setOpen] = React.useState(false);
  const id = domId("dk-dp", React.useId());
  const field = React.useRef(null);
  const button = React.useRef(null);
  const box = React.useRef(null);
  const panel = React.useRef(null);
  const shown = React.useRef(value ? value.getTime() : null);
  useFormReset(field, () => {
    if (controlled) return;
    const d = toDay(props.defaultValue);
    shown.current = d ? d.getTime() : null;
    setOwn(d);
    setText(d ? formatDate(d, locale) : "");
    setOpen(false);
  });
  const shownLocale = React.useRef(locale);
  if ((value ? value.getTime() : null) !== shown.current || locale !== shownLocale.current) {
    shown.current = value ? value.getTime() : null;
    shownLocale.current = locale;
    const t = value ? formatDate(value, locale) : "";
    if (t !== text) setText(t);
  }
  const allowed = (d) => !(min && compare(d, min) < 0) && !(max && compare(d, max) > 0) && !(isDateDisabled && isDateDisabled(d));
  const commit = (d) => {
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
  const close = (focusField) => {
    setOpen(false);
    if (focusField && field.current) field.current.focus();
  };
  const exit = useExit(open, panel);
  useAnchoredLayer(open, panel, box, { placement: "bottom-start", offsetVar: "--dk-dp-offset", onOutside: () => close(false), onFocusOutside: () => close(false), inside: button });
  const typed = parseDate(text, locale);
  const off = !!disabled || !!readOnly;
  return /* @__PURE__ */ React.createElement("span", { ref: box, className: cn("dk-input", "dk-input--size-" + size, "dk-date-picker", invalid && "dk-input--invalid", disabled && "dk-input--disabled", readOnly && "dk-input--readonly", className), style, "data-component": "date-picker", "data-state": open ? "open" : "closed", "data-size": size, onMouseDown: pressFocuses(field) }, /* @__PURE__ */ React.createElement(
    "input",
    {
      ...rest,
      ref: (n) => {
        field.current = n;
        nameRef(n);
        if (typeof ref === "function") ref(n);
        else if (ref) ref.current = n;
      },
      lang: rest.lang ?? lang,
      type: "text",
      inputMode: "numeric",
      autoComplete: rest.autoComplete || "off",
      className: "dk-input__field",
      value: text,
      disabled,
      readOnly,
      placeholder: placeholder != null ? placeholder : datePattern(locale),
      "aria-invalid": invalid || void 0,
      "aria-describedby": cn(rest["aria-describedby"], id + "-format"),
      onChange: (e) => setText(e.target.value),
      onBlur: (e) => {
        if (!windowBlur(e)) read();
        if (onBlur) onBlur(e);
      },
      onKeyDown: (e) => {
        if (onKeyDown) onKeyDown(e);
        if (e.defaultPrevented || isComposing(e)) return;
        if (e.key === "Enter") read();
        else if (e.key === "ArrowDown" && e.altKey && !off) {
          e.preventDefault();
          read();
          setOpen(true);
        }
      }
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      ref: button,
      type: "button",
      className: "dk-date-picker__button",
      "aria-label": buttonLabel || sds.labels.chooseDate,
      "aria-haspopup": "dialog",
      "aria-expanded": open,
      "aria-controls": open ? id : void 0,
      disabled: off,
      onClick: () => {
        if (!open) read();
        setOpen(!open);
      }
    },
    /* @__PURE__ */ React.createElement(Icon, { icon: icons.CalendarToday })
  ), /* @__PURE__ */ React.createElement("span", { id: id + "-format", hidden: true }, sds.labels.formatHint(datePattern(locale))), name ? /* @__PURE__ */ React.createElement("input", { type: "hidden", name, form: rest.form, value: value ? isoDate(value) : "", disabled }) : null, /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: panel,
      id,
      role: "dialog",
      "aria-label": buttonLabel || sds.labels.chooseDate,
      ...{ popover: "manual" },
      hidden: !open || void 0,
      inert: !open || void 0,
      "data-instant": exit.instant ? "" : void 0,
      className: "dk-date-picker__popup",
      onKeyDown: (e) => {
        if (e.key === "Escape" && !isComposing(e)) {
          e.preventDefault();
          e.stopPropagation();
          close(true);
        }
      }
    },
    open || exit.leaving ? /* @__PURE__ */ React.createElement(
      Calendar,
      {
        value,
        defaultMonth: (typed && allowed(typed) ? typed : null) || value || void 0,
        min,
        max,
        isDateDisabled,
        locale,
        weekStartsOn,
        autoFocus: true,
        onValueChange: (d) => {
          commit(d);
          close(true);
        }
      }
    ) : null
  ));
});
export {
  DatePicker
};
//# sourceMappingURL=DatePicker.js.map
