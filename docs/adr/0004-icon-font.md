# ADR-0004: Icons from the Material Symbols font, custom icons as inline SVG

**Status:** Superseded by [ADR-0009](0009-svg-icons.md)
**Status when written:** Superseded by [ADR-0009](0009-svg-icons.md) (SVG icons, 6.0.0)
**Date:** 2026-10-17
**Deciders:** Diki

## Context

`<Icon name="close" />` renders a ligature in **Material Symbols Rounded, filled**: the name is text, and the font turns it into a glyph. The font ships in `fonts/MaterialSymbolsRounded-Filled.woff2` (**990 KB**, the full set of several thousand icons) and `tokens.css` declares it with `font-display: swap`. Custom icons are SVGs built by `tools/icons/build.py` into `src/icons.ts` and rendered inline; none exist yet. The components themselves use about 20 icon names.

## Decision

Short term: subset the shipped font to the icons the system and its projects use. At 5.0: decide whether to move to SVG icons.

## Options considered

### A: Full ligature font (current)
| Dimension | Assessment |
|---|---|
| Payload | Poor: ~1 MB before the first icon draws, on every project |
| First paint | Poor: with `swap`, the word "close" or "arrow_forward" shows in Inter until the font arrives, then the layout jumps |
| Authoring | Excellent: any Material Symbols name works with no build step |
| Accessibility | Fine while `aria-hidden` (the default); a labelled icon needs care so the ligature text isn't read out |

### B: Subset font (recommended now)
A build step (`fonttools`' `pyftsubset`, or a Node equivalent) keeps only the listed names, from `docs/icon-names.json` plus the names in component code; a project can add its own list. Typical result: 10–40 KB.

**Pros:** same API, same look, non-breaking; most of the weight goes. **Cons:** a name not in the list renders as text, so the list must be checked (the existing `icon-names.mjs` test can do that) and documented.

### C: SVG icons only (consider for 5.0)
Each icon is a small React component or an SVG sprite, imported by name.

**Pros:** tree-shaken per icon, no font loading, no text flash, crisp at any size, same path custom icons already take. **Cons:** a bigger change for projects (dynamic names like `name={x}` need a lookup map); Material Symbols' variable axes (weight, grade) are lost unless several weights are exported.

### D: `font-display: block`
**Pros:** hides the ligature text. **Cons:** icons stay invisible up to ~3 s on slow connections, and the weight doesn't change. Only a stopgap.

## Trade-off analysis

The font is the largest single thing the package makes every project download, bigger than the two Inter files together. B removes almost all of it without touching any API. C is the cleaner end state and matches how most current React systems ship icons, but it changes how projects write icons, so it belongs with the other breaking changes at 5.0, if at all.

## Consequences

- Easier (B): faster first paint, smaller installs. Harder: icons outside the list need a rebuild.
- Revisit at 5.0: C, keeping the `Icon` API (`name`, `size`, `label`) so only the import changes.

## Action items

1. [ ] Subset build into `dist/fonts/`, driven by an icon list; keep the full font available as an opt-in for prototyping.
2. [ ] Test: every name used in `src/` and `docs/icon-names.json` draws as one glyph in the subset.
3. [ ] Decide for 5.0: stay on the subset font or move to SVG (needs Diki's OK; changes how icons are loaded).
