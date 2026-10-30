"use client";

// src/components/RelativeTime/RelativeTime.tsx
import * as React from "react";
import { cn, omit } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { canonicalLocale } from "../../internal/locale.js";
import { useLocale, useOwnLang } from "../../internal/provider.js";
import { warnOnce } from "../../internal/warn.js";
var TICK = 15e3;
var now = Date.now();
var listeners = /* @__PURE__ */ new Set();
var timer = null;
var tick = () => {
  now = Date.now();
  listeners.forEach((l) => l());
};
var onVisible = () => {
  if (document.visibilityState === "visible") tick();
};
function subscribe(cb) {
  listeners.add(cb);
  if (!timer) {
    timer = setInterval(tick, TICK);
    document.addEventListener("visibilitychange", onVisible);
    if (Date.now() - now > 1e3) tick();
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}
var getNow = () => {
  if (!timer && Date.now() - now > TICK) now = Date.now();
  return now;
};
var serverNow = -Infinity;
var getServerNow = () => {
  const t = Date.now();
  if (t - serverNow > 1e3 || t < serverNow) serverNow = t;
  return serverNow;
};
var UNITS = [
  // [unit, its length in seconds, use it while the gap is under this many seconds]
  ["second", 1, 45],
  ["minute", 60, 45 * 60],
  ["hour", 3600, 22 * 3600],
  ["day", 86400, 26 * 86400],
  ["month", 2629800, 320 * 86400],
  ["year", 31557600, Infinity]
];
function relativeTime(date, now2, locale, options) {
  const t = new Date(date).getTime();
  if (!isFinite(t)) return "";
  const secs = (t - now2) / 1e3, abs = Math.abs(secs);
  const rtf = new Intl.RelativeTimeFormat(locale ? canonicalLocale(locale) : void 0, { style: options?.format || "long", numeric: options?.numeric || "auto" });
  let i = UNITS.findIndex(([, , under]) => abs < under);
  if (i === 0) return rtf.format(0, "second");
  if (options?.numeric !== "always") {
    const a = new Date(t), b = new Date(now2);
    for (; i >= 3; i--) {
      const n = i === 3 ? Math.round((Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) / 864e5) : i === 4 ? (a.getFullYear() - b.getFullYear()) * 12 + a.getMonth() - b.getMonth() : a.getFullYear() - b.getFullYear();
      if (n !== 0) return rtf.format(n, UNITS[i][0]);
    }
  }
  return rtf.format(Math.round(secs / UNITS[i][1]), UNITS[i][0]);
}
var RelativeTime = /* @__PURE__ */ component("RelativeTime", function RelativeTime2(props, ref) {
  const rest = omit(props, { date: 1, format: 1, numeric: 1, titleFormat: 1, locale: 1, className: 1 });
  const locale = useLocale(props.locale), lang = useOwnLang(props.locale);
  const current = React.useSyncExternalStore(subscribe, getNow, getServerNow);
  const d = new Date(props.date), valid = isFinite(d.getTime());
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production" && !valid) warnOnce("relative-time-date", "RelativeTime: date " + JSON.stringify(String(props.date)) + ` isn't a date, so it shows nothing. Pass a Date, a timestamp in ms, or a string Date can read, such as "2026-10-24T09:30:00Z".`);
  }, [valid, props.date]);
  const text = valid ? relativeTime(d, current, locale, { format: props.format, numeric: props.numeric }) : "";
  const title = !valid || props.titleFormat === false ? void 0 : new Intl.DateTimeFormat(locale, props.titleFormat || { dateStyle: "long", timeStyle: "short" }).format(d);
  return /* @__PURE__ */ React.createElement(
    "time",
    {
      lang,
      ...rest,
      ref,
      dateTime: valid ? d.toISOString() : void 0,
      title: rest.title ?? title,
      className: cn("dk-relative-time", props.className),
      "data-component": "relative-time",
      suppressHydrationWarning: true
    },
    text
  );
});
export {
  RelativeTime,
  relativeTime
};
//# sourceMappingURL=RelativeTime.js.map
