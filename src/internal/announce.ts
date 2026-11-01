import { onModalChange, topModal } from "./layers";
import { pageShared } from "./pageShared";

// Two shared, visually hidden live regions: a polite one (WAI-ARIA status) for Button and Badge loading, Loader
// and toasts, and an assertive one for danger toasts. The polite one is created when the first Button mounts, so
// it already exists when a button starts loading, and screen readers announce the change. They live in the
// innermost open modal (Dialog, Drawer), since the page behind one is inert and isn't read, and on <body> otherwise.
type Channel = { el: HTMLDivElement | null; queue: string[]; since: number; timer: ReturnType<typeof setTimeout> | null };
// Kept once per page (pageShared): a second copy of the package says its messages through the same two regions,
// in turn with this one's, rather than adding its own.
const channel = (): Channel => ({ el: null, queue: [], since: 0, timer: null });
const { polite, assertive } = pageShared("announce@1", () => ({ polite: channel(), assertive: channel() }));
const HOLD = 500;   // each message stays this long before the next one replaces it, so a quick second one doesn't drop the first

const home = () => topModal() || document.body;
// module state: browser only (it watches the page's open modals); a server render never sets it. Each copy of the
// package watches for itself: both move the same two regions to the same place.
let watching = false;
function region(ch: Channel, live: "polite" | "assertive"): HTMLDivElement | null {
  if (ch.el || typeof document === "undefined") return ch.el;
  const el = document.createElement("div");
  el.setAttribute("role", live === "polite" ? "status" : "alert");
  el.setAttribute("aria-live", live);
  el.setAttribute(live === "polite" ? "data-dk-announcer" : "data-dk-announcer-assertive", "");
  // Hidden the way the sr-only utility hides (kept as the class too), set inline so it holds without utilities.css.
  el.className = "sr-only";
  el.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0";
  home().appendChild(el);
  ch.el = el;
  if (!watching) {
    watching = true;
    onModalChange(() => { for (const c of [polite, assertive]) if (c.el && c.el.parentNode !== home()) home().appendChild(c.el); });
  }
  return el;
}

export function ensureAnnouncer(): HTMLDivElement | null {
  return region(polite, "polite");
}

function pump(ch: Channel): void {
  if (ch.timer || !ch.queue.length || !ch.el) return;
  const el = ch.el;
  // At most HOLD: if the clock went back (a system time change, a test's fake clock), the wait doesn't grow with it.
  const wait = Math.min(HOLD, Math.max(0, ch.since + HOLD - Date.now()));
  ch.timer = setTimeout(function () {
    el.textContent = "";
    // Cleared first so the same text is announced again.
    ch.timer = setTimeout(function () {
      ch.timer = null;
      if (!el.isConnected) home().appendChild(el);
      el.textContent = ch.queue.shift() || "";
      ch.since = Date.now();
      pump(ch);
    }, 50);
  }, wait);
}

/** text is already one of the sentences waiting in queued. */
function said(queued: string, text: string): boolean {
  if (queued === text) return true;
  const at = queued.indexOf(text);
  return at >= 0 && (at === 0 || /[.!?…。] $/.test(queued.slice(0, at)) || queued.slice(at - 2, at) === ". ") && (at + text.length === queued.length || /^(\.? )/.test(queued.slice(at + text.length)));
}

/** Says text to screen readers through the live regions the components use, which move into an open Dialog or Drawer
 *  so they're heard there too. A burst is said as one message. assertive interrupts what's being read: only for errors. */
export function announce(text: string, options?: { assertive?: boolean }): void {
  const ch = options && options.assertive ? assertive : polite;
  if (!region(ch, options && options.assertive ? "assertive" : "polite")) return;
  // At most one message waits: a burst is said as one, so nothing is dropped and nothing is said late.
  // Joined as sentences: ". " after a message that doesn't end in its own stop, a space after one that does
  // ("Picked up Apollo, position 1 of 3. Apollo, position 2 of 3."), never "3.. Apollo".
  if (!ch.queue.length) ch.queue.push(text);
  else if (!said(ch.queue[0], text)) ch.queue[0] += (/[.!?…。]$/.test(ch.queue[0]) ? " " : ". ") + text;
  pump(ch);
}

/** True when nothing waits to be said (tests wait for this before checking what a component announces). @testseam */
export function announcerIdle(): boolean {
  return !polite.timer && !polite.queue.length && !assertive.timer && !assertive.queue.length;
}
