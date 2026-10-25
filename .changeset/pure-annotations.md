---
"serupa-ds": patch
---

A bundler that doesn't read the package's `"sideEffects"` now leaves out every part of Serupa a project doesn't import. Before this, an empty `import "serupa-ds"` kept about 48 modules: the label text, the phone country table and the currency table. The cause was top-level calls without `/*#__PURE__*/`. Webpack, Rollup with its resolve plugin, Vite and esbuild already left them out.
