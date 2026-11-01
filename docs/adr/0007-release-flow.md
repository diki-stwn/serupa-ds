# ADR-0007: Changesets → Release PR → tag and GitHub release

**Status:** Accepted
**Status when written:** Accepted (currently blocked by a repo setting)
**Checked against main (31 October 2026, 11.0.0):** No longer blocked: the repository setting is on and the Release PR flow publishes the GitHub releases (`.github/workflows/release.yml`).
**Date:** 2026-10-17
**Deciders:** Diki

## Context

Each PR adds a changeset (`.changeset/*.md`) with patch/minor/major and Keep a Changelog lines. On `main`, `changesets/action` runs `npm run version-packages` (`tools/version.mjs`): it merges the notes into `CHANGELOG.md`, deletes the changesets and calls `tools/release.py` to bump and stamp the version into `package.json`, `src/styles/base.css` and `src/theme.js`. The action opens a "Release: next version" PR; merging it runs `npm run release` (`tools/publish.mjs`): tag, GitHub release, tarball attached.

Every Release run fails with "GitHub Actions is not permitted to create or approve pull requests". 37 changesets wait, `package.json` is still 4.7.0, and no tag exists, so no project can get anything built since the import.

## Decision

Keep the flow. Turn on the setting. Then trim the custom scripts.

## Options considered

### A: Changesets with custom versioning (current)
| Dimension | Assessment |
|---|---|
| Fit | Good: one note per PR, a reviewable Release PR, Diki merges both |
| Complexity | Medium: three scripts in two languages (`version.mjs`, `release.py`, `publish.mjs`) around a tool that can do most of it |
| Version stamps | Fragile: the version is regex-stamped into three source files plus checked in CHANGELOG |

### B: Changesets' own versioning (`changeset version`) with a changelog plugin
**Pros:** less custom code. **Cons:** its changelog format isn't Keep a Changelog sections; `CHANGELOG.md` would change shape. Not worth it alone.

### C: Release on every merge (semantic-release, conventional commits)
**Pros:** no Release PR. **Cons:** releases happen without Diki choosing when; commit-message discipline replaces explicit notes. Doesn't match "only Diki merges". Rejected.

## Trade-off analysis

A matches how Diki wants to work: every change carries its note, and a release happens only when Diki merges the Release PR. The weak points are small: the setting, and version stamps in source files. The build can inject the version (it already does for `dist/` via tsup's `define`), so `release.py`'s stamping can go and `version.mjs` can call a Node bump directly, leaving the build Python-free alongside ADR-0002.

## Consequences

- After the setting: the first Release PR will be one big minor release (4.8.0) with 37 entries. Read it once before merging.
- Easier later: one script, one language, no version stamps to keep in step.
- Revisit: the bump for the rename. Changesets will compute 5.0.0 from a `major` changeset, which the rename PR should carry with migration notes.

## Action items

1. [ ] **Diki:** Settings → Actions → General → Workflow permissions → "Allow GitHub Actions to create and approve pull requests".
2. [ ] Review and merge the first Release PR; check the tag and release appear.
3. [ ] Replace `release.py` stamping with build-time injection for `base.css` and `theme.js`; keep `--check` as a test until then.
4. [ ] Combine with ADR-0006 so the tag that `publish.mjs` creates is the prebuilt one.
