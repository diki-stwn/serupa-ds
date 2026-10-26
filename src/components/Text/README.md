# Text

Body text in the system's type: a paragraph, a caption, an error line. `size`, `tone` and `weight` set only what you give them, so anything you leave out follows the parent, and Text can sit inside a card, a cell or a button without fighting it.

```jsx
const { Text } = window.Serupa;

<Text>Invite people to work on this project with you.</Text>
<Text size="sm" tone="muted">Last edited 2 hours ago</Text>
<Text as="span" weight="semibold">6 of 10</Text> seats used
<Text tone="danger" size="sm">The name is already taken.</Text>
<Text as="span" truncate style={{ maxWidth: 200 }}>{fileName}</Text>
```

## When to use

- Paragraphs, captions and short lines of supporting text, such as "Last edited 2 hours ago".
- Changing the size, tone or weight of part of a sentence, with `as="span"`.
- A single line that may be too long for its space, such as a file name, cut short with `truncate`.

## When not to use

- A page or section title: use [Heading](../Heading/README.md) instead.
- Text that goes somewhere: use [Link](../Link/README.md) instead.
- A form control's help or error message: use `hint` and `error` on [Field](../Field/README.md), which wire it to the control for screen readers.
- A keyboard key or shortcut: use [Kbd](../Kbd/README.md) instead.

## Usage

- Leave `size`, `tone` and `weight` out unless you need them, so the text follows its parent.
- Use `as="span"` inside other text, and a `p` (the default) for paragraphs.
- It has no margins: space paragraphs with the layout, such as a [Stack](../Stack/README.md).
- Text's tokens (`--text-color`, `--text-color-muted`, `--text-color-primary`, `--text-color-danger`) only change Text's tones. They're separate from the shared theme colors such as `--text` and `--text-muted`, which they default to, and from the type sizes such as `--text-sm`: overriding `--text-color-muted` changes muted Text, not every muted color on the page.

## Accessibility

- Every tone keeps 4.5:1 on `surface` in all six themes (`Text.test.tsx`). On other backgrounds, check it yourself.
- Don't use color alone to say something is wrong: say it in the words too.
- A truncated line hides the rest: put the full text in a `title` or somewhere else on the page.
- **Keyboard:** none: inline text, not focusable.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root element (`as`). |
| `as` | `'p'` \| `'span'` \| `'div'` \| `'label'` \| `'strong'` \| `'em'` \| `'small'` \| `'li'` \| `'figcaption'` | `'p'` | The element |
| `size` | `'xs'` \| `'sm'` \| `'base'` \| `'lg'` \| `'xl'` | inherited | A step of the type scale, with its line height |
| `tone` | `'default'` \| `'muted'` \| `'primary'` \| `'danger'` | inherited | `text`, `text-muted`, `primary` or `danger-text` |
| `weight` | `'normal'` \| `'medium'` \| `'semibold'` \| `'bold'` | inherited | 400, 500, 600 or 700 |
| `truncate` | boolean | `false` | One line, cut with an ellipsis. It becomes a block, so give it a width or a parent that has one |

Text has no margins (space it with the layout). `className`, `style`, `ref`, `htmlFor` (with `as="label"`) and everything else go to the element, which has `data-component="text"`.

## Component tokens

Each is an optional override: set it on the page, a container or one element. The list lives in `src/components/Text/text.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--text-color` | `text` | tone="default". |
| `--text-color-muted` | `text-muted` | tone="muted": secondary text (4.5:1 on surface). |
| `--text-color-primary` | `primary` | tone="primary". |
| `--text-color-danger` | `danger-text` | tone="danger": error text (4.5:1 on surface and danger-subtle). |
