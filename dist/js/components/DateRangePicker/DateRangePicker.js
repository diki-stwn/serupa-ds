"use client";

// src/components/DateRangePicker/DateRangePicker.tsx
import * as React from "react";
import { cn, domId, isInvalid, oneOf, SIZES } from "../../internal/cn.js";
import { addMonths, compare, datePattern, formatDate, isoDate, parseDate, sameDay, startOfMonth, toDay } from "../../internal/dates.js";
import { reject } from "../../internal/rejectInput.js";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer.js";
import { useExit } from "../../internal/useExit.js";
import { Calendar } from "../Calendar/Calendar.js";
import { Icon } from "../Icon/Icon.js";
import { component } from "../../internal/component.js";
import { useFieldControl } from "../../internal/field.js";
import { useLocale, useSettings } from "../../internal/provider.js";
import { useFormReset } from "../../internal/useFormReset.js";
import * as icons from "../../material/builtin.js";
import { isComposing } from "../../internal/ime.js";
import { delegateFocus, useAutoFocus, windowBlur } from "../../internal/focus.js";
import { en as DateRangePickerWords } from "./labels.js";
import { en as DatePickerWords } from "../DatePicker/labels.js";
var words = /* @__PURE__ */ Object.assign({}, DateRangePickerWords, DatePickerWords);
var norm = (r) => ({ start: r ? toDay(r.start, "DateRangePicker") : null, end: r ? toDay(r.end, "DateRangePicker") : null });
var key = (d) => d ? d.getTime() : null;
var DateRangePicker = /* @__PURE__ */ component("DateRangePicker", function DateRangePicker2(props, ref) {
  props = useFieldControl(props);
  const sds = useSettings(words);
  const { value: _v, defaultValue: _d, onValueChange, onInvalidInput, min: minIn, max: maxIn, isDateDisabled, locale: localeProp, weekStartsOn, size: _s, invalid: _i, disabled, readOnly, required: requiredProp, id, startLabel, endLabel, startName, endName, form, buttonLabel, months: _m, autoFocus, className, ...rest } = props;
  const locale = useLocale(localeProp);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  const describedBy = rest["aria-describedby"], required = rest["aria-required"] ?? (requiredProp || void 0);
  const errorMessage = rest["aria-errormessage"];
  delete rest["aria-describedby"];
  delete rest["aria-required"];
  delete rest["aria-errormessage"];
  const controlled = props.value !== void 0;
  const [own, setOwn] = React.useState(norm(props.defaultValue));
  const value = controlled ? norm(props.value) : own;
  const min = toDay(minIn, "DateRangePicker") || void 0, max = toDay(maxIn, "DateRangePicker") || void 0;
  const fmt = (d) => d ? formatDate(d, locale) : "";
  const [text, setText] = React.useState({ start: fmt(value.start), end: fmt(value.end) });
  const shown = React.useRef({ start: key(value.start), end: key(value.end) });
  const shownLocale = React.useRef(locale);
  if (key(value.start) !== shown.current.start || key(value.end) !== shown.current.end || locale !== shownLocale.current) {
    shown.current = { start: key(value.start), end: key(value.end) };
    shownLocale.current = locale;
    const t = { start: fmt(value.start), end: fmt(value.end) };
    if (t.start !== text.start || t.end !== text.end) setText(t);
  }
  const [open, setOpen] = React.useState(false);
  const [picking, setPicking] = React.useState("start");
  const [hover, setHover] = React.useState(null);
  const home = () => {
    const t = /* @__PURE__ */ new Date();
    return min && compare(t, min) < 0 ? min : max && compare(t, max) > 0 ? max : t;
  };
  const [base, setBase] = React.useState(() => startOfMonth(value.start || home()));
  const popId = domId("dk-drp", React.useId());
  const box = React.useRef(null);
  const startField = React.useRef(null);
  const start = () => startField.current;
  useAutoFocus(autoFocus, start);
  useFormReset(startField, () => {
    if (controlled) return;
    const r = norm(props.defaultValue);
    shown.current = { start: key(r.start), end: key(r.end) };
    setOwn(r);
    setText({ start: fmt(r.start), end: fmt(r.end) });
    setOpen(false);
    setPicking("start");
  });
  const button = React.useRef(null);
  const panel = React.useRef(null);
  const two = props.months !== 1;
  const allowed = (d) => !(min && compare(d, min) < 0) && !(max && compare(d, max) > 0) && !(isDateDisabled && isDateDisabled(d));
  const commit = (r) => {
    shown.current = { start: key(r.start), end: key(r.end) };
    setText({ start: fmt(r.start), end: fmt(r.end) });
    if (key(r.start) === key(value.start) && key(r.end) === key(value.end)) return;
    if (!controlled) setOwn(r);
    if (onValueChange) onValueChange(r, { start: r.start ? isoDate(r.start) : null, end: r.end ? isoDate(r.end) : null });
  };
  const read = (which) => {
    const raw = text[which].trim();
    let d = raw === "" ? null : parseDate(raw, locale);
    if (raw !== "" && !(d && allowed(d))) {
      reject(raw, d ? "unavailable" : "unreadable", onInvalidInput, sds.labels.inputNotAccepted);
      d = value[which];
    }
    const r = { ...value, [which]: d };
    if (r.start && r.end && compare(r.start, r.end) > 0) {
      if (which === "start") r.end = null;
      else {
        reject(raw, "unavailable", onInvalidInput, sds.labels.inputNotAccepted);
        r.end = value.end;
      }
    }
    commit(r);
  };
  const close = (focus) => {
    setOpen(false);
    setHover(null);
    if (focus && startField.current) startField.current.focus();
  };
  const show = () => {
    const typed = parseDate(text.start, locale);
    setBase(startOfMonth((typed && allowed(typed) ? typed : null) || value.start || home()));
    setPicking(value.start && !value.end ? "end" : "start");
    setOpen(true);
  };
  const exit = useExit(open, panel);
  useAnchoredLayer(open, panel, box, { placement: "bottom-start", offsetVar: "--dk-drp-offset", onOutside: () => close(false), onFocusOutside: () => close(false), inside: button });
  const pick = (d) => {
    if (picking === "start" || !value.start || compare(d, value.start) < 0) {
      commit({ start: d, end: null });
      setPicking("end");
      return;
    }
    commit({ start: value.start, end: d });
    close(true);
  };
  const to = picking === "end" && value.start && !value.end && hover && compare(hover, value.start) > 0 ? hover : value.end;
  const dayClass = (d) => {
    const s = value.start;
    if (!s || !to) return void 0;
    if (compare(d, s) > 0 && compare(d, to) < 0) return "dk-calendar__day--in-range";
    return void 0;
  };
  const isSel = (d) => sameDay(d, value.start) || sameDay(d, value.end);
  const off = !!disabled || !!readOnly;
  const field = (which) => /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      inputMode: "numeric",
      autoComplete: "off",
      className: "dk-input__field dk-date-range-picker__field",
      ref: which === "start" ? startField : void 0,
      id: which === "start" ? id : void 0,
      "aria-label": which === "start" ? startLabel || sds.labels.startDate : endLabel || sds.labels.endDate,
      "aria-describedby": cn(describedBy, popId + "-format"),
      "aria-errormessage": invalid ? errorMessage : void 0,
      "aria-required": required,
      "aria-invalid": invalid || void 0,
      value: text[which],
      placeholder: datePattern(locale),
      disabled,
      readOnly,
      required: requiredProp,
      form,
      onChange: (e) => setText({ ...text, [which]: e.target.value }),
      onBlur: (e) => {
        if (!windowBlur(e)) read(which);
      },
      onKeyDown: (e) => {
        if (isComposing(e)) return;
        if (e.key === "Enter") read(which);
        else if (e.key === "ArrowDown" && e.altKey && !off) {
          e.preventDefault();
          read(which);
          show();
        }
      }
    }
  );
  const cal = (m, first) => /* @__PURE__ */ React.createElement(
    Calendar,
    {
      month: m,
      onMonthChange: (n) => setBase(first ? n : addMonths(n, -1)),
      value: first ? value.start : value.end,
      min,
      max,
      isDateDisabled,
      locale,
      weekStartsOn,
      autoFocus: first,
      hideOutside: two,
      isDateSelected: isSel,
      dayClassName: dayClass,
      onDayHover: setHover,
      onValueChange: pick
    }
  );
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      ...rest,
      ref: (n) => {
        box.current = n;
        delegateFocus(n, start);
        if (typeof ref === "function") ref(n);
        else if (ref) ref.current = n;
      },
      role: "group",
      className: cn("dk-input", "dk-input--size-" + size, "dk-date-range-picker", invalid && "dk-input--invalid", disabled && "dk-input--disabled", readOnly && "dk-input--readonly", className),
      "data-component": "date-range-picker",
      "data-state": open ? "open" : "closed",
      "data-size": size
    },
    field("start"),
    /* @__PURE__ */ React.createElement("span", { className: "dk-date-range-picker__dash", "aria-hidden": true }, "\u2013"),
    /* @__PURE__ */ React.createElement("span", { id: popId + "-format", hidden: true }, sds.labels.formatHint(datePattern(locale))),
    field("end"),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        ref: button,
        type: "button",
        className: "dk-date-picker__button dk-date-range-picker__button",
        "aria-label": buttonLabel || sds.labels.chooseDates,
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        "aria-controls": open ? popId : void 0,
        disabled: off,
        onClick: () => {
          if (open) close(false);
          else {
            read("start");
            show();
          }
        }
      },
      /* @__PURE__ */ React.createElement(Icon, { icon: icons.DateRange })
    ),
    startName ? /* @__PURE__ */ React.createElement("input", { type: "hidden", name: startName, form, value: value.start ? isoDate(value.start) : "", disabled }) : null,
    endName ? /* @__PURE__ */ React.createElement("input", { type: "hidden", name: endName, form, value: value.end ? isoDate(value.end) : "", disabled }) : null,
    /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: panel,
        id: popId,
        role: "dialog",
        "aria-label": buttonLabel || sds.labels.chooseDates,
        ...{ popover: "manual" },
        hidden: !open || void 0,
        inert: !open || void 0,
        "data-instant": exit.instant ? "" : void 0,
        className: "dk-date-picker__popup dk-date-range-picker__popup",
        onKeyDown: (e) => {
          if (e.key === "Escape" && !isComposing(e)) {
            e.preventDefault();
            e.stopPropagation();
            close(true);
          }
        },
        onMouseLeave: () => setHover(null)
      },
      open || exit.leaving ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "dk-date-range-picker__months" }, cal(base, true), two ? cal(addMonths(base, 1), false) : null), /* @__PURE__ */ React.createElement("p", { className: "dk-date-range-picker__status", "aria-live": "polite" }, picking === "start" ? sds.labels.chooseStartDate : sds.labels.chooseEndDate)) : null
    )
  );
});
export {
  DateRangePicker
};
//# sourceMappingURL=DateRangePicker.js.map
