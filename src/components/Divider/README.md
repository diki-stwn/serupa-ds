# Divider

A 1px line between content, horizontal or vertical, with an optional label in the middle such as "or".

```jsx
const { Divider, Stack } = window.Serupa;

<Divider />
<Divider label="or" />
<Stack direction="row" gap={3}>
  <span>Edit</span><Divider orientation="vertical" /><span>Share</span>
</Stack>
<Divider decorative />
```

## When to use

- Separating groups of content where space alone doesn't make the break clear.
- Two ways to do the same thing, with "or" between them, such as signing in with a password or with a provider.
- Separating items in a row, such as links or actions, with a vertical line.

## When not to use

- When space between groups is enough: use the gap of a [Stack](../Stack/README.md) instead.
- Lines between the rows of a list: use [List](../List/README.md), which has them (`divided`).
- Setting a group of content apart in a box: use [Card](../Card/README.md) instead.

## Anatomy

Drawn from the `LongLabel` story.

1. **Line** (`.dk-divider`): separates two groups of content.
2. **Label** (`.dk-divider__label`): optional words in the line that name the group after it.

## Usage

- It has no margins: put it in a [Stack](../Stack/README.md) or give the space around it with the layout.
- Keep a label to a word or two, such as "or".
- A vertical divider takes the height of the row it's in, so put it in a row, such as `<Stack direction="row">`.
- Use `decorative` when the groups are already clear without it.

## Accessibility

- It's a separator to screen readers (an `<hr>`, or `role="separator"` with `aria-orientation`). When it only decorates, such as between items that are already grouped, use `decorative`.
- A separator's content isn't read, so a text `label` becomes its `aria-label` (your own `aria-label` wins). A label that isn't text, such as a heading, stays ordinary content and the divider drops the separator role, leaving the lines as decoration.
- The label keeps 4.5:1 on `surface` in all six themes (`Divider.test.tsx`). The line itself is decoration, so it doesn't need 3:1.
- In Windows high-contrast mode the line uses the text color.
- **Keyboard:** none: it isn't focusable.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<hr>`. |
| `orientation` | `'horizontal'` \| `'vertical'` | `'horizontal'` | Across the full width, or the height of the row it's in |
| `label` | node | none | Text in the middle of a horizontal line. A vertical divider has no label |
| `decorative` | boolean | `false` | Leaves it out of the accessibility tree |

Without a label, a horizontal divider is an `<hr>`; otherwise a `<div>`. It has no margins: space it with the layout around it. `className`, `style`, `ref` and everything else go to the element, which has `data-component="divider"`.

## Component tokens

Each is an optional override: set it on the page, a container or one element. The list lives in `src/components/Divider/divider.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from divider.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--divider-color` | `border` | The line. |
| `--divider-label-color` | `text-muted` | A label in the line (4.5:1 on surface). |
| `--divider-width` | `border-width-1` | The line's thickness (1px). |
| `--divider-label-gap` | `spacing-3` | Space on each side of a label (12px). |
<!-- token-table:end -->
