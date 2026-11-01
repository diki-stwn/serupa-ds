// serupa-ds/testing: screenshots of your own pages in each of Serupa's six themes, for your app's CI. Serupa checks
// its components in every theme; this lets your screens get the same check, with Playwright (or anything with a
// page.evaluate()).
//   import { test, expect } from "@playwright/test";
//   import { forEachTheme } from "serupa-ds/testing";
//   test("checkout", async ({ page }) => {
//     await page.goto("/checkout");
//     await forEachTheme(page, async (theme) => {
//       await expect(page).toHaveScreenshot(`checkout-${theme}.png`);
//     });
//   });
// For each theme it sets data-theme on <html> (which beats data-brand, data-mode and theme.js's choice), matches the
// emulated color scheme to it when the page can emulate one, turns off transitions, animations and the text caret so
// a picture doesn't catch a fade halfway, and waits for fonts and two frames. Afterwards the page is as it was.

/** Serupa's six themes, in the order the docs show them. */
export const THEMES = Object.freeze(["blue-light", "blue-dark", "violet-light", "violet-dark", "emerald-light", "emerald-dark"]);

const STILL = "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}";

/** Runs fn once per theme, with the page drawn in that theme. */
export async function forEachTheme(page, fn, options = {}) {
  const themes = options.themes || THEMES;
  const unknown = themes.filter((t) => !THEMES.includes(t));
  if (unknown.length) throw new Error(`serupa-ds/testing: no theme called ${unknown.join(", ")}. The themes are ${THEMES.join(", ")}.`);
  const still = options.still !== false;
  const emulate = typeof page.emulateMedia === "function";
  // What to put back: the page's own data-theme (or none), and whether the style that stills it was added here.
  const before = await page.evaluate(([css, add]) => {
    const html = document.documentElement;
    let added = false;
    if (add && !document.getElementById("serupa-testing-still")) {
      const style = document.createElement("style");
      style.id = "serupa-testing-still";
      style.textContent = css;
      document.head.appendChild(style);
      added = true;
    }
    return { theme: html.getAttribute("data-theme"), added };
  }, [STILL, still]);
  try {
    for (const theme of themes) {
      if (emulate) await page.emulateMedia({ colorScheme: theme.endsWith("-dark") ? "dark" : "light" });
      await page.evaluate(async (t) => {
        document.documentElement.setAttribute("data-theme", t);
        await document.fonts.ready;
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())));
      }, theme);
      await fn(theme);
    }
  } finally {
    if (emulate) await page.emulateMedia({ colorScheme: null });
    await page.evaluate(({ theme, added }) => {
      const html = document.documentElement;
      if (theme === null) html.removeAttribute("data-theme"); else html.setAttribute("data-theme", theme);
      if (added) document.getElementById("serupa-testing-still")?.remove();
    }, before);
  }
}
