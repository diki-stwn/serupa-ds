// src/internal/dates.ts
import { latinDigits } from "./digits.js";
import { warnOnce } from "./warn.js";
var day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
var addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
function addMonths(d, n) {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), last));
}
var sameDay = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
var sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
var startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
var startOfWeek = (d, weekStartsOn) => addDays(d, -((d.getDay() - weekStartsOn + 7) % 7));
var compare = (a, b) => day(a).getTime() - day(b).getTime();
var isValid = (d) => d instanceof Date && !isNaN(d.getTime());
var isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function toDay(v, who) {
  if (typeof v === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim());
    if (!m) return null;
    const d = new Date(2e3, +m[2] - 1, +m[3]);
    d.setFullYear(+m[1]);
    return d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
  }
  if (!isValid(v)) return null;
  if (process.env.NODE_ENV !== "production" && who && v.getTimezoneOffset() > 0 && v.getUTCHours() + v.getUTCMinutes() + v.getUTCSeconds() + v.getUTCMilliseconds() === 0)
    warnOnce("utc-date", `${who}: a Date at UTC midnight (${v.toISOString()}) is ${isoDate(v)} here, the day before. A Date made from "yyyy-mm-dd" is UTC; pass the "yyyy-mm-dd" string itself instead.`, who + ":utc");
  return day(v);
}
var SUNDAY_FIRST = /^(AG|AS|BD|BR|BS|BT|BW|BZ|CA|CO|DM|DO|ET|GT|GU|HK|HN|ID|IL|IN|JM|JP|KE|KH|KR|LA|MH|MM|MO|MT|MX|MZ|NI|NP|PA|PE|PH|PK|PR|PT|PY|SA|SG|SV|TH|TT|TW|UM|US|VE|VI|WS|YE|ZA|ZW)$/;
var SATURDAY_FIRST = /^(AF|BH|DJ|DZ|EG|IQ|IR|JO|KW|LY|OM|QA|SD|SY)$/;
function firstDayOfWeek(locale) {
  try {
    const l = new Intl.Locale(locale || new Intl.DateTimeFormat().resolvedOptions().locale);
    const info = typeof l.getWeekInfo === "function" ? l.getWeekInfo() : l.weekInfo;
    if (info && info.firstDay) return info.firstDay % 7;
    const region = l.region || (typeof l.maximize === "function" ? l.maximize().region : void 0);
    if (region) return SUNDAY_FIRST.test(region) ? 0 : SATURDAY_FIRST.test(region) ? 6 : region === "MV" ? 5 : 1;
  } catch {
  }
  return 0;
}
var numericFormats = /* @__PURE__ */ new Map();
function numeric(locale) {
  const key = locale || "";
  let f = numericFormats.get(key);
  if (!f) numericFormats.set(key, f = new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit", calendar: "gregory", numberingSystem: "latn" }));
  return f;
}
var shapes = /* @__PURE__ */ new Map();
function shape(locale) {
  const key = locale || "";
  let s = shapes.get(key);
  if (!s) {
    const parts = numeric(locale).formatToParts(new Date(2001, 10, 22));
    shapes.set(key, s = {
      order: Object.freeze(parts.filter((p) => p.type === "day" || p.type === "month" || p.type === "year").map((p) => p.type)),
      pattern: parts.map((p) => p.type === "day" ? "dd" : p.type === "month" ? "mm" : p.type === "year" ? "yyyy" : p.value).join("")
    });
  }
  return s;
}
function dateOrder(locale) {
  return shape(locale).order.slice();
}
function parseDate(text, locale, now = /* @__PURE__ */ new Date()) {
  const nums = latinDigits(text).trim().split(/[^0-9]+/).filter(Boolean);
  const own = dateOrder(locale);
  if (nums.length === 1 && (nums[0].length === 6 || nums[0].length === 8)) {
    const run = nums[0], yl = run.length - 4;
    const read = (order) => {
      let i = 0;
      const parts = order.map((k) => {
        const n = k === "year" ? yl : 2;
        i += n;
        return run.slice(i - n, i);
      });
      return fromParts(parts, order, now);
    };
    const mine = read(own), iso = yl === 4 ? read(["year", "month", "day"]) : null;
    if (!mine || !iso) return mine || iso;
    return Math.abs(iso.getFullYear() - now.getFullYear()) < Math.abs(mine.getFullYear() - now.getFullYear()) ? iso : mine;
  }
  if (nums.length !== 3) return null;
  return fromParts(nums, /^\d{4}$/.test(nums[0]) && own[0] !== "year" ? ["year", "month", "day"] : own, now);
}
function fromParts(nums, order, now) {
  const v = {};
  order.forEach((k, i) => {
    v[k] = Number(nums[i]);
  });
  if (nums[order.indexOf("year")].length <= 2) {
    const y = now.getFullYear();
    v.year += y - y % 100;
    if (v.year - y > 49) v.year -= 100;
    else if (y - v.year > 50) v.year += 100;
  }
  const d = new Date(2e3, 0, 1);
  d.setFullYear(v.year, v.month - 1, v.day);
  return d.getFullYear() === v.year && d.getMonth() === v.month - 1 && d.getDate() === v.day ? d : null;
}
var formatDate = (d, locale) => numeric(locale).format(d);
function datePattern(locale) {
  return shape(locale).pattern;
}
export {
  addDays,
  addMonths,
  compare,
  dateOrder,
  datePattern,
  day,
  firstDayOfWeek,
  formatDate,
  isValid,
  isoDate,
  parseDate,
  sameDay,
  sameMonth,
  startOfMonth,
  startOfWeek,
  toDay
};
//# sourceMappingURL=dates.js.map
