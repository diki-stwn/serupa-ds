# Radio and RadioGroup

Native radios for one choice from a short list. `RadioGroup` names them, holds the value and lays them out; each `Radio` is drawn from tokens like Checkbox, sits centered on its label's first line, and the whole label picks it. Arrow keys move the choice, as browsers do for radios.

```jsx
const { Radio, RadioGroup, Field } = window.Serupa;

<Field group label="Plan" hint="You can change it later." error={error}>
  <RadioGroup name="plan" value={plan} onValueChange={(value) => setPlan(value)}>
    <Radio value="free" description="Up to 3 projects.">Free</Radio>
    <Radio value="pro" description="Unlimited projects and history.">Pro</Radio>
  </RadioGroup>
</Field>

// uncontrolled, in a row
<RadioGroup aria-label="Density" defaultValue="md" orientation="horizontal">
  <Radio value="sm">Compact</Radio>
  <Radio value="md">Default</Radio>
  <Radio value="lg">Roomy</Radio>
</RadioGroup>
```

## When to use

- One choice from 2 to about 5 options people should compare, such as a plan.
- When seeing every option at once helps people choose, for example with a `description` under each.

## When not to use

- More than about 5 options: a [Select](../Select/README.md) saves space.
- Any number of choices: use [checkboxes](../Checkbox/README.md).
- On and off: use a [Checkbox](../Checkbox/README.md) or a [Switch](../Switch/README.md), not two radios.

## Anatomy

Drawn from the `Disabled` story.

1. **Circle** (`.dk-radio__control`): the ring that shows chosen or not, over the native radio button.
2. **Dot** (`.dk-radio__dot`): fills the ring when it's chosen.
3. **Label** (`.dk-radio__text`): what choosing it means; clicking it chooses it too.
4. **Description** (`.dk-radio__description`): optional detail under the label.

## Usage

- Pick a default when one is safe, so the group never starts empty; leave it empty when the choice has to be deliberate.
- Stack options; use a row only for short labels that fit on one line.

## States

| State | Look |
| --- | --- |
| Unchecked | `field` background, 1px `field-border` |
| Checked | `primary` fill and border, with a dot in `on-primary` (6, 6 or 8px) |
| Hover | `field-border-hover`; a checked radio turns `primary-hover` |
| Focus | From the keyboard: a 2px `focus-ring` outline 2px out (`focus-ring-width`, `focus-ring-offset`), like Button. The gap is transparent, so it reads on any background, and forced-colors mode draws it too |
| Invalid | `danger` border while unchecked, and a `danger` focus ring |
| Disabled | 50% opacity, `not-allowed` cursor, a `surface-muted` circle; also inside a disabled fieldset (`Field group disabled`) |

## Accessibility

- A press anywhere within 24px of the row counts (WCAG 2.5.8): when the row is shorter, its hit area reaches past what is drawn, so nothing moves. On a touch screen it's 44px high, as Apple and Material ask; in a group it stops halfway into the gap, so neighbours never share a point.
- They're real radios: Tab moves to the group (to the picked one), arrow keys move the choice, and screen readers announce the position ("2 of 3").
- Name the group: wrap it in `Field group` (a `<fieldset>` and `<legend>`, with the hint and error describing it), or give the RadioGroup an `aria-label` or `aria-labelledby`.
- A radio's label (its `children`) names it; a description is read after it. The dot is decorative. In development, a radio with no label and no `aria-label` warns, and so does one given `label=` (put the text in `children`).
- The label and description keep 4.5:1, and the border, checked fill, dot, focus ring and invalid border 3:1, in all six themes (`Radio.test.tsx`).
- Native constraints (`required`) show too: a box that fails them takes the `invalid` border once people have changed it or tried to send the form (`:user-invalid`), never on first paint. It's only the color: `aria-invalid` and the message stay yours (set `invalid` and Field's `error` when you check it yourself). To keep the browser out of it, leave out the attribute and check the value in your own code.
- A form reset checks the radio that was checked first, and an uncontrolled RadioGroup's choice follows it, so the next click works as expected. A controlled group shows its `value` again.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Into the group, on the checked radio (or the first, when none is) |
| ↑ ↓ ← → | The previous or next radio, checking it; wraps, and skips disabled ones |
| Space | Check the focused radio, when none is checked |

## Props

