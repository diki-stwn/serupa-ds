"use client";
import * as React from "react";
import { cn, omit } from "../../internal/cn";
import { component } from "../../internal/component";
import { canonicalLocale } from "../../internal/locale";
import { useLocale, useOwnLang } from "../../internal/provider";
import { warnOnce } from "../../internal/warn";

export interface RelativeTimeProps extends Omit<React.TimeHTMLAttributes<HTMLTimeElement>, 'children' | 'dateTime'> {
  /** The moment: a Date, a timestamp in ms, or a string Date can read ("2026-10-24T09:30:00Z"). A day on its own,
      "2026-10-24", is that day on the viewer's calendar, in days: "today", "yesterday", "in 3 days". */
  date: Date | number | string;
  /** 'long' ("3 minutes ago", default), 'short' ("3 min. ago") or 'narrow' ("3m ago"), as Intl.RelativeTimeFormat writes them. */
  format?: 'long' | 'short' | 'narrow';
  /** 'auto' (default): "yesterday", "now", "next week" where the language has a word. 'always': "1 day ago". */
  numeric?: 'auto' | 'always';
  /** How the exact date in the tooltip (title) is written. Default: { dateStyle: "long", timeStyle: "short" }. false: no tooltip. */
  titleFormat?: Intl.DateTimeFormatOptions | false;
  /** A locale for this one; otherwise the SerupaProvider's, else the browser's. */
  locale?: string;
}

/* One clock for every RelativeTime on the page: it ticks every 15 seconds while any is mounted (and at once when
   the tab comes back into view), so a page of timestamps re-renders together rather than each on its own timer. */
const TICK = 15000;
// module state: the browser's one clock (subscribe starts it); a server render reads getServerNow instead.
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
const tick = () => { now = Date.now(); listeners.forEach((l) => l()); };
const onVisible = () => { if (document.visibilityState === "visible") tick(); };
function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    timer = setInterval(tick, TICK);
    document.addEventListener("visibilitychange", onVisible);
    if (Date.now() - now > 1000) tick();   // the clock stood still while nothing was mounted
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) { clearInterval(timer); timer = null; document.removeEventListener("visibilitychange", onVisible); }
  };
}
const getNow = () => { if (!timer && Date.now() - now > TICK) now = Date.now(); return now; };
// The server's moment is used for hydration too, so the first client render matches the HTML; the browser's clock
// takes over right after (useSyncExternalStore's server snapshot). It's the same moment for every render within a
// second (one page's times agree, and React reads the snapshot twice), and a new one after that: a long-running
// server would otherwise write the time it started for every request.
// module state: the server's moment, renewed each second, so requests a second apart never share it.
let serverNow = -Infinity;
const getServerNow = () => { const t = Date.now(); if (t - serverNow > 1000 || t < serverNow) serverNow = t; return serverNow; };

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number, number]> = [
  // [unit, its length in seconds, use it while the gap is under this many seconds]
  ["second", 1, 45], ["minute", 60, 45 * 60], ["hour", 3600, 22 * 3600], ["day", 86400, 26 * 86400], ["month", 2629800, 320 * 86400], ["year", 31557600, Infinity],
];

/* A day on its own ("2026-10-24", as a date column or <input type="date"> gives it) is that local day. Date reads it
   as UTC midnight, the day before west of Greenwich, so "yesterday" came out as "2 days ago" there, and a day from
   this morning as "14 hours ago" (L8E13). */
function dayOf(date: Date | number | string): Date | null {
  const m = typeof date === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim()) : null;
  if (!m) return null;
  const d = new Date(2000, +m[2] - 1, +m[3]); d.setFullYear(+m[1]);
  return d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : new Date(NaN);
}

/** The words for a moment relative to now, as RelativeTime writes them: "3 minutes ago", "in 2 days", "now". A day
    on its own ("2026-10-24") is counted in calendar days or more: "today", "yesterday", "in 3 days". */
