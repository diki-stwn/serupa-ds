---
"serupa-ds": patch
---

Bundling serupa-ds with esbuild (and the tools built on it) no longer prints ten "Ignoring this import because … marked as having no side effects" warnings. Ten modules imported only types as `import { type X }`, which left a bare `import "…"` in the build. They now use `import type`, and lint keeps it that way (FD1).
