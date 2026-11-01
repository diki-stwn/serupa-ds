// src/internal/plural.ts
import { canonicalLocale } from "./locale.js";
var rules = /* @__PURE__ */ new Map();
function toolsFor(locale) {
  let t = rules.get(locale);
  if (!t) {
    const l = canonicalLocale(locale) ?? "en";
    t = [new Intl.PluralRules(l), new Intl.NumberFormat(l)];
    if (rules.size > 50) rules.clear();
    rules.set(locale, t);
  }
  return t;
}
function plural(locale, count, forms) {
  const [pr, nf] = toolsFor(locale);
  const words = forms[pr.select(count)] ?? forms.other;
  return words.includes("#") ? words.replace(/#/g, nf.format(count)) : words;
}
export {
  plural
};
//# sourceMappingURL=plural.js.map
