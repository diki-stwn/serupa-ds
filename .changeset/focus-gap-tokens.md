---
"serupa-ds": minor
---

- Removed: `--button-focus-gap-color`, `--checkbox-focus-gap-color`, `--radio-focus-gap-color`, `--switch-focus-gap-color` and `--badge-focus-gap-color`, which 9.0.0 deprecated and said were removed. They have had no effect since 9.0.0 (the focus ring is an outline, so its gap is transparent on any background), but they still shipped in the five usage guides, the components' tokens.json files and `design-tokens/components/`. A project that sets one can delete it: nothing changes on screen. `--tabs-focus-gap-color` stays, because the selected pill's inset ring uses it.
