# TimePicker

A time-of-day field: people type a time, or pick one from a list.

```tsx
import { Field, TimePicker } from "serupa-ds";

const [start, setStart] = React.useState<string | null>("09:00");
<Field label="Start time">
  <TimePicker value={start} onValueChange={setStart} min="08:00" max="18:00" step={15} name="start" />
</Field>
```

## When to use

- A time of day: a meeting start, an opening hour, a reminder time.
- When times usually fall on regular slots (every 15 or 30 minutes) but people may also type an exact time.
- When only some hours are allowed, such as business hours.

## When not to use

- A length of time, such as "45 minutes": use [NumberInput](../NumberInput/README.md) with the unit in the label instead.
- A date as well as a time: pair a [DatePicker](../DatePicker/README.md) with a TimePicker; TimePicker holds the time only.
- A handful of fixed slots that people must choose from: use [Select](../Select/README.md) or a [Radio](../Radio/README.md) group instead. TimePicker accepts typed times between the slots.

## Anatomy

Drawn from the `Disabled` story.

1. **Field** (`.dk-input__field`): where the time is typed.
2. **Clock button** (`.dk-time-picker__button`): opens a list of times to choose from instead.

## Usage

- Wrap it in [Field](../Field/README.md) with a label that says which time it is ("Start time", "Remind me at").
- Set `step` to the slots people usually pick, and `min` and `max` to the hours that are allowed.
- Leave `hour12` and `locale` unset in most products so times follow the visitor's settings.
- Use `name` in a plain form: it sends `"HH:mm"`, whatever the display format.

## Behavior

- People type `2:30 pm`, `2:30p`, `2pm`, `14:30`, `1430` or `9`. Without AM or PM, 13–23 are afternoon and 0–11 morning. The locale's own form is read too, as the field writes it: `오후 2:05` in Korean, `٢:٠٥ م` in Egyptian Arabic, `۱۴:۰۵` in Persian, with digits in any script. The text is read on blur and Enter; text that isn't a time, or a time outside `min`–`max`, puts back the last good value. Switching to another window or browser tab isn't leaving the field: the text waits until people come back.
- The list opens on ↓ or ↑ in the field, or the clock button, with the chosen time (or the one nearest the typed text) highlighted and near the top.
- A press anywhere on the box, on its start padding or past the clock button, focuses the field with the caret at the end, as the text cursor over the box promises.
- In the list: ↑ ↓ move one time, PageUp and PageDown four, Ctrl+Home and Ctrl+End to the ends, Enter picks, Escape closes, Tab closes and moves on. Typing while the list is open moves the highlight to the nearest time, and Enter then keeps what was typed. Focus stays in the field throughout, the clock button included.
- The list fades and grows in from the edge facing the field, and fades and shrinks back out a little faster on close, inert while it goes, as Menu, Popover and DatePicker do. Closed mid-way, it turns back from where it is. Under reduced motion it only fades. From the keyboard there is no motion: opened by an arrow the list is there at once, and Escape takes it away at once.

## Accessibility

- The field is an ARIA combobox (`aria-haspopup="listbox"`, `aria-expanded`, `aria-activedescendant`) and the list a `role="listbox"` with `aria-selected` on the chosen time. The check is decorative.
- The placeholder and the format in the field's description ("Format: hh:mm AM/PM", after a Field hint) follow the locale's order, separator and AM/PM words: "hh.mm" in id-ID, "오전/오후 hh:mm" in ko. The words come from the `formatHint` label.
- The clock button is out of the tab order, since ↓ in the field does the same.
- Times keep 4.5:1 (also highlighted), and the check and clock icon 3:1, in all six themes (`TimePicker.test.tsx`).

### Keyboard

