// serupa-ds/labels/en: every built-in word in English, the default. A language pack is an entry of its own, so a
// project loads only the languages it imports: import { labels, locale } from "serupa-ds/labels/<language>", then
// <SerupaProvider locale={locale} labels={labels}>.
export { DEFAULT_LABELS as labels } from "../internal/labels";
/** The locale the words are written for. */
export const locale = "en";
