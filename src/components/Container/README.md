# Container

Centers a page's content with a maximum width, and side padding that grows with the screen: 16px, 24px from 640px and 32px from 1024px wide.

```jsx
const { Container } = window.Serupa;

<Container as="main">…</Container>
<Container size="prose">{article}</Container>
<Container size="lg" padded={false}>…</Container>
```

## When to use

- A page's main content, so it doesn't stretch across very wide screens and keeps space at the edges on small ones.
- Long text, such as an article or help page, kept to a comfortable line length with `size="prose"`.
- A page's header, main content and footer, lined up on the same edges.

## When not to use

- Spacing items inside a page or a card: use [Stack](../Stack/README.md) instead.
- Laying items out in columns: use [Grid](../Grid/README.md) instead.
- A bordered or shaded box around content: use [Card](../Card/README.md) instead.

## Usage

- Give the header, main content and footer Containers of the same `size`, so their edges line up.
- Use `size="prose"` for reading, and a wider size for pages of cards or tables.
- Set `padded={false}` when something around it already gives the side padding.
- Container's tokens (`--container-padding-x`, `--container-padding-x-sm`, `--container-padding-x-lg`) set only its side padding. They're separate from the shared `--container-*` width tokens (`--container-3xs` to `--container-7xl`, behind the `max-w-*` classes), even though `prose` uses one of them (`container-2xl`) for its width.

## Accessibility

- Use `as="main"` for the page's main content (once per page), so people can jump to it.
- `prose` keeps lines to a comfortable reading length: use it for long text.
- **Keyboard:** none: a layout box, not focusable.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `size` | `'prose'` \| `'md'` \| `'lg'` \| `'xl'` \| `'2xl'` \| `'full'` | `'xl'` | The widest it gets: 672px (`container-2xl`, for reading), 768, 1024, 1280 or 1536px (`screen-*`), or no maximum |
| `padded` | boolean | `true` | Side padding that grows with the screen |
| `as` | `'div'` \| `'main'` \| `'section'` \| `'header'` \| `'footer'` \| `'article'` | `'div'` | The element |

`className`, `style`, `ref` and everything else go to the element, which has `data-component="container"` and `data-size`.

## Component tokens

Each is an optional override: set it on the page, a container or one element. The list lives in `src/components/Container/container.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--container-padding-x` | `spacing-4` | Side padding on small screens (16px). |
| `--container-padding-x-sm` | `spacing-6` | Side padding from 640px (24px). |
| `--container-padding-x-lg` | `spacing-8` | Side padding from 1024px (32px). |
