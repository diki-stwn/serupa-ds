import { latinDigits } from "./digits";

// Times of day as minutes since midnight, written "HH:mm" for forms and APIs.

/** "14:05" → 845, or null. */
export function toMinutes(v: string | null | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((v || "").trim());
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}
/** 845 → "14:05". */
export const toHHmm = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
// module state: a cache by locale.
const twelve = new Map<string, boolean>();
/** Whether the locale writes times with AM and PM. */
export function uses12h(locale?: string): boolean {
  const key = locale || "";
  let h = twelve.get(key);
  if (h === undefined) twelve.set(key, h = !!new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hour12);
  return h;
}
// module state: a cache by locale.
const formats = new Map<string, Intl.DateTimeFormat>();
/** A time as the locale writes it: "2:05 PM", "14:05". */
export function formatTime(n: number, locale?: string, hour12?: boolean): string {
  const h12 = hour12 ?? uses12h(locale);
  const key = (locale || "") + "|" + h12;
  let f = formats.get(key);
  if (!f) formats.set(key, f = new Intl.DateTimeFormat(locale, { hour: h12 ? "numeric" : "2-digit", minute: "2-digit", hour12: h12 }));
  return f.format(new Date(2000, 0, 1, Math.floor(n / 60), n % 60));
}
// The locale's own words for morning and afternoon ("오전" "오후" in ko, "ص" "م" in ar), and the other words it writes
// around a time ("ч." in bg, "ཆུ་ཚོད་" hour and "སྐར་མ་" minute in dz), lowercased without spaces, as typed text is.
// module state: a cache by locale.
const words = new Map<string, { am: string; pm: string; other: string[] }>();
const squash = (x: string) => x.toLowerCase().replace(/\s+/g, "");
function wordsOf(locale?: string): { am: string; pm: string; other: string[] } {
  const key = locale || "";
  let w = words.get(key);
  if (!w) {
    const f12 = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hour12: true });
    const f24 = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
    const period = (h: number) => squash(f12.formatToParts(new Date(2000, 0, 1, h, 5)).find((x) => x.type === "dayPeriod")?.value || "");
    const other = new Set<string>();
    for (const f of [f12, f24]) for (const x of f.formatToParts(new Date(2000, 0, 1, 14, 5))) {
      if (x.type === "literal" && /\p{L}/u.test(x.value)) other.add(squash(x.value));
    }
    words.set(key, w = { am: period(9), pm: period(14), other: [...other].sort((a, b) => b.length - a.length) });
  }
  return w;
}
/** A typed time, as minutes, or null: "14:05", "2:05 pm", "2pm", "1405", "9", "9.30", "21h30", and the locale's own form,
    such as "오후 2:05" (ko), "٢:٠٥ م" (ar-EG), "AM ৯.০৫" (as) or "۱۴:۰۵" (fa): digits in any script, the locale's words
    for AM and PM before or after the time, and its other words around a time ("ч." in bg) are read. Without am/pm, a 12-hour locale still reads 13–23 as afternoon; 1–11 stay morning. */
export function parseTime(text: string, locale?: string): number | null {
  let s = latinDigits(text).trim().toLowerCase().replace(/[\u200e\u200f\u061c]/g, "").replace(/\s+/g, "");
  if (!s) return null;
  let ap = "";
  const { am, pm, other } = wordsOf(locale);
  // The longer word first, in case one contains the other; before or after the time.
  for (const [w, v] of ([[am, "a"], [pm, "p"]] as const).slice().sort((x, y) => y[0].length - x[0].length)) {
    if (w && !/^(am|pm|a\.m\.|p\.m\.)$/.test(w) && s.includes(w)) { ap = v; s = s.replace(w, ""); break; }
  }
  for (const w of other) s = s.split(w).join("");
  const m = /^(a|am|a\.m\.|p|pm|p\.m\.)?(\d{1,2})(?:[:.h]?(\d{2}))?(a|am|a\.m\.|p|pm|p\.m\.)?$/.exec(s);
  if (!m) return null;
  const typed = m[1] || m[4];
  if (typed) { if (ap || (m[1] && m[4])) return null; ap = typed[0]; }
  let h = Number(m[2]);
  const min = m[3] ? Number(m[3]) : 0;
  if (min > 59) return null;
  // 12 and 0 are both the first hour of the half (ja writes 午前0:00).
  if (ap) { if (h > 12) return null; if (h === 12) h = 0; if (ap === "p") h += 12; }
  else if (h > 23) return null;
  return h * 60 + min;
}
