# DatePicker

A date field: people type a date, or pick one from a calendar that opens under the field. The calendar flips above the field when there's no room below; with no room on either side (a short window, a phone held sideways) it takes the roomier side and scrolls inside, so its last week can still be reached.

```tsx
import { DatePicker, Field } from "serupa-ds";

const [due, setDue] = React.useState<Date | null>(null);
<Field label="Due date" hint="mm/dd/yyyy">
  <DatePicker value={due} onValueChange={setDue} min={new Date()} name="due" />
</Field>
```

## When to use

- A single, specific day the person knows or can find on a calendar: a due date, a start date, an appointment day.
- Dates near today, where seeing the month helps people choose (the next delivery day, a booking in the coming weeks).
- When some days can't be chosen (past days, weekends, fully booked days) and people should see that before they pick.

## When not to use

- A start and an end date: use [DateRangePicker](../DateRangePicker/README.md) instead.
- A date people know by heart and that's far from today, such as a date of birth: a plain [Input](../Input/README.md) with a format hint (or separate day, month and year fields) is quicker than paging back decades. DatePicker still accepts typing, so it works, but the calendar adds nothing.
- Only a month or a year: use a [Select](../Select/README.md).
- A calendar that's always on the page, such as a scheduling view: use [Calendar](../Calendar/README.md) on its own.

## Anatomy

Drawn from the `Disabled` story.

1. **Field** (`.dk-input__field`): where the date is typed, in the format shown in the hint.
2. **Calendar button** (`.dk-date-picker__button`): opens a calendar to choose the date instead.

## Usage

- Always wrap it in [Field](../Field/README.md) with a label, and put the expected format in the `hint` ("mm/dd/yyyy") for people who type.
- Set `min`, `max` or `isDateDisabled` rather than rejecting a date after it's entered: blocked days show faded and struck through in the calendar and a blocked typed date puts back the last good value.
- Leave `locale` unset in most products so the format follows the visitor's browser. Set it only when the whole product uses one locale.
- Use `name` in a plain form: it sends `yyyy-mm-dd`, whatever the display format.
- Keep a day from an API or database as the plain `"yyyy-mm-dd"` string and pass it as is: `value="2026-10-24"`, and store `iso` from `onValueChange`. `new Date("2026-10-24")` is UTC midnight, which is 23 October anywhere west of Greenwich; DatePicker warns once in the console when it's given such a Date there.
- Match the `size` of the other fields in the same form.

## Behavior

- People type in the locale's numeric order (11/22/2025 in en-US, 22.11.2025 in de-DE) or as `2025-11-22` anywhere. Digits alone work too, as typed on a number keypad: `11222025` or `112225` in en-US, `22112025` in de-DE, or `20251122`. A two-digit year is the one within 50 years of today: in 2026, `85` is 1985 and `30` is 2030, so birth dates and deadlines both read right. A date pasted with its month as a word reads too, in the locale or in English, in full or cut short: `12 Mei 2025`, `May 12, 2025`, `12. März 2025`.
- The field always uses Gregorian years and Latin digits, so a date reads back as the same day in every locale: Thai shows 22/11/2025 rather than the Buddhist year 2568, and Persian shows 2025/11/22 rather than ۱۴۰۴/۰۹/۰۱. Digits typed in another script (٢٢/١١/٢٠٢٥) are read too. The calendar's month and weekday names stay in the locale.
- The text is read on blur and on Enter. A date that can't be read, or one that can't be chosen, puts back the last good value. An empty field clears it. Switching to another window or browser tab isn't leaving the field: the text waits until people come back.
- A press anywhere on the box, on its side padding or past the calendar button, focuses the field with the caret at the end, as the text cursor over the box promises.
- The calendar opens from the button or Alt+↓ in the field, showing the typed or chosen month with focus on that day. Picking a day or Escape closes it and returns focus to the field. A click outside or Tab past the calendar closes it too, leaving focus where it went. On a touch screen, a finger that starts a scroll outside leaves it open; a tap outside closes it.

## Accessibility

