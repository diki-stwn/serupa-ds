# Checkbox

A native checkbox with its label, for turning one option on or off, or picking any number from a list. The box is drawn from tokens (`appearance: none`) and sits centered on the label's first line; a click anywhere on the label toggles it. `indeterminate` shows a dash for a select-all box when only some items are picked.

```jsx
const { Checkbox, Field } = window.Serupa;

<Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)}>I accept the terms</Checkbox>

<Checkbox defaultChecked description="Get an email when someone mentions you.">Mentions</Checkbox>

// a set: Field group gives it a legend, a hint and an error
<Field group label="Notify me about" error={error}>
  <Checkbox name="notify" value="comments">Comments</Checkbox>
  <Checkbox name="notify" value="mentions">Mentions</Checkbox>
</Field>

// select all
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

- It's a real checkbox: Space toggles it, forms submit it, and screen readers announce checked, unchecked and mixed.
- The label names it. With a description, the checkbox is named by the label alone (`aria-labelledby`) and the description is read after it (`aria-describedby`).
- The check and dash are decorative (`aria-hidden`).
- `readOnly` keeps it focusable and read out with `aria-readonly`, but a click or Space doesn't change it, and `onChange` doesn't run (your `onClick` does). The browser's own `readonly` does nothing on a checkbox, so Checkbox cancels the click. A checked read-only box is still submitted, which `disabled` isn't.
- For a set, use `Field group`: a `<fieldset>` and `<legend>`, so the question is read with each option.
- The label and description keep 4.5:1, the border, checked fill, focus ring and invalid border 3:1, and the check 4.5:1 on its fill, in all six themes (`Checkbox.test.tsx`).

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `children` | node | | The label. Without one, give the checkbox an `aria-label` |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | A 14px box with `text-xs`, 16px with `text-sm`, 20px with `text-base` |
| `description` | node | | A muted second line under the label, linked with `aria-describedby` (and kept out of the name) |
| `indeterminate` | boolean | `false` | A dash, announced as "mixed". Set it from your state: a click clears it natively, and the next render puts it back if the prop is still true |
| `invalid` | boolean | `false` | A danger border (while unchecked) and focus ring, and `aria-invalid` |
| `readOnly` | boolean | `false` | Focusable and read out (`aria-readonly`), but clicks and Space don't change it; a checked box is still submitted |

Everything else (`checked`, `defaultChecked`, `onChange`, `name`, `value`, `disabled`, `required`, `id`, `aria-*`) and `ref` go to the `<input type="checkbox">`. `className` and `style` go to the `<label>` around it, which has `data-component="checkbox"` and `data-size`.

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
