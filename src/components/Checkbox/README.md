# Checkbox

A native checkbox with its label, for turning one option on or off, or picking any number from a list. The box is drawn from tokens (`appearance: none`) and sits centered on the label's first line; a click anywhere on the label toggles it. `indeterminate` shows a dash for a select-all box when only some items are picked.

```jsx
const { Checkbox, CheckboxGroup, Field } = window.Serupa;

<Checkbox checked={agree} onCheckedChange={setAgree}>I accept the terms</Checkbox>

<Checkbox defaultChecked description="Get an email when someone mentions you.">Mentions</Checkbox>

// a set: Field group gives it a legend, a hint and an error
<Field group label="Notify me about" error={error}>
  <Checkbox name="notify" value="comments">Comments</Checkbox>
  <Checkbox name="notify" value="mentions">Mentions</Checkbox>
</Field>

// a group that holds the checked values, with a select-all box
const [tags, setTags] = React.useState(["news"]);
<Field group label="Topics">
  <CheckboxGroup name="topics" value={tags} onValueChange={setTags}>
    <Checkbox selectAll>All topics</Checkbox>
    <Checkbox value="news">News</Checkbox>
    <Checkbox value="tips">Tips</Checkbox>
  </CheckboxGroup>
</Field>

// select all by hand (a table)
<Checkbox checked={all} indeterminate={some && !all} onChange={toggleAll}>Select all</Checkbox>

// no visible label (a table row)
<Checkbox aria-label="Select row" />
```

## When to use

- Choices that take effect when the form is sent, such as accepting the terms.
- Picking any number of options from a list, including none.
- Selecting rows in a table, with a select-all box that shows `indeterminate` when only some are picked.

## When not to use

- A setting that applies at once: use a [Switch](../Switch/README.md).
- One choice from a list: use [radios](../Radio/README.md); checkboxes say "any number".

## Usage

- Write the label as a statement that's true when checked ("Email me about replies"), not a question.
- Stack sets vertically: they're quicker to scan than a row.
- For a set whose answer is a list of values, use `CheckboxGroup`. It holds the list, gives every box one `name`, and passes `size`, `invalid`, `disabled` and `required` down.
- Put a `selectAll` box first when people often want all or none. It needs no `value`.

## States

| State | Look |
| --- | --- |
| Unchecked | `field` background, 1px `field-border` |
| Checked | `primary` fill and border, a check in `on-primary` |
| Indeterminate | `primary` fill and border, a dash in `on-primary` |
| Hover | `field-border-hover`; a checked or indeterminate box turns `primary-hover` |
| Focus | From the keyboard: a 2px `focus-ring` outline 2px out (`focus-ring-width`, `focus-ring-offset`), like Button. The gap is transparent, so it reads on any background, and forced-colors mode draws it too |
| Invalid | `danger` border while unchecked, and a `danger` focus ring |
| Read-only | Looks as it is, with a default cursor and no hover change |
| Disabled | 50% opacity, `not-allowed` cursor, a `surface-muted` box; also when a parent fieldset (`Field group disabled`) is disabled |

## Accessibility

- A press anywhere within 24px of the box or the row counts (WCAG 2.5.8): when the row is shorter, or the box stands alone, its hit area reaches past what is drawn, so nothing moves.
- It's a real checkbox: Space toggles it, forms submit it, and screen readers announce checked, unchecked and mixed.
- The label names it. With a description, the checkbox is named by the label alone (`aria-labelledby`) and the description is read after it (`aria-describedby`).
- The check and dash are decorative (`aria-hidden`).
- `readOnly` keeps it focusable and read out with `aria-readonly`, but a click or Space doesn't change it, and `onChange` doesn't run (your `onClick` does). The browser's own `readonly` does nothing on a checkbox, so Checkbox cancels the click. A checked read-only box is still submitted, which `disabled` isn't.
- For a set, use `Field group`: a `<fieldset>` and `<legend>`, so the question is read with each option.
- `CheckboxGroup` is a `role="group"` with `aria-invalid`, `aria-required` and `aria-disabled` from its props. `required` means at least one: every box is `required` while none is checked, so the browser won't submit the form and says why, and none is once one is.
- A `selectAll` box is checked when every enabled box is, and indeterminate (announced as mixed) when only some are. A click checks every enabled box, or clears them when all are checked. Disabled boxes keep their state. It isn't submitted. Server-rendered, it already shows this state, counted from the Checkboxes among the group's children (a box inside a component of your own counts once it mounts).
- The label and description keep 4.5:1, the border, checked fill, focus ring and invalid border 3:1, and the check 4.5:1 on its fill, in all six themes (`Checkbox.test.tsx`).

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To the checkbox |
| Space | Check or uncheck it (an indeterminate one becomes checked) |

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the native `<input type="checkbox">` (not the wrapper), so a `<label htmlFor>` or a Field can point at it. |
| `children` | node | | The label. Without one, give the checkbox an `aria-label` |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | A 14px box with `text-xs`, 16px with `text-sm`, 20px with `text-base` |
| `description` | node | | A muted second line under the label, linked with `aria-describedby` (and kept out of the name) |
| `indeterminate` | boolean | `false` | A dash, announced as "mixed". Set it from your state: a click clears it natively, and the next render puts it back if the prop is still true |
| `invalid` | boolean | `false` | A danger border (while unchecked) and focus ring, and `aria-invalid` |
| `readOnly` | boolean | `false` | Focusable and read out (`aria-readonly`), but clicks and Space don't change it; a checked box is still submitted |

