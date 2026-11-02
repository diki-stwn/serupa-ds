# NumberInput

A field for a number, with − and + buttons at the end. People can type freely; the arrow keys and buttons change it by `step`, and it's kept within `min` and `max`. It uses Input's box, sizes and tokens.

```tsx
import { NumberInput } from "serupa-ds";

<NumberInput aria-label="Quantity" defaultValue={1} min={1} max={99} />

const [price, setPrice] = React.useState<number | null>(9.5);
<NumberInput aria-label="Price" value={price} onValueChange={setPrice} step={0.5} min={0} />

// Money: the symbol where the locale puts it ("$19.99", "19,99 €"), stored as whole cents
const [cents, setCents] = React.useState<number | null>(1999);
<NumberInput aria-label="Price" currency="USD" minorUnits value={cents} onValueChange={setCents} min={0} />
```

## When to use

- A count or an amount people know exactly: a quantity, a price, a number of seats.
- Small changes up or down from a starting value, with the arrow keys or the − and + buttons.

## When not to use

- A value where its place in a range matters more than the exact number: use [Slider](../Slider/README.md).
- Digits that aren't an amount, such as a phone number, a postcode or a card number: use [Input](../Input/README.md) with the right `type` or `inputMode`.

## Anatomy

Drawn from the `Controlled` story.

1. **Field** (`.dk-input__field`): where the number is typed.
2. **Steppers** (`.dk-number-input__steppers`): the buttons that lower and raise it by one step.
3. **Step** (`.dk-number-input__step`): one of them; holding it repeats.

## Usage

- Label it with [Field](../Field/README.md) and put the unit in the label or hint ("Weight (kg)").
- Set `min`, `max` and `step` to the real limits, so the field keeps values within them.
- Match the `size` to the fields and buttons beside it.
- For money, set `currency` to its ISO 4217 code. The symbol goes where the locale writes it, and the value keeps the currency's decimals however coarse `step` is, so `12.5` stays $12.50. A `value` or `defaultValue` with more decimals than that is taken as shown: `19.995` shows as $20.00, and the form gets 20. With `formatOptions`, it's the same for the decimals they show. A controlled parent that keeps 19.995 isn't told, because nothing was edited.
- Store money as whole minor units with `minorUnits`: `value`, `defaultValue`, `onValueChange`, `min`, `max` and `step` are then cents (`1999` is $19.99, `step={5}` is five cents), which avoids floating-point sums such as `0.1 + 0.2`. The minor units come from ISO 4217: 2 for most currencies, including IDR, 0 for JPY and KRW, 3 for KWD.

## Behavior

- On blur the text is parsed in the locale's marks, clamped, rounded to the step's decimals and written back in the locale's form. The locale's group mark counts as grouping only when the digits are grouped in threes, so `1.500` is 1500 in `id-ID` and `de-DE`, and `9.5` or `9,5` is 9.5 in any locale. Spaces, a currency symbol or %, a typographic minus and digits in other scripts are accepted. Text that isn't a number goes back to the last number, and screen readers are told ("\"abc\" wasn't accepted, so the previous value was kept."). Switching to another window or browser tab isn't leaving the field: the text waits until people come back.
- The value is written in the locale's own digits, as Meter, Pagination and Calendar write numbers: `١٢٥٠٫٥` in `ar-EG`, `۱۲۵۰٫۵` in `fa-IR`. People can type digits in any script, Latin ones too, and the form always gets Latin digits (`1250.5`). Pass `numberingSystem="latn"` to show Latin digits instead.
- A typed number outside `min`..`max` is brought back within them on blur or Enter, as spinbuttons do. `onInvalidInput(text, "range")` tells the app, so a form can say "Quantity was reduced to 100"; text that isn't a number calls it with `"unreadable"`.
- **Forms get the number.** With `name`, the form submits the number itself from a hidden input (`1500000`, not "Rp 1.500.000"; whole cents with `minorUnits`, so `1999` for $19.99), and the visible field has no name. `form` works for a field outside its form. A disabled field sends nothing.
- **Form reset** puts `defaultValue` back, in the field and in what the form sends. A controlled field shows its `value` again.
- Leave `locale` unset in most products so it follows the `SerupaProvider` locale, or the visitor's browser without one.
- A typed number outside the limits isn't reported until blur, so a half-typed number never jumps.
- The buttons are out of the Tab order, since the arrow keys do the same, and are disabled at the limits.
- Holding − or + repeats: one step on the press, then after 400ms one every 50ms, until the pointer goes up or leaves the button, Escape is pressed, or the limit is reached. A screen reader's click is one step.

