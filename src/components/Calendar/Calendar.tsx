"use client";
import * as React from "react";
import { cn, domId, omit } from "../../internal/cn";
import { addDays, addMonths, compare, day, firstDayOfWeek, isValid, sameDay, sameMonth, startOfMonth, startOfWeek } from "../../internal/dates";
import { Icon } from "../Icon/Icon";
import { IconButton } from "../IconButton/IconButton";
import { component } from "../../internal/component";
import { useLocale, useOwnLang, useSerupa } from "../../internal/provider";
import * as icons from "../../material/builtin";

export interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** The selected day (controlled), or null. Use with onValueChange. */
  value?: Date | null;
  /** The selected day at first (uncontrolled). */
  defaultValue?: Date | null;
  /** Called with the day people pick. */
  onValueChange?: (value: Date) => void;
  /** The month shown (controlled): any day in it. Use with onMonthChange. */
  month?: Date;
  /** The month shown at first. Default: the selected day's, or today's. */
  defaultMonth?: Date;
  /** Called when the shown month changes. */
  onMonthChange?: (month: Date) => void;
  /** The earliest day that can be picked. */
  min?: Date;
  /** The latest day that can be picked. */
  max?: Date;
  /** Days that can't be picked, such as weekends. */
  isDateDisabled?: (date: Date) => boolean;
  /** A BCP 47 locale for month and weekday names and the first day of the week. Default: the nearest SerupaProvider's locale, else the browser's. */
  locale?: string;
  /** 0 Sunday … 6 Saturday. Default: the locale's. */
  weekStartsOn?: number;
  /** Moves focus to the selected day (or today) when the calendar appears. Default: false. */
  autoFocus?: boolean;
  /** Names for the month buttons. Default: "Previous month" and "Next month". */
  previousLabel?: string;
  nextLabel?: string;
  /** @internal Extra classes per day, for DateRangePicker. */
  dayClassName?: (date: Date) => string | undefined;
  /** @internal aria-selected per day, for DateRangePicker. */
  isDateSelected?: (date: Date) => boolean;
  /** @internal Called when a day gets focus or the pointer, for DateRangePicker's preview. */
  onDayHover?: (date: Date) => void;
  /** @internal Leaves the days of other months blank, for DateRangePicker's two months side by side. */
  hideOutside?: boolean;
}

