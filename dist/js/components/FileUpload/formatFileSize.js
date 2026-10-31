// src/components/FileUpload/formatFileSize.ts
import { formatNumber } from "../FormattedNumber/formatNumber.js";
function formatFileSize(bytes, locale) {
  if (!(bytes >= 0)) return "";
  if (typeof locale === "string" && locale) return formatNumber(bytes, locale, { format: "bytes" });
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0, n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return (i === 0 ? String(n) : n >= 10 ? String(Math.round(n)) : String(Math.round(n * 10) / 10)) + " " + units[i];
}
export {
  formatFileSize
};
//# sourceMappingURL=formatFileSize.js.map
