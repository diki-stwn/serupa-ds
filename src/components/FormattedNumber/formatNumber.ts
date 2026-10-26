// In its own module, without "use client", so a Server Component can call it (a function from a client module is
// only a reference there). FormattedNumber.tsx re-exports it.

/** How FormattedNumber writes a number: as is, short (1.2K), a share (45%), money, a file size or a unit. */
export type NumberFormat = 'decimal' | 'compact' | 'percent' | 'currency' | 'bytes' | 'unit';

export interface FormatNumberOptions extends Intl.NumberFormatOptions {
  /** 'decimal' (default), 'compact', 'percent' (0.45 is 45%), 'currency' (with currency), 'bytes' or 'unit' (with unit). */
  format?: NumberFormat;
}

import { pinCurrencyDigits } from "../../internal/currency";

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
      let n = Math.abs(Number(value)), i = 0;
      while (n >= 1024 && i < BYTES.length - 1) { n /= 1024; i++; }
      const signed = Number(value) < 0 ? -n : n;
      return [signed, { style: "unit", unit: BYTES[i], unitDisplay: "short", maximumFractionDigits: i && n < 10 ? 1 : 0, ...own }];
    }
    default: return [value, own];
  }
}

/** A number in the locale's words: formatNumber(1234, "id-ID") is "1.234"; { format: "compact" } "1,2 rb"; "bytes" "1,5 MB". */
export function formatNumber(value: number | bigint, locale?: string, options?: FormatNumberOptions): string {
  if (typeof value === "number" && Number.isNaN(value)) return "";
  const [n, o] = resolve(value, options || {});
  return new Intl.NumberFormat(locale, o).format(n);
}