export function relativeTime(date: Date | number | string, now: number, locale?: string, options?: { format?: 'long' | 'short' | 'narrow'; numeric?: 'auto' | 'always' }): string {
  const day = dayOf(date);
  const t = (day || new Date(date)).getTime();
  if (!isFinite(t)) return "";
  const secs = (t - now) / 1000, abs = Math.abs(secs);
  const rtf = new Intl.RelativeTimeFormat(locale ? canonicalLocale(locale) : undefined, { style: options?.format || "long", numeric: options?.numeric || "auto" });
  let i = UNITS.findIndex(([, , under]) => abs < under);
  if (day) i = Math.max(i, 3);
  // Under 45 seconds is "now" ("0 seconds ago" with numeric always): a timer every 15s can't keep seconds honest.
  if (i === 0) return rtf.format(0, "second");
  // With numeric "auto", "yesterday", "last month" and "last year" are calendar words: days, months and years are
  // counted on the viewer's calendar, not by elapsed time, and a moment on the same calendar day (month, year)
  // falls back to the unit below (GL2). 01:00 seen at 23:00 is "22 hours ago", not "yesterday".
  // A day on its own is always counted on the calendar, and is "today" on its own day.
  if (options?.numeric !== "always" || day) {
    const a = new Date(t), b = new Date(now);
    for (; i >= 3; i--) {
      const n = i === 3 ? Math.round((Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) / 86400000)
        : i === 4 ? (a.getFullYear() - b.getFullYear()) * 12 + a.getMonth() - b.getMonth() : a.getFullYear() - b.getFullYear();
      if (n !== 0 || (day && i === 3)) return rtf.format(n, UNITS[i][0]);
    }
  }
  return rtf.format(Math.round(secs / UNITS[i][1]), UNITS[i][0]);
}

/* RelativeTime: a <time datetime> that says how long ago (or how far ahead) a moment is, in the locale's words:
   "3 minutes ago", "yesterday", "in 2 hours". It updates on one shared 15-second clock, and the exact date is its
   tooltip (title). format "long" (default), "short" or "narrow"; numeric "auto" (default) or "always". */
/** How long ago a moment was, in words ("3 minutes ago"), kept up to date; the exact date in its tooltip. */
export const RelativeTime = /* @__PURE__ */ component<HTMLTimeElement, RelativeTimeProps>("RelativeTime", function RelativeTime(props, ref) {
  const rest = omit(props, { date: 1, format: 1, numeric: 1, titleFormat: 1, locale: 1, className: 1 });
  const locale = useLocale(props.locale), lang = useOwnLang(props.locale);
  const current = React.useSyncExternalStore(subscribe, getNow, getServerNow);
  const day = dayOf(props.date), d = day || new Date(props.date), valid = isFinite(d.getTime());
  React.useEffect(() => {   // in the browser only, once per page
    if (process.env.NODE_ENV !== "production" && !valid) warnOnce("relative-time-date", "RelativeTime: date " + JSON.stringify(String(props.date)) + " isn't a date, so it shows nothing. Pass a Date, a timestamp in ms, or a string Date can read, such as \"2026-10-24T09:30:00Z\".");
  }, [valid, props.date]);
  const text = valid ? relativeTime(day ? props.date : d, current, locale, { format: props.format, numeric: props.numeric }) : "";
  // A day has no time of day to show, and its datetime is the day itself.
  const title = !valid || props.titleFormat === false ? undefined : new Intl.DateTimeFormat(locale, props.titleFormat || (day ? { dateStyle: "long" } : { dateStyle: "long", timeStyle: "short" })).format(d);
  return <time lang={lang} {...rest} ref={ref} dateTime={valid ? (day ? String(props.date).trim() : d.toISOString()) : undefined} title={rest.title ?? title} className={cn("dk-relative-time", props.className)}
    data-component="relative-time" suppressHydrationWarning>{text}</time>;
});
