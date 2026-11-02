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
npm install github:diki-stwn/serupa-ds#v14.0.0
```

Or install the same release from its file on the Releases page, which needs no git on the machine and puts the file's checksum in your lockfile:

```sh
npm install https://github.com/diki-stwn/serupa-ds/releases/download/v14.0.0/serupa-ds-14.0.0.tgz
```

To check a downloaded file before you install it: the release notes give its SHA-256, and releases after 10.1.0 also carry a build attestation, GitHub's signed record that this repository's Release workflow built the file from the tagged commit. With the [GitHub CLI](https://cli.github.com):

```sh
gh attestation verify ./serupa-ds-14.0.0.tgz --repo diki-stwn/serupa-ds
```

Always pin a tag (`#v14.0.0`), never `#main`, so an update only reaches your project when you choose it. Each release tag is prebuilt: it carries `dist/` and nothing runs on install, so npm only copies files. Released versions and what changed in each are in [CHANGELOG.md](CHANGELOG.md) and on the repository's Releases page.

To update later, change the tag in `package.json` (or run the install again with the new tag) and read the changelog entries in between. Major versions come with migration notes.

### 2. Load the styles and use the components

In a React app (Vite, Next.js, Remix):

```js
import 'serupa-ds/tokens.css';
import 'serupa-ds/base.css';     // page defaults; leave out when adding the system to an existing app
import 'serupa-ds/bundle.css';   // or components.css, plus utilities.css if you use the classes
// import 'serupa-ds/utilities-extra.css';   // masks and gradients (mask-*, bg-linear-*, from-*…), if you use them
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

React 19 is a peer dependency, so the components use your app's React, and they render on the server too. Types ship with the package. They build on React's, so a TypeScript project also needs `@types/react` 19, an optional peer dependency that a JavaScript project can leave out.

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

A server-rendered app can save the request by pasting the text of `dist/theme.js` into an inline `<script>` in `<head>` (give it a nonce under a strict Content Security Policy); the file is written so it works inline. If both the inline copy and the file end up on a page, the second one does nothing, so the first keeps running the theme.

Or set one theme directly on any element: `data-theme="violet-dark"`. A theme switch with theme.js changes every color at once: it finishes each control's color transition, so controls don't each fade on their own, while motion runs on (a menu fading out as "Dark" is picked, a switch sliding). To switch a section yourself, do it inside `withoutTransitions(() => section.setAttribute("data-theme", "violet-dark"), section)` for the same effect. With theme.js loaded, a `data-theme` on `<html>` (and no `data-brand` or `data-mode`) is the page default, so it isn't replaced. See Foundations › Themes in Storybook (`docs/foundations.md`).

### 4. Ship it

`bundle.css` holds every utility class (nearly 2 MB). For production, trim it to the classes your code uses. With Vite, add the plugin that comes with the package, and keep importing `bundle.css` as above:

```js
// vite.config.js
import react from '@vitejs/plugin-react';
import { serupaPurge } from 'serupa-ds/purge';

export default { plugins: [react(), serupaPurge()] };
```

`vite build` then ships the component styles (about 220 KB) and only the utility classes your code uses; the dev server keeps every class, so a class you add shows at once. It reads whichever of `src/`, `index.html`, `app/`, `pages/` and `components/` your project has (or `content: ['src', 'docs']`), and trims only Serupa's stylesheets (`utilities-extra.css` too, if you import it), never your own CSS. With Next.js, webpack, or a stylesheet that `@import`s `bundle.css`, use the PostCSS plugin instead:

```js
// postcss.config.mjs
import { serupaPurgePostcss } from 'serupa-ds/purge';

