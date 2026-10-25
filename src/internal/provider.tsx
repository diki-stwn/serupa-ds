"use client";
import * as React from "react";
import type { IconData } from "../material/types";
import { isIconData } from "../icons";
import { DEFAULT_LABELS, type SerupaLabels } from "./labels";
import { warnOnce } from "./warn";

export interface SerupaProviderProps {
  /** A BCP 47 locale (such as "id-ID") for Calendar, DatePicker, DateRangePicker, TimePicker and NumberInput: how dates, times and numbers
   *  are written and typed, month and weekday names, and the first day of the week. Default: the browser's. */
  locale?: string;
  /** Replaces some or all of the words the components say on their own, such as { close: "Tutup" }, or a whole
   *  set (idLabels). Keys left out keep the outer provider's words, else English. */
  labels?: Partial<SerupaLabels>;
  /** Icons that work by name inside this provider, in the shape registerIcons takes: one icon, or a module of them. */
  icons?: Array<IconData | Readonly<Record<string, IconData>>> | IconData | Readonly<Record<string, IconData>>;
  /** The device's platform, for Kbd's key names (⌘ or Ctrl): 'apple' or 'other'. Set it from the request (the
   *  User-Agent or Sec-CH-UA-Platform header) so the server writes the right keys and nothing changes on hydration.
   *  Default: found on the device after it mounts. */
  platform?: 'apple' | 'other';
  children?: React.ReactNode;
}

/** What the components read: the nearest provider's settings, merged with the outer ones. */
export interface SerupaSettings {
  locale: string | undefined;
  labels: SerupaLabels;
  icons: ReadonlyMap<string, IconData>;
  platform: 'apple' | 'other' | undefined;
}

const NONE: SerupaSettings = { locale: undefined, labels: DEFAULT_LABELS, icons: new Map(), platform: undefined };
const Context = React.createContext<SerupaSettings>(NONE);

/* SerupaProvider: settings for every component inside it (ADR-0010), as React context rather than module state, so
   they reach client components from a server layout, differ between concurrent server requests, and can change for
   one part of a page. Nested providers merge: an inner one changes only what it sets. labels and icons written
   inline (a new object each render, with the same contents) keep the settings as they were, so a parent's render
   doesn't re-render every component under it. */
/** Locale, built-in words and extra icons for every component inside it. A component's own prop still wins. */
export function SerupaProvider(props: SerupaProviderProps): React.ReactElement {
  const outer = React.useContext(Context);
  const { locale, platform } = props;
  const labels = useSameAsBefore(props.labels, 0), icons = useSameAsBefore(props.icons, 1);   // icons={[{ Star }]}: one level deeper
  const value = React.useMemo<SerupaSettings>(() => {
    const merged: SerupaLabels = { ...outer.labels };
    if (labels) for (const k of Object.keys(labels) as (keyof SerupaLabels)[]) {
      const v = labels[k];
      if (v != null && v !== "") (merged as unknown as Record<string, unknown>)[k] = v;
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
  return <Context.Provider value={value}>{props.children}</Context.Provider>;
}
SerupaProvider.displayName = "SerupaProvider";

// The same keys holding the same values (===, or compared the same way depth levels further down): an object or
// array written inline again with the same contents. A key missing on one side and undefined on the other counts as
// the same, as it does when the settings are merged.
function same(a: unknown, b: unknown, depth: number): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a != "object" || typeof b != "object") return false;
  const x = a as Record<string, unknown>, y = b as Record<string, unknown>, keys = Object.keys(x);
  return keys.length == Object.keys(y).length && keys.every((k) => (depth ? same(x[k], y[k], depth - 1) : x[k] === y[k]));
}
/** The value from the render before while the new one has the same contents, so a memo that depends on it holds. */
function useSameAsBefore<T>(v: T, depth: number): T {
  const kept = React.useRef(v);
  if (!same(kept.current, v, depth)) kept.current = v;
  return kept.current;
}

/** The nearest SerupaProvider's settings, or the defaults (browser locale, English words) without one. */
export function useSerupa(): SerupaSettings {
  return React.useContext(Context);
}

/* With no locale from a prop or a provider, a component follows the browser's. The server can't know it, so
   server HTML and the first client render use SERVER_LOCALE, and React switches to the browser's right after
   hydration (useSyncExternalStore's server snapshot). A client-only render uses the browser's from the start. */
const SERVER_LOCALE = "en-US";
const browserLocale = () => new Intl.DateTimeFormat().resolvedOptions().locale;
const onLanguageChange = (cb: () => void) => { window.addEventListener("languagechange", cb); return () => window.removeEventListener("languagechange", cb); };
/** The locale a component uses: its own prop, else the nearest SerupaProvider's, else the browser's (en-US until hydrated). */
export function useLocale(own?: string): string {
  const fromProvider = React.useContext(Context).locale;
  const browser = React.useSyncExternalStore(onLanguageChange, browserLocale, () => SERVER_LOCALE);
  // Said on the server, where the switch after hydration can't be seen yet; once per process.
  if (!own && !fromProvider && typeof window === "undefined") warnOnce("server-locale", `Serupa: rendered on the server without a locale, so dates and numbers are ${SERVER_LOCALE} until hydration, then the browser's. Set <SerupaProvider locale> from the request.`);
  return own || fromProvider || browser;
}
/** The lang for text a component writes in its own locale prop, when that differs from the locale it would use
 *  without one (the provider's, else the browser's), so screen readers read "Januari" in an Indonesian voice on an
 *  English page (F13). undefined when the prop is unset or the same. */
export function useOwnLang(own?: string): string | undefined {
  const base = useLocale();
  return own && own.toLowerCase() !== base.toLowerCase() ? own : undefined;
}
