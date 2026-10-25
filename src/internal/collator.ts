"use client";
import { useLocale } from "./provider";

/* Building a Collator is slow next to comparing with one, so each locale and set of options gets one, kept.
   module state: a Collator holds no request's data, only how a locale sorts, so every request can share them. */
const made = new Map<string, Intl.Collator>();
/** The Collator for a locale, made once. Numbers inside text compare as numbers unless options say otherwise. */
export function collatorFor(locale: string, options?: Intl.CollatorOptions): Intl.Collator {
  const all: Intl.CollatorOptions = { numeric: true, ...options };
  const key = locale + "|" + JSON.stringify(all);
  let c = made.get(key);
  if (!c) {
    try { c = new Intl.Collator(locale, all); } catch { c = new Intl.Collator(undefined, all); }
    if (made.size > 50) made.clear();
    made.set(key, c);
  }
  return c;
}

/** An `Intl.Collator` for the locale the components use (the given one, else the nearest SerupaProvider's, else the
 *  browser's), for sorting options and table rows the way people expect: "Äpfel" beside "Apfel" in German,
 *  "Item 2" before "Item 10". `rows.sort((a, b) => compare(a.name, b.name))` with `const { compare } = useCollator()`.
 *  Pass `sensitivity: "base"` to treat "a", "A" and "á" as the same, or `numeric: false` to compare digits one by one. */
export function useCollator(options?: Intl.CollatorOptions & { locale?: string }): Intl.Collator {
  const { locale: own, ...rest } = options || {};
  return collatorFor(useLocale(own), rest);
}
