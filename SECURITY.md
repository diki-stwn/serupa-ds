# Security

## Supported versions

Fixes go into the next release of the latest major (see [CHANGELOG.md](CHANGELOG.md) and the Releases page). To get
one, update to that tag.

## Reporting a vulnerability

Please report it privately, not in a public issue or pull request: on the repository's **Security** tab, choose
**Report a vulnerability**. Say what is affected (a component, `theme.js`, the CLI, the build), the version, and how
to reproduce it. Once a fix is released, the advisory is published with credit to you unless you'd rather not be
named.

## What the package does

Knowing this helps tell a real issue from expected behaviour:

- Nothing runs on install. Release tags are prebuilt, so npm only copies files.
- Nothing loads from another server. The shipped CSS and JavaScript contain no remote URLs or `@import` (checked by
  `tools/test/foundation.mjs`).
- The components work under a strict Content Security Policy and with Trusted Types enforced (checked on every story
  by `src/internal/strictCsp.test.tsx` and `trustedTypes.test.tsx`). `theme.js` can run inline with a nonce.
- Text you pass to a component is rendered as text, never as HTML.
- Scripts store only two things, both in `localStorage`: `theme.js` keeps the chosen theme under `serupa-theme`, and
  a Splitter given a `storageKey` keeps its size under that key.
