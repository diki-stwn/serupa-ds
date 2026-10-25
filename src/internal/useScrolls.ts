import * as React from "react";

/** Whether the element's content is taller or wider than it, so it scrolls. Kept up to date as the element or
 *  its content resizes, or content is added. A scrolling area needs Tab focus to be scrolled from the keyboard
 *  (outside Chromium, which scrolls the area under focus anyway), so callers make it focusable while this is true. */
export function useScrolls(el: HTMLElement | null): boolean {
  const [scrolls, setScrolls] = React.useState(false);
  React.useEffect(() => {
    if (!el || typeof ResizeObserver === "undefined") { setScrolls(false); return; }
    const check = () => setScrolls(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    const ro = new ResizeObserver(check);
    const watch = () => { ro.disconnect(); ro.observe(el); for (const c of Array.from(el.children)) ro.observe(c); check(); };
    const mo = typeof MutationObserver === "undefined" ? null : new MutationObserver(watch);
    if (mo) mo.observe(el, { childList: true });
    watch();
    return () => { ro.disconnect(); if (mo) mo.disconnect(); };
  }, [el]);
  return scrolls;
}
