# Serupa

A design system by **Diki**. Tokens, themes, utility classes and accessible React components that every project starts from, so new projects are quicker to build, look consistent, and pick up fixes with a version bump.

- **Token-driven.** Every color, size, space, radius, shadow, motion and type value is a design token. Components never hardcode a value.
- **Six themes.** Blue, Violet and Emerald, each light and dark, switched with one attribute and no component changes.
- **Accessible by default.** WCAG 2.2 AA in every theme (contrast, target size, focus), full keyboard support, visible focus, correct roles and labels, checked by the test suite on every story in every theme.
- **Works anywhere.** ES modules for React 19 apps, or one script tag on a plain page. Fonts and icons ship inside the package; nothing loads from another server.

The documentation is Storybook: run `npm run storybook` in this repo and open http://localhost:6006. The foundations (colors, themes, type, spacing, motion and the utility classes) are written in `docs/foundations.md`; each component's guide is `src/components/<Name>/README.md`.

## Getting started

### 1. Install a released version from GitHub

```sh
npm install github:diki-stwn/serupa-ds#v9.1.1
```

Always pin a tag (`#v9.1.1`), never `#main`, so an update only reaches your project when you choose it. Each release tag is prebuilt: it carries `dist/` and nothing runs on install, so npm only copies files. Released versions and what changed in each are in [CHANGELOG.md](CHANGELOG.md) and on the repository's Releases page.

To update later, change the tag in `package.json` (or run the install again with the new tag) and read the changelog entries in between. Major versions come with migration notes.

### 2. Load the styles and use the components

In a React app (Vite, Next.js, Remix):

```js
import 'serupa-ds/tokens.css';
import 'serupa-ds/base.css';     // page defaults; leave out when adding the system to an existing app
import 'serupa-ds/bundle.css';   // or components.css, plus utilities.css if you use the classes
import { Button, Field, Input } from 'serupa-ds';

export function SignUp() {
  return (
    <form>
      <Field label="Email" required><Input type="email" /></Field>
      <Button type="submit">Create account</Button>
    </form>
  );
}
```

React 19 is a peer dependency, so the components use your app's React, and they render on the server too. Types ship with the package.

In React Server Components (the Next.js App Router), import them straight into a server component. The interactive ones (Button, Dialog, Combobox…) are client components (`"use client"`); layout and text (Container, Stack, Grid, Heading, Text, Divider…) render on the server, and so do the helpers `buttonClass`, `paginationRange`, `formatFileSize` and `initials`.

Load `tokens.css` first: the styles read every value from it. The styles sit in cascade layers, in this order: `dk.tokens`, `dk.base`, `dk.components`, `dk.utilities`. Your own CSS outside a layer always wins over them, whatever order the files load in, so overriding a component needs no `!important` or extra specificity. If your app uses layers too, place the system's where you want them, such as `@layer reset, dk, app;` (the `dk.*` layers sit inside `dk`).

On a plain page without a bundler:

```html
<html lang="en" data-brand="blue" data-mode="auto">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="dist/theme.js"></script>
  <link rel="stylesheet" href="tokens.css">
  <link rel="stylesheet" href="dist/base.css">
  <link rel="stylesheet" href="dist/bundle.css">
</head>
<body>
  <div id="root"></div>
  <script src="dist/lib/react.production.min.js"></script>
  <script src="dist/lib/react-dom.production.min.js"></script>
  <script src="dist/serupa.iife.js"></script>   <!-- puts the components on window.Serupa -->
</body>
</html>
```

### 3. Pick a theme

Set the brand and mode on `<html>` and load `theme.js` first in `<head>`, so the page follows the visitor's light or dark setting without a flash:

```html
<html data-brand="blue" data-mode="auto">   <!-- brand: blue | violet | emerald; mode: auto | light | dark -->
```

Or set one theme directly on any element: `data-theme="violet-dark"`. See Foundations › Themes in Storybook (`docs/foundations.md`).

### 4. Ship it

`bundle.css` holds every utility class (nearly 2 MB). For production, trim it to the classes your code uses with `serupa-purge`, which comes with the package. From your project's folder:

```sh
npx serupa-purge src -o public/bundle.min.css
```

It reads the installed `bundle.css` (or `--css <file>`); name classes your code builds at runtime with `--keep`.

That keeps the component styles (about 220 KB) and only the utility classes your code uses. Add `--components` to also drop the styles of components your code never names: an app that only uses Button gets about 48 KB instead of 189 KB. A component counts as used when its name appears in your sources (`<Button`, `import { Button }`, `Serupa.Button`), and the components it needs come along (IconButton brings Button and Icon).

```sh
npx serupa-purge src -o public/bundle.min.css --components
```

### What's in the package

