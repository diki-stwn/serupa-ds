"use client";

// src/components/Calendar/Calendar.tsx
import * as React from "react";
import { cn, domId, omit } from "../../internal/cn.js";
import { addDays, addMonths, compare, day, firstDayOfWeek, isValid, sameDay, sameMonth, startOfMonth, startOfWeek } from "../../internal/dates.js";
import { Icon } from "../Icon/Icon.js";
import { IconButton } from "../IconButton/IconButton.js";
import { component } from "../../internal/component.js";
import { useLocale, useOwnLang, useSerupa } from "../../internal/provider.js";
import * as icons from "../../material/builtin.js";
var FORMATS = /* @__PURE__ */ new Map();
function formats(locale) {
  let f = FORMATS.get(locale);
  if (!f) {
    const greg = { calendar: "gregory", numberingSystem: "latn" };
    f = {
      title: new Intl.DateTimeFormat(locale, { ...greg, month: "long", year: "numeric" }),
      short: new Intl.DateTimeFormat(locale, { weekday: "short" }),
      long: new Intl.DateTimeFormat(locale, { weekday: "long" }),
      full: new Intl.DateTimeFormat(locale, { ...greg, weekday: "long", year: "numeric", month: "long", day: "numeric" })
    };
    FORMATS.set(locale, f);
  }
  return f;
}
var OWN = { value: 1, defaultValue: 1, onValueChange: 1, month: 1, defaultMonth: 1, onMonthChange: 1, min: 1, max: 1, isDateDisabled: 1, locale: 1, weekStartsOn: 1, autoFocus: 1, previousLabel: 1, nextLabel: 1, dayClassName: 1, isDateSelected: 1, onDayHover: 1, hideOutside: 1, className: 1 };
var Calendar = /* @__PURE__ */ component("Calendar", function Calendar2(props, ref) {
  const sds = useSerupa();
  const rest = omit(props, OWN);
  const locale = useLocale(props.locale), lang = useOwnLang(props.locale);
  const ws = props.weekStartsOn != null ? (Math.floor(props.weekStartsOn) % 7 + 7) % 7 : firstDayOfWeek(locale);
  const controlledValue = props.value !== void 0;
  const [ownValue, setOwnValue] = React.useState(isValid(props.defaultValue) ? day(props.defaultValue) : null);
  const value = controlledValue ? isValid(props.value) ? day(props.value) : null : ownValue;
  const today = day(/* @__PURE__ */ new Date());
  const controlledMonth = props.month !== void 0;
  const [ownMonth, setOwnMonth] = React.useState(() => startOfMonth(props.defaultMonth || value || today));
  const month = controlledMonth && isValid(props.month) ? startOfMonth(props.month) : ownMonth;
  const [focus, setFocus] = React.useState(() => value && sameMonth(value, month) ? value : sameMonth(today, month) ? today : month);
  const grid = React.useRef(null);
  const wantFocus = React.useRef(!!props.autoFocus);
  const disabled = (d) => props.min && compare(d, props.min) < 0 || props.max && compare(d, props.max) > 0 || (props.isDateDisabled ? props.isDateDisabled(d) : false);
  const showMonth = (m) => {
    const s = startOfMonth(m);
    if (!controlledMonth) setOwnMonth(s);
    if (props.onMonthChange) props.onMonthChange(s);
  };
  const monthTime = month.getTime();
  const [focusMonth, setFocusMonth] = React.useState(monthTime);
  if (focusMonth !== monthTime) {
    setFocusMonth(monthTime);
    if (!sameMonth(focus, month)) setFocus(value && sameMonth(value, month) ? value : sameMonth(today, month) ? today : month);
  }
  React.useEffect(() => {
    if (!wantFocus.current || !grid.current) return;
    wantFocus.current = false;
    const b = grid.current.querySelector('button[tabindex="0"]');
    if (b) b.focus();
  });
  const move = (d) => {
    setFocus(d);
    if (!sameMonth(d, month)) showMonth(d);
    wantFocus.current = true;
  };
  const pick = (d) => {
    if (disabled(d)) return;
    if (!controlledValue) setOwnValue(d);
    if (props.onValueChange) props.onValueChange(d);
    if (!sameMonth(d, month)) showMonth(d);
    setFocus(d);
  };
  const onKeyDown = (e) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    let n = null;
    switch (e.key) {
      case "ArrowLeft":
        n = addDays(focus, rtl ? 1 : -1);
        break;
      case "ArrowRight":
        n = addDays(focus, rtl ? -1 : 1);
        break;
      case "ArrowUp":
        n = addDays(focus, -7);
        break;
      case "ArrowDown":
        n = addDays(focus, 7);
        break;
      case "Home":
        n = startOfWeek(focus, ws);
        break;
      case "End":
        n = addDays(startOfWeek(focus, ws), 6);
        break;
      case "PageUp":
        n = addMonths(focus, e.shiftKey ? -12 : -1);
        break;
      case "PageDown":
        n = addMonths(focus, e.shiftKey ? 12 : 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        pick(focus);
        return;
      default:
        return;
    }
    e.preventDefault();
    if (props.min && compare(n, props.min) < 0) n = day(props.min);
    if (props.max && compare(n, props.max) > 0) n = day(props.max);
    move(n);
  };
  const first = startOfWeek(month, ws);
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let i = 0; i < 7; i++) row.push(addDays(first, w * 7 + i));
    weeks.push(row);
  }
  const { short, long, full } = formats(locale);
  const title = formats(locale).title.format(month);
  const titleId = domId("dk-cal", React.useId()) + "-title";
  const selected = (d) => props.isDateSelected ? props.isDateSelected(d) : sameDay(d, value);
  return /* @__PURE__ */ React.createElement("div", { ...rest, ref, className: cn("dk-calendar", props.className), "data-component": "calendar" }, /* @__PURE__ */ React.createElement("div", { className: "dk-calendar__header" }, /* @__PURE__ */ React.createElement(
    IconButton,
    {
      icon: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronLeft, className: "dk-calendar__ltr" }), /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronRight, className: "dk-calendar__rtl" })),
      className: "dk-calendar__nav dk-calendar__nav--prev",
      label: props.previousLabel || sds.labels.previousMonth,
      size: "sm",
      variant: "ghost",
      noTitle: true,
      disabled: !!props.min && compare(addDays(month, -1), props.min) < 0,
      onClick: () => showMonth(addMonths(month, -1))
    }
  ), /* @__PURE__ */ React.createElement("h2", { className: "dk-calendar__title", id: titleId, lang, "aria-live": "polite" }, title), /* @__PURE__ */ React.createElement(
    IconButton,
    {
      icon: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronRight, className: "dk-calendar__ltr" }), /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronLeft, className: "dk-calendar__rtl" })),
      className: "dk-calendar__nav dk-calendar__nav--next",
      label: props.nextLabel || sds.labels.nextMonth,
      size: "sm",
      variant: "ghost",
      noTitle: true,
      disabled: !!props.max && compare(addMonths(month, 1), props.max) > 0,
      onClick: () => showMonth(addMonths(month, 1))
    }
  )), /* @__PURE__ */ React.createElement("table", { ref: grid, lang, className: "dk-calendar__grid", role: "grid", "aria-labelledby": titleId, onKeyDown }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, weeks[0].map((d) => /* @__PURE__ */ React.createElement("th", { key: d.getDay(), scope: "col", abbr: long.format(d) }, /* @__PURE__ */ React.createElement("span", { "aria-hidden": true }, short.format(d)), /* @__PURE__ */ React.createElement("span", { className: "dk-visually-hidden" }, long.format(d)))))), /* @__PURE__ */ React.createElement("tbody", null, weeks.map((row, w) => /* @__PURE__ */ React.createElement("tr", { key: w }, row.map((d) => {
    const off = !!disabled(d), sel = selected(d), outside = !sameMonth(d, month);
    if (outside && props.hideOutside) return /* @__PURE__ */ React.createElement("td", { key: d.getTime(), role: "gridcell", className: "dk-calendar__blank" });
    return /* @__PURE__ */ React.createElement("td", { key: d.getTime(), "aria-selected": sel, role: "gridcell" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        tabIndex: sameDay(d, focus) ? 0 : -1,
        "aria-label": full.format(d),
        "aria-disabled": off || void 0,
        "aria-current": sameDay(d, today) ? "date" : void 0,
        className: cn("dk-calendar__day", outside && "dk-calendar__day--outside", sel && "dk-calendar__day--selected", sameDay(d, today) && "dk-calendar__day--today", off && "dk-calendar__day--disabled", props.dayClassName && props.dayClassName(d)),
        "data-date": d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"),
        onClick: () => pick(d),
        onFocus: () => {
          if (!sameDay(d, focus)) setFocus(d);
          if (props.onDayHover) props.onDayHover(d);
        },
        onMouseEnter: props.onDayHover ? () => props.onDayHover(d) : void 0
      },
      d.getDate()
    ));
  }))))));
});
export {
  Calendar
};
//# sourceMappingURL=Calendar.js.map
