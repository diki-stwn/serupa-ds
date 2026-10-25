# Select

A native `<select>` styled like Input: the same three heights (24, 32 and 44px), colors, focus ring and states, with a chevron and an optional left icon. It keeps everything the browser gives a select for free: the system picker on phones, type-to-find, and full keyboard and screen-reader support.

```jsx
const { Select, Field } = window.Serupa;

<Field label="Role">
  <Select options={["Viewer", "Editor", "Admin"]} value={role} onChange={(e) => setRole(e.target.value)} />
</Field>

<Select aria-label="Country" placeholder="Choose a country" options={countries} />

// labels, disabled options and groups
<Select aria-label="Time zone" leftIcon="schedule" options={[
  { label: "Europe", options: [{ value: "Europe/London", label: "London (GMT+1)" }, { value: "Europe/Paris", label: "Paris (GMT+2)" }] },
  { value: "UTC", label: "UTC", disabled: true },
]} />

// or your own options
<Select aria-label="Sort"><option value="new">Newest</option><option value="old">Oldest</option></Select>
```

## When to use

- One choice from about 5 to 15 options, such as a role, a country or a time zone.
- Forms used on phones, where the system picker is easier than a custom list.

## When not to use

- 2 to 4 options: use [radios](../Radio/README.md), which show every choice at once.
- A long list people search through: a [Combobox](../Combobox/README.md) fits better.
- Picking more than one option: use [checkboxes](../Checkbox/README.md); Select doesn't support `multiple`.
- A few options that change a view right away, such as Day, Week, Month: use [SegmentedControl](../SegmentedControl/README.md).

## Usage

- Order options the way people expect: alphabetically, by frequency, or in their natural order (sizes, dates).
- Pick a sensible default when there is one; use a placeholder only when no default makes sense.
- Match its size to the inputs and buttons beside it.

## States

| State | Look |
| --- | --- |
| Rest | `field` background, 1px `field-border`, chevron in `text-muted` |
| Placeholder | The placeholder in the `placeholder` color until something is picked, and again after a form reset |
| Hover | `field-border-hover` |
| Focus | The border and a 1px ring hugging it in `focus-ring` (2px in all), like Input; a visible outline in forced-colors mode |
| Invalid | `danger` border, and a `danger` focus ring |
| Disabled | `surface-muted` background at 50%, `not-allowed` cursor |

## Accessibility

- On iOS the field's text is 16px at every size, so Safari doesn't zoom the page when it takes focus; the box keeps its height.
- It's the browser's own select, so screen readers, the keyboard (arrows, Home/End, type to find) and the phone's picker all work without extra code.
- Every select needs a name: Field, a `<label htmlFor>` or `aria-label`. The placeholder isn't a label.
- The chevron and left icon are decorative and don't take clicks: a click anywhere in the box opens the select.
- Text and placeholder keep 4.5:1 on `field`; the chevron, border, focus ring and invalid border 3:1, in all six themes (`Select.test.tsx`).

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | 24px with `text-xs`, 32px with `text-sm`, 44px with `text-base`, like Input |
| `options` | array | | Strings (value and label), `{ value, label, disabled }`, or groups `{ label, options, disabled }`. `<option>` and `<optgroup>` children come after them |
| `placeholder` | string | | A first, empty option shown in the placeholder color until something is picked. It can't be picked back. An uncontrolled Select starts on it |
| `leftIcon` | icon name or element | | A decorative icon before the text (14, 16 or 20px, in `text-muted`) |
| `invalid` | boolean | `false` | A danger border and focus ring, and `aria-invalid` |

Everything else (`value`, `defaultValue`, `onChange`, `name`, `disabled`, `required`, `id`, `aria-*`) and `ref` go to the `<select>`. `className` and `style` go to the box, so `className="w-48"` sets its width (full width by default). The box has `data-component="select"` and `data-size`. `multiple` isn't supported (a native multi-select is hard to use): it's ignored with a warning; use checkboxes.

## Component tokens

Each is an optional override: set it on the page, a container or one select. The list lives in `src/components/Select/select.tokens.json` (also in `design-tokens/components/`). The defaults are the same shared tokens Input uses.

| Token | Default | Use |
| --- | --- | --- |
| `--select-bg` | `field` | Background, and the options where the browser draws them |
| `--select-bg-disabled` | `surface-muted` | Background when disabled |
| `--select-text` | `text` | The chosen value, and the options where the browser draws them |
| `--select-border` | `field-border` | Border |
| `--select-border-hover` | `field-border-hover` | Border on hover |
| `--select-placeholder` | `placeholder` | The placeholder |
| `--select-icon-color` | `text-muted` | Chevron and left icon |
| `--select-focus-ring` | `focus-ring` | Border and ring while focused |
| `--select-invalid` | `danger` | Border and ring when invalid |
| `--select-height-sm` / `-md` / `-lg` | `control-height-sm` / `-md` / `-lg` | Heights (24, 32, 44px) |
| `--select-icon-size-sm` / `-md` / `-lg` | `spacing-3.5` / `spacing-4` / `spacing-5` | Icon sizes (14, 16, 20px) |
| `--select-padding-x-sm` / `-md` / `-lg` | `spacing-2` / `spacing-3` / `spacing-4` | Side padding (8, 12, 16px) |
| `--select-gap` | `spacing-2` | Gap between an icon and the text (8px) |
| `--select-border-width` | `border-width-1` | Border width (1px) |
| `--select-radius` | `rounded-md` | Corner radius (6px) |