| File | What it is |
| --- | --- |
| `tokens.css` | Every token as a CSS variable, the six themes, and the fonts. Load it first. |
| `dist/base.css` | Page defaults (font, colors, focus style, reduced motion, print), all inside `:where()` so any class wins. When printing, filled controls (Button, Badge, Progress, checked boxes) keep their colors, toasts, tooltips and open menus and pickers are left out, and `data-print-urls` on a container prints each outside link's address after it. |
| `dist/components.css` | The component styles (`dk-*`), about 205 KB (27 KB gzipped). |
| `dist/utilities.css` | Every utility class. |
| `dist/bundle.css` | `components.css` + `utilities.css`. |
| `dist/index.js`, `dist/index.d.ts` | The components as ES modules, with types. |
| `dist/serupa.iife.js` | The components for a plain page (`window.Serupa`). |
| `dist/theme.js` | Automatic dark mode and the theme switcher API. |
| `tokens.json`, `design-tokens/` | The tokens as data, and in the W3C format for Figma and Style Dictionary. |

### How the utility classes read tokens

Every utility class works on its own, with no framework or build step, and every class whose value is on a scale reads it from its token: `p-4` is `var(--spacing-4)`, `duration-300` is `var(--duration-300)`. Change a token on a page and its classes follow. Three deliberate exceptions: breakpoints (CSS can't read variables inside `@media`), shadow classes (they write the token's shape out so a color class can recolor it), and `rounded-full` (9999px). Border and divide style classes (`border-dashed`) only change a line that a width class draws, so the system needs no CSS reset.

The palette has 22 color families with 11 shades each (`50`–`950`) plus `white` and `black`, and 33 alias tokens that give colors a role (`primary`, `text`, `border`…). Build with the aliases; they change per theme.

## Components

React components, styled only with this system's tokens. Each one's guide (when to use it, when not to, props, keyboard and accessibility notes, component tokens) is on its Storybook page and in `src/components/<Name>/README.md`.

Storybook's sidebar lists them by group: Actions, Forms, Feedback, Overlays, Navigation, Content, and Layout and type (each component's stories file names its group in its `title`). The folders are in [`src/components/`](src/components/).

Shared conventions, so learning one component teaches the rest:

- `size` is `'sm' | 'md' | 'lg'` at the control heights 24, 32 and 44px (some components have only `sm` and `md`).
- Form controls take `invalid` and `disabled`, and get their label, hint and error from `Field`.
- Components read their own component tokens (`--button-*`, `--input-*`), which default to the shared aliases. Override one on a page, a container or a single instance.
- For router links, set the link component once at startup: `configure({ link: Link })`.

Not every component is in a release yet: check the changelog for the version that added it.

## Versioning

The system follows [Semantic Versioning](https://semver.org): the version is in `package.json`, at the top of every shipped file and in `Serupa.version`, and every release is listed in `CHANGELOG.md`.

| Release | When | Examples |
| --- | --- | --- |
| **Major** (2.0.0) | Something that worked stops working | A token, class, prop or file removed or renamed; a default that changes existing screens; removing a deprecated name |
| **Minor** (1.1.0) | Something new; everything existing keeps working | New tokens, classes, components or props; a new theme |
| **Patch** (1.0.1) | A fix that doesn't change what correct code gets | A contrast fix inside the rules, a bug in a component, docs |

Names are never removed in a minor or patch release: they're marked deprecated in `CHANGELOG.md`, keep working, and go in the next major. The test suite enforces it: a utility class that disappears is reported as a breaking change. To release: each pull request carries a changeset (`npx changeset`: patch, minor or major, and the note); on `main` a "Release" pull request gathers them into the next version and `CHANGELOG.md`, and merging it tags the version and makes a GitHub release (see `tools/README.md`).

## Design tokens for design tools

`design-tokens/` holds the same tokens in the W3C Design Tokens format (DTCG 2025.10), which Figma plugins (Tokens Studio and others), Style Dictionary and other token tools read:

| File | Holds |
| --- | --- |
| `serupa.tokens.json` | The palette and every scale: colors, dimensions, durations, easings, font families and weights, numbers, shadows, and the type styles as typography tokens |
| `themes/<theme>.tokens.json` | The 33 alias colors for one theme, as references into the palette (`"{color.blue-600}"`). Load `serupa.tokens.json` plus one theme file |
| `css-values.json` | Values the format has no type for yet (degrees, `em`, percentages of a box, viewport units, keywords, CSS shorthands, text shadows), as plain CSS |
| `components/<component>.tokens.json` | A component's own tokens (Button's 44 `--button-*` tokens), as references to the shared ones. Copied from `src/components/<Name>/<name>.tokens.json` |

