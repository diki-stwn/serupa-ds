# Architecture decision records

Each record says why Serupa is built the way it is: the context, the options weighed, and what was chosen. Read the one behind a part before you change that part. If the change goes against the record, write a new record that supersedes it, and say why.

| # | Decision | Status |
|---|---|---|
| [0001](0001-three-layer-tokens.md) | Three token layers (palette, semantic, component) as CSS custom properties | Accepted |
| [0002](0002-token-source-and-generation.md) | Edit tokens in `tokens.json` and generate every output from it | Accepted |
| [0003](0003-theming.md) | Themes as brand × mode on `data-theme` | Superseded by [0011](0011-theming-v2.md) |
| [0004](0004-icon-font.md) | Icons from the Material Symbols font | Superseded by [0009](0009-svg-icons.md) |
| [0005](0005-build-and-packaging.md) | Build into `dist/` with tsup and joined CSS | Accepted |
| [0006](0006-installing-from-github.md) | Install releases from GitHub, prebuilt | Accepted |
| [0007](0007-release-flow.md) | Changesets, then a Release PR, then a tag and a GitHub release | Accepted |
| [0009](0009-svg-icons.md) | Material Symbols as inline SVG, by name or by import | Accepted |
| [0010](0010-serupa-provider.md) | One app-level provider instead of module-global settings | Accepted |
| [0011](0011-theming-v2.md) | Theme axes, CSS-only dark mode, one brand registry | Accepted |
| [0012](0012-data-state.md) | One `data-state` vocabulary across components | Accepted |
| [0013](0013-overlay-layers.md) | How overlays share Escape, focus and outside presses | Accepted |
| [0014](0014-dtcg-token-source.md) | Write the tokens in the W3C Design Tokens format | Accepted |

There is no 0008: that number was never used.

## Writing one

- Name the file `NNNN-short-title.md`, with the next free number, and start it with `# ADR-NNNN: Title`.
- Give it a `**Status:**` line set to `Proposed`, `Accepted`, or `Superseded by [ADR-NNNN](NNNN-….md)`. Put anything more about the status on its own line below that one.
- When a newer record replaces an old one, change only the old one's status line. Leave its body as it was written, and move any reason that still counts into the new record.
- Add a row to the table above.

`node tools/test/adr.mjs` checks these rules: every record has an allowed status, every link to another record resolves, every record has a row in this table, and every row matches its record's status.
