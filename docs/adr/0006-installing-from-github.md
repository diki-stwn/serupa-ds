# ADR-0006: Install releases from GitHub, prebuilt

**Status:** Accepted
**Status when written:** Proposed
**Checked against main (31 October 2026, 11.0.0):** Done: each release tag is prebuilt and carries `dist/`, and each GitHub release also has the packed `.tgz` (README, Install).
**Date:** 2026-10-17
**Deciders:** Diki

## Context

The name isn't final, so there's no npm or GitHub Packages publishing until Diki picks one (the rename ships as 5.0.0). Projects install straight from GitHub. The README says:

```sh
npm install github:diki-stwn/design-system#v4.8.0
```

Facts that matter:

- The repo is **private**, so every installing machine and CI needs git access to it.
- `dist/` isn't committed, so npm runs the `prepare` script on install: it installs **all devDependencies** (Storybook, Vite, Playwright, Style Dictionary, TypeScript, tsup) into a temp folder and builds. Slow, heavy, and a failed build on the project's machine fails the project's install.
- **No release tag exists yet** (the Release workflow is blocked, ADR-0007), so the README's `#v4.8.0` points at nothing.
- The Release workflow already attaches the `npm pack` tarball to each GitHub release, but npm can't download a release asset from a private repo without a token in the URL.

## Decision

Make each release tag point at a commit that already contains the built files and no `prepare` script. Projects keep the same install command; npm just copies files.

## Options considered

### A: Git install that builds on install (current)
| Dimension | Assessment |
|---|---|
| Install time | Poor: minutes, hundreds of MB of dev tools |
| Reliability | Poor: depends on the project's Node version and network for the build |
| Setup | Good: git access only |

### B: Prebuilt release tags (recommended)
`tools/publish.mjs` builds, then creates a release commit off `main` (not on it) that adds `dist/`, removes `prepare` and the devDependencies from `package.json`, and tags that commit `vX.Y.Z`. `main` stays free of build output.

| Dimension | Assessment |
|---|---|
| Install time | Seconds |
| Reliability | High: what's installed is exactly what CI tested and packed |
| Setup | Same as today: git access; same command |
| Risk | Low: the tag's `package.json` differs from `main`'s; the `package.mjs` test can run against the tagged tree |

### C: Tarball URL from the GitHub release
**Pros:** the file already exists. **Cons:** private repo, so the URL needs a token and isn't cacheable; tokens end up in `package.json` or lockfiles. Rejected while the repo is private.

### D: GitHub Packages or npm now
**Pros:** standard installs, version ranges, `npm update`. **Cons:** needs the final name (GitHub Packages requires the `@diki-stwn` scope), which is exactly what's on hold. Right answer at 5.0.

## Trade-off analysis

B fixes the speed and reliability problems with no change for projects and no naming decision. D is the end state and replaces B at 5.0; B makes that move trivial because the tagged tree is already a publishable package.

## Consequences

- Easier: the first real project installs quickly and gets exactly the tested build.
- Harder: release tags are no longer on `main`'s history; `git describe` on `main` won't find them (use the GitHub release list).
- Revisit at 5.0: registry choice and scope with the new name; the README's install section then changes once.

## Action items

1. [ ] `publish.mjs`: build, commit `dist/` on a detached release commit with `prepare` and devDependencies removed, tag it, attach the tarball as today.
2. [ ] Fix the README install line to the first real tag once it exists.
3. [ ] CI: install the tag into a scratch project and import every entry point.
4. [ ] 5.0: pick the registry with the name.