export default { plugins: [serupaPurgePostcss()] };
```

Without a bundler, run `serupa-purge` from your project's folder; it reads the installed `bundle.css` (or `--css <file>`):

```sh
npx serupa-purge src -o public/bundle.min.css
```

Class names must appear whole in your code: name the ones it builds at runtime (`"grid-cols-" + n`) with `keep: ['grid-cols-2', '@safelist.txt']` in either plugin, or `--keep` on the command line.

To also drop the styles of components your code never names, pass `components: true` (or `--components`): an app that only uses Button gets about 48 KB instead of 189 KB. A component counts as used when its name appears in your sources (`<Button`, `import { Button }`, `Serupa.Button`), and the components it needs come along (IconButton brings Button and Icon).

```sh
npx serupa-purge src -o public/bundle.min.css --components
```

### What's in the package

| File | What it is |
| --- | --- |
| `tokens.css` | Every token as a CSS variable, the six themes, and the fonts. Load it first. |
| `dist/base.css` | Page defaults (font, colors, focus style, reduced motion, print), all inside `:where()` so any class wins. When printing, filled controls (Button, Badge, Progress, checked boxes) keep their colors, toasts, tooltips and open menus and pickers are left out, and `data-print-urls` on a container prints each outside link's address after it. |
| `dist/components.css` | The component styles (`dk-*`), about 205 KB (27 KB gzipped). |
| `dist/utilities.css` | The utility classes, apart from masks and gradients. |
| `dist/utilities-extra.css` | The masks (`mask-*`) and gradients (`bg-linear-*`, `bg-radial`, `bg-conic`, and the `from-`, `via-` and `to-` stops): a quarter of the utility rules, which few pages use. Import it after `bundle.css` or `utilities.css`. |
| `dist/bundle.css` | `components.css` + `utilities.css`. |
| `dist/index.js`, `dist/index.d.ts` | The components as ES modules, with types. |
| `dist/serupa.iife.js` | The components for a plain page (`window.Serupa`). |
| `dist/serupa-icons.iife.js` | Every Material Symbol by name, for a plain page. `serupa.iife.js` loads it from its own folder when an Icon needs it, so keep the two together. |
| `dist/theme.js` | Automatic dark mode and the theme switcher API. |
| `dist/debug.js` | A debug overlay for finding why a screen looks off. Load it, then add `?serupa-debug` to the page's address: every component gets a dashed outline, and pointing at one shows its name, variant and size, its state and the component tokens set on it. It also checks the color pairs against WCAG contrast where they're drawn, so a color token you override can't quietly fail: the console lists the failures on the page, and the panel adds those on the component. Escape turns it off. `Serupa.debug.inspect(element)` and `Serupa.debug.contrast(element)` give the same as objects. Leave it out of production. |
| `dist/eslint.js` (`serupa-ds/eslint`) | Tells eslint-plugin-jsx-a11y what each component renders, so your lint checks `<Image>` and `<IconButton>` as it checks `img` and `button`. See Getting started in Storybook. |
| `dist/stylelint.js` (`serupa-ds/stylelint`) | A Stylelint config for your own CSS: it flags a color, a spacing length or a radius written out where a token belongs. See Getting started in Storybook. |
| `dist/testing.js` (`serupa-ds/testing`) | `forEachTheme(page, fn)` for your own CI: it draws a Playwright page in each of the six themes, with transitions off and the color scheme to match, and calls `fn` so you can take a screenshot in each. |
| `dist/purge.js` (`serupa-ds/purge`) | `serupaPurge()` for Vite and `serupaPurgePostcss()` for PostCSS: they trim `bundle.css` in your build to the utility classes your code uses, as `serupa-purge` does. See Ship it above. |
| `tokens.json`, `design-tokens/` | The tokens as data, and in the W3C format for Figma and Style Dictionary. |

### For your own components

The package also exports what the components use themselves, so a component you build follows the same settings:

| Export | What it gives |
| --- | --- |
| `useSerupa()` | The nearest `SerupaProvider`'s settings: `locale`, `labels` (the built-in words), `icons` and `platform`. |
| `useLocale(own?)` | The locale the components use: `own` when given, else the provider's, else the browser's (`en-US` in server HTML until hydrated). |
| `useCollator(options?)` | An `Intl.Collator` for that locale, to sort the way people expect. |
| `plural(locale, count, forms)` | The words for `count` in that language's plural rules (`one`, `few`, `many`, … and `other`), with `#` replaced by the count: for labels in languages with more than "1" and "the rest". |
| `announce(text, { assertive? })` | Says `text` to screen readers through the components' live regions, which move into an open Dialog or Drawer so it's heard there too. `assertive` interrupts: only for errors. |
| `announcePage({ title?, focus? })` | After a client-side route change, does what a full page load would: focuses the new page's main heading (the `h1` in `<main>`, made focusable with `tabindex="-1"`) and says its title (`document.title` by default) to screen readers, unless the focused heading already says it. `focus` takes an element or a selector, or `false` to leave focus where it is. Call it in an effect once the new page has rendered. |
| `withViewTransition(update, { types? })` | Runs a state change as a View Transition, so what it moves glides to its new place instead of jumping: a list reordered or filtered, a card expanded, a layout switched. Mark what should travel with `view-transition-name` or the `view-transition-match` class. It uses `motion-change-md` with `ease-move`, only crossfades under reduced motion, and applies the change at once where View Transitions are missing. |

