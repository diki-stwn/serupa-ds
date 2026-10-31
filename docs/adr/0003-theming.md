# ADR-0003: Themes as brand × mode on `data-theme`

**Status:** Superseded by [ADR-0011](0011-theming-v2.md)
**Status when written:** Accepted, with a proposed extension
**Checked against main (31 October 2026, 11.0.0):** ADR-0011 replaced the flat-theme model with theme axes and one brand registry. The plan to generate each brand from one ramp is carried in ADR-0011 and is not built yet: the brands are still listed by hand (for example `BRANDS` in `src/theme.js`).
**Date:** 2026-10-17
**Deciders:** Diki

## Context

There are 3 brands (blue, violet, emerald) × 2 modes = 6 themes. `tokens.css` writes one block per theme (`:root, [data-theme="blue-light"] { … }`, then `[data-theme="blue-dark"]` and so on), each re-assigning the 33 semantic colors to palette steps. `theme.js` (optional, no React) reads `data-brand` and `data-mode` on `<html>`, follows the OS setting when the mode is `auto`, remembers the visitor's choice in `localStorage`, syncs across tabs, and sets `data-theme`. Any element can carry its own `data-theme` for a nested section. Contrast is tested per theme (24 core pairs in `foundation.py`, per-component pairs in 45 test files, axe on every story in all six).

The project goal is a system reused **across all of Diki's projects**, each likely with its own brand.

## Decision

Keep `data-theme="<brand>-<mode>"` as the switch and `theme.js` as the optional helper. Change how a brand is *defined*: from 66 hand-set alias values to a brand ramp plus generated theme blocks.

## Options considered

### A: Hand-written flat themes (current)
| Dimension | Assessment |
|---|---|
| Runtime | Excellent: pure CSS, nested themes, no JavaScript needed |
| Adding a brand | Poor: 33 aliases × 2 modes by hand, plus `BRANDS` in `theme.js`, the Storybook toolbar and every contrast test list |
| A project's own brand | Not supported without forking the system |

### B: Brand = one color ramp; themes generated (recommended)
A brand declares an 11-step ramp (50–950) and, where needed, a handful of overrides (emerald already uses 700 instead of 600 for `primary` to reach 4.5:1). The token build (ADR-0002) produces the light and dark blocks from one shared mapping (`primary` → brand-600 light, brand-400 dark, etc.). `theme.js` and the tests read the brand list from the generated output instead of hard-coding it.

| Dimension | Assessment |
|---|---|
| Adding a brand | ~15 lines, contrast checked automatically in both modes |
| Project brands | A project can ship its own ramp file and build its own `[data-theme="acme-light"]` block |
| Risk | Low: the generated blocks must equal today's six exactly |

### C: Separate mode and brand attributes at the CSS level (`[data-brand][data-mode]`)
**Pros:** the axes are explicit. **Cons:** changes the public switch every project uses; `theme.js` already gives this split. Breaking for no runtime gain. Rejected.

## Trade-off analysis

The runtime model is right and is the hard part; it should not change. The weakness is authoring: brands are data entered by hand, so the "multiple brands" principle stops at three. B keeps every existing theme name and value.

One smaller gap: without `theme.js`, dark mode only happens if a project sets `data-theme` itself. Adding a `@media (prefers-color-scheme: dark)` block for `:root:not([data-theme])` would give automatic dark mode with CSS alone. It changes what pages without `data-theme` look like for dark-mode visitors, so it's a visible change: ship it opt-in (a separate `tokens-auto.css`) or at 5.0.

## Consequences

- Easier: new brands, per-project brands, and contrast guarantees that cover them.
- Harder: the mapping becomes a rule, so a brand that needs a different step for one alias needs an explicit override (as emerald does today).
- Revisit: whether projects should define brands in their own repo (a documented "custom brand" build) or inside the system.

## Action items

1. [ ] After ADR-0002: brand ramps + one light/dark mapping → generated theme blocks, identical to today's output.
2. [~] `theme.js`, Storybook's toolbar and the contrast tests take the brand list from the build. *Partly done (branch `claude/project-thread-zp3ele-brands`):* `tokens.json`'s `color.themes` is the one source. Storybook's toolbar reads it directly. `theme.js` (`BRANDS`, default, header), the `ThemeBrand` type and the 47 theme lists written out in `tools/test/` stay hand-written but the foundation audit fails when any differs (a check rather than generation: `theme.js` and `theme-types.ts` are hand-written public files copied as they are, and rewriting them from the token build would make `npm run tokens` edit source; revisit with action item 1, when brands become ramps).
3. [ ] Document "add your own brand" in the Themes page.
4. [ ] Decide on CSS-only auto dark mode (opt-in file now, or default at 5.0).
