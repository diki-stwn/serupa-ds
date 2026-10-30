// src/internal/scheme.ts
import * as React from "react";
function schemeOf(el) {
  const s = getComputedStyle(el).colorScheme || "";
  const dark = /\bdark\b/.test(s), light = /\blight\b/.test(s);
  return dark && !light ? "dark" : light && !dark ? "light" : null;
}
var listeners = /* @__PURE__ */ new Set();
var observer = null;
var changes = 0;
function subscribe(f) {
  listeners.add(f);
  if (!observer) {
    observer = new MutationObserver(() => {
      changes++;
      for (const l of listeners) l();
    });
    observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ["data-theme", "data-mode", "data-brand"] });
  }
  return () => {
    listeners.delete(f);
    if (!listeners.size && observer) {
      observer.disconnect();
      observer = null;
    }
  };
}
var none = () => 0;
var noSubscribe = () => () => {
};
var current = () => changes;
function useThemeChanges(watch) {
  return React.useSyncExternalStore(watch ? subscribe : noSubscribe, watch ? current : none, none);
}
export {
  schemeOf,
  useThemeChanges
};
//# sourceMappingURL=scheme.js.map
