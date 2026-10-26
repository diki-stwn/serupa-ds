import * as React from "react";

/* The color scheme an element is drawn in: "dark" or "light" when its color-scheme names only one (a *-dark or *-light
   theme, or a data-mode, sets it), or null when it follows the screen's (light dark, normal), where a
   prefers-color-scheme media query gives the answer. */
export function schemeOf(el: Element): "light" | "dark" | null {
  const s = getComputedStyle(el).colorScheme || "";
  const dark = /\bdark\b/.test(s), light = /\blight\b/.test(s);
  return dark && !light ? "dark" : light && !dark ? "light" : null;
}

// module state: the browser's one observer of theme attributes and its listeners; a server never subscribes.
const listeners = new Set<() => void>();
let observer: MutationObserver | null = null, changes = 0;
function subscribe(f: () => void) {
  listeners.add(f);
  if (!observer) {
    observer = new MutationObserver(() => { changes++; for (const l of listeners) l(); });
    observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ["data-theme", "data-mode", "data-brand"] });
  }
  return () => { listeners.delete(f); if (!listeners.size && observer) { observer.disconnect(); observer = null; } };
}
const none = () => 0, noSubscribe = () => () => {}, current = () => changes;

/* A number that changes whenever a data-theme, data-mode or data-brand attribute changes anywhere on the page, for
   an effect that reads schemeOf again. Pass false to skip watching. */
export function useThemeChanges(watch: boolean): number {
  return React.useSyncExternalStore(watch ? subscribe : noSubscribe, watch ? current : none, none);
}