```tsx
import { announce, useLocale } from "serupa-ds";

function SavedAt({ at }: { at: Date }) {
  const locale = useLocale();
  return <span>{at.toLocaleTimeString(locale)}</span>;
}

announce("Draft saved");
```

```tsx
import { announcePage } from "serupa-ds";

// In the app's layout, with your router's location
function RouteAnnouncer({ path }: { path: string }) {
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }   // the first load is the browser's to announce
    announcePage();
  }, [path]);
  return null;
}
```

```tsx
import { withViewTransition } from "serupa-ds";

function Cards({ items }: { items: { id: string; title: string }[] }) {
  const [sorted, setSorted] = React.useState(items);
  const sortByTitle = () => withViewTransition(() => setSorted((s) => [...s].sort((a, b) => a.title.localeCompare(b.title))));
  return <>
    <button onClick={sortByTitle}>Sort by title</button>
    <ul className="stagger">{sorted.map((c) => <li key={c.id} className="view-transition-match animate-enter">{c.title}</li>)}</ul>
  </>;
}
```

[Localization](docs/Localization.mdx) has more on the provider.

### How the utility classes read tokens

Every utility class works on its own, with no framework or build step, and every class whose value is on a scale reads it from its token: `p-4` is `var(--spacing-4)`, `duration-300` is `var(--duration-300)`. Change a token on a page and its classes follow. Three deliberate exceptions: breakpoints (CSS can't read variables inside `@media`), shadow classes (they write the token's shape out so a color class can recolor it), and `rounded-full` (9999px). Border and divide style classes (`border-dashed`) only change a line that a width class draws, so the system needs no CSS reset.

The palette has 22 color families with 11 shades each (`50`–`950`) plus `white` and `black`, and 33 alias tokens that give colors a role (`primary`, `text`, `border`…). Build with the aliases; they change per theme.

## Components

React components, styled only with this system's tokens. Each one's guide (when to use it, when not to, props, keyboard and accessibility notes, component tokens) is on its Storybook page and in `src/components/<Name>/README.md`.

Storybook's sidebar lists them by group: Actions, Forms, Feedback, Overlays, Navigation, Content, and Layout and type (each component's stories file names its group in its `title`). The folders are in [`src/components/`](src/components/).

<!-- components:start (written by tools/build/registry.mjs) -->

### Actions

| Component | What it's for |
| --- | --- |
| [Button](src/components/Button/README.md) | Triggers an action: submitting a form, opening a dialog, confirming or cancelling. |
| [ButtonGroup](src/components/ButtonGroup/README.md) | Related buttons side by side, or stacked: joined into one control with shared borders (the default), or spaced apart. |
| [CopyButton](src/components/CopyButton/README.md) | A button that copies text to the clipboard: an API key, an invite link, a command. |
| [Fab](src/components/Fab/README.md) | A floating action button: the one main action of a screen, such as "New project" or "Compose", in a round, raised button fixed to a corner. |
| [IconButton](src/components/IconButton/README.md) | A button that shows only an icon: a menu trigger, a close button, a toolbar action. |
| [Link](src/components/Link/README.md) | An inline text link: underlined, in the primary color or the surrounding text's. |
| [ToggleButton](src/components/ToggleButton/README.md) | A Button that stays on or off, for a setting that applies right away: bold in a text editor, mute, show the grid. |
| [ToggleGroup](src/components/ToggleGroup/README.md) | A set of [ToggleButton](src/components/ToggleButton/README.md)s that share one value: one on at a time, such as text alignment or a view mode, or any number, such as bold, italic and underline. |
| [Toolbar](src/components/Toolbar/README.md) | A set of controls, such as an editor's formatting buttons, that takes one Tab stop instead of one per control. |

### Content

