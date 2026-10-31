# ADR-0009: Material Symbols as inline SVG, by name or by import

**Status:** Accepted
**Status when written:** Accepted (Diki, 18 October 2026), ships in 6.0.0
**Checked against main (31 October 2026, 11.0.0):** Shipped in 6.0.0.
**Supersedes:** [ADR-0004](0004-icon-font.md)
**Deciders:** Diki

## Context

Up to 5.x, `<Icon name="close" />` drew a ligature in the Material Symbols Rounded (filled) font. The font was 990 KB and every project downloaded it, and with `font-display: swap` icon names flashed as words. ADR-0004 proposed cutting the font down first and moving to SVG later. Diki chose to move to SVG now, before any real project depends on the system.

## Decision

Every Material Symbol is an inline SVG. `tools/icons/material.py` reads each icon's outline from the 5.x font (the 24px optical size, filled), so every name that worked before still exists and looks the same, pixel for pixel. It writes:

- `src/material/icons.ts`: one named export per icon (3,776), published as `serupa-ds/icons`. A project imports what it uses (`import { RocketLaunch } from "serupa-ds/icons"`) and ships only that.
- `src/material/common.ts`: the **everyday icons** that work by name with no import. These are `docs/icon-names.json` (the Foundations/Icons page) plus every icon name used in the source, about 270, roughly 40 KB gzipped inside the components.

`<Icon name>` and every icon prop take an everyday name, a name registered with `registerIcons()`, an imported icon, or an element. Custom icons (`tools/icons/build.py`) work as before. Plain pages get the everyday icons from `serupa.iife.js`; `serupa-icons.iife.js` registers all of them.

## Options considered (Diki chose A)

| | A: Imports + names (chosen) | B: Names only | C: Imports only |
|---|---|---|---|
| Payload | Everyday set (~40 KB gz) plus what's imported | Everyday set; extras need registering | Only what's imported |
| Writing icons | `leftIcon="add"` for common ones, `leftIcon={RocketLaunch}` for the rest | Names only; extras need `registerIcons` | Every icon is an import |
| Migration from 5.x | Names outside the set need an import or one `registerIcons` call | Same | Every name in code and docs changes |

## Consequences

- Breaking (6.0.0): names outside the everyday set draw an empty box and warn until they're imported or registered. The `--font-icon` token and the font file are removed.
- No optical sizes: every icon is the 24px design, scaled. At 14–16px the strokes are a little thinner than the font's optical size 20 drew. Accepted. A second set at optical size 20 could be generated later if small icons look too light.
- The everyday set is maintained in `docs/icon-names.json`. `tools/test/icon-names.mjs` fails when `common.ts` is out of date, and checks every everyday icon against the font pixel by pixel.
- The source font stays in the repo as `tools/icons/source/` (not shipped), so the SVGs can be regenerated.
