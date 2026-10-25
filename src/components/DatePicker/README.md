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

## Usage

- Always wrap it in [Field](../Field/README.md) with a label, and put the expected format in the `hint` ("mm/dd/yyyy") for people who type.
- Set `min`, `max` or `isDateDisabled` rather than rejecting a date after it's entered: blocked days show faded and struck through in the calendar and a blocked typed date puts back the last good value.
- Leave `locale` unset in most products so the format follows the visitor's browser. Set it only when the whole product uses one locale.
- Use `name` in a plain form: it sends `yyyy-mm-dd`, whatever the display format.
- Match the `size` of the other fields in the same form.

## Behavior

- People type in the locale's numeric order (11/22/2025 in en-US, 22.11.2025 in de-DE) or as `2025-11-22` anywhere. Digits alone work too, as typed on a number keypad: `11222025` or `112225` in en-US, `22112025` in de-DE, or `20251122`. A two-digit year is the one within 50 years of today: in 2026, `85` is 1985 and `30` is 2030, so birth dates and deadlines both read right.
- The field always uses Gregorian years and Latin digits, so a date reads back as the same day in every locale: Thai shows 22/11/2025 rather than the Buddhist year 2568, and Persian shows 2025/11/22 rather than ۱۴۰۴/۰۹/۰۱. Digits typed in another script (٢٢/١١/٢٠٢٥) are read too. The calendar's month and weekday names stay in the locale.
- The text is read on blur and on Enter. A date that can't be read, or one that can't be chosen, puts back the last good value. An empty field clears it.
- The calendar opens from the button or Alt+↓ in the field, showing the typed or chosen month with focus on that day. Picking a day or Escape closes it and returns focus to the field. A click outside or Tab past the calendar closes it too, leaving focus where it went. On a touch screen, a finger that starts a scroll outside leaves it open; a tap outside closes it.

## Accessibility

- **Role and name:** the field is a text input; label it with Field, `<label htmlFor>` or `aria-label`. The calendar button is named by `buttonLabel` ("Choose a date").
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
| `value` / `defaultValue` | `Date \| null` | | The chosen day, controlled or not. |
| `onValueChange` | `(date: Date \| null) => void` | | Called with the new day, or `null` when the field is cleared. |
| `onInvalidInput` | `(text, reason) => void` | | Called when typed text is put back: `"unreadable"` (not a date) or `"unavailable"` (outside `min`..`max` or disabled). Screen readers also hear that it wasn't accepted (`inputNotAccepted`). |
| `min`, `max`, `isDateDisabled` | | | Days that can't be chosen, typed or picked. |
| `locale` | `string` | the nearest `SerupaProvider`'s, else the browser's (en-US until a server-rendered page hydrates) | The typed format and the calendar's names and first day. |
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

The field itself uses Input's box (the `dk-input` classes and `--input-*` tokens), so it lines up with other fields.

## Related

- [Field](../Field/README.md): the label, hint and error around it.
- [DateRangePicker](../DateRangePicker/README.md): two dates, start and end.
- [Calendar](../Calendar/README.md): the calendar on its own, always visible.