| Component | What it's for |
| --- | --- |
| [Accordion](src/components/Accordion/README.md) | A stack of items whose content shows and hides under a title button: FAQs, settings groups, long forms split into sections. |
| [Avatar](src/components/Avatar/README.md) | A small picture of a person (a circle) or of a team, project or organisation (a square). |
| [AvatarGroup](src/components/AvatarGroup/README.md) | Avatars in an overlapping row, such as the people on a project or the assignees of a task. |
| [Card](src/components/Card/README.md) | A surface that groups related content and its actions: a summary, a settings panel, an item in a grid. |
| [Carousel](src/components/Carousel/README.md) | One slide at a time, with previous and next buttons, a dot per slide and swipe. |
| [FormattedNumber](src/components/FormattedNumber/README.md) | Writes a number the way the reader's language does: `1.234,5` in Indonesian, `1,234.5` in English, `١٬٢٣٤٫٥` in Egyptian Arabic. |
| [Highlight](src/components/Highlight/README.md) | Shows text with the parts that match a search marked, ignoring case and accents, for search results, [Combobox](src/components/Combobox/README.md) options and a command palette. |
| [Icon](src/components/Icon/README.md) | Shows one icon as an inline SVG: from Material Symbols, always in the **Rounded** style with **Fill** on, or one of your own custom icons. |
| [Image](src/components/Image/README.md) | A picture in a frame: a fixed ratio, rounded corners, a placeholder while it loads and a fallback if it fails. |
| [Kbd](src/components/Kbd/README.md) | Shows a keyboard key or shortcut as keycaps, in help text, tooltips, menus and empty states. |
| [List](src/components/List/README.md) | Rows of related things: people, files, notifications, settings. |
| [RelativeTime](src/components/RelativeTime/README.md) | Says how long ago, or how far ahead, a moment is, in the reader's language: "3 minutes ago", "yesterday", "in 2 hours". |
| [SortableList](src/components/SortableList/README.md) | A list people put in their own order: tasks by priority, steps in a flow, columns in a table. |
| [Table](src/components/Table/README.md) | A data table built on native table markup: a header row, body rows and an optional footer, in a bordered frame that scrolls sideways when the table is too wide. |
| [VirtualList](src/components/VirtualList/README.md) (beta) | A [List](src/components/List/README.md) of any length that draws only the rows in view, so ten thousand people, files or log lines scroll as smoothly as ten. |

### Data display

| Component | What it's for |
| --- | --- |
| [Timeline](src/components/Timeline/README.md) | An ordered list of events, each with a marker on a line that joins them, a title, a time and optional content. |

### Feedback

| Component | What it's for |
| --- | --- |
| [Alert](src/components/Alert/README.md) | A message about the page or a task: something saved, something to know, something that went wrong. |
| [Badge](src/components/Badge/README.md) | A short label for status, counts and categories, optionally clickable. |
| [EmptyState](src/components/EmptyState/README.md) | What a page or a panel shows when there's nothing in it yet, or nothing matches: an icon, a few words saying what's empty, what it means, and the action that fills it. |
| [ErrorBoundary](src/components/ErrorBoundary/README.md) | Catches an error thrown while rendering anything inside it and shows a message with "Try again" in its place, so one broken widget doesn't blank the whole page. |
| [Loader](src/components/Loader/README.md) | Shows that something is loading when you can't say how far along it is. |
| [Meter](src/components/Meter/README.md) | Shows a measurement within a known range: storage used, a plan's seats, a password's strength, a battery level. |
| [Progress](src/components/Progress/README.md) | Shows how far along a task is when you can tell: an upload, a setup, a quota. |
| [SaveStatus](src/components/SaveStatus/README.md) | A small line that says whether autosaved changes are safe: "Saving…", "Saved 2 minutes ago", or "Couldn't save" with a Try again button. |
| [Toast](src/components/Toast/README.md) | A short message that confirms something happened ("Changes saved", "Moved to trash") without getting in the way. |

### Forms