### RadioGroup props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div role="radiogroup">`. A `<label htmlFor>` can't name it; inside a Field, the Field's label names it through this id. |
| `value` | string \| number \| null | | The picked radio's value (controlled). `null` picks none |
| `defaultValue` | string \| number | | The value picked at first (uncontrolled) |
| `onValueChange` | `(value, event) => void` | | Called with the picked radio's value and the change event, like SegmentedControl's and Tabs' |
| `name` | string | generated | The radios' name, for forms |
| `orientation` | `'vertical'` \| `'horizontal'` | `'vertical'` | A stack 8px apart, or a wrapping row 16px apart |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Every radio's size, unless one sets its own |
| `invalid` | boolean | `false` | `aria-invalid` on the group, and a danger border on each unchecked radio. Field sets it from its error |
| `disabled` | boolean | `false` | Disables every radio (and sets `aria-disabled` on the group) |
| `required` | boolean | `false` | `aria-required` on the group, `required` on each radio |

Other props (`id`, `aria-label`, `aria-labelledby`, `className`…) and `ref` go to the `<div role="radiogroup">`, which has `data-component="radio-group"` and `data-orientation`.

### Radio props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `value` | string \| number | | What the group reports when this radio is picked |
| `children` | node | | The label. Without one, give the radio an `aria-label` |
| `description` | node | | A muted second line under the label, linked with `aria-describedby` (and kept out of the name) |
| `size` | `'sm'` \| `'md'` \| `'lg'` | the group's, or `'md'` | A 14px circle with `text-xs`, 16px with `text-sm`, 20px with `text-base` |
| `invalid` | boolean | `false` | A danger border and `aria-invalid`. In a group, set `invalid` on the RadioGroup instead |

Other props (`id`, `disabled`, `aria-*`, `onChange`…) and `ref` go to the `<input type="radio">`. `className` and `style` go to the `<label>`, which has `data-component="radio"` and `data-size`. In a group, the group sets `name` and `checked` (a radio's own are ignored). Outside one, a Radio is a plain radio: pass `name` and `checked` or `defaultChecked` yourself.

## Component tokens

Each is an optional override: set it on the page, a container or one radio. The list lives in `src/components/Radio/radio.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from radio.tokens.json by npm run tokens: edit the descriptions there) -->
**Colors**

| Token | Default | Use |
| --- | --- | --- |
| `--radio-bg` | `field` | The circle while unchecked |
| `--radio-bg-disabled` | `surface-muted` | The circle when disabled and unchecked |
| `--radio-bg-checked` | `primary` | Fill and border when checked |
| `--radio-bg-checked-hover` | `primary-hover` | The same, on hover |
| `--radio-border` | `field-border` | Border while unchecked |
| `--radio-border-hover` | `field-border-hover` | Border on hover |
| `--radio-dot-color` | `on-primary` | The dot |
| `--radio-label-color` | `text` | The label |
| `--radio-description-color` | `text-muted` | The description |
| `--radio-focus-ring` | `focus-ring` | The focus ring |
| `--radio-invalid` | `danger` | Border and focus ring when invalid |

**Sizing**

| Token | Default | Use |
| --- | --- | --- |
| `--radio-size-sm` | `spacing-3.5` | Circle size, sm (14px). |
| `--radio-size-md` | `spacing-4` | Circle size, md (16px, default). |
| `--radio-size-lg` | `spacing-5` | Circle size, lg (20px). |
| `--radio-dot-size-sm` | `spacing-1.5` | Dot size, sm (6px). |
| `--radio-dot-size-md` | `spacing-1.5` | Dot size, md (6px). |
| `--radio-dot-size-lg` | `spacing-2` | Dot size, lg (8px). |

**Spacing**

| Token | Default | Use |
| --- | --- | --- |
| `--radio-gap` | `spacing-2` | Circle to label (8px) |
| `--radio-group-gap` | `spacing-2` | Between radios in a stack, and between rows (8px) |
| `--radio-group-gap-horizontal` | `spacing-4` | Between radios in a row (16px) |

**Border**

| Token | Default | Use |
| --- | --- | --- |
| `--radio-border-width` | `border-width-1` | Border width (1px) |

**Motion**

| Token | Default | Use |
| --- | --- | --- |
| `--radio-press-scale` | `scale-90` | Size of the circle while it's held down (90%). 1 turns it off |
<!-- token-table:end -->
