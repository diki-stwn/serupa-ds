# Field

A label, an optional hint and an error message around one form control, wired up for screen readers. The label names the control, the hint and error are added to its `aria-describedby`, and an error makes the control invalid. It works with Input, Textarea, Select and any native control, a plain `<select>` with its options included. With `group` it renders a `<fieldset>` and `<legend>` for a set of checkboxes or radios.

```jsx
const { Field, Input, Textarea } = window.Serupa;

<Field label="Email" hint="We only use it for receipts." error={emailError} required>
  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
</Field>

<Field label="Company" optional><Input /></Field>
<Field label="Notes" hint="Anything the team should know."><Textarea rows={3} /></Field>

// a set of choices: a fieldset with a legend
<Field group label="Plan" hint="You can change it later." error={planError}>
  <RadioGroup name="plan" value={plan} onValueChange={setPlan}>
    <Radio value="free">Free</Radio>
    <Radio value="pro">Pro</Radio>
  </RadioGroup>
</Field>
```

## When to use

- Any form control that needs a visible label, with or without a hint or an error: an [Input](../Input/README.md), a [Select](../Select/README.md), a [Textarea](../Textarea/README.md) or a native control.
- A set of checkboxes or radios that answer one question, with `group`.

## When not to use

- A single [Checkbox](../Checkbox/README.md) or [Switch](../Switch/README.md): it carries its own label (its children), so use it on its own.
- A control with no visible label, such as a row checkbox in a table: give the control an `aria-label` instead.

## Usage

- Keep labels short and specific ("Work email", not "Please enter your email address"). Put format help in the hint, never only in the placeholder.
- Show errors after someone leaves the field or submits, not on every keystroke, and on submit move focus to the first field with an error.
- Stack fields with `gap-5` or `gap-6` between them.

### Layout

Label, hint, control and error stack with 6px between them (`--field-gap`). The label is `text-sm` in `font-medium`; hint and error are `text-sm`. The error's 16px icon sits centered on its first line. A group's legend lays out exactly like a label.

## Accessibility

- Screen readers read the label as the control's name and the hint and error as its description, so a person hears "Email, required, invalid entry, We only use it for receipts. Enter an email address like name@example.com."
- Say what went wrong and how to fix it, not just "Invalid". The error icon is decorative; the words carry the meaning.
- With an error, the control also points at it with `aria-errormessage`, at any depth. The error stays in the description too, because not every screen reader reads `aria-errormessage` yet.
- Clicking the label focuses the control, as with an input, also for Slider, SegmentedControl and ColorPicker. Their root is a `<div>`, which a label can't focus by itself, so Field moves focus to their thumb or checked option.
- The `*` is hidden from screen readers, which hear `aria-required` instead. Explain it once at the top of a long form ("Fields marked * are required"), or when most fields are required, mark the optional ones instead.
- An error that appears or changes after the Field mounts (after a submit, for example) is announced politely, since focus is usually elsewhere and a description is only read on focus. An error already there on first render isn't announced.
- If nothing on the page has the control's id (a control Field can't reach, with no `id` passed), Field warns once in the console: the label would name nothing.
- For radios and checkboxes use `group`: screen readers announce the legend when focus enters the set.
- Label, hint, error and `*` keep 4.5:1 on `surface` in all six themes (`Field.test.tsx`).
- **Keyboard:** nothing of its own. Tab goes to the control it wraps, and a click on the label focuses that control.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `label` | text or element | | A `<label>` linked to the control; with `group`, the fieldset's `<legend>` |
| `hint` | text or element | | Help under the label, before the control, in `text-muted`; added to the control's `aria-describedby` |
| `error` | text or element | | A message under the control, in `danger-text` with an icon; makes the control invalid (`invalid` on Serupa components, `aria-invalid` on DOM elements) and is added to its `aria-describedby` |
| `required` | boolean | `false` | A `*` after the label (hidden from screen readers) and `aria-required` on the control. Add the control's own `required` too if you want the browser's check |
| `optional` | boolean or text | `false` | "(optional)" after the label (the `fieldOptional` label, "(opsional)" in `idLabels`), or your own words. Ignored with `required` |
| `disabled` | boolean | `false` | Disables the control (with `group`, every control in the fieldset) and dims the label and hint |
| `group` | boolean | `false` | A `<fieldset>` and `<legend>` around a set of controls; the hint and error describe the fieldset |
| `id` | string | | The control's id; by default the control's own `id`, or a generated one |

Field takes one control as its child (any number with `group`). The control keeps its own props, `ref` and `aria-describedby` (Field's ids are added after yours). `className` and any other attribute go to the outer element, which has `data-component="field"`.

## Component tokens

Each is an optional override: set it on the page, a container or one field. The list lives in `src/components/Field/field.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--field-text` | `text` | Text with no token of its own (the label, hint and error have theirs) |
| `--field-label-color` | `text` | Label |
| `--field-label-weight` | `font-medium` | Label weight (500) |
| `--field-hint-color` | `text-muted` | Hint and "(optional)" |
| `--field-error-color` | `danger-text` | Error message and its icon |
| `--field-required-color` | `danger-text` | The `*` |
| `--field-gap` | `spacing-1.5` | Space between label, hint, control and error (6px) |
| `--field-error-gap` | `spacing-1` | Error icon to text (4px) |
| `--field-error-icon-size` | `spacing-4` | Error icon (16px) |