| Component | What it's for |
| --- | --- |
| [Calendar](src/components/Calendar/README.md) | A month of days to pick one from, with full keyboard navigation. |
| [Checkbox](src/components/Checkbox/README.md) | A native checkbox with its label, for turning one option on or off, or picking any number from a list. |
| [ColorPicker](src/components/ColorPicker/README.md) | Picks a color from a set of swatches, or any color by its hex code or with the browser's own picker. |
| [Combobox](src/components/Combobox/README.md) | A text field with a list of options that narrows as you type: pick a country, an assignee, a project. |
| [DatePicker](src/components/DatePicker/README.md) | A date field: people type a date, or pick one from a calendar that opens under the field. |
| [DateRangePicker](src/components/DateRangePicker/README.md) | Two date fields for the start and end of a range (a stay, a report period, a filter), with a popup of two months to pick both. |
| [ErrorSummary](src/components/ErrorSummary/README.md) | After a form fails to submit, a box at the top of the form that says what's wrong, with each error a link to its field. |
| [Field](src/components/Field/README.md) | A label, an optional hint and an error message around one form control, wired up for screen readers. |
| [FileUpload](src/components/FileUpload/README.md) | A drop area with a button for choosing files, and the chosen files listed under it with their size and a remove button. |
| [InlineEdit](src/components/InlineEdit/README.md) | Text people can change where it is: a project name, a card title, a slug. |
| [Input](src/components/Input/README.md) | A single-line text field: a native `<input>` in a box that can hold icons. |
| [NumberInput](src/components/NumberInput/README.md) | A field for a number, with − and + buttons at the end. |
| [PasswordInput](src/components/PasswordInput/README.md) | A password field with a button at the end that shows and hides what was typed, so people can check it before they submit. |
| [PhoneInput](src/components/PhoneInput/README.md) | A phone number field with a country menu at the start. |
| [PinInput](src/components/PinInput/README.md) | A one-time code or PIN, shown as one box per character, such as the 6-digit code texted at sign-in. |
| [Radio](src/components/Radio/README.md) | Native radios for one choice from a short list. |
| [Rating](src/components/Rating/README.md) | Stars to pick a score (how was your stay, how useful was this article) or to show one (a product's average). |
| [SearchInput](src/components/SearchInput/README.md) | A search field: a search icon at the start, and a × at the end once something is typed. |
| [SegmentedControl](src/components/SegmentedControl/README.md) | Picks one of a few options shown side by side, such as a view (List, Board) or a period (Day, Week, Month). |
| [Select](src/components/Select/README.md) | A native `<select>` styled like Input: the same three heights (24, 32 and 44px), colors, focus ring and states, with a chevron and an optional left icon. |
| [Slider](src/components/Slider/README.md) | Picks a number, or a range with two thumbs, by dragging along a track or with the keyboard. |
| [Switch](src/components/Switch/README.md) | An on/off setting that takes effect at once. |
| [Textarea](src/components/Textarea/README.md) | A multi-line text field, Input's sibling: a native `<textarea>` in a box. |
| [TimePicker](src/components/TimePicker/README.md) | A time-of-day field: people type a time, or pick one from a list. |
| [TypeToConfirm](src/components/TypeToConfirm/README.md) | A field and a destructive button for an action that can't be undone: the button works only once the person types a phrase, usually the name of what's being deleted. |

### Layout

| Component | What it's for |
| --- | --- |
| [Splitter](src/components/Splitter/README.md) | Two panes with a handle between them that people drag, or move with the keys, to give one pane more room: a list and its detail, a sidebar and an editor, code and its output. |

### Layout and type

| Component | What it's for |
| --- | --- |
| [Container](src/components/Container/README.md) | Centers a page's content with a maximum width, and side padding that grows with the screen: 16px, 24px from 640px and 32px from 1024px wide. |
| [Divider](src/components/Divider/README.md) | A 1px line between content, horizontal or vertical, with an optional label in the middle such as "or". |
| [Grid](src/components/Grid/README.md) | Cells in equal columns, or as many columns as fit, with the same space between them from the spacing scale. |
| [Heading](src/components/Heading/README.md) | A heading, `h1` to `h6`, in the system's type. |
| [Prose](src/components/Prose/README.md) | Styles for content nobody wrote in components: HTML from Markdown, a CMS or a rich-text editor, such as a help article, a changelog or a blog post. |
| [Stack](src/components/Stack/README.md) | Lays its children out in a column, or a row, with the same space between each, taken from the spacing scale. |
| [Text](src/components/Text/README.md) | Body text in the system's type: a paragraph, a caption, an error line. |
| [VisuallyHidden](src/components/VisuallyHidden/README.md) | Content that screen readers announce but nobody sees: "(opens in a new tab)", the label of an icon-only control you build yourself, a heading for a section that's obvious by sight. |

### Navigation

| Component | What it's for |
| --- | --- |
| [Breadcrumb](src/components/Breadcrumb/README.md) | Shows where the current page sits: links to the pages above it, from the top level down, with chevrons between them. |
| [LoadMore](src/components/LoadMore/README.md) | The end of a list that loads in pages: "Showing 20 of 134" over a Load more button, or infinite scroll, and an announcement of what each load added. |
| [Navbar](src/components/Navbar/README.md) | The bar across the top of an app: the brand on the left, the main page links, and actions on the right (search, a user menu, sign in). |
| [Pagination](src/components/Pagination/README.md) | Moves through pages of results: previous and next arrows around the page numbers, with … where pages are skipped. |
| [Sidebar](src/components/Sidebar/README.md) | A vertical nav for an app's pages: an optional header (a logo, a workspace switcher), sections of items with icons, badges and nested groups, and a footer pinned to the bottom (settings, the signed-in user). |
| [SkipLink](src/components/SkipLink/README.md) | The "Skip to content" link that keyboard and screen reader users need first on every page (WCAG 2.4.1 Bypass Blocks). |
| [Stepper](src/components/Stepper/README.md) | Shows where people are in a task split into steps, such as sign-up, checkout or setup. |
| [Tabs](src/components/Tabs/README.md) | Switches between related panels in one place, such as a project's Overview, Activity and Settings. |
| [TreeView](src/components/TreeView/README.md) | Nested items that open and close, such as folders and files, a table of contents or categories. |

### Overlays

| Component | What it's for |
| --- | --- |
| [CommandPalette](src/components/CommandPalette/README.md) (beta) | A search over the app's commands and pages in a dialog, opened with ⌘K (Ctrl+K off Apple devices) from anywhere: type a few letters, move with the arrows, press Enter. |
| [Dialog](src/components/Dialog/README.md) | A modal window over a dimmed page, for a task or a decision that needs attention before people go on: inviting someone, confirming a delete, editing a few fields. |
| [Drawer](src/components/Drawer/README.md) | A modal panel that slides in from an edge of the screen: navigation on small screens, filters, or details and edits without leaving the page. |
| [HoverCard](src/components/HoverCard/README.md) | A preview of what a link points to: a person, a page, a repository. |
| [KeyboardShortcuts](src/components/KeyboardShortcuts/README.md) | Keyboard shortcuts for an app, in one place: `useShortcut` sets one up where it's used, and `<KeyboardShortcuts>` is the help dialog that lists them all, opened with <kbd>?</kbd>. |
| [Menu](src/components/Menu/README.md) | A list of actions behind a button: a row's "More" menu, an "Actions" dropdown, a user menu. |
| [NotificationCenter](src/components/NotificationCenter/README.md) | A drawer of past notifications with read states: newest first, unread ones with a dot and a bolder title, and buttons to mark them read or clear the list. |
| [Popover](src/components/Popover/README.md) | A small panel next to its trigger for content people interact with: a short form, filters, details with links. |
| [Tooltip](src/components/Tooltip/README.md) | A short hint about one element, shown while it's hovered or focused: what an icon button does, a keyboard shortcut, why something is unavailable. |

<!-- components:end -->

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

Each component is **stable** unless it says otherwise. A component marked **beta** is ready to use, but its API may still change in a minor release, and that release's changeset says how; an **alpha** one is still taking shape and may change in any release. A **deprecated** one keeps working until the next major removes it. The status is in the doc comment on the component's export (`@beta`, `@alpha` or `@deprecated`), so your editor shows it on hover, and it also appears above the component's guide in Storybook and after its name in the index below.

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

### In Figma

The Figma variables workflow keeps a Figma file's variables in step with the tokens: three collections (Serupa palette, Serupa themes with a mode per theme, Serupa scales), each variable named by its path (`spacing/spacing-4`) with its description and its CSS variable as the code syntax Dev Mode shows. It runs on `main` when the tokens change, once the repository has a `FIGMA_TOKEN` (with the `file_variables:read` and `file_variables:write` scopes) and a `FIGMA_FILE` secret; Figma's Variables REST API needs an Enterprise plan. `node tools/tokens/figma-variables.mjs` shows what it would send.

## Tokens for native apps

`dist/native/` (`serupa-ds/native/…`) holds the colors, spacing, radii, border widths, sizes, font sizes, opacities and durations for an iOS or Android app that sits beside a web app on Serupa, made from the same tokens by `npm run build`. A rem is 16 points (dp).

| File | Holds |
| --- | --- |
| `ios/SerupaTokens.swift` | SwiftUI: `SerupaTokens.spacing4` (points), `SerupaTokens.motionHover` (seconds), `SerupaPalette.blue600`, and `SerupaColors.blueLight.primary`: the alias colors, one set per theme |
| `android/SerupaTokens.kt` | Jetpack Compose (package `com.serupa.tokens`): the same in `dp`, `sp` and milliseconds, and `SerupaColors.BlueLight.primary` |
| `android/res/values/serupa_tokens.xml` | Android resources: the palette, `@dimen/serupa_spacing_4`, durations as integers and opacities as float dimens |
| `android/res-<brand>/values/` and `values-night/` | One brand's alias colors (`@color/serupa_primary`), light and dark. Add the brand's folder as a resource directory and night mode picks the dark ones |

Shadows, easings and the type styles aren't in them yet.

## Editor autocomplete

The package carries [VS Code custom data](https://code.visualstudio.com/api/extension-guides/custom-data-extension) for the utility classes and the tokens. With it, VS Code offers every utility class in `class="…"` with what it sets, the themes in `data-theme`, and every token where a stylesheet sets one (`:root { --primary: … }`). Add this to the project's `.vscode/settings.json`:

```json
{
  "html.customData": ["./node_modules/serupa-ds/dist/vscode/serupa.html-data.json"],
  "css.customData": ["./node_modules/serupa-ds/dist/vscode/serupa.css-data.json"]
}
```

The class list works in HTML files. JSX's `className` and `var(--…)` inside a value are completed by other means: VS Code offers inside `var()` only the custom properties of the stylesheet being edited.

## For coding agents

The package carries a skill for coding agents (Claude Code and others that read `SKILL.md`): `skills/serupa/SKILL.md`. It tells an agent how to install and theme Serupa, which component fits which job, to style with tokens only, and what the app must do for accessibility. Add it to a project with the `skills` command:

```sh
npx skills add diki-stwn/serupa-ds
```

Or copy `node_modules/serupa-ds/skills/serupa/` into the project's `.claude/skills/`. Its components list is the one above, as of the installed release.

## Browser support

Current Chrome, Edge, Safari and Firefox. The tests run in Chromium, and the cross-browser test (`tools/test/compat.mjs`) runs the system in Safari's engine (WebKit) or Firefox and compares every utility class and the behaviour of `base.css`, `theme.js`, responsive classes and Button with Chromium. A few classes depend on newer CSS that not every browser has yet; they do nothing where it's missing:

| Classes | Where they don't work yet |
| --- | --- |
| `justify-self-*`, `place-self-*` on a child of a plain block (in flex and grid they work everywhere) | Safari |
| `touch-pan-up`, `-down`, `-left`, `-right` | Safari (use `touch-pan-x` / `touch-pan-y`) |
| `mask-clip-fill`, `-stroke`, `-view` and the same `mask-origin-*` | Safari |
| `place-content-baseline` | Safari |
| `mix-blend-plus-darker` | Everything but Safari |
| `*-safe` alignment (`items-end-safe`, `justify-center-safe`, …) | Safari before 17.6 (they align as without `-safe`) |
| `field-sizing-*` | Firefox, and Safari before 26.2 (Textarea's `autoResize` measures in script there) |

Popover and command buttons (`popoverTarget`, `command`), `text-wrap: balance` and `pretty`, phrase breaks in Japanese headings (`word-break: auto-phrase`), entry and exit animations (`@starting-style`, `transition-behavior`), view transitions and scrollbar styling are progressive: older browsers ignore them and the page still works.

Three features set the oldest versions that get the whole system, so the baseline is Chrome and Edge 123, Safari 17.5 and Firefox 128. A check (`tools/test/browser-baseline.mjs`) holds every property, value and at-rule in `bundle.css` to it, with MDN's compatibility data, and lists what is newer on purpose:

| Feature | Needs | Without it |
| --- | --- | --- |
| `light-dark()`, behind `data-brand` and `data-mode` | Chrome and Edge 123, Safari 17.5, Firefox 120 | A page or section themed only by `data-brand` / `data-mode` loses its theme colors (text and backgrounds fall back to the browser's). A page whose root has `data-theme`, which `theme.js` sets, keeps its colors, because the flat `[data-theme]` themes don't use `light-dark()`. |
| `@property`, which gives the `--dk-*` variables their starting values | Chrome and Edge 85, Safari 16.4, Firefox 128 | The utilities that combine through those variables (`translate-*`, `rotate-*`, `scale-*`, `skew-*`, `shadow-*`, `ring-*`, gradients, filters and `mask-*`) do nothing unless every part is set. |
| The `popover` attribute (the top layer) | Chrome and Edge 114, Safari 17, Firefox 125 | Menu, Popover, Tooltip and the picker lists still open where they belong, but in the page instead of the top layer, so a parent's `overflow: hidden` can clip them and a higher `z-index` can cover them. |

## Maintaining the system

The source is in `src/`: one folder per component in `src/components/<Name>/` (the component in TypeScript, its CSS, its component tokens, its guidelines and its preview), the utility classes in `src/styles/utilities.template.css` (expanded over the tokens by `tools/utilities/build.mjs`), and `base.css` and `theme.js`. `npm run build` makes `dist/`, which is never edited or committed: `index.js` and `index.d.ts` (ES modules and types), `serupa.iife.js` (the browser script), `components.css`, `utilities.css`, `bundle.css`, `base.css`, `theme.js` and `lib/`. `npm run typecheck` checks the types.

`npm run new-component -- <Name> --group <Storybook group>` starts one: it writes the folder with every file the contract asks for, already wired to the tokens, the layers and the docs, plus its server-render case, and marks each place that needs your words `TODO(new-component)` (the contract check fails while one is left), then prints the remaining steps. A new component lives in its own folder and nothing else needs a line for it: its `index.ts` says what the package exports, its words go in its `labels.ts` (with the Indonesian), and `tools/build/registry.mjs` builds the export list, the CSS import list and the label sets from the folders into `src/generated/` (not committed). Its stylesheet joins `components.css` after the ones listed in `src/styles/cascade.txt`; list it there only when it must come before another component's styles. Its server-render case is `tools/test/ssr/<Name>.mjs`, and `node tools/test/api.mjs --update` writes its `tools/test/baseline-api/<Name>.d.ts`, and `node tools/test/size.mjs --update <Name>` its size budgets, `tools/test/baseline-size/<Name>.json`. So two pull requests that add or change different components don't conflict.

How to make a change, and a new component, step by step: [CONTRIBUTING.md](CONTRIBUTING.md). `tools/` holds the build, the test suite, the design tokens export, the release script and the CSS trimmer; see `tools/README.md`. Run `npm test` before publishing a change; it builds first. It checks the package (every export exists, the components render on the server, the types), audits the foundation (every value reads its token, fallbacks match, contrast in every theme, one version everywhere, nothing loads from outside), checks the design tokens export and builds it through Style Dictionary, compares all 25,559 utility classes and every Storybook story with saved screenshots, tests Button's behaviour, the custom icon build and the page groundwork, and opens every Storybook story and page, checking each story against WCAG 2.2 AA in all six themes. The documentation is Storybook: `npm run storybook`. Add `--compat safari` (or `firefox`, `webkitgtk`) to compare another browser engine. Products don't need `tools/`.

## Credits

Serupa is designed and built by **Diki** ([@diki-stwn](https://github.com/diki-stwn)). It was called the Diki Design System up to version 4. It isn't open source: all rights are reserved ([LICENSE](LICENSE)), and `package.json` says so with `"license": "UNLICENSED"`.

The system is self-contained: every file it needs is in it, and nothing loads from another server. It builds on these open-source works; their licenses are in `licenses/`.

| Work | Used for | License |
| --- | --- | --- |
| Tailwind CSS (Tailwind Labs) | The naming and values of the utility classes, the palette and the scales, checked against its compiler (v4.3.3) | MIT — `licenses/TailwindCSS-MIT.txt` |
| Inter (Rasmus Andersson) | `font-sans` — `fonts/InterVariable.woff2`, `fonts/InterVariable-Italic.woff2`, and the same split by script, `fonts/InterVariable-*.woff2` | SIL Open Font License 1.1 — `licenses/Inter-OFL-1.1.txt` |
| Material Symbols (Google) | Icons, as SVG in the components and `serupa-ds/icons`: the Rounded, filled, weight-400 style | Apache 2.0 — `licenses/MaterialSymbols-Apache-2.0.txt` |
| React 19.3.1 (Meta) | Running the components on plain pages — `dist/lib/`, built from the `react` and `react-dom` packages by the build | MIT — `licenses/React-MIT.txt` |
