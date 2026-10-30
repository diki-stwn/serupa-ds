// In its own module, without "use client", so a Server Component can call it (a function from a client module is
// only a reference there). FileUpload.tsx re-exports it.
import { formatNumber } from "../FormattedNumber/formatNumber";

/** A file size for people: 1.5 MB, 820 KB, 12 B. With a locale, in that locale's digits and units, the same as
 *  FormattedNumber format="bytes": formatFileSize(5_000_000, "id-ID") is "4,8 MB" (GR20). */
export function formatFileSize(bytes: number, locale?: string): string {
  if (!(bytes >= 0)) return "";
  // Only a string: sizes.map(formatFileSize) passes each index here.
  if (typeof locale === "string" && locale) return formatNumber(bytes, locale, { format: "bytes" });
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0, n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return (i === 0 ? String(n) : n >= 10 ? String(Math.round(n)) : String(Math.round(n * 10) / 10)) + " " + units[i];
}