// The four formats a Calendar draws with, built once per locale rather than on every render (a grid of 42 days
// re-renders on each arrow key).
type Formats = { title: Intl.DateTimeFormat; short: Intl.DateTimeFormat; long: Intl.DateTimeFormat; full: Intl.DateTimeFormat };
const FORMATS = new Map<string, Formats>();
function formats(locale: string): Formats {
  let f = FORMATS.get(locale);
  if (!f) {
    // The grid is Gregorian with Latin digits, so the title and day labels are too (a Thai or Persian title would
    // otherwise name another month and year). Month and weekday names stay localized.
    const greg = { calendar: "gregory", numberingSystem: "latn" } as const;
    f = {
      title: new Intl.DateTimeFormat(locale, { ...greg, month: "long", year: "numeric" }),
      short: new Intl.DateTimeFormat(locale, { weekday: "short" }),
      long: new Intl.DateTimeFormat(locale, { weekday: "long" }),
      full: new Intl.DateTimeFormat(locale, { ...greg, weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    };
    FORMATS.set(locale, f);
  }
  return f;
}

const OWN = { value: 1, defaultValue: 1, onValueChange: 1, month: 1, defaultMonth: 1, onMonthChange: 1, min: 1, max: 1, isDateDisabled: 1, locale: 1, weekStartsOn: 1, autoFocus: 1, previousLabel: 1, nextLabel: 1, dayClassName: 1, isDateSelected: 1, onDayHover: 1, hideOutside: 1, className: 1 } as const;

/* Calendar: a month of days to pick one from. Follows the ARIA date grid pattern: one Tab stop on the days,
   arrows move a day or a week, Home and End to the week's start and end, PageUp and PageDown a month (with
   Shift, a year), Enter or Space picks. Moving past the month shows the next one. Days outside min..max or
   refused by isDateDisabled are aria-disabled and can't be picked. Month and weekday names follow the locale. */
/** A month of days to pick one from, with keyboard navigation; used by DatePicker. */
export const Calendar = /* @__PURE__ */ component<HTMLDivElement, CalendarProps>("Calendar", function Calendar(props, ref) {
  const sds = useSerupa();
  const rest = omit(props, OWN);
  const locale = useLocale(props.locale), lang = useOwnLang(props.locale);
  const ws = props.weekStartsOn != null ? ((Math.floor(props.weekStartsOn) % 7) + 7) % 7 : firstDayOfWeek(locale);
  const controlledValue = props.value !== undefined;
  const [ownValue, setOwnValue] = React.useState<Date | null>(isValid(props.defaultValue) ? day(props.defaultValue) : null);
  const value = controlledValue ? (isValid(props.value) ? day(props.value) : null) : ownValue;
  const today = day(new Date());
  const controlledMonth = props.month !== undefined;
  const [ownMonth, setOwnMonth] = React.useState(() => startOfMonth(props.defaultMonth || value || today));
  const month = controlledMonth && isValid(props.month) ? startOfMonth(props.month) : ownMonth;
  const [focus, setFocus] = React.useState<Date>(() => (value && sameMonth(value, month) ? value : sameMonth(today, month) ? today : month));
  const grid = React.useRef<HTMLTableElement | null>(null);
  const wantFocus = React.useRef(!!props.autoFocus);

  const disabled = (d: Date) => (props.min && compare(d, props.min) < 0) || (props.max && compare(d, props.max) > 0) || (props.isDateDisabled ? props.isDateDisabled(d) : false);
  const showMonth = (m: Date) => { const s = startOfMonth(m); if (!controlledMonth) setOwnMonth(s); if (props.onMonthChange) props.onMonthChange(s); };
  // Keep the focused day inside the shown month when the month changes from outside or by the buttons
  // (adjusted during render, so the new month never draws without its Tab stop).
  const monthTime = month.getTime();
  const [focusMonth, setFocusMonth] = React.useState(monthTime);
  if (focusMonth !== monthTime) {
    setFocusMonth(monthTime);
    if (!sameMonth(focus, month)) setFocus(value && sameMonth(value, month) ? value : sameMonth(today, month) ? today : month);
  }
  React.useEffect(() => {
    if (!wantFocus.current || !grid.current) return;
    wantFocus.current = false;
    const b = grid.current.querySelector<HTMLButtonElement>('button[tabindex="0"]');
    if (b) b.focus();
  });

  const move = (d: Date) => { setFocus(d); if (!sameMonth(d, month)) showMonth(d); wantFocus.current = true; };
  const pick = (d: Date) => {
    if (disabled(d)) return;
    if (!controlledValue) setOwnValue(d);
    if (props.onValueChange) props.onValueChange(d);
    if (!sameMonth(d, month)) showMonth(d);
    setFocus(d);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    let n: Date | null = null;
    switch (e.key) {
      case "ArrowLeft": n = addDays(focus, rtl ? 1 : -1); break;
      case "ArrowRight": n = addDays(focus, rtl ? -1 : 1); break;
      case "ArrowUp": n = addDays(focus, -7); break;
      case "ArrowDown": n = addDays(focus, 7); break;
      case "Home": n = startOfWeek(focus, ws); break;
      case "End": n = addDays(startOfWeek(focus, ws), 6); break;
      case "PageUp": n = addMonths(focus, e.shiftKey ? -12 : -1); break;
      case "PageDown": n = addMonths(focus, e.shiftKey ? 12 : 1); break;
      case "Enter": case " ": e.preventDefault(); pick(focus); return;
      default: return;
    }
    e.preventDefault();
    // Keys stop at min and max, as the native date field does, so a PageDown near the end doesn't leave focus on a
    // day that can't be picked in a month the next button won't show.
    if (props.min && compare(n, props.min) < 0) n = day(props.min);
    if (props.max && compare(n, props.max) > 0) n = day(props.max);
    move(n);
  };

  const first = startOfWeek(month, ws);
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) { const row: Date[] = []; for (let i = 0; i < 7; i++) row.push(addDays(first, w * 7 + i)); weeks.push(row); }
  const { short, long, full } = formats(locale);
  const title = formats(locale).title.format(month);
  const titleId = domId("dk-cal", React.useId()) + "-title";
  const selected = (d: Date) => (props.isDateSelected ? props.isDateSelected(d) : sameDay(d, value));
  return (
    <div {...rest} ref={ref} className={cn("dk-calendar", props.className)} data-component="calendar">
      <div className="dk-calendar__header">
        <IconButton icon={<><Icon icon={icons.ChevronLeft} className="dk-calendar__ltr" /><Icon icon={icons.ChevronRight} className="dk-calendar__rtl" /></>} className="dk-calendar__nav dk-calendar__nav--prev" label={props.previousLabel || sds.labels.previousMonth} size="sm" variant="ghost" noTitle
          disabled={!!props.min && compare(addDays(month, -1), props.min) < 0} onClick={() => showMonth(addMonths(month, -1))} />
        <h2 className="dk-calendar__title" id={titleId} lang={lang} aria-live="polite">{title}</h2>
        <IconButton icon={<><Icon icon={icons.ChevronRight} className="dk-calendar__ltr" /><Icon icon={icons.ChevronLeft} className="dk-calendar__rtl" /></>} className="dk-calendar__nav dk-calendar__nav--next" label={props.nextLabel || sds.labels.nextMonth} size="sm" variant="ghost" noTitle
          disabled={!!props.max && compare(addMonths(month, 1), props.max) > 0} onClick={() => showMonth(addMonths(month, 1))} />
      </div>
      <table ref={grid} lang={lang} className="dk-calendar__grid" role="grid" aria-labelledby={titleId} onKeyDown={onKeyDown}>
        <thead>
          <tr>{weeks[0].map((d) => <th key={d.getDay()} scope="col" abbr={long.format(d)}><span aria-hidden>{short.format(d)}</span><span className="dk-visually-hidden">{long.format(d)}</span></th>)}</tr>
        </thead>
        <tbody>
          {weeks.map((row, w) => (
            <tr key={w}>
              {row.map((d) => {
                const off = !!disabled(d), sel = selected(d), outside = !sameMonth(d, month);
                if (outside && props.hideOutside) return <td key={d.getTime()} role="gridcell" className="dk-calendar__blank" />;
                return (
                  <td key={d.getTime()} aria-selected={sel} role="gridcell">
                    <button type="button" tabIndex={sameDay(d, focus) ? 0 : -1} aria-label={full.format(d)} aria-disabled={off || undefined} aria-current={sameDay(d, today) ? "date" : undefined}
                      className={cn("dk-calendar__day", outside && "dk-calendar__day--outside", sel && "dk-calendar__day--selected", sameDay(d, today) && "dk-calendar__day--today", off && "dk-calendar__day--disabled", props.dayClassName && props.dayClassName(d))}
                      data-date={d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")}
                      onClick={() => pick(d)} onFocus={() => { if (!sameDay(d, focus)) setFocus(d); if (props.onDayHover) props.onDayHover(d); }}
                      onMouseEnter={props.onDayHover ? () => props.onDayHover!(d) : undefined}>
                      {d.getDate()}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
