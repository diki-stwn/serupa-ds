import { latinDigits } from "./digits";

// Numbers as people type them in their locale: "1.500,25" in id-ID and de-DE, "1,500.25" in en-US, "1 500,25" in fr.

// The Arabic decimal and group marks (٫ ٬, written with Arabic-Indic digits in ar-EG, fa and ps) as the marks the
// locale writes with Latin digits, which aren't always "." and ",": ps and uz-Arab write 1.234,5.
const arabic = (t: string, { group, decimal }: Symbols) => t.replace(/\u066b/g, decimal).replace(/\u066c/g, group);

interface Symbols { group: string; decimal: string }
// module state: a cache by locale.
const symbols = new Map<string, Symbols>();
function symbolsOf(locale?: string): Symbols {
  const key = locale || "";
  let s = symbols.get(key);
  if (!s) {
    // With Latin digits, as formatNumber writes them: a locale's own digits can come with other marks (ps: ٬ ٫ with
    // its Arabic-Indic digits, but . and , with Latin ones).
    const parts = new Intl.NumberFormat(locale, { numberingSystem: "latn" }).formatToParts(12345.6);
    s = { group: parts.find((p) => p.type === "group")?.value || ",", decimal: parts.find((p) => p.type === "decimal")?.value || "." };
    symbols.set(key, s);
  }
  return s;
}

const SPACE = /[\s\u00a0\u202f]/g;
// Whether the mark groups the digits: a first group of one to three that doesn't start with 0, then groups of three
// (or of two before the last three, as in hi-IN's 12,34,567).
const grouped = (t: string, mark: string) => {
  const chunks = t.split(mark);
  return chunks.length > 1 && /^[1-9]\d{0,2}$/.test(chunks[0]) && /^\d{3}$/.test(chunks[chunks.length - 1]) && chunks.slice(1, -1).every((c) => /^\d{2,3}$/.test(c));
};

/** A typed number in the locale's form, or null when empty, or undefined when it isn't a number (yet).
    The locale's decimal mark is always the decimal. Its group mark is read as grouping only when the digits are
    grouped in threes ("1.500" is 1500 in de-DE); otherwise a lone mark is the decimal ("9.5" or "9,5" is 9.5
    anywhere). Spaces, currency symbols and % around the number are ignored, and digits in any script are read. */
export function parseNumber(text: string, locale?: string): number | null | undefined {
  const sym = symbolsOf(locale), { group, decimal } = sym;
  const s = arabic(latinDigits(text), sym).replace(/[\u200e\u200f\u061c]/g, "").replace(/\u2212/g, "-").replace(SPACE, "");
  if (s === "") return null;
  // Text around the number (Rp, $, €, %, a minus) is fine; letters inside it are not. The text may hold dots away
  // from the digits, as unit abbreviations do ("กม.", "कि.मि.", "கி.மீ.").
  const parts = /^((?:[^0-9]*[^0-9.,'\u2019])?)([0-9.,'\u2019]*)((?:[^0-9.,'\u2019][^0-9]*)?)$/.exec(s);
  if (!parts || !/[0-9]/.test(parts[2])) return undefined;
  // A minus before or after the number ("1234.5-"), or accounting parentheses ("(Rp 1.500)"), make it negative.
  const neg = parts[1].includes("-") || parts[3].includes("-") || (parts[1].includes("(") && parts[3].includes(")"));
  let t = parts[2];
  if (/['\u2019]/.test(t)) { if (group !== "'" && group !== "\u2019") return undefined; t = t.replace(/['\u2019]/g, ""); }
  const marks = [...new Set(t.replace(/[0-9-]/g, ""))];
  let normal: string;
  if (marks.length === 0) normal = t;
  else if (marks.length === 2) {
    // Both marks: the last one is the decimal, the other one groups.
    const last = t[Math.max(t.lastIndexOf("."), t.lastIndexOf(","))];
    const other = last === "." ? "," : ".";
    const [int, frac, extra] = t.split(last);
    if (extra !== undefined || !grouped(int, other)) return undefined;
    normal = int.split(other).join("") + "." + frac;
  } else {
    const m = marks[0];
    if (m === decimal && m !== group) { const [int, frac, extra] = t.split(m); if (extra !== undefined) return undefined; normal = int + "." + frac; }
    else if (grouped(t, m)) normal = t.split(m).join("");
    else { const [int, frac, extra] = t.split(m); if (extra !== undefined) return undefined; normal = int + "." + frac; }
  }
  if (normal.endsWith(".")) return undefined;
  const n = Number(normal);
  return isFinite(n) ? (neg ? -n : n) : undefined;
}

// module state: a cache by locale and options.
const formats = new Map<string, Intl.NumberFormat>();
/** A number as the locale writes it, with Latin digits unless options set a numberingSystem. Without options, no
    grouping and every decimal the value has ("9,5" in de-DE, "1500" not "1.500"), so it reads back as it is. */
export function formatNumber(n: number, locale?: string, options?: Intl.NumberFormatOptions): string {
  const key = (locale || "") + "|" + (options ? JSON.stringify(options) : "");
  let f = formats.get(key);
  if (!f) formats.set(key, f = new Intl.NumberFormat(locale, { numberingSystem: "latn", ...(options || { useGrouping: false, maximumFractionDigits: 20 }) }));
  return f.format(n);
}

// module state: a cache by locale and options.
const shown = new Map<string, Intl.NumberFormat>();
/** A number to show, not to type: in the locale's own digits and signs, as Calendar shows its days ("٤٥٪" in ar-EG,
    "%45" in tr-TR, "45 %" in fr-FR as a percentage). formatNumber is for what a field reads back. */
export function displayNumber(n: number, locale?: string, options?: Intl.NumberFormatOptions): string {
  const key = (locale || "") + "|" + (options ? JSON.stringify(options) : "");
  let f = shown.get(key);
  if (!f) shown.set(key, f = new Intl.NumberFormat(locale, options));
  return f.format(n);
}