## Accessibility

- Each stepper button takes presses over at least 24px (WCAG 2.5.8), even at size `sm` where it's 22px: a box behind it reaches past its edges without moving anything.
- A press anywhere else on the box, on the icon, the side padding or the gap by a prefix, focuses the field with the caret at the end, as Input's box does.
- `role="spinbutton"` with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`. It's `type="text"` with `inputMode` numeric or decimal, which avoids the native number field's scroll-wheel and locale problems.
- The − and + keep 3:1 and the number 4.5:1 on the field in all six themes (`NumberInput.test.tsx`).

### Keyboard

| Key | Does |
| --- | --- |
| ArrowUp, ArrowDown | ± `step`. From a typed value between steps, the first press goes to the nearest step that way (0.1 ↑ with `step={0.25}` is 0.25), as the native field and Slider do. Money shown with finer decimals than its step keeps them ($19.99 ↑ with a step of $1 is $20.99) |
| PageUp, PageDown, Shift+Arrow | ± `largeStep` steps |
| Home, End | `min`, `max` (when set) |
| Enter | Tidies the typed number (clamps and rounds it) |

## Props

Every Input prop works (`size`, `invalid`, `leftIcon`, `prefix`, `suffix`, `placeholder`, `disabled`, `readOnly`…), except `type` and `rightIcon`. A `suffix` such as "kg" or "%" sits before the steppers.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the native `<input>` (not the wrapper), so a `<label htmlFor>` or a Field can point at it. |
| `value` | `number \| null` | | Controlled. `null` is an empty field. After a step, Enter or blur the field shows `value`, so a parent that keeps or changes the number it gets is what people see. |
| `defaultValue` | `number \| null` | | Uncontrolled. |
| `onValueChange` | `(value: number \| null) => void` | | As people type (numbers within range), on blur (clamped), and from the keys and buttons. |
| `min`, `max` | `number` | | Limits. The field snaps into them when it loses focus. |
| `onInvalidInput` | `(text: string, reason: 'range' \| 'unreadable') => void` | | When typed text isn't kept as it is: a number brought back within `min`..`max`, or text that isn't a number. |
| `step` | `number` | `1` | How much the arrows and buttons change it. Its decimals set how many the value keeps. |
| `largeStep` | `number` | `10` | Steps moved by PageUp, PageDown and Shift with an arrow. |
| `steppers` | `boolean` | `true` | The − and + buttons. |
| `decrementLabel`, `incrementLabel` | `string` | `'Decrease'`, `'Increase'` | The buttons' names. |
| `locale` | `string` | the nearest `SerupaProvider`'s, else the browser's | Whose decimal and group marks are read and written: `1.500,25` in `id-ID`, `1,500.25` in `en-US`. When it differs from the provider's, the field carries `lang`. |
| `currency` | `string` | | An ISO 4217 code: shows the amount as money and keeps its decimals. Short for `formatOptions={{ style: 'currency', currency }}`; `formatOptions` still wins. |
| `minorUnits` | `boolean` | `false` | With `currency`: the value props and `onValueChange` are whole minor units (cents). `aria-valuenow` stays in the currency's units. |
| `formatOptions` | `Intl.NumberFormatOptions` | no grouping | How the number is shown: `{ style: 'currency', currency: 'IDR' }`, `{ useGrouping: true }`, `{ style: 'percent' }` (the value is the fraction, so 0.15 shows 15%), `{ style: 'unit', unit: 'kilometer' }`, or `currencySign: 'accounting'` (a negative in parentheses, read back as negative). Sets `aria-valuetext` too. |
| `numberingSystem` | string | the locale's | The digits the value is written in: `"latn"` for Latin, `"arab"` for Arabic-Indic. Typed digits are read in any script either way |

`className` and `style` go to the box; `ref` and every other prop go to the `<input>`.

## Component tokens

Each is an optional override: set it on the page, a container or one field. The box uses Input's tokens. The list lives in `src/components/NumberInput/number-input.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from number-input.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--number-input-stepper` | `text-muted` | The − and + icons (3:1 on the field). |
| `--number-input-stepper-hover` | `text` | The icons on hover. |
| `--number-input-stepper-bg-hover` | `secondary` | The buttons' background on hover. |
| `--number-input-stepper-radius` | `rounded-sm` | The buttons' corners (4px). |
| `--number-input-stepper-padding` | `spacing-1` | Space around each button's icon (4px). |
| `--number-input-stepper-gap` | `spacing-0.5` | Space between the − and + buttons (2px). |
<!-- token-table:end -->
