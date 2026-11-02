// src/internal/announce.ts
import { onModalChange, topModal } from "./layers.js";
import { pageShared } from "./pageShared.js";
var channel = () => ({ el: null, queue: [], since: 0, timer: null });
var page = /* @__PURE__ */ pageShared("announce@1", () => ({ polite: channel(), assertive: channel() }));
var HOLD = 500;
var home = () => topModal() || document.body;
var watching = false;
function region(ch, live) {
  if (ch.el || typeof document === "undefined") return ch.el;
  const el = document.createElement("div");
  el.setAttribute("role", live === "polite" ? "status" : "alert");
  el.setAttribute("aria-live", live);
  el.setAttribute(live === "polite" ? "data-dk-announcer" : "data-dk-announcer-assertive", "");
  el.className = "sr-only";
  el.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0";
  home().appendChild(el);
  ch.el = el;
  if (!watching) {
    watching = true;
    onModalChange(() => {
      for (const c of [page.polite, page.assertive]) if (c.el && c.el.parentNode !== home()) home().appendChild(c.el);
    });
  }
  return el;
}
function ensureAnnouncer() {
  return region(page.polite, "polite");
}
function pump(ch) {
  if (ch.timer || !ch.queue.length || !ch.el) return;
  const el = ch.el;
  const wait = Math.min(HOLD, Math.max(0, ch.since + HOLD - Date.now()));
  ch.timer = setTimeout(function() {
    el.textContent = "";
    ch.timer = setTimeout(function() {
      ch.timer = null;
      if (!el.isConnected) home().appendChild(el);
      el.textContent = ch.queue.shift() || "";
      ch.since = Date.now();
      pump(ch);
    }, 50);
  }, wait);
}
function said(queued, text) {
  if (queued === text) return true;
  const at = queued.indexOf(text);
  return at >= 0 && (at === 0 || /[.!?…。] $/.test(queued.slice(0, at)) || queued.slice(at - 2, at) === ". ") && (at + text.length === queued.length || /^(\.? )/.test(queued.slice(at + text.length)));
}
function announce(text, options) {
  const ch = options && options.assertive ? page.assertive : page.polite;
  if (!region(ch, options && options.assertive ? "assertive" : "polite")) return;
  if (!ch.queue.length) ch.queue.push(text);
  else if (!said(ch.queue[0], text)) ch.queue[0] += (/[.!?…。]$/.test(ch.queue[0]) ? " " : ". ") + text;
  pump(ch);
}
function announcerIdle() {
  return !page.polite.timer && !page.polite.queue.length && !page.assertive.timer && !page.assertive.queue.length;
}
export {
  announce,
  announcerIdle,
  ensureAnnouncer
};
//# sourceMappingURL=announce.js.map
