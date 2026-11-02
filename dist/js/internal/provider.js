"use client";

// src/internal/provider.tsx
import * as React from "react";
import { isIconData } from "../icons.js";
import { DEFAULT_LABELS, SHARED_LABELS } from "./labels.js";
import { canonicalLocale } from "./locale.js";
import { warnOnce } from "./warn.js";
var NONE = { locale: void 0, labels: SHARED_LABELS, icons: /* @__PURE__ */ new Map(), platform: void 0 };
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
  const [kept, setKept] = React.useState(() => v);
  if (same(kept, v, depth)) return kept;
  setKept(() => v);
  return v;
}
function useSettings(own) {
  const settings = React.useContext(Context);
  return React.useMemo(() => own ? { ...settings, labels: Object.assign({}, own, settings.labels) } : settings, [settings, own]);
}
function useSerupa() {
  const settings = React.useContext(Context);
  return React.useMemo(() => ({ ...settings, labels: Object.assign({}, DEFAULT_LABELS, settings.labels) }), [settings]);
}
var SERVER_LOCALE = "en-US";
var seenLocale;
var forgetting = false;
var browserLocale = () => {
  if (seenLocale === void 0) {
    seenLocale = new Intl.DateTimeFormat().resolvedOptions().locale;
    if (!forgetting) {
      forgetting = true;
      window.addEventListener("languagechange", () => {
        seenLocale = void 0;
      });
    }
  }
  return seenLocale;
};
var onLanguageChange = (cb) => {
  window.addEventListener("languagechange", cb);
  return () => window.removeEventListener("languagechange", cb);
};
function usable(locale) {
  if (!locale) return void 0;
  const ok = canonicalLocale(locale);
  if (!ok && process.env.NODE_ENV !== "production") warnOnce("bad-locale", `Serupa: "${locale}" isn't a locale Intl can read, so it's ignored. Use a BCP 47 tag such as "en-US" or "id-ID".`, "bad-locale:" + locale);
  return ok;
}
function useLocale(own) {
  const fromProvider = React.useContext(Context).locale;
  const browser = React.useSyncExternalStore(onLanguageChange, browserLocale, () => SERVER_LOCALE);
  if (process.env.NODE_ENV !== "production" && !own && !fromProvider && typeof window === "undefined") warnOnce("server-locale", `Serupa: rendered on the server without a locale, so dates and numbers are ${SERVER_LOCALE} until hydration, then the browser's. Set <SerupaProvider locale> from the request.`);
  return usable(own) || usable(fromProvider) || browser;
}
function useOwnLang(own) {
  const base = useLocale(), mine = own ? canonicalLocale(own) : void 0;
  return mine && mine.toLowerCase() !== base.toLowerCase() ? mine : void 0;
}
export {
  SerupaProvider,
  useLocale,
  useOwnLang,
  useSerupa,
  useSettings
};
//# sourceMappingURL=provider.js.map
