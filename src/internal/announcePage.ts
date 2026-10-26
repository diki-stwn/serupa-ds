import { announce } from "./announce";

/** What announcePage takes: the title to say (default: document.title), and where focus goes (default: the h1 in
 * <main>, else the first h1, else <main>; an element or a selector; false leaves focus where it is). */
export interface AnnouncePageOptions {
  title?: string;
  focus?: Element | string | false;
}

/* announcePage: what a single-page app does after a client-side route change, which a browser would have done on
   a full page load. Focus moves to the new page's main heading (made focusable with tabindex="-1" if it isn't), so
   keyboard and screen reader users start there instead of on a link that may be gone, and the page's title is
   said through the shared polite announcer. A focused heading is read out already, so the title is said only when
   it says something else ("Invoices · Acme" after the heading "Invoices") or nothing took focus. Call it once the
   new page has rendered, in an effect on the location. */
/** After a client-side route change: focuses the new page's main heading and says its title to screen readers. */
export function announcePage(options?: AnnouncePageOptions): void {
  if (typeof document === "undefined") return;
  const o = options || {};
  const pick = (s: string) => document.querySelector(s);
  const target = o.focus === false ? null : o.focus && typeof o.focus === "object" ? o.focus : o.focus ? pick(o.focus) : pick("main h1") || pick("h1") || pick("main");
  if (target instanceof HTMLElement || target instanceof SVGElement) {
    if (!target.hasAttribute("tabindex") && target.tabIndex < 0) target.setAttribute("tabindex", "-1");
    target.focus();
  }
  const read = target && document.activeElement === target ? (target.textContent || "").trim() : "";
  const title = (o.title != null ? o.title : document.title).trim();
  if (title && title !== read) announce(title);
}
