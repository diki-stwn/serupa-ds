# SkipLink

The "Skip to content" link that keyboard and screen reader users need first on every page (WCAG 2.4.1 Bypass Blocks). It's out of sight until Tab reaches it, then shows at the top of the page; following it moves focus to the main content, past the header and navigation.

```tsx
import { SkipLink } from "serupa-ds";

<SkipLink />
<Navbar sticky>…</Navbar>
<main id="main">…</main>
```

## When to use

- Once on every page with a header or navigation before its main content: put it first in the `<body>`, before the Navbar.

## When not to use

- For links within a page's content (a table of contents, "Back to top"): use a [Link](../Link/README.md) to the section's `#id`.
- For something only screen readers should read: use [VisuallyHidden](../VisuallyHidden/README.md).

## Usage

- Give the main content `id="main"`, or pass its id as `target`. With no element of that id on the page, following it warns in development and does nothing more than a plain `#` link.
- Its text is "Skip to content" (`labels.skipToContent`, "Langsung ke konten" in Indonesian). Pass children for other words, such as "Skip to results" with `target="results"`.
- It's a real link to `#main`, so it works before the script loads, and the address shows `#main` after it's followed.

## Accessibility

- **Role and name:** a link, named by its text.
- **Keyboard:** the first Tab on the page shows it at the top start of the viewport, above a sticky Navbar, with the focus ring. Enter moves focus to the target, even when that isn't focusable, such as a `<main>`: it gets `tabindex="-1"` until focus leaves it, so it isn't left as a stray tab stop. The next Tab goes on from inside the main content.
- **Not covered:** a sticky [Navbar](../Navbar/README.md) keeps the page's `scroll-padding-top` at its height, so the target scrolls into view below the bar, not under it (WCAG 2.4.11).
- **Contrast:** its text reads 4.5:1 on its background in all six themes (`SkipLink.test.tsx`). In forced colors its border is CanvasText. It isn't printed.
- **What's still yours:** one SkipLink, first on the page, and a target that holds the main content.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `target` | `string` | `"main"` | The id of the element it skips to. |
| `children` | `ReactNode` | "Skip to content" | The link's text. |
| `id` | `string` | | Goes to the `<a>`. |
| `onClick` | `(e) => void` | | Called first; call `e.preventDefault()` to stop it moving focus. |

`className`, `ref` and other props go to the `<a>`.

## Component tokens

Each is an optional override: set it on the page, a container or one SkipLink. The list lives in `src/components/SkipLink/skip-link.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--skip-link-bg` | `surface-raised` | The shown link's background. |
| `--skip-link-text` | `primary` | The link's text (4.5:1 on its background). |
| `--skip-link-border` | `border-raised` | The shown link's border. |
| `--skip-link-focus-ring` | `focus-ring` | The focus ring around it while it's shown. |
| `--skip-link-shadow` | `shadow-lg` | Lifts it above the page and a sticky Navbar. |
| `--skip-link-radius` | `rounded-md` | Its corners (6px). |
| `--skip-link-border-width` | `border-width-1` | Its border's width (1px). |
| `--skip-link-offset` | `spacing-3` | How far it sits from the viewport's top and start edges (12px). |
| `--skip-link-padding-x` | `spacing-4` | Space at its start and end (16px). |
| `--skip-link-padding-y` | `spacing-2` | Space above and below its text (8px). |
