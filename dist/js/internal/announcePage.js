// src/internal/announcePage.ts
import { announce } from "./announce.js";
function announcePage(options) {
  if (typeof document === "undefined") return;
  const o = options || {};
  const pick = (s) => document.querySelector(s);
  const target = o.focus === false ? null : o.focus && typeof o.focus === "object" ? o.focus : o.focus ? pick(o.focus) : pick("main h1") || pick("h1") || pick("main");
  if (target instanceof HTMLElement || target instanceof SVGElement) {
    if (!target.hasAttribute("tabindex") && target.tabIndex < 0) target.setAttribute("tabindex", "-1");
    target.focus();
  }
  const read = target && document.activeElement === target ? (target.textContent || "").trim() : "";
  const title = (o.title != null ? o.title : document.title).trim();
  if (title && title !== read) announce(title);
}
export {
  announcePage
};
//# sourceMappingURL=announcePage.js.map
