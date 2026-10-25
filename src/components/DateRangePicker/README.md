# DateRangePicker

Two date fields for the start and end of a range (a stay, a report period, a filter), with a popup of two months to pick both.

```tsx
import { DateRangePicker, Field, type DateRange } from "serupa-ds";

const [stay, setStay] = React.useState<DateRange>({ start: null, end: null });
<Field label="Stay" hint="mm/dd/yyyy">
  <DateRangePicker value={stay} onValueChange={setStay} min={new Date()} startName="check_in" endName="check_out" />
</Field>
```

## When to use

- A period with a start and an end day: a hotel stay, a leave request, a booking.
- Filtering a report or a list to the days between two dates.
- When people benefit from seeing the whole range on the calendar while they pick it.

## When not to use

- A single day: use [DatePicker](../DatePicker/README.md) instead.
- A fixed period such as "Last 7 days" or "This month": use a [Select](../Select/README.md) or a [SegmentedControl](../SegmentedControl/README.md) of presets instead.
- A time of day as well as the dates: pair the fields with [TimePicker](../TimePicker/README.md); DateRangePicker holds days only.

## Usage

- Wrap it in [Field](../Field/README.md) with one label for the range, and put the expected format in the `hint`. Field's `id` goes to the start field.
- Set `startLabel` and `endLabel` to fit the task ("Check-in", "Check-out") so each field has a clear name.
- Use `min`, `max` and `isDateDisabled` to block days rather than rejecting a range afterwards. Blocked days can't be an end but can sit inside a range, so check for them yourself if a range must not cross them.
- In narrow places, such as a side panel, set `months={1}`. Two months stack below 640px anyway.
- In a plain form, use `startName` and `endName`: each end is sent as `yyyy-mm-dd`.

## Behavior

- In the popup, the first pick is the start and the second the end; a day before the start moves the start instead. Pointing at days previews the range. The popup closes once both ends are set, on Escape, on a click outside and when Tab moves focus past it. A finger that starts a scroll outside leaves it open.
- Opening it with only a start asks for the end.
- Each field reads typed text on blur and Enter, like DatePicker. Text that can't be used puts back the last good day, and a typed start after the end clears the end.

## Accessibility

- The box is a `role="group"`; name it with `aria-label` when it has no Field. Each field has its own name.
- The popup is a `role="dialog"` holding one or two Calendars (see Calendar's keyboard table); a polite live line says which end to pick next.
- Days in a range, the status line and the dash keep 4.5:1 in all six themes (`DateRangePicker.test.tsx`).

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` / `defaultValue` | `{ start: Date \| null; end: Date \| null }` | | The range, controlled or not. |
| `onValueChange` | `(range: DateRange) => void` | | Called whenever either end changes, so also after the first pick (with `end: null`). |
| `onInvalidInput` | `(text, reason) => void` | | Called when text typed in either field is put back: `"unreadable"` (not a date) or `"unavailable"` (outside `min`..`max`, disabled, or an end before the start). Screen readers also hear that it wasn't accepted (`inputNotAccepted`). |
| `min`, `max` | `Date` | | Days outside can't be either end. |
| `isDateDisabled` | `(date: Date) => boolean` | | Days that can't be an end. They can sit inside a range. |
| `months` | `1 \| 2` | `2` | Months side by side in the popup (stacked below 640px). |
| `locale`, `weekStartsOn` | | the browser's | As in DatePicker. The calendars carry `lang` when it differs from the provider's; the two fields keep the page's, as their names do. |
| `size`, `invalid`, `disabled`, `readOnly` | | | Like Input. |
| `required` | `boolean` | `false` | Both fields are required (and `aria-required`), so a form won't submit until each end has a date. Field's `required` sets `aria-required` on both. |
| `id` | `string` | | The start field's id, so Field or `<label htmlFor>` focuses it. |
| `startLabel`, `endLabel` | `string` | `"Start date"`, `"End date"` | The fields' names. |
| `startName`, `endName` | `string` | | Hidden inputs that send each end as `yyyy-mm-dd`. |
| `form` | `string` | | The id of a form it sits outside of: both fields and both hidden inputs belong to that form, and reset with it. |
| `buttonLabel` | `string` | `"Choose dates"` | The calendar button's name, and the popup's. |

`className`, `ref`, `aria-label` and other props go to the box (`role="group"`); `aria-describedby` and `aria-required` (which Field passes) go to both fields. Its `focus()` and `autoFocus` move focus to the start field, so a form library that focuses the first invalid field after a failed submit lands on it.

## Component tokens

Each is an optional override: set it on the page, a container or one picker. The list lives in `src/components/DateRangePicker/date-range-picker.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--date-range-picker-dash` | `text-muted` | The dash between the two fields. |
| `--date-range-picker-status-color` | `text-muted` | "Choose the start date" under the months (4.5:1 on surface). |
| `--date-range-picker-months-gap` | `spacing-6` | Space between the two months (24px). |
| `--date-range-picker-field-width` | `spacing-24` | Each field's width (96px), enough for a full date. |

It uses Input's box, DatePicker's button and popup (`--date-picker-*` tokens), and Calendar's days (`--calendar-*`, with `--calendar-range-bg` and `--calendar-range-color` for the days between).
