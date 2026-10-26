"use client";

// src/internal/provider.tsx
import * as React from "react";
import { isIconData } from "../icons.js";
import { DEFAULT_LABELS } from "./labels.js";
import { warnOnce } from "./warn.js";
var NONE = { locale: void 0, labels: DEFAULT_LABELS, icons: /* @__PURE__ */ new Map(), platform: void 0 };
var Context = /* @__PURE__ */ React.createContext(NONE);
function SerupaProvider(props) {
  const outer = React.useContext(Context);
  const { locale, platform } = props;
  const labels = useSameAsBefore(props.labels, 0), icons = useSameAsBefore(props.icons, 1);
  const value = React.useMemo(() => {
    const merged = { ...outer.labels };
    if (labels) for (const k of Object.keys(labels)) {
      const v = labels[k];
      if (v != null && v !== "") merged[k] = v;
    }
    let map = outer.icons;
    if (icons) {
      const m = new Map(outer.icons);
      for (const x of Array.isArray(icons) ? icons : [icons]) {
        if (isIconData(x)) m.set(x.name, x);
        else for (const v of Object.values(x)) if (isIconData(v)) m.set(v.name, v);
      }
      map = m;
    }
    return { locale: locale || outer.locale, labels: merged, icons: map, platform: platform === "apple" || platform === "other" ? platform : outer.platform };
  }, [outer, locale, labels, icons, platform]);
  return /* @__PURE__ */ React.createElement(Context.Provider, { value }, props.children);
}
SerupaProvider.displayName = "SerupaProvider";
function same(a, b, depth) {
  if (a === b) return true;
  if (!a || !b || typeof a != "object" || typeof b != "object") return false;
  const x = a, y = b, keys = Object.keys(x);
  return keys.length == Object.keys(y).length && keys.every((k) => depth ? same(x[k], y[k], depth - 1) : x[k] === y[k]);
}
function useSameAsBefore(v, depth) {
  const kept = React.useRef(v);
  if (!same(kept.current, v, depth)) kept.current = v;
  return kept.current;
}
function useSerupa() {
  return React.useContext(Context);
}
var SERVER_LOCALE = "en-US";
var browserLocale = () => new Intl.DateTimeFormat().resolvedOptions().locale;
var onLanguageChange = (cb) => {
  window.addEventListener("languagechange", cb);
  return () => window.removeEventListener("languagechange", cb);
};
function useLocale(own) {
  const fromProvider = React.useContext(Context).locale;
  const browser = React.useSyncExternalStore(onLanguageChange, browserLocale, () => SERVER_LOCALE);
  if (process.env.NODE_ENV !== "production" && !own && !fromProvider && typeof window === "undefined") warnOnce("server-locale", `Serupa: rendered on the server without a locale, so dates and numbers are ${SERVER_LOCALE} until hydration, then the browser's. Set <SerupaProvider locale> from the request.`);
  return own || fromProvider || browser;
}
function useOwnLang(own) {
  const base = useLocale();
  return own && own.toLowerCase() !== base.toLowerCase() ? own : void 0;
}
export {
  SerupaProvider,
  useLocale,
  useOwnLang,
  useSerupa
};
//# sourceMappingURL=provider.js.map
