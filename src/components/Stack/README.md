# Stack

Lays its children out in a column, or a row, with the same space between each, taken from the spacing scale. Use it for most layout inside a page: a form's fields, a card's content, a row of buttons.

```jsx
const { Stack, Button } = window.Serupa;

<Stack gap={6}>
  <Field label="Name"><Input /></Field>
  <Field label="Email"><Input type="email" /></Field>
</Stack>

<Stack direction="row" gap={2} justify="end">
  <Button variant="secondary">Cancel</Button>
  <Button>Save</Button>
</Stack>

<Stack as="ul" gap={2}>{items.map((i) => <li key={i.id}>{i.name}</li>)}</Stack>
```

## When to use

- Things one after another with even space between them: a form's fields, a card's content, a row of buttons.
- Spacing siblings from the spacing scale, instead of a margin on each one.

## When not to use

- Items in columns that line up from row to row: use [Grid](../Grid/README.md) instead.
- Setting the page's width and side padding: use [Container](../Container/README.md) instead.
- Buttons joined into one control: use [ButtonGroup](../ButtonGroup/README.md) instead.

## Usage

- Use a larger gap between groups and a smaller one inside them, such as `gap={6}` between fields and `gap={2}` between buttons.
- Set `wrap` on a row that may not fit on narrow screens.
- Pick the element with `as`: `ul` or `ol` for a list, `form` or `fieldset` for a form's fields.
- Nest Stacks for more complex layouts, such as a row of buttons at the end of a column of fields.

## Accessibility

- Stack only lays things out: the reading and tab order stay the order of the children, so keep it the same as what people see.
- Use `as="ul"` or `as="ol"` when the items are a list, so screen readers say how many there are.
- **Keyboard:** none: a layout box, not focusable.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root element (`as`). |
| `direction` | `'column'` \| `'row'` | `'column'` | One under another, or side by side |
| `gap` | a spacing step: `0` `0.5` `1` `1.5` `2` `2.5` `3` `3.5` `4` `5` `6` `7` `8` `9` `10` `11` `12` `14` `16` `20` `24` | `4` (16px) | The space between items: `gap={6}` is `spacing-6`, 24px |
| `align` | `'stretch'` \| `'start'` \| `'center'` \| `'end'` \| `'baseline'` | `'stretch'` in a column, `'center'` in a row | Cross-axis alignment |
| `justify` | `'start'` \| `'center'` \| `'end'` \| `'between'` | `'start'` | Main-axis distribution |
| `wrap` | boolean | `false` | Lets a row wrap onto more lines |
| `as` | `'div'` \| `'section'` \| `'ul'` \| `'ol'` \| `'nav'` \| `'header'` \| `'footer'` \| `'form'` \| `'fieldset'` \| `'span'` | `'div'` | The element. A list loses its bullets, margins and padding |

A value that isn't on the list falls back to the default. `className`, `style`, `ref` and everything else go to the element, which has `data-component="stack"`.

## Component tokens

Each is an optional override: set it on the page, a container or one element. The list lives in `src/components/Stack/stack.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--stack-gap` | `spacing-4` | The space between items when gap isn't given (16px). |