- The calendar fades and grows in out of the field over 150ms, and fades and shrinks back over 100ms when it closes; with `prefers-reduced-motion` it only fades. The motion is a transition, so closing it while it opens turns back from where it is. The calendar stays while it fades out, inert, and focus goes back to the field at once. Firefox and Safari can't keep a closing popup in the top layer yet, so there it closes at once. From the keyboard there is no motion: opened by Alt+ArrowDown or Enter on the calendar button it is there at once, and Escape takes it away at once.
- **Role and name:** the field is a text input; label it with Field, `<label htmlFor>` or `aria-label`. The calendar button is named by `buttonLabel` ("Choose a date").
- **Format:** the format to type ("Format: mm/dd/yyyy", in the locale's order) is part of the field's description, after a Field hint, so screen readers say it even once the placeholder is gone. The words come from the `formatHint` label.
- **Keyboard:**

  | Key | Does |
  | --- | --- |
  | Type, then Enter or Tab | Enters the date. |
  | Alt+↓ | Opens the calendar, focused on the typed or chosen day. |
  | Arrows, Home, End, PageUp, PageDown | Move around the calendar (see [Calendar](../Calendar/README.md)). |
  | Enter, Space | Pick the focused day and close the calendar. |
  | Escape | Closes the calendar and returns focus to the field. |

- **ARIA states:** the button has `aria-haspopup="dialog"` and `aria-expanded`; the popup is a `role="dialog"` in the top layer holding a Calendar.
- **Contrast:** the calendar icon keeps 3:1 on the field in all six themes (`DatePicker.test.tsx`).
- **What's still yours:** the label, and the format in the hint.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the native `<input>` (not the wrapper), so a `<label htmlFor>` or a Field can point at it. |
| `value` / `defaultValue` | `Date \| string \| null` | | The chosen day, controlled or not: a Date, or a plain `"yyyy-mm-dd"` string. |
| `onValueChange` | `(date: Date \| null, iso: string \| null) => void` | | Called with the new day (local midnight) and the same day as `"yyyy-mm-dd"`, or `null` twice when the field is cleared. |
| `onInvalidInput` | `(text, reason) => void` | | Called when typed text is put back: `"unreadable"` (not a date) or `"unavailable"` (outside `min`..`max` or disabled). Screen readers also hear that it wasn't accepted (`inputNotAccepted`). |
| `min`, `max`, `isDateDisabled` | | | Days that can't be chosen, typed or picked. `min` and `max` take a Date or `"yyyy-mm-dd"`. |
| `locale` | `string` | the nearest `SerupaProvider`'s, else the browser's (en-US until a server-rendered page hydrates) | The typed format and the calendar's names and first day. When it differs from the provider's, the field and the calendar carry `lang`, so screen readers read them in that language. |
| `weekStartsOn` | `0`–`6` | the locale's | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Like Input. |
| `invalid` | `boolean` | `false` | Like Input. |
| `name` | `string` | | Adds a hidden input that sends `yyyy-mm-dd`. With `form`, the hidden input belongs to that form too. |
| `placeholder` | `string` | the locale's pattern, such as `mm/dd/yyyy` | |
| `buttonLabel` | `string` | `"Choose a date"` | The calendar button's name, and the popup's. |

`disabled`, `readOnly`, `id`, `aria-*`, `onBlur`, `onKeyDown` and `ref` go to the text field; `className` and `style` to the box.

`autoComplete` is `off` unless you pass one. For a date of birth, pass `autoComplete="bday"` so browsers can fill it (WCAG 1.3.5); what they type, such as 1990-05-12 or 05/12/1990, is read as the date.

## Component tokens

Each is an optional override: set it on the page, a container or one picker. The list lives in `src/components/DatePicker/date-picker.tokens.json` (also in `design-tokens/components/`). The calendar inside uses the `--calendar-*` tokens.

<!-- token-table:start (made from date-picker.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--date-picker-button` | `text-muted` | The calendar button's icon (3:1 on the field). |
| `--date-picker-button-hover` | `text` | The calendar button's icon on hover. |
| `--date-picker-button-bg-hover` | `surface-muted` | The calendar button's background on hover. |
| `--date-picker-focus-ring` | `focus-ring` | The calendar button's keyboard focus ring. |
| `--date-picker-popup-bg` | `surface-overlay` | The calendar panel's background. |
| `--date-picker-popup-text` | `text` | Text in the calendar panel (the Calendar has its own `--calendar-*` tokens). |
| `--date-picker-popup-border` | `border-overlay` | Its outline. |
| `--date-picker-popup-shadow` | `shadow-lg` | Its shadow. |
| `--date-picker-popup-radius` | `rounded-lg` | Its corners (8px). |
| `--date-picker-popup-padding` | `spacing-3` | Space inside it (12px). |
| `--date-picker-offset` | `spacing-1` | The gap between the field and the panel (4px). |
| `--date-picker-z-index` | `z-popover` | The panel's stacking order, where the top layer isn't available. |
<!-- token-table:end -->

The field itself uses Input's box (the `dk-input` classes and `--input-*` tokens), so it lines up with other fields.

## Related

- [Field](../Field/README.md): the label, hint and error around it.
- [DateRangePicker](../DateRangePicker/README.md): two dates, start and end.
- [Calendar](../Calendar/README.md): the calendar on its own, always visible.
