// src/internal/numbers.ts
import { latinDigits } from "./digits.js";
var arabic = (t, { group, decimal }) => t.replace(/\u066b/g, decimal).replace(/\u066c/g, group);
var symbols = /* @__PURE__ */ new Map();
function symbolsOf(locale) {
  const key = locale || "";
  let s = symbols.get(key);
  if (!s) {
    const parts = new Intl.NumberFormat(locale, { numberingSystem: "latn" }).formatToParts(12345.6);
    s = { group: parts.find((p) => p.type === "group")?.value || ",", decimal: parts.find((p) => p.type === "decimal")?.value || "." };
    symbols.set(key, s);
  }
  return s;
}
var SPACE = /[\s\u00a0\u202f]/g;
var grouped = (t, mark) => {
  const chunks = t.split(mark);
  return chunks.length > 1 && /^[1-9]\d{0,2}$/.test(chunks[0]) && /^\d{3}$/.test(chunks[chunks.length - 1]) && chunks.slice(1, -1).every((c) => /^\d{2,3}$/.test(c));
};
function parseNumber(text, locale) {
  const sym = symbolsOf(locale), { group, decimal } = sym;
  const s = arabic(latinDigits(text.normalize("NFKC")), sym).replace(/[\u200e\u200f\u061c]/g, "").replace(/\u2212/g, "-").replace(SPACE, "");
  if (s === "") return null;
  const parts = /^((?:[^0-9]*[^0-9.,'\u2019])?)([0-9.,'\u2019]*)((?:[^0-9.,'\u2019][^0-9]*)?)$/.exec(s);
  if (!parts || !/[0-9]/.test(parts[2])) return void 0;
  const neg = parts[1].includes("-") || parts[3].includes("-") || parts[1].includes("(") && parts[3].includes(")");
  let t = parts[2];
  if (/['\u2019]/.test(t)) {
    if (group !== "'" && group !== "\u2019") return void 0;
    t = t.replace(/['\u2019]/g, "");
  }
  const marks = [...new Set(t.replace(/[0-9-]/g, ""))];
  let normal;
  if (marks.length === 0) normal = t;
  else if (marks.length === 2) {
    const last = t[Math.max(t.lastIndexOf("."), t.lastIndexOf(","))];
    const other = last === "." ? "," : ".";
    const [int, frac, extra] = t.split(last);
    if (extra !== void 0 || !grouped(int, other)) return void 0;
    normal = int.split(other).join("") + "." + frac;
  } else {
    const m = marks[0];
    if (m === decimal && m !== group) {
      const [int, frac, extra] = t.split(m);
      if (extra !== void 0) return void 0;
      normal = int + "." + frac;
    } else if (grouped(t, m)) normal = t.split(m).join("");
    else {
      const [int, frac, extra] = t.split(m);
      if (extra !== void 0) return void 0;
      normal = int + "." + frac;
    }
  }
  if (normal.endsWith(".")) return void 0;
  const n = Number(normal);
  return isFinite(n) ? neg ? -n : n : void 0;
}
var formats = /* @__PURE__ */ new Map();
function formatNumber(n, locale, options) {
  const key = (locale || "") + "|" + (options ? JSON.stringify(options) : "");
  let f = formats.get(key);
  if (!f) formats.set(key, f = new Intl.NumberFormat(locale, { numberingSystem: "latn", ...options || { useGrouping: false, maximumFractionDigits: 20 } }));
  return f.format(n);
}
function formatSign(f, n) {
  if (typeof n !== "number" || !(n < 0 || Object.is(n, -0)) || f.resolvedOptions().signDisplay !== "auto") return f.format(n);
  const zero = f.format(0);
  return f.format(-n) === zero ? zero : f.format(n);
}
var shown = /* @__PURE__ */ new Map();
function displayNumber(n, locale, options) {
  const key = (locale || "") + "|" + (options ? JSON.stringify(options) : "");
  let f = shown.get(key);
  if (!f) shown.set(key, f = new Intl.NumberFormat(locale, options));
  return formatSign(f, n);
}
export {
  displayNumber,
  formatNumber,
  formatSign,
  parseNumber
};
//# sourceMappingURL=numbers.js.map
