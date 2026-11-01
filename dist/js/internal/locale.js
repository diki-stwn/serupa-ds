// src/internal/locale.ts
var checked = /* @__PURE__ */ new Map();
function canonicalLocale(locale) {
  if (checked.has(locale)) return checked.get(locale);
  let ok;
  try {
    ok = Intl.getCanonicalLocales(locale.trim().replace(/_/g, "-"))[0];
  } catch {
    ok = void 0;
  }
  if (checked.size > 100) checked.clear();
  checked.set(locale, ok);
  return ok;
}
export {
  canonicalLocale
};
//# sourceMappingURL=locale.js.map