Each token keeps its CSS variable in `$extensions["com.serupa"].cssVar`. The files are generated from `tokens.json` (`npm run tokens`) and the tests fail if they fall out of step. `tools/tokens/style-dictionary.config.mjs` builds them back into CSS, one file per theme, with the system's own variable names; the tests check that every one of its 3,500 values equals the token.

## Browser support

Current Chrome, Edge, Safari and Firefox. The tests run in Chromium, and the cross-browser test (`tools/test/compat.mjs`) runs the system in Safari's engine (WebKit) or Firefox and compares every utility class and the behaviour of `base.css`, `theme.js`, responsive classes and Button with Chromium. A few classes depend on newer CSS that not every browser has yet; they do nothing where it's missing:

| Classes | Where they don't work yet |
| --- | --- |
| `justify-self-*`, `place-self-*` on a child of a plain block (in flex and grid they work everywhere) | Safari |
| `touch-pan-up`, `-down`, `-left`, `-right` | Safari (use `touch-pan-x` / `touch-pan-y`) |
| `mask-clip-fill`, `-stroke`, `-view` and the same `mask-origin-*` | Safari |
| `place-content-baseline` | Safari |
| `mix-blend-plus-darker` | Everything but Safari |

Popover and command buttons (`popoverTarget`, `command`) and `text-wrap: balance` are progressive: older browsers ignore them and the page still works.

## Maintaining the system

The source is in `src/`: one folder per component in `src/components/<Name>/` (the component in TypeScript, its CSS, its component tokens, its guidelines and its preview), the utility classes in `src/styles/utilities.template.css` (expanded over the tokens by `tools/utilities/build.mjs`), and `base.css` and `theme.js`. `npm run build` makes `dist/`, which is never edited or committed: `index.js` and `index.d.ts` (ES modules and types), `serupa.iife.js` (the browser script), `components.css`, `utilities.css`, `bundle.css`, `base.css`, `theme.js` and `lib/`. `npm run typecheck` checks the types.

`npm run new-component -- <Name> --group <Storybook group>` starts one: it writes the folder with every file the contract asks for, already wired to the tokens, the layers and the docs, plus its server-render case, and marks each place that needs your words `TODO(new-component)` (the contract check fails while one is left), then prints the remaining steps. A new component lives in its own folder and nothing else needs a line for it: its `index.ts` says what the package exports, its words go in its `labels.ts` (with the Indonesian), and `tools/build/registry.mjs` builds the export list, the CSS import list and the label sets from the folders into `src/generated/` (not committed). Its stylesheet joins `components.css` after the ones listed in `src/styles/cascade.txt`; list it there only when it must come before another component's styles. Its server-render case is `tools/test/ssr/<Name>.mjs`, and `node tools/test/api.mjs --update` writes its `tools/test/baseline-api/<Name>.d.ts`, and `node tools/test/size.mjs --update <Name>` its size budgets, `tools/test/baseline-size/<Name>.json`. So two pull requests that add or change different components don't conflict.

`tools/` holds the build, the test suite, the design tokens export, the release script and the CSS trimmer; see `tools/README.md`. Run `npm test` before publishing a change; it builds first. It checks the package (every export exists, the components render on the server, the types), audits the foundation (every value reads its token, fallbacks match, contrast in every theme, one version everywhere, nothing loads from outside), checks the design tokens export and builds it through Style Dictionary, compares all 25,559 utility classes and every Storybook story with saved screenshots, tests Button's behaviour, the custom icon build and the page groundwork, and opens every Storybook story and page, checking each story against WCAG 2.2 AA in all six themes. The documentation is Storybook: `npm run storybook`. Add `--compat safari` (or `firefox`, `webkitgtk`) to compare another browser engine. Products don't need `tools/`.

## Credits

Serupa is designed and built by **Diki** ([@diki-stwn](https://github.com/diki-stwn)). It was called the Diki Design System up to version 4.

The system is self-contained: every file it needs is in it, and nothing loads from another server. It builds on these open-source works; their licenses are in `licenses/`.

| Work | Used for | License |
| --- | --- | --- |
| Tailwind CSS (Tailwind Labs) | The naming and values of the utility classes, the palette and the scales, checked against its compiler (v4.3.3) | MIT — `licenses/TailwindCSS-MIT.txt` |
| Inter (Rasmus Andersson) | `font-sans` — `fonts/InterVariable.woff2`, `fonts/InterVariable-Italic.woff2` | SIL Open Font License 1.1 — `licenses/Inter-OFL-1.1.txt` |
| Material Symbols (Google) | Icons, as SVG in the components and `serupa-ds/icons`: the Rounded, filled, weight-400 style | Apache 2.0 — `licenses/MaterialSymbols-Apache-2.0.txt` |
| React 19.3.1 (Meta) | Running the components on plain pages — `dist/lib/`, built from the `react` and `react-dom` packages by the build | MIT — `licenses/React-MIT.txt` |
