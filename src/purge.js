// serupa-ds/purge __VERSION__: serupa-purge inside the build, as a Vite plugin and a PostCSS plugin, so a project
// that imports bundle.css ships the component styles and only the utility classes its code uses.
//   // vite.config.js
//   import { serupaPurge } from "serupa-ds/purge";
//   export default { plugins: [react(), serupaPurge()] };
//   // postcss.config.js (Next.js, webpack, or CSS that @imports bundle.css)
//   import { serupaPurgePostcss } from "serupa-ds/purge";
//   export default { plugins: [serupaPurgePostcss()] };
// It trims Serupa's own stylesheets only (bundle.css, utilities.css, utilities-extra.css and components.css), the
// same way the serupa-purge command does: see bin/serupa-purge.mjs for what is always kept. Your own CSS passes
// through untouched. The Vite plugin works on production builds; the dev server serves every class, so a class you
// add shows at once.
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { purge, usedClasses, unusedComponentClasses } from "../bin/serupa-purge.mjs";

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const OURS = ["bundle.css", "utilities.css", "utilities-extra.css", "components.css"].map((f) => path.join(DIST, f));
const real = (f) => { try { return fs.realpathSync(f); } catch { return path.resolve(f); } };
const ours = new Set(OURS.map(real));

/** Whether a file (an id, with any ?query) is one of this package's stylesheets. */
const isSerupa = (file) => !!file && ours.has(real(file.split("?")[0]));

// The classes the sources use and the component classes to drop, read once per build.
function scan(options, root) {
  const content = (options.content || ["src", "index.html", "app", "pages", "components"]).map((c) => path.resolve(root, c));
  // Each looked at once: whether it is there, and whether it is a folder (for PostCSS's dependency messages).
  const kind = new Map(content.map((c) => [c, fs.statSync(c, { throwIfNoEntry: false })]));
  const sources = options.content ? content : content.filter((c) => kind.get(c));
  const missing = sources.filter((c) => !kind.get(c));
  if (missing.length) throw new Error(`serupa-ds/purge: no such file or folder: ${missing.join(", ")}`);
  if (!sources.length) throw new Error(`serupa-ds/purge: found none of src/, index.html, app/, pages/ or components/ in ${root}. Name your sources with the content option.`);
  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, "components.json"), "utf8"));
  const keep = (options.keep || []).map((k) => (k.startsWith("@") ? `@${path.resolve(root, k.slice(1))}` : k));
  const used = usedClasses(sources, [...keep, ...manifest.runtimeUtilities]);
  return { sources, folders: new Set(sources.filter((c) => kind.get(c).isDirectory())), used, drop: options.components ? unusedComponentClasses(manifest, used) : new Set() };
}

/** The Vite plugin: trims Serupa's stylesheets in `vite build`. */
export function serupaPurge(options = {}) {
  let root = process.cwd(), found = null;
  return {
    name: "serupa-purge",
    apply: "build",
    enforce: "pre",
    configResolved(config) { root = config.root; },
    buildStart() { found = null; },
    transform(code, id) {
      if (!isSerupa(id)) return null;
      found ||= scan(options, root);
      return { code: purge(code, found.used, found.drop) + "\n", map: null };
    },
  };
}

/** The PostCSS plugin: trims the rules that came from Serupa's stylesheets, whether the file is Serupa's own or
 *  your CSS @imports it (postcss-import, or Vite's and Next.js's own @import, keeps where each rule came from). */
export function serupaPurgePostcss(options = {}) {
  const root = options.root || process.cwd();
  return {
    postcssPlugin: "serupa-purge",
    Once(css, { result, postcss }) {
      const nodes = css.nodes.filter((n) => isSerupa(n.source && n.source.input && n.source.input.file));
      if (!nodes.length) return;
      const found = scan(options, root);
      // Rebuilt when a source changes, under a watcher that reads PostCSS's dependency messages.
      for (const s of found.sources) {
        result.messages.push(found.folders.has(s)
          ? { type: "dir-dependency", plugin: "serupa-purge", dir: s, glob: "**/*", parent: result.opts.from }
          : { type: "dependency", plugin: "serupa-purge", file: s, parent: result.opts.from });
      }
      // A statement (@layer a, b;) prints without its semicolon, which belongs to the parent: put it back.
      const text = nodes.map((n) => String(n) + (n.type === "atrule" && !n.nodes ? ";" : "")).join("\n");
      const trimmed = postcss.parse(purge(text, found.used, found.drop), { from: nodes[0].source.input.file });
      nodes[0].before(trimmed.nodes);
      for (const n of nodes) n.remove();
    },
  };
}
serupaPurgePostcss.postcss = true;
