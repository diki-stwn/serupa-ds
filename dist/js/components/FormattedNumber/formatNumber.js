// src/components/FormattedNumber/formatNumber.ts
var BYTES = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte", "petabyte"];
function resolve(value, o) {
  const { format = "decimal", ...given } = o;
  const own = {};
  for (const [k, v] of Object.entries(given)) if (v !== void 0 && v !== "") own[k] = v;
  switch (format) {
    case "compact":
      return [value, { notation: "compact", ...own }];
    case "percent":
      return [value, { style: "percent", ...own }];
    // Without a currency (or a unit) there's nothing to write it in, so it falls back to a plain number.
    case "currency":
      return [value, own.currency ? { style: "currency", ...own } : own];
    case "unit":
      return [value, own.unit ? { style: "unit", unitDisplay: "short", ...own } : own];
    case "bytes": {
      let n = Math.abs(Number(value)), i = 0;
      while (n >= 1024 && i < BYTES.length - 1) {
        n /= 1024;
        i++;
      }
      const signed = Number(value) < 0 ? -n : n;
      return [signed, { style: "unit", unit: BYTES[i], unitDisplay: "short", maximumFractionDigits: i && n < 10 ? 1 : 0, ...own }];
    }
    default:
      return [value, own];
  }
}
function formatNumber(value, locale, options) {
  if (typeof value === "number" && Number.isNaN(value)) return "";
  const [n, o] = resolve(value, options || {});
  return new Intl.NumberFormat(locale, o).format(n);
}
export {
  formatNumber
};
//# sourceMappingURL=formatNumber.js.map
