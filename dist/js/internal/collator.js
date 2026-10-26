"use client";

// src/internal/collator.ts
import { useLocale } from "./provider.js";
var made = /* @__PURE__ */ new Map();
function collatorFor(locale, options) {
  const all = { numeric: true, ...options };
  const key = locale + "|" + JSON.stringify(all);
  let c = made.get(key);
  if (!c) {
    try {
      c = new Intl.Collator(locale, all);
    } catch {
      c = new Intl.Collator(void 0, all);
    }
    if (made.size > 50) made.clear();
    made.set(key, c);
  }
  return c;
}
function useCollator(options) {
  const { locale: own, ...rest } = options || {};
  return collatorFor(useLocale(own), rest);
}
export {
  collatorFor,
  useCollator
};
//# sourceMappingURL=collator.js.map
