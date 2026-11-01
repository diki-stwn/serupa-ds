# ADR-0014: Write the tokens in the W3C Design Tokens format

**Status:** Accepted
**Deciders:** Diki (queue item D16, approved; follows option C of [ADR-0002](0002-token-source-and-generation.md))

## Context

[ADR-0002](0002-token-source-and-generation.md) made the repo the only generator, with `tokens.json` (the format of the old design system page) as the source, and left moving the source to the W3C Design Tokens format (DTCG) as a later step. `design-tokens/` already holds an export in that format, but the export is lossy: it drops the more-contrast and compact values, the group notes, the CSS exactly as written and which tokens are set per theme, and puts 117 values it has no type for in a separate `css-values.json`. So a token edited in a design tool couldn't come back.

## Decision

The source is `tokens/serupa.tokens.json`, a DTCG file that holds everything `tokens.json` does. `tools/tokens/source.mjs` makes `tokens.json` from it, and everything else is still made from `tokens.json`, so no generator, test or consumer that reads `tokens.json` changes.

- Every group of `tokens.json` is a group, in the same order, with its note as `$description`. Every token is a token: `$type` and `$value` in the format (`{ "value": 0.25, "unit": "rem" }`), a reference as `{group.name}`, the usage as `$description`.
- A token's CSS is printed from `$value`. Where the CSS was written differently (`5%` for the number 0.05, `.75rem`, a shadow with `rgb()`), it's kept in `$extensions["com.serupa"].css`, and the check fails when it no longer means `$value`, so the two can't drift.
- Serupa's own facts sit in `$extensions["com.serupa"]`: the name when it has a dot (the format doesn't allow one), the other themes' values, `themed`, `contrastMore`, `compact`. The theme list, the type styles and the fonts, which aren't tokens, sit in the root's `$extensions`.
- A value the format has no type for yet (degrees, `em`, keywords, CSS shorthands) is a token with no `$type` and its CSS as `$value`.

The foundation check makes sure `tokens.json` is what the source gives, and that the source turns into `tokens.json` and back without a change, so nothing is lost either way.

## Options considered

- **Keep `tokens.json` as the source** (ADR-0002 option B). Nothing to do, but every token stays in a homemade format that design tools don't read.
- **Make `design-tokens/` the source.** The files design tools already read, but they're lossy (above), and splitting the colors into theme files loses the order `tokens.css` is written in.
- **A lossless DTCG source that `tokens.json` is made from** (this one). The format, with the rest kept beside it, and every output unchanged byte for byte.

## Consequences

- Editing a token means editing `tokens/serupa.tokens.json` and running `npm run tokens`. `tokens.json` is generated: it still ships, unchanged, for whoever reads it.
- `tools/fonts/subset.py` and `tools/fonts/fallback.mjs` write the faces into the source.
- Later steps can read the source directly: Style Dictionary (ADR-0002 option C), a Figma sync (27) and the brand generator (I5). Until then they read `tokens.json` or `design-tokens/`.
