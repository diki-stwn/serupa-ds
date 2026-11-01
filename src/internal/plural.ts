import { canonicalLocale } from "./locale";

/** The words for a count in each plural category a language has (CLDR: zero, one, two, few, many, other). Only
 *  `other` is required; a category left out falls back to it. A `#` stands for the count, written the locale's way. */
export interface PluralForms {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

/* module state: each locale's PluralRules and NumberFormat, made once (building them is slow next to using them).
   They hold no request's data, only a language's rules, so every request can share them. */
const rules = new Map<string, [Intl.PluralRules, Intl.NumberFormat]>();
function toolsFor(locale: string): [Intl.PluralRules, Intl.NumberFormat] {
  let t = rules.get(locale);
  if (!t) {
    const l = canonicalLocale(locale) ?? "en";
    t = [new Intl.PluralRules(l), new Intl.NumberFormat(l)];
    if (rules.size > 50) rules.clear();
    rules.set(locale, t);
  }
  return t;
}

/** The words for `count` in `locale`'s plural rules (Intl.PluralRules), with `#` replaced by the count. For labels whose
 *  words change with a number, in languages with more than "1" and "the rest":
 *  `resultsCount: (n) => plural("ru", n, { one: "# результат", few: "# результата", many: "# результатов", other: "# результата" })`.
 *  A locale Intl can't read is treated as English. */
export function plural(locale: string, count: number, forms: PluralForms): string {
  const [pr, nf] = toolsFor(locale);
  const words = forms[pr.select(count)] ?? forms.other;
  return words.includes("#") ? words.replace(/#/g, nf.format(count)) : words;
}
