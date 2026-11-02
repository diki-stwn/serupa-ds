# ColorPicker

Picks a color from a set of swatches, or any color by its hex code or with the browser's own picker. With `contrastWith`, it shows the contrast between the picked color and the one it goes on, and warns when text would be hard to read.

```tsx
import { ColorPicker } from "serupa-ds";

const SWATCHES = [{ value: "#1d4ed8", label: "Blue" }, { value: "#047857", label: "Emerald" }, { value: "#b91c1c", label: "Red" }];

<Field label="Label color">
  <ColorPicker swatches={SWATCHES} value={color} onValueChange={setColor} />
</Field>

<ColorPicker aria-label="Text color" swatches={SWATCHES} defaultValue="#1d4ed8" contrastWith="#ffffff" />  // "Contrast 6.7:1"
<ColorPicker aria-label="Tag" swatches={SWATCHES} custom={false} size="sm" />
```

## When to use

- Picking a color for something people make: a label, a tag, a calendar, a chart series, a brand color.
- A short set of colors that work in your product, with a way out for any other.

## When not to use

- Choosing between a few named options that happen to be colors ("Red", "Green" as statuses): use a [SegmentedControl](../SegmentedControl/README.md) or [Select](../Select/README.md) with the names.
- Theming the whole product: use the themes and tokens.

## Anatomy

Drawn from the `ContrastCheck` story.

1. **Swatches** (`.dk-color-picker__swatches`): the colors to choose from, each named for screen readers.
2. **Chosen swatch** (`.dk-color-picker__swatch--checked`): the color chosen now, with a check.
3. **Custom color** (`.dk-color-picker__custom`): any other color, from the system picker or as a hex code.
4. **Hex code** (`.dk-color-picker__hex`): the chosen color as a hex code, to read or type.
5. **Contrast** (`.dk-color-picker__contrast`): the contrast against the background it will sit on.
6. **Warning** (`.dk-color-picker__warning`): says when that contrast is too low to read.

## Usage

- Name every swatch in words with `label` ("Ocean", "Sunset"). Screen readers say the name. A bare hex string (or an empty `label`) gets a rough name from its color, such as "Dark blue" or "Light gray" (the `colorName` label, English and Indonesian built in), and its code as the tooltip; your own names are still better, since two blues both read as "Blue".
- Pick swatches that pass contrast where they'll be used, and set `contrastWith` to the background (or the text color) when people can pick freely, so they see the ratio. `minContrast` is 4.5 by default (body text); use 3 for large text and icons.
- Turn off `custom` when only the swatches are allowed.
- Colors come out as lowercase `#rrggbb`, whatever case or short form people type.

## Behavior

- The swatches are one radio group: Tab reaches the picked swatch (or the first), the arrow keys move and pick (wrapping), and Home and End go to the ends.
- A form reset puts the first color (`defaultValue`) back, in the swatches, the hex field and the submitted value, also for a picker outside the form that `form` names, with or without `name`.
- The hex field picks the color as soon as six digits are typed, and a three-digit code (`f0a`) on Enter or blur. A code on its way to six digits isn't marked invalid; one that can't be a color (`1g`, seven digits) is marked at once, and a short one (`1d4e`) when Enter is pressed. A bad code goes back to the picked color on blur. The `#` is optional, and a pasted code is trimmed first, so ` #1d4ed8 ` copied with spaces works. Switching to another window or browser tab isn't leaving the field: the text waits until people come back.
- The browser's color picker (the square before the field) picks any color too; when the picked color isn't a swatch, no swatch is checked. With nothing picked, its square shows empty rather than black, and black chosen there is picked when it closes.
- The contrast ratio is rounded down to one decimal, so 4.49 shows as 4.4 and never looks like a pass. It's written in the locale's numbers ("4,5:1" in Indonesian).

## Accessibility

