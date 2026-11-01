// In its own module, without "use client", so a Server Component can call it (a function from a client module is
// only a reference there). FormattedNumber.tsx re-exports it.
import { canonicalLocale } from "../../internal/locale";
import { warnOnce } from "../../internal/warn";

/** How FormattedNumber writes a number: as is, short (1.2K), a share (45%), money, a file size or a unit. */
export type NumberFormat = 'decimal' | 'compact' | 'percent' | 'currency' | 'bytes' | 'unit';

export interface FormatNumberOptions extends Intl.NumberFormatOptions {
  /** 'decimal' (default), 'compact', 'percent' (0.45 is 45%), 'currency' (with currency), 'bytes' or 'unit' (with unit). */
  format?: NumberFormat;
}

import { pinCurrencyDigits } from "../../internal/currency";
import { formatSign } from "../../internal/numbers";

const BYTES = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte", "petabyte"];

/** The Intl.NumberFormat options for a format; your own options win. Bytes also give the number to format. */
function resolve(value: number | bigint, o: FormatNumberOptions): [number | bigint, Intl.NumberFormatOptions] {
  const { format = "decimal", ...given } = o;
  // Only the options that are set: Intl rejects an empty unit or currency even where the format doesn't use it.
  const own: Intl.NumberFormatOptions = {};
  for (const [k, v] of Object.entries(given)) if (v !== undefined && v !== "") (own as Record<string, unknown>)[k] = v;
  switch (format) {
    case "compact": return [value, { notation: "compact", ...own }];
    case "percent": return [value, { style: "percent", ...own }];
    // Without a currency (or a unit) there's nothing to write it in, so it falls back to a plain number.
    case "currency": return [value, own.currency ? pinCurrencyDigits({ style: "currency", ...own }) : own];
    case "unit": return [value, own.unit ? { style: "unit", unitDisplay: "short", ...own } : own];
    case "bytes": {
      // Steps of 1024 with the short names (kB, MB), like formatFileSize, so a size reads the same in both;
      // one decimal under 10 (1.5 MB), none above (820 kB) or for bytes.
      // A value that rounds up to 1024 steps up too, so 1,048,575 is "1 MB", not "1,024 kB".
      let n = Math.abs(Number(value)), i = 0;
      const digits = () => (own.maximumFractionDigits != null ? own.maximumFractionDigits : i && n < 10 ? 1 : 0);
      const rounded = () => { const f = 10 ** Math.min(20, Math.max(0, digits())); return Math.round(n * f) / f; };
      while ((n >= 1024 || rounded() >= 1024) && i < BYTES.length - 1) { n /= 1024; i++; }
      const signed = Number(value) < 0 ? -n : n;
      return [signed, { style: "unit", unit: BYTES[i], unitDisplay: "short", maximumFractionDigits: digits(), ...own }];
    }
    default: return [value, own];
  }
}

/* Building an Intl.NumberFormat costs some 30 times a format with one, and a table of numbers re-renders often,
   so each locale and set of options gets one, kept. Options Intl rejects (a currency "US", a unit "km/h",
   minimumFractionDigits over maximumFractionDigits) throw RangeError, which would unmount the tree: those fall
   back to the locale's plain number, with a warning in development.
   module state: a cache of formatters; a NumberFormat holds no request's data, only how a locale writes numbers,
   so every request can share them. */
const formatters = new Map<string, Intl.NumberFormat>();
function formatterFor(locale: string | undefined, o: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = (locale || "") + "|" + JSON.stringify(o);
  let f = formatters.get(key);
  if (!f) {
    try { f = new Intl.NumberFormat(locale, o); } catch (e) {
      if (process.env.NODE_ENV !== "production") warnOnce("number-options", `FormattedNumber: Intl can't use these options (${e instanceof Error ? e.message : String(e)}), so the number is written plainly. Check the currency (an ISO code such as "IDR") or unit (such as "kilometer-per-hour").`, "number-options:" + key);
      f = new Intl.NumberFormat(locale);
    }
    if (formatters.size > 200) formatters.clear();
    formatters.set(key, f);
  }
  return f;
}

/** A number in the locale's words: formatNumber(1234, "id-ID") is "1.234"; { format: "compact" } "1,2 rb"; "bytes" "1,5 MB". */
export function formatNumber(value: number | bigint, locale?: string, options?: FormatNumberOptions): string {
  if (typeof value === "number" && Number.isNaN(value)) return "";
  const [n, o] = resolve(value, options || {});
  return formatSign(formatterFor(locale ? canonicalLocale(locale) : undefined, o), n);
}
