// The browser script (serupa.iife.js): reads React from window.React and puts
// the components on window.Serupa, for plain pages without a bundler.
import * as Serupa from "./index";
import { iconChunks, loadAllIcons } from "./icons";

// Everything the package exports (index.ts), so a new component reaches plain pages without a line here.
window.Serupa = Object.assign(window.Serupa || {}, Serupa);

// The full Material Symbols table (2.7 MB) isn't in this script: it's serupa-icons.iife.js, beside this one. The
// components' own icons and the everyday ones are here (src/material/builtin.ts, named.ts); the first time an Icon
// meets any other name, that script is added to the page from this script's own folder (same origin, so
// script-src 'self' covers it). A page that names many icons can include serupa-icons.iife.js itself to skip the wait.
// Read now: document.currentScript is only set while this script first runs.
const self = document.currentScript as HTMLScriptElement | null;
const from = self && self.src ? new URL("serupa-icons.iife.js", self.src).href : "";
iconChunks.all = () => window.SerupaIcons ? Promise.resolve(window.SerupaIcons) : new Promise((resolve, reject) => {
  const fail = (why: string) => { tag.remove(); reject(new Error(`${why}; include serupa-icons.iife.js on the page to draw every icon by name`)); };
  const tag = document.createElement("script");
  if (!from) return fail("serupa.iife.js couldn't tell its own address");
  tag.onload = () => window.SerupaIcons ? resolve(window.SerupaIcons) : fail(`${from} didn't set window.SerupaIcons`);
  tag.onerror = () => fail(`${from} didn't load`);
  // With Trusted Types on (require-trusted-types-for 'script') a plain string can't be a script's src: say so.
  try { tag.src = from; } catch (err) { return fail(`${from} can't be added here (${err instanceof Error ? err.message : String(err)})`); }
  document.head.appendChild(tag);
});
// The script has every icon, so any name loads it, once (loadAllIcons keeps the one load).
iconChunks.part = () => loadAllIcons().then(() => ({}));
