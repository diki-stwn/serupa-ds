// src/internal/times.ts
import { latinDigits } from "./digits.js";
function toMinutes(v) {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec((v || "").trim());
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  return h < 24 && min < 60 && (m[3] == null || Number(m[3]) < 60) ? h * 60 + min : null;
}
var toHHmm = (n) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
var twelve = /* @__PURE__ */ new Map();
function uses12h(locale) {
  const key = locale || "";
  let h = twelve.get(key);
  if (h === void 0) twelve.set(key, h = !!new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hour12);
  return h;
}
var formats = /* @__PURE__ */ new Map();
function formatTime(n, locale, hour12) {
  const h12 = hour12 ?? uses12h(locale);
  const key = (locale || "") + "|" + h12;
  let f = formats.get(key);
  if (!f) formats.set(key, f = new Intl.DateTimeFormat(locale, { hour: h12 ? "numeric" : "2-digit", minute: "2-digit", hour12: h12 }));
  return f.format(new Date(2e3, 0, 1, Math.floor(n / 60), n % 60));
}
var patterns = /* @__PURE__ */ new Map();
function timePattern(locale, hour12) {
  const h12 = hour12 ?? uses12h(locale);
  const key = (locale || "") + "|" + h12;
  let p = patterns.get(key);
  if (p === void 0) {
    const f = new Intl.DateTimeFormat(locale, { hour: h12 ? "numeric" : "2-digit", minute: "2-digit", hour12: h12 });
    const period = (h) => f.formatToParts(new Date(2e3, 0, 1, h, 5)).find((x) => x.type === "dayPeriod")?.value || "";
    const am = period(9), pm = period(14), both = am === pm ? am : am + "/" + pm;
    patterns.set(key, p = f.formatToParts(new Date(2e3, 0, 1, 9, 5)).map((x) => x.type === "hour" ? "hh" : x.type === "minute" ? "mm" : x.type === "dayPeriod" ? both : x.value.replace(/[\u200e\u200f\u061c]/g, "")).join("").replace(/\s+/g, " ").trim());
  }
  return p;
}
var words = /* @__PURE__ */ new Map();
var squash = (x) => x.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
function wordsOf(locale) {
  const key = locale || "";
  let w = words.get(key);
  if (!w) {
    const f12 = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hour12: true });
    const f24 = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
    const period = (h) => squash(f12.formatToParts(new Date(2e3, 0, 1, h, 5)).find((x) => x.type === "dayPeriod")?.value || "");
    const other = /* @__PURE__ */ new Set();
    for (const f of [f12, f24]) for (const x of f.formatToParts(new Date(2e3, 0, 1, 14, 5))) {
      if (x.type === "literal" && /\p{L}/u.test(x.value)) other.add(squash(x.value));
    }
    words.set(key, w = { am: period(9), pm: period(14), other: [...other].sort((a, b) => b.length - a.length) });
  }
  return w;
}
function parseTime(text, locale) {
  let s = latinDigits(text.normalize("NFKC")).trim().toLowerCase().replace(/[\u200e\u200f\u061c]/g, "").replace(/\s+/g, "");
  if (!s) return null;
  let ap = "";
  const { am, pm, other } = wordsOf(locale);
  for (const [w, v] of [[am, "a"], [pm, "p"]].slice().sort((x, y) => y[0].length - x[0].length)) {
    if (w && !/^(am|pm|a\.m\.|p\.m\.)$/.test(w) && s.includes(w)) {
      ap = v;
      s = s.replace(w, "");
      break;
    }
  }
  for (const w of other) s = s.split(w).join("");
  const m = /^(a|am|a\.m\.|p|pm|p\.m\.)?(\d{1,2})(?:[:.h]?(\d{2})(?:[:.](\d{2}))?)?(a|am|a\.m\.|p|pm|p\.m\.)?$/.exec(s);
  if (!m || m[4] && Number(m[4]) > 59) return null;
  const typed = m[1] || m[5];
  if (typed) {
    if (ap || m[1] && m[5]) return null;
    ap = typed[0];
  }
  let h = Number(m[2]);
  const min = m[3] ? Number(m[3]) : 0;
  if (min > 59) return null;
  if (ap) {
    if (h > 12) return null;
    if (h === 12) h = 0;
    if (ap === "p") h += 12;
  } else if (h > 23) return null;
  return h * 60 + min;
}
export {
  formatTime,
  parseTime,
  timePattern,
  toHHmm,
  toMinutes,
  uses12h
};
//# sourceMappingURL=times.js.map
