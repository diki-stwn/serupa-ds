---
"serupa-ds": patch
---

- Changed: `@types/react` (19) is an optional peer dependency. The package's types import React's, so npm now tells a TypeScript project with the wrong major, while a JavaScript project still installs nothing extra.
