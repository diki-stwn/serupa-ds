# ADR-0011: Theming v2: independent axes, CSS-only dark mode, one brand registry

**Status:** Accepted
**Status when written:** Accepted (Diki approved analysis items B2, B3 and G5 on 23 October 2026). The axes and `light-dark()` ship in a minor release; removing the flat ids is a 9.0.0 question.
**Checked against main (31 October 2026, 11.0.0):** The axes and `light-dark()` shipped. The flat `data-theme` ids were kept past 9.0.0: `theme.js` still sets them, and they are the fallback for browsers without `light-dark()` (README, Browser support).
**Supersedes (in part):** [ADR-0003](0003-theming.md). Its plan to generate each brand from one ramp still stands.
**Deciders:** Diki

## Context

- **Themes are a flat list of six ids** (`blue-light` … `emerald-dark`) on `data-theme`, in `tokens.json` → `color.themes`. Every new axis multiplies the list: adding contrast (queued) makes 12 themes, and adding density makes 24.
- **The brand list is written out by hand in at least six places:**
  - `tokens.json`
  - `src/theme.js` (`BRANDS`)
  - `src/theme-types.ts`
  - `tools/tokens/style-dictionary.config.mjs`
  - `tools/test/vitest/helpers.ts`
  - the page and Storybook tests

  The planned brand generator would have to edit all of them.
- **Components know the mode names.** `Badge.css` branches on `[data-theme$="-light"]` and `[data-theme$="-dark"]`, with about 126 private colors per mode. Those colors are really an accent palette, and they belong in the tokens.
- **Dark mode needs JavaScript.** `tokens.css` has no `prefers-color-scheme` and no `light-dark()`. Automatic dark mode only happens if `theme.js` runs. A React or Next.js app that doesn't inject the script is always light. An app that does inject it gets a flash or a hydration warning on `<html>`, because the choice lives in localStorage and the server can't read it.

## Decision

### 1. Three independent axes, set on any element

| Attribute | Values | Sets |
|---|---|---|
| `data-brand` | `blue`, `violet`, `emerald` (generated) | Brand aliases: `--primary`, `--primary-hover`, `--primary-subtle`, `--on-primary`, `--focus-ring` |
| `data-mode` | `auto` (default), `light`, `dark` | `color-scheme: light dark` / `light` / `dark` |
| `data-contrast` | `auto` (default), `more` | Stronger borders, text and focus ring. `auto` follows `prefers-contrast: more`. |
| `data-density` | `comfortable` (default), `compact` | `--control-height-*`, padding and gap tokens (G5) |
| `data-shadow` | `neutral` (default), `brand` | `--shadow-2xs` to `--shadow-2xl`: black, or a deep shade of the element's `--primary` at the same opacity (added later, 73) |
| `data-type-scale` | `fixed` (default), `fluid` | `--text-2xl` to `--text-9xl` and the `--text-type-*` shorthands that use them: fixed, or a `clamp()` from 70% at a 320px viewport to the full size at 1280px (added later, 22) |

Any element can carry the axes, not only `<html>`. For example, a compact table inside a comfortable page, or a dark hero section inside a light page.

### 2. Mode is resolved by CSS, through `light-dark()`

Every themed color is written once, as a pair:

```css
:root            { color-scheme: light dark; --surface: light-dark(var(--white), var(--zinc-950)); … }
[data-brand="blue"] { --primary: light-dark(var(--blue-600), var(--blue-400)); … }
[data-mode="light"] { color-scheme: light; }
[data-mode="dark"]  { color-scheme: dark; }
```

`light-dark()` stays unresolved inside a custom property, so it's resolved on the element that uses the color. That element's `color-scheme` decides which value applies, so a `data-mode="dark"` section works inside a light page. The operating system setting applies from the first paint, with no JavaScript.

Browser support is Baseline 2024: Chrome and Edge 123, Safari 17.5, Firefox 120. Older browsers get the light values from a fallback declaration that comes first in each block.

### 3. One brand registry

- `tokens.json` → `color.brands` lists each brand's id, name and ramp.
- The build generates `theme.js`'s `BRANDS`, the `ThemeBrand` type, the Style Dictionary themes and the test helpers' theme list from it.
- A test fails if any of these is edited by hand.

Adding a brand then means adding one entry, plus the contrast tests generated for it (ADR-0003).

### 4. Components stop branching on the mode

Badge's 17-family palette moves into semantic tokens. Each one is a `light-dark()` pair in `tokens.json`: `--accent-red-subtle-bg`, `--accent-red-subtle-text`, `--accent-red-solid-bg`, and so on. That's an addition, so no token is renamed. A lint rule fails on `data-theme`, `data-mode` or `prefers-color-scheme` in any component CSS.

### 5. `theme.js` and React

- **`theme.js`** only stores an explicit choice and sets `data-brand` and `data-mode`. With nothing stored, it does nothing, and CSS follows the operating system.
- **`useTheme()`** is a new React hook in the main entry. It returns `{ brand, mode, resolvedMode, set }`, and it uses `useSyncExternalStore` with the `prefers-color-scheme` media query, so it's correct during hydration.
- **The Next.js recipe** (docs): `theme.js` saves the choice in a cookie as well as localStorage. The root layout reads the cookie and renders `data-brand` and `data-mode` on `<html>`, so a saved choice renders on the server with no flash and no hydration warning.

### 6. Compatibility

- `data-theme="blue-dark"` keeps working as an alias: every `[data-brand="blue"]` selector also matches `[data-theme^="blue-"]`, and `[data-theme$="-dark"]` sets `color-scheme: dark`.
- `theme.js` keeps setting `data-theme` too, until 9.0.0.
- The six existing theme ids stay as the visual test matrix, plus `contrast-more` and `compact` shots of the blue-light theme.

## Options considered

| | A: Axes and `light-dark()` (chosen) | B: Flat ids plus a `prefers-color-scheme` block | C: Keep it as it is |
|---|---|---|---|
| Dark mode without JavaScript | Yes | Yes (duplicate blocks) | No |
| Size of `tokens.css` as axes grow | Adds | Multiplies | Multiplies |
| A dark section in a light page | Yes | Only with a second id | Only with a second id |
| Server-rendered saved choice | Cookie recipe | Cookie recipe | Flash or hydration warning |

## Consequences

- **Minor release:**
  - the axes, `light-dark()` colors, the accent tokens, `useTheme()`, the cookie in `theme.js`
  - the brand registry and its generators
  - the lint rule
  - density tokens

  The contrast axis lands with the queued `prefers-contrast` item, built on these axes.
- **Tests:**
  - `tools/test/contrast` checks every color pair under both `color-scheme` values, for each brand, and for `contrast-more`.
  - The visual suite adds the two new axis shots.
  - A Storybook toolbar sets the axes separately.
- **9.0.0 (if Diki agrees then):**
  - `data-theme` stops being read.
  - `theme.js` drops `data-theme` and the `theme` field of `ThemeInfo`.
  - The codemod rewrites `data-theme="x-y"` into `data-brand="x" data-mode="y"`.
- **Risk:** a project that sets one of our color variables at `:root` to a plain value overrides both modes. The migration notes say to set both values with `light-dark()`.
