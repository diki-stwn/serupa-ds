# ADR-0001: Three token layers, delivered as CSS custom properties

**Status:** Accepted
**Status when written:** Accepted (documents the current design)
**Date:** 2026-10-17
**Deciders:** Diki

## Context

The system promises that every visual value comes from a token, that themes switch without touching component code, and that projects can adjust a component without forking it. Today there are three layers:

1. **Palette (primitive):** `--blue-600`, `--gray-900`, spacing, radius, type, motion scales. Same in every theme.
2. **Semantic (alias):** 33 colors such as `--primary`, `--surface`, `--text-muted`, `--field-border`, each with a value per theme (`tokens.json` → `color.tokens[].value[theme]`).
3. **Component:** 724 tokens across 53 `*.tokens.json` files, e.g. `--button-primary-bg` → `{color.primary}`. They are *not* declared anywhere; component CSS reads them with a fallback chain: `var(--button-primary-bg, var(--primary, …))`.

## Decision

Keep the three layers and keep component tokens as optional, undeclared overrides.

## Options considered

### A: Three layers, component tokens as undeclared overrides (current)
| Dimension | Assessment |
|---|---|
| Complexity | Medium |
| Override story | Excellent: set `--button-radius` on a page, a container or one element |
| Theme correctness | Excellent: an unset component token resolves in the element's own theme, so nested themes work |
| Payload | Small: nothing extra in `tokens.css` |

**Pros:** the pattern most mature systems use (Spectrum, Primer, Carbon); overrides cascade naturally; tests already check every component token refers to a shared one and that CSS uses exactly its documented default.
**Cons:** names must be kept consistent by hand (the audit found three split conventions); a project can't see the full list without reading the token files.

### B: Two layers (palette + semantic), no component tokens
**Pros:** fewer names. **Cons:** no per-component override without CSS selectors; breaks the project rule that each component has its own tokens. Rejected.

### C: Component tokens declared on `:root`
**Pros:** visible in dev tools. **Cons:** a `:root` value is resolved in the root theme, so a nested `data-theme` section would show the wrong colors unless every token is re-declared per theme. Rejected.

## Trade-off analysis

A is the right model. Its weaknesses are naming discipline and how the values are generated and duplicated, which ADR-0002 and ADR-0005 cover, not the layering itself.

## Consequences

- Easier: theming, nested themes, per-project tweaks, Figma and Style Dictionary exports (the DTCG files already mirror the layers).
- Harder: renaming. Every rename touches the component CSS, the token file, the DTCG copy and the docs, so names should be fixed once, at 5.0.
- Revisit: the one exception, Loader `inverse` → `{color.white}`, skips the semantic layer. Either add an `on-inverse-fixed` alias or document it as the only allowed exception.

## Action items

1. [ ] Add the consistent names (`-text`, `-<part>-color`, `-border`) as aliases in a minor release; remove the old ones at 5.0 (audit item 4; needs Diki's OK, since it renames tokens).
2. [ ] Add a naming test that fails on a new component token outside the agreed suffixes, so the split doesn't come back.
