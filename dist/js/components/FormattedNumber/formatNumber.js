// src/components/FormattedNumber/formatNumber.ts
import { canonicalLocale } from "../../internal/locale.js";
import { warnOnce } from "../../internal/warn.js";
import { pinCurrencyDigits } from "../../internal/currency.js";
import { formatSign } from "../../internal/numbers.js";
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
      return [value, own.currency ? pinCurrencyDigits({ style: "currency", ...own }) : own];
    case "unit":
      return [value, own.unit ? { style: "unit", unitDisplay: "short", ...own } : own];
    case "bytes": {
      let n = Math.abs(Number(value)), i = 0;
      const digits = () => own.maximumFractionDigits != null ? own.maximumFractionDigits : i && n < 10 ? 1 : 0;
      const rounded = () => {
        const f = 10 ** Math.min(20, Math.max(0, digits()));
        return Math.round(n * f) / f;
      };
      while ((n >= 1024 || rounded() >= 1024) && i < BYTES.length - 1) {
        n /= 1024;
        i++;
      }
      const signed = Number(value) < 0 ? -n : n;
      return [signed, { style: "unit", unit: BYTES[i], unitDisplay: "short", maximumFractionDigits: digits(), ...own }];
    }
    default:
      return [value, own];
  }
}
var formatters = /* @__PURE__ */ new Map();
function formatterFor(locale, o) {
  const key = (locale || "") + "|" + JSON.stringify(o);
  let f = formatters.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(locale, o);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") warnOnce("number-options", `FormattedNumber: Intl can't use these options (${e instanceof Error ? e.message : String(e)}), so the number is written plainly. Check the currency (an ISO code such as "IDR") or unit (such as "kilometer-per-hour").`, "number-options:" + key);
      f = new Intl.NumberFormat(locale);
    }
    if (formatters.size > 200) formatters.clear();
    formatters.set(key, f);
  }
  return f;
}
function formatNumber(value, locale, options) {
  if (typeof value === "number" && Number.isNaN(value)) return "";
  const [n, o] = resolve(value, options || {});
  return formatSign(formatterFor(locale ? canonicalLocale(locale) : void 0, o), n);
}
export {
  formatNumber
};
//# sourceMappingURL=formatNumber.js.map
