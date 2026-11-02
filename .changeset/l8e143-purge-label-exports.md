---
"serupa-ds": patch
---

- Fixed (serupa-purge): `--components` (and `components: true` in the purge plugins) kept 45 components' styles whenever the sources had the word `id` or `en` in them (`id="save"`, `lang="en"`), because every component's label sets are named `en` and `id`. A name more than one component exports no longer marks any of them used, so a Button-only app is about 52 KB again instead of 237 KB.
