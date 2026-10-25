import { latinDigits } from "./digits";

// Calendar dates without times: local midnight, so days compare and step reliably across daylight saving.

export const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** The same day n months on, or the month's last day when it's shorter (Jan 31 + 1 → Feb 28). */
export function addMonths(d: Date, n: number): Date {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), last));
}
export const sameDay = (a: Date | null | undefined, b: Date | null | undefined) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const startOfWeek = (d: Date, weekStartsOn: number) => addDays(d, -((d.getDay() - weekStartsOn + 7) % 7));
export const compare = (a: Date, b: Date) => day(a).getTime() - day(b).getTime();
export const isValid = (d: unknown): d is Date => d instanceof Date && !isNaN(d.getTime());
/** yyyy-mm-dd, for forms and APIs. */
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** The locale's first day of the week (0 Sunday … 6 Saturday), where the browser knows it; otherwise Sunday. */
// Regions whose week starts on Sunday or Saturday (CLDR weekData; the Maldives starts on Friday, the rest on
// Monday), for browsers without Intl.Locale week info (Firefox).
const SUNDAY_FIRST = /^(AG|AS|BD|BR|BS|BT|BW|BZ|CA|CO|DM|DO|ET|GT|GU|HK|HN|ID|IL|IN|JM|JP|KE|KH|KR|LA|MH|MM|MO|MT|MX|MZ|NI|NP|PA|PE|PH|PK|PR|PT|PY|SA|SG|SV|TH|TT|TW|UM|US|VE|VI|WS|YE|ZA|ZW)$/;
const SATURDAY_FIRST = /^(AF|BH|DJ|DZ|EG|IQ|IR|JO|KW|LY|OM|QA|SD|SY)$/;

export function firstDayOfWeek(locale?: string): number {
  try {
    // getWeekInfo() (and the older weekInfo) are newer than TypeScript's Intl types.
    const l: Intl.Locale & { getWeekInfo?: () => { firstDay?: number }; weekInfo?: { firstDay?: number } } = new Intl.Locale(locale || new Intl.DateTimeFormat().resolvedOptions().locale);
    const info = typeof l.getWeekInfo === "function" ? l.getWeekInfo() : l.weekInfo;
    if (info && info.firstDay) return info.firstDay % 7;
    const region = l.region || (typeof l.maximize === "function" ? l.maximize().region : undefined);
    if (region) return SUNDAY_FIRST.test(region) ? 0 : SATURDAY_FIRST.test(region) ? 6 : region === "MV" ? 5 : 1;
  } catch { /* no Intl.Locale */ }
  return 0;
}

// The typed date is always Gregorian with Latin digits, so it reads back as the same day: Thai (Buddhist years),
// ja-u-ca-japanese (era years) and fa (Persian calendar and digits) would otherwise drift on the way back in.
// Month names in the calendar grid stay localized.
// module state: a cache by locale; the same locale gives the same format in every request.
const numericFormats = new Map<string, Intl.DateTimeFormat>();
function numeric(locale?: string): Intl.DateTimeFormat {
  const key = locale || "";
  let f = numericFormats.get(key);
  if (!f) numericFormats.set(key, f = new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit", calendar: "gregory", numberingSystem: "latn" }));
  return f;
}
/** The order and separators of a short numeric date in the locale: ["month", "day", "year"] for en-US. */
export function dateOrder(locale?: string): ("day" | "month" | "year")[] {
  const parts = numeric(locale).formatToParts(new Date(2001, 10, 22));
  return parts.filter((p) => p.type === "day" || p.type === "month" || p.type === "year").map((p) => p.type as "day" | "month" | "year");
}
/** A typed date in the locale's numeric order (11/22/2001, 22.11.2001, 2001-11-22, or digits alone: 11222001), or null. A one- or two-digit
 * year is the one within 50 years of now (in 2026: 85 is 1985, 30 is 2030, 75 is 2075 and 77 is 1977), so a birth
 * date or a deadline both read right. A leading 4-digit year reads as ISO year-month-day unless the locale writes its
 * year first. */
export function parseDate(text: string, locale?: string, now: Date = new Date()): Date | null {
  const nums = latinDigits(text).trim().split(/[^0-9]+/).filter(Boolean);
  const own = dateOrder(locale);
  // Digits alone, as typed on a number keypad: 6 or 8 of them, split in the locale's order (11222001 and 112201 in
  // en-US, 22112001 in de-DE), or as an ISO yyyymmdd. When both make a date (20011122 in de-DE is also 20.01.1122),
  // the one nearer now wins.
  if (nums.length === 1 && (nums[0].length === 6 || nums[0].length === 8)) {
    const run = nums[0], yl = run.length - 4;
    const read = (order: readonly string[]) => { let i = 0; const parts = order.map((k) => { const n = k === "year" ? yl : 2; i += n; return run.slice(i - n, i); }); return fromParts(parts, order, now); };
    const mine = read(own), iso = yl === 4 ? read(["year", "month", "day"]) : null;
    if (!mine || !iso) return mine || iso;
    return Math.abs(iso.getFullYear() - now.getFullYear()) < Math.abs(mine.getFullYear() - now.getFullYear()) ? iso : mine;
  }
  if (nums.length !== 3) return null;
  // A leading 4-digit year is ISO (2001-11-22), unless the locale itself writes the year first in another order
  // (Kyrgyz: year-day-month).
  return fromParts(nums, /^\d{4}$/.test(nums[0]) && own[0] !== "year" ? ["year", "month", "day"] : own, now);
}
function fromParts(nums: string[], order: readonly string[], now: Date): Date | null {
  const v: Record<string, number> = {};
  order.forEach((k, i) => { v[k] = Number(nums[i]); });
  if (nums[order.indexOf("year")].length <= 2) {
    const y = now.getFullYear();
    v.year += y - (y % 100);
    if (v.year - y > 49) v.year -= 100;
    else if (y - v.year > 50) v.year += 100;
  }
  const d = new Date(2000, 0, 1);
  d.setFullYear(v.year, v.month - 1, v.day);   // so years 0–99 typed with four digits stay themselves, not 19xx
  return d.getFullYear() === v.year && d.getMonth() === v.month - 1 && d.getDate() === v.day ? d : null;
}
/** A date in the locale's short numeric form, as people type it: 11/22/2001. */
export const formatDate = (d: Date, locale?: string) => numeric(locale).format(d);
/** What to type, in the locale's order: mm/dd/yyyy, dd.mm.yyyy. */
export function datePattern(locale?: string): string {
  const parts = numeric(locale).formatToParts(new Date(2001, 10, 22));
  return parts.map((p) => (p.type === "day" ? "dd" : p.type === "month" ? "mm" : p.type === "year" ? "yyyy" : p.value)).join("");
}