| `selectAll` | boolean | `false` | In a `CheckboxGroup`: checks or clears every other box; checked when all are, indeterminate when some are |

`onCheckedChange(checked, event)` runs after `onChange` with the new state, the same shape as ToggleButton's `onPressedChange`, so you needn't read `event.target.checked`. Not on a read-only box.

Everything else (`checked`, `defaultChecked`, `onChange`, `name`, `value`, `disabled`, `required`, `id`, `aria-*`) and `ref` go to the `<input type="checkbox">`. In a `CheckboxGroup`, the group sets `name` and `checked` from each box's `value`. `className` and `style` go to the `<label>` around it, which has `data-component="checkbox"` and `data-size`.

### CheckboxGroup

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `value` | `(string \| number)[]` | | The checked boxes' values (controlled). Use with `onValueChange` |
| `defaultValue` | `(string \| number)[]` | `[]` | The values checked at first (uncontrolled). A form reset brings them back |
| `onValueChange` | `(value, event) => void` | | Called with the new list, in the boxes' order. Numbers stay numbers |
| `name` | `string` | generated | Every box's name, so each checked one is submitted with its value |
| `orientation` | `'vertical'` \| `'horizontal'` | `'vertical'` | Stacked, or a wrapping row |
| `size` | `'sm'` \| `'md'` \| `'lg'` | | The boxes' size, unless a Checkbox sets its own |
| `invalid` | boolean | `false` | A danger border on every unchecked box, and `aria-invalid` on the group. Field's `error` sets it |
| `disabled` | boolean | `false` | Disables every box |
| `required` | boolean | `false` | At least one box must be checked |

Other props (`id`, `aria-label`, `aria-labelledby`, `className`…) and `ref` go to the `<div role="group">`, which has `data-component="checkbox-group"` and `data-orientation`.

## Component tokens

Each is an optional override: set it on the page, a container or one checkbox. The list lives in `src/components/Checkbox/checkbox.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--checkbox-bg` | `field` | The box while unchecked |
| `--checkbox-bg-disabled` | `surface-muted` | The box when disabled and unchecked |
| `--checkbox-bg-checked` | `primary` | Fill and border when checked or indeterminate |
| `--checkbox-bg-checked-hover` | `primary-hover` | The same, on hover |
| `--checkbox-border` | `field-border` | Border while unchecked |
| `--checkbox-border-hover` | `field-border-hover` | Border on hover |
| `--checkbox-icon-color` | `on-primary` | The check and the dash |
| `--checkbox-label-color` | `text` | The label |
| `--checkbox-description-color` | `text-muted` | The description |
| `--checkbox-focus-ring` | `focus-ring` | The focus ring |
| `--checkbox-invalid` | `danger` | Border and focus ring when invalid |
| `--checkbox-size-sm` / `-md` / `-lg` | `spacing-3.5` / `spacing-4` / `spacing-5` | Box sizes (14, 16, 20px) |
| `--checkbox-icon-size-sm` / `-md` / `-lg` | `spacing-3` / `spacing-3.5` / `spacing-4` | Check sizes (12, 14, 16px) |
| `--checkbox-gap` | `spacing-2` | Box to label (8px) |
| `--checkbox-border-width` | `border-width-1` | Border width (1px) |
| `--checkbox-radius` | `rounded-sm` | Corner radius (4px) |
| `--checkbox-group-gap` | `spacing-2` | Between boxes in a CheckboxGroup stack, and between rows (8px) |
| `--checkbox-group-gap-horizontal` | `spacing-4` | Between boxes in a CheckboxGroup row (16px) |
