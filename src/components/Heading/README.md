# Heading

A heading, `h1` to `h6`, in the system's type. `level` sets the element, which is what screen readers and the page's outline see; `size` sets the look. So a card's title can be an `h3` that looks like body text, or a page's `h1` can be small.

```jsx
const { Heading } = window.Serupa;

<Heading level={1}>Projects</Heading>
<Heading>Recent activity</Heading>                 {/* h2 */}
<Heading level={3} size="base">Billing</Heading>  {/* an h3 at text-base */}
```

## When to use

- A page's title, and the titles of the sections on it.
- Any title people should be able to jump to with a screen reader, whatever size it looks.

## When not to use

- Text that should only look large or bold, without starting a section: use [Text](../Text/README.md) with `size` and `weight` instead.
- A card's title: use `title` on [Card](../Card/README.md)'s `CardHeader`, with `headingLevel`.
- A heading only screen reader users need, for a section that's clear by sight: use [VisuallyHidden](../VisuallyHidden/README.md) with `as="h2"` (or the level that fits).

## Usage

- Set `level` from the page's outline, then change the look with `size` if the default doesn't fit.
- It has no margins: space it with the layout, such as a [Stack](../Stack/README.md).
- Keep headings short, so they wrap less and are quick to scan.

## Accessibility

- Pick the level from the page's outline, never from the look: that's what `size` is for.
- One `h1` per page, naming it.
- Headings keep 4.5:1 on `surface` in all six themes (`Heading.test.tsx`).
- **Keyboard:** none: it isn't focusable. Screen reader users move between headings with their own keys, so keep the levels in order.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root heading (`<h1>`–`<h6>`, by `level`). |
| `level` | `1`–`6` | `2` | The element. Keep the levels in order down the page, without skipping |
| `size` | `'sm'` \| `'base'` \| `'lg'` \| `'xl'` \| `'2xl'` \| `'3xl'` \| `'4xl'` \| `'5xl'` | the level's | A step of the type scale, with its line height. Each level's own: 1 `3xl`, 2 `2xl`, 3 `xl`, 4 `lg`, 5 `base`, 6 `sm` |

Every heading is `font-semibold` in `text`, with no margins (space it with the layout). `2xl` and up are tracked tight (`tracking-tight`), and long headings wrap in balanced lines. `className`, `style`, `ref` and everything else go to the heading, which has `data-component="heading"`.

## Component tokens

Each is an optional override: set it on the page, a container or one heading. The list lives in `src/components/Heading/heading.tokens.json` (also in `design-tokens/components/`). A `--heading-size-*` override changes the size only; the line height stays the level's.

| Token | Default | Use |
| --- | --- | --- |
| `--heading-text` | `text` | The heading's color. |
| `--heading-weight` | `font-semibold` | The weight of every level (600). |
| `--heading-size-1` | `text-3xl` | The size of a level 1 heading (text-3xl). |
| `--heading-size-2` | `text-2xl` | The size of a level 2 heading (text-2xl). |
| `--heading-size-3` | `text-xl` | The size of a level 3 heading (text-xl). |
| `--heading-size-4` | `text-lg` | The size of a level 4 heading (text-lg). |
| `--heading-size-5` | `text-base` | The size of a level 5 heading (text-base). |
| `--heading-size-6` | `text-sm` | The size of a level 6 heading (text-sm). |
