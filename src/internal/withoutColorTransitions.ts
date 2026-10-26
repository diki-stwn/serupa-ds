// Switching theme changes every control's colors at once; with their own transitions (150ms on background, color
// and borders) each one would fade on its own while the page surface switches at once, so the page changes color
// unevenly and the cost grows with the page. tokens.css turns transitions off under [data-theme-switching], which
// this sets around the change and removes two frames later, once the new colors have been drawn.
/** Runs `change` (such as setting data-theme on a section) with transitions off in `element` and everything inside it, so
 *  the new theme's colors arrive at once instead of fading control by control. theme.js does this for the page. */
export function withoutTransitions(change: () => void, element?: HTMLElement): void {
  const el = element || (typeof document !== "undefined" ? document.documentElement : null);
  if (!el) { change(); return; }
  const n = Number(el.getAttribute("data-theme-switching") || 0) + 1;   // nested or quick switches: the last one clears it
  el.setAttribute("data-theme-switching", String(n));
  try { change(); } finally {
    const frame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (f: () => void) => setTimeout(f, 16);
    frame(() => frame(() => { if (el.getAttribute("data-theme-switching") === String(n)) el.removeAttribute("data-theme-switching"); }));
  }
}