| Key | Does |
| --- | --- |
| Down / Up | In the field, opens the list; in the list, the next or previous time |
| PageDown / PageUp | Four times down or up the list |
| Ctrl+Home / Ctrl+End | The first or last time (Alt works too) |
| Enter | Picks the highlighted time, or reads what was typed; with the list closed, reads what was typed |
| Escape | Closes the list |
| Tab | Closes the list and moves on; the clock button isn't a Tab stop |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the native `<input>` (not the wrapper), so a `<label htmlFor>` or a Field can point at it. |
| `value` / `defaultValue` | `string \| null` | | The time as `"HH:mm"` (24-hour), controlled or not. The same format as `<input type="time">`; seconds (`"14:05:00"`, as a database's time column gives) are read and dropped. |
| `onValueChange` | `(value: string \| null) => void` | | Called with `"HH:mm"`, or `null` when the field is cleared. |
| `onInvalidInput` | `(text, reason) => void` | | Called when typed text is put back: `"unreadable"` (not a time) or `"unavailable"` (outside `min`..`max`). Screen readers also hear that it wasn't accepted (`inputNotAccepted`). |
| `min`, `max` | `string` | `"00:00"`, `"23:59"` | The earliest and latest times, typed or picked. |
| `step` | `number` | `30` | **Minutes** between the times in the list, counted from `min` (or midnight). Under 1, it's 30. Typed times don't have to fall on a step. `<input type="time">` counts its `step` in seconds, so a native `step={900}` (15 minutes) becomes `step={15}` here; `step={900}` would list a time every 15 hours. |
| `locale` | `string` | the nearest `SerupaProvider`'s, else the browser's (en-US until a server-rendered page hydrates) | How times are written. When it differs from the provider's, the field and the options carry `lang`, so screen readers read them in that language. |
| `hour12` | `boolean` | the locale's | 12-hour (2:30 PM) or 24-hour (14:30). |
| `size`, `invalid` | | `'md'`, `false` | Like Input. |
| `name` | `string` | | Adds a hidden input that sends `"HH:mm"`. With `form`, the hidden input belongs to that form too. |
| `placeholder` | `string` | the locale's format: `"hh:mm AM/PM"` (en-US), `"hh:mm"` (en-GB), "hh.mm" (id-ID) | |
| `listLabel` | `string` | `"Choose a time"` | The list's name, and the clock button's. |

`disabled`, `readOnly`, `id`, `aria-*`, `onBlur`, `onKeyDown` and `ref` go to the text field; `className` and `style` to the box.

`autoComplete` is `off` unless you pass one.

## Component tokens

Each is an optional override: set it on the page, a container or one picker. The list lives in `src/components/TimePicker/time-picker.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from time-picker.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--time-picker-button` | `text-muted` | The clock button's icon (3:1 on the field). |
| `--time-picker-button-hover` | `text` | The clock button's icon on hover. |
| `--time-picker-button-bg-hover` | `surface-muted` | The clock button's background on hover. |
| `--time-picker-list-bg` | `surface-overlay` | The list's background. |
| `--time-picker-list-border` | `border-overlay` | The list's outline. |
| `--time-picker-option-color` | `text` | A time in the list. |
| `--time-picker-option-bg-active` | `highlight` | The highlighted time (pointer or keyboard). |
| `--time-picker-option-indicator` | `primary` | The 2px bar at the highlighted time's start. |
| `--time-picker-check` | `primary` | The check by the chosen time (3:1 on surface). |
| `--time-picker-list-shadow` | `shadow-lg` | The list's shadow. |
| `--time-picker-list-radius` | `rounded-lg` | The list's corners (8px). |
| `--time-picker-list-max-height` | `spacing-60` | The list's tallest before it scrolls (240px). |
| `--time-picker-list-min-width` | `spacing-40` | The list's least width (160px). |
| `--time-picker-option-height` | `control-height-md` | Each time's height (32px). |
| `--time-picker-list-padding` | `spacing-1` | Space inside the list (4px). |
| `--time-picker-offset` | `spacing-1` | The gap between the field and the list (4px). |
| `--time-picker-z-index` | `z-popover` | The list's stacking order, where the top layer isn't available. |
<!-- token-table:end -->

It uses Input's box, so it lines up with other fields.
