---
"serupa-ds": patch
---

- Fixed: a server-rendered Image was invisible until React hydrated, and never appeared without JavaScript, so a hero picture's Largest Contentful Paint waited for the script. Server HTML now shows the picture as soon as it arrives. Once the script runs, a lazy picture still loading fades in when it arrives, and a `priority` one is never hidden.
