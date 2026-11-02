# ADR-0005: Build into `dist/` with tsup and plain CSS concatenation

**Status:** Accepted
**Status when written:** Accepted, with changes proposed for 5.0
**Checked against main (31 October 2026, 11.0.0):** The cascade layers shipped (`@layer dk.tokens, dk.base, dk.components, dk.utilities` in `tokens.css`), and the utility classes are generated (tools/utilities/build.mjs).
**Date:** 2026-10-17
**Deciders:** Diki

## Context

`npm run build` (`tools/build/build.mjs`) produces:

- `dist/index.js` + `index.d.ts`: one ESM file with types, React as a peer dependency, server-render safe (tested).
- `dist/diki.iife.js` (= `bundle.js`): the browser script that reads `window.React` and sets `window.Diki`, with React 18 UMD files in `dist/lib/`.
- `components.css` (every component's CSS joined in the `@import` order of `src/styles/index.css`), `utilities.css` (1.8 MB), `bundle.css` (both), `base.css`, `theme.js`.

`tokens.css`, `tokens.json`, `design-tokens/` and `fonts/` ship from the repo root. `dist/` isn't committed. Component CSS repeats each token's value as a fallback (about 1,600 `var(--x, value)` fallbacks), checked by `foundation.py` to equal the token.

## Decision

Keep tsup and the single ESM entry. Keep the CSS as plain files (no CSS-in-JS). At 5.0, put the CSS in cascade layers and drop the value fallbacks.

## Options considered

### A: Current build
| Dimension | Assessment |
|---|---|
| JS | Good: ESM + types + SSR test; a bundler tree-shakes the single file because it has no top-level side effects |
| CSS precedence | Weak: no `@layer`, so a project's own styles and the utilities compete on specificity and order |
| CSS size | Weak: all components or none; utilities are 1.8 MB unless the project runs `purge.py` |
| Duplication | Weak: ~1,600 fallbacks repeat token values, so a value change touches two places (tests catch drift, but it's noise) |
| Browser script | Tied to React 18: React 19 no longer ships UMD files |

### B: Same build, layered CSS, no fallbacks (recommended for 5.0)
`@layer diki.tokens, diki.base, diki.components, diki.utilities;` lets a project's unlayered CSS win without `!important`, and keeps utilities above components. Fallbacks go because `tokens.css` is a required import (it already is in every documented setup).

**Pros:** predictable overrides, half the component CSS text, one place per value. **Cons:** breaking: project CSS that relied on today's specificity may change, and a page that forgot `tokens.css` breaks visibly instead of looking almost right.

### C: Per-component CSS entry points (`@diki/design-system/button.css`)
**Pros:** load only what's used. **Cons:** components style each other (Loader in Button, Icon everywhere), so import order becomes the project's problem. `components.css` is small enough next to the font and the utilities. Not worth it now.

### D: CSS-in-JS or CSS Modules
**Pros:** automatic per-component CSS. **Cons:** runtime cost or a bundler requirement, breaks the plain-HTML use case, rewrites every stylesheet. Rejected.

## Trade-off analysis

The JavaScript side is sound and conventional. The CSS side works but was shaped by the artifact (one `bundle.css` under 2 MB). B is the standard modern answer and costs little to build; it waits for 5.0 only because it changes precedence for existing pages. Utilities stay opt-in (`utilities.css`) with `purge.py` as the documented trim; generating them from tokens is covered by ADR-0002.

## Consequences

- Easier after B: overriding a component from a project, reading component CSS, changing a token value.
- Harder: the browser script. Decide at 5.0 whether `diki.iife.js` stays (pinned to React 18) or is dropped now that the artifacts are frozen and projects use ESM.
- Revisit: React 19 in CI (types and `forwardRef` are React 18 style; structure review item 5).

## Update, 1 November 2026 (13.0)

The masks and gradients moved out of `utilities.css` and `bundle.css` into `utilities-extra.css` (`tools/utilities/extra.mjs` splits them off at build time; the template, Storybook and the tests keep them in one place). They were a quarter of the utility rules (about 530 KB of 1.76 MB) and few pages use them. A page that does imports the extra file after `bundle.css`.

## Action items

1. [ ] 5.0: wrap every stylesheet in `@layer`, drop the fallbacks, update `foundation.py` to check "no fallbacks" instead of "fallback equals token". Migration note: "import `tokens.css` first; your unlayered CSS now always wins".
2. [ ] 5.0: decide the fate of `diki.iife.js` and `dist/lib/`.
3. [ ] Now: add a React 19 job to CI (non-breaking).