- `role="radiogroup"` named by `aria-label`, `aria-labelledby` or a surrounding [Field](../Field/README.md)'s label, with a `role="radio"` swatch for each color and `aria-checked` on the picked one. In a Field, the hint and error describe the radiogroup, and `aria-required` and `aria-invalid` sit on it. The hex field is its own field, named "Hex code".
- The picked swatch shows a ring (3:1 on the page in all six themes) and a check in white or black, whichever stands out more on that color, so the choice doesn't rely on seeing the color.
- Every swatch, and the native color well, has a thin border in `field-border`, which keeps 3:1 on the page in all six themes. So a white swatch shows on a white page and a black one on a dark page (WCAG 1.4.11). In forced-colors mode the swatches keep their real colors and the ring uses Highlight.
- The contrast line is a polite live region, so a change is read out. The warning has an icon and words, not just a color.
- With `contrastWith`, every swatch also says its ratio before it's picked, as its description ("Contrast 1.3:1, below 4.5:1, which can be hard to read"), and a swatch under `minContrast` is struck through with a diagonal line (`CanvasText` in forced-colors mode) and has `data-low-contrast`. The line goes away once it's picked, when the check and the contrast line take over.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To the chosen swatch (the swatches are one Tab stop), then the hex field and the browser's color picker, with `custom` |
| Right / Down | The next swatch, choosing it; Left and Right swap in right-to-left pages, and it wraps |
| Left / Up | The previous swatch, the same way |
| Home / End | The first or last swatch |
| Enter | In the hex field, chooses the color typed |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div>`. A `<label htmlFor>` can't name it; inside a Field, the Field's label names it through this id. A label click then focuses the picked swatch. |
| `swatches` | `Array<{ value, label } \| string>` | | The colors, as hex. A bare hex is named from its color ("Dark blue"). |
| `value` | `string \| null` | | Controlled, as hex. |
| `defaultValue` | `string \| null` | | Uncontrolled. |
| `onValueChange` | `(value: string) => void` | | With lowercase `#rrggbb`. |
| `onValueCommit` | `(value: string) => void` | | Called once a color is chosen: a swatch picked, the browser's picker closed, or the hex field left or Enter pressed. Not on every drag step or keystroke, unlike `onValueChange`. |
| `custom` | `boolean` | `true` | The browser's picker and a hex field. |
| `contrastWith` | `string` | | A hex color to check against: the picked one in the contrast line, and every swatch in its description and strike-through. |
| `minContrast` | `number` | `4.5` | Below this ratio it warns. |
| `size` | `'sm' \| 'md'` | `'md'` | 24 or 32px swatches. |
| `disabled` | `boolean` | `false` | A `<fieldset disabled>` around it does the same |
| `name` | `string` | | Submits the color with a form. |
| `form` | `string` | | The id of the form it submits with, when the picker sits outside it (like an input's `form`). |
| `required` | `boolean` | `false` | A color must be picked: `aria-required` on the swatches, and the form won't submit without one (the swatches are marked invalid and take focus). Set for you in a required Field. |
| `invalid` | `boolean` | `false` | Marks the swatches invalid: `aria-invalid` on the group, and each swatch's border turns the danger color (`--color-picker-invalid`). Set for you in a Field with an error. |

Every other prop, `className` and `ref` go to the outer `<div>`, which has `data-component="color-picker"`; `focus()` on it and `autoFocus` focus the picked swatch. `aria-label` and `aria-labelledby` name the radio group.

## Component tokens

Each is an optional override: set it on the page, a container or one picker. The hex field uses Input's tokens. The list lives in `src/components/ColorPicker/color-picker.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from color-picker.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--color-picker-text` | `text` | The picker's text. |
| `--color-picker-swatch-border` | `field-border` | The thin inset border on every swatch and round the native color well (3:1 on the page). |
| `--color-picker-ring` | `primary` | The ring around the picked swatch (3:1). |
| `--color-picker-invalid` | `danger` | The swatches' border while invalid (3:1), so the error shows on the swatches as well as in the Field's message. |
| `--color-picker-focus-ring` | `focus-ring` | The keyboard focus ring. |
| `--color-picker-contrast` | `text-muted` | The contrast line (4.5:1). |
| `--color-picker-contrast-low` | `warning-text` | The contrast line below `minContrast` (4.5:1). |
| `--color-picker-swatch-radius` | `rounded-full` | A swatch's shape. |
| `--color-picker-gap` | `spacing-3` | Space between the swatches, the custom row and the contrast line (12px). |
| `--color-picker-swatch-gap` | `spacing-2` | Space between swatches (8px). |
| `--color-picker-swatch-size-sm` | `spacing-6` | A swatch at `size="sm"` (24px). |
| `--color-picker-swatch-size-md` | `spacing-8` | A swatch at `size="md"` (32px). |
| `--color-picker-hex-width` | `spacing-28` | The hex field's width (112px). |
<!-- token-table:end -->
