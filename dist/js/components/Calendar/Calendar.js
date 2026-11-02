"use client";

// src/components/Calendar/Calendar.tsx
import * as React from "react";
import { cn, domId, omit } from "../../internal/cn.js";
import { addDays, addMonths, compare, day, firstDayOfWeek, isoDate, isValid, sameDay, sameMonth, startOfMonth, startOfWeek, toDay } from "../../internal/dates.js";
import { IconButton } from "../IconButton/IconButton.js";
import { component } from "../../internal/component.js";
import { useLocale, useOwnLang, useSettings } from "../../internal/provider.js";
import * as icons from "../../material/builtin.js";
import { useFocusHandover } from "../../internal/focus.js";
import { en as words } from "./labels.js";
var FORMATS = /* @__PURE__ */ new Map();
function header(locale) {
  const fmt = (o, at = locale) => new Intl.DateTimeFormat(at, o);
  const short = fmt({ weekday: "short" }), long = fmt({ weekday: "long" }), narrow = fmt({ weekday: "narrow" });
  const week = Array.from({ length: 7 }, (_, i) => new Date(2025, 2, 2 + i));
  const names = (f) => week.map((d) => f.format(d)).join("|");
  const wide = week.some((d) => short.format(d) === long.format(d) || /\s/.test(short.format(d))) || names(short).length > 7 * 5 - 1;
  const english = names(narrow) === names(fmt({ weekday: "narrow" }, "en")) && names(short) !== names(fmt({ weekday: "short" }, "en"));
  return wide && !english ? narrow : short;
}
function formats(locale) {
  let f = FORMATS.get(locale);
  if (!f) {
    const greg = { calendar: "gregory", numberingSystem: "latn" };
    f = {
      title: new Intl.DateTimeFormat(locale, { ...greg, month: "long", year: "numeric" }),
      short: header(locale),
      long: new Intl.DateTimeFormat(locale, { weekday: "long" }),
      full: new Intl.DateTimeFormat(locale, { ...greg, weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      month: new Intl.DateTimeFormat(locale, { ...greg, month: "long" })
    };
    FORMATS.set(locale, f);
  }
  return f;
}
var OWN = { value: 1, defaultValue: 1, onValueChange: 1, month: 1, defaultMonth: 1, onMonthChange: 1, min: 1, max: 1, isDateDisabled: 1, locale: 1, weekStartsOn: 1, autoFocus: 1, previousLabel: 1, nextLabel: 1, monthYearPicker: 1, dayClassName: 1, isDateSelected: 1, onDayHover: 1, hideOutside: 1, className: 1 };
var Calendar = /* @__PURE__ */ component("Calendar", function Calendar2(props, ref) {
  const sds = useSettings(words);
  const rest = omit(props, OWN);
  const locale = useLocale(props.locale), lang = useOwnLang(props.locale);
  const ws = props.weekStartsOn != null ? (Math.floor(props.weekStartsOn) % 7 + 7) % 7 : firstDayOfWeek(locale);
  const controlledValue = props.value !== void 0;
  const [ownValue, setOwnValue] = React.useState(() => toDay(props.defaultValue, "Calendar"));
  const value = controlledValue ? toDay(props.value, "Calendar") : ownValue;
  const min = toDay(props.min, "Calendar"), max = toDay(props.max, "Calendar");
  const [, setTick] = React.useState(0);
  const today = day(/* @__PURE__ */ new Date());
  const todayTime = today.getTime();
  React.useEffect(() => {
    const t = setTimeout(() => setTick((n) => n + 1), addDays(new Date(todayTime), 1).getTime() - Date.now() + 50);
    return () => clearTimeout(t);
  }, [todayTime]);
  const home = min && compare(today, min) < 0 ? min : max && compare(today, max) > 0 ? max : today;
  const controlledMonth = props.month !== void 0;
  const [ownMonth, setOwnMonth] = React.useState(() => startOfMonth(props.defaultMonth || value || home));
  const month = controlledMonth && isValid(props.month) ? startOfMonth(props.month) : ownMonth;
  const [focus, setFocus] = React.useState(() => value && sameMonth(value, month) ? value : sameMonth(home, month) ? home : month);
  const valueTime = value ? value.getTime() : null;
  const [seen, setSeen] = React.useState(valueTime);
  if (seen !== valueTime) {
    setSeen(valueTime);
    const away = !!value && !sameMonth(value, month);
    if (value && !(away && controlledMonth)) {
      setFocus(value);
      if (away) setOwnMonth(startOfMonth(value));
    }
  }
  const grid = React.useRef(null);
  const wantFocus = React.useRef(!!props.autoFocus);
  const disabled = (d) => min && compare(d, min) < 0 || max && compare(d, max) > 0 || (props.isDateDisabled ? props.isDateDisabled(d) : false);
  const showMonth = (m) => {
    const s = startOfMonth(m);
    if (!controlledMonth) setOwnMonth(s);
    if (props.onMonthChange) props.onMonthChange(s);
  };
  const monthTime = month.getTime();
  const [focusMonth, setFocusMonth] = React.useState(monthTime);
  if (focusMonth !== monthTime) {
    setFocusMonth(monthTime);
    if (!sameMonth(focus, month)) setFocus(value && sameMonth(value, month) ? value : sameMonth(home, month) ? home : month);
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
    if (props.onValueChange) props.onValueChange(d, isoDate(d));
    if (!sameMonth(d, month)) showMonth(d);
    setFocus(d);
  };
  const onKeyDown = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
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
    if (min && compare(n, min) < 0) n = day(min);
    if (max && compare(n, max) > 0) n = day(max);
    move(n);
  };
  const first = startOfWeek(month, ws);
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let i = 0; i < 7; i++) row.push(addDays(first, w * 7 + i));
    weeks.push(row);
  }
  const { short, long, full, month: monthName } = formats(locale);
  const title = formats(locale).title.format(month);
  const titleId = domId("dk-cal", React.useId()) + "-title";
  const selected = (d) => props.isDateSelected ? props.isDateSelected(d) : sameDay(d, value);
  const handover = useFocusHandover();
  const prevNav = React.useRef(null), nextNav = React.useRef(null);
  return /* @__PURE__ */ React.createElement("div", { ...rest, ref, className: cn("dk-calendar", props.className), "data-component": "calendar" }, /* @__PURE__ */ React.createElement("div", { className: "dk-calendar__header" }, /* @__PURE__ */ React.createElement(
    IconButton,
    {
      icon: icons.ChevronLeft,
      className: "dk-calendar__nav dk-calendar__nav--prev",
      label: props.previousLabel || sds.labels.previousMonth,
      size: "sm",
      variant: "ghost",
      hideTitle: true,
      disabled: !!min && compare(addDays(month, -1), min) < 0,
      onClick: (e) => {
        handover(e.currentTarget, () => nextNav.current);
        showMonth(addMonths(month, -1));
      },
      ref: prevNav
    }
  ), /* @__PURE__ */ React.createElement("h2", { className: cn("dk-calendar__title", props.monthYearPicker && "dk-visually-hidden"), id: titleId, lang, "aria-live": "polite" }, title), props.monthYearPicker ? /* @__PURE__ */ React.createElement(MonthYear, { month, min, max, today, names: monthName, lang, monthLabel: sds.labels.month, yearLabel: sds.labels.year, onPick: showMonth }) : null, /* @__PURE__ */ React.createElement(
    IconButton,
    {
      icon: icons.ChevronRight,
      className: "dk-calendar__nav dk-calendar__nav--next",
      label: props.nextLabel || sds.labels.nextMonth,
      size: "sm",
      variant: "ghost",
      hideTitle: true,
      disabled: !!max && compare(addMonths(month, 1), max) > 0,
      onClick: (e) => {
        handover(e.currentTarget, () => prevNav.current);
        showMonth(addMonths(month, 1));
      },
      ref: nextNav
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
function MonthYear(p) {
  const y = p.month.getFullYear();
  const from = p.min ? p.min.getFullYear() : Math.min(y, p.today.getFullYear() - 100);
  const to = p.max ? p.max.getFullYear() : Math.max(y, p.today.getFullYear() + 10);
  const out = (yy, m) => !!p.min && new Date(yy, m + 1, 0) < p.min || !!p.max && new Date(yy, m, 1) > p.max;
  const go = (yy, m) => {
    let d = new Date(yy, m, 1);
    if (p.min && d < startOfMonth(p.min)) d = startOfMonth(p.min);
    if (p.max && d > p.max) d = startOfMonth(p.max);
    p.onPick(d);
  };
  const years = [];
  for (let i = from; i <= to; i++) years.push(i);
  return /* @__PURE__ */ React.createElement("span", { className: "dk-calendar__menus" }, /* @__PURE__ */ React.createElement("select", { className: "dk-calendar__menu", form: "", "aria-label": p.monthLabel, lang: p.lang, value: p.month.getMonth(), onChange: (e) => go(y, +e.currentTarget.value) }, Array.from({ length: 12 }, (_, m) => /* @__PURE__ */ React.createElement("option", { key: m, value: m, disabled: out(y, m) }, p.names.format(new Date(2e3, m, 1))))), /* @__PURE__ */ React.createElement("select", { className: "dk-calendar__menu", form: "", "aria-label": p.yearLabel, value: y, onChange: (e) => go(+e.currentTarget.value, p.month.getMonth()) }, years.map((yy) => /* @__PURE__ */ React.createElement("option", { key: yy, value: yy }, yy))));
}
export {
  Calendar
};
//# sourceMappingURL=Calendar.js.map
