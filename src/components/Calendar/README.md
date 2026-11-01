# Calendar

A month of days to pick one from, with full keyboard navigation. DatePicker shows one in a popup; use Calendar on its own for an always-visible picker, such as in a booking page or a side panel.

```tsx
import { Calendar } from "serupa-ds";

const [day, setDay] = React.useState<Date | null>(null);
<Calendar value={day} onValueChange={setDay} min={new Date()} />
<Calendar defaultValue={new Date(2025, 2, 10)} isDateDisabled={(d) => d.getDay() === 0 || d.getDay() === 6} />
```

## When to use

- Picking a day is the main task on the page or panel, such as choosing a booking day.
- People should see which days are free or blocked before they choose.
- There's room to keep the month on screen while people look at other details beside it.

## When not to use

- A date field in a form: use [DatePicker](../DatePicker/README.md), which opens a Calendar only when needed.
- A start and an end date: use [DateRangePicker](../DateRangePicker/README.md); Calendar picks one day.
- A date people know by heart, such as a date of birth: use an [Input](../Input/README.md) with a format hint.

## Anatomy

Drawn from the `MonthYearPicker` story.

1. **Header** (`.dk-calendar__header`): the month shown and the ways to change it.
2. **Month and year** (`.dk-calendar__menus`): menus to jump to another month or year.
3. **Previous and next** (`.dk-calendar__nav`): move one month back or forward.
4. **Grid** (`.dk-calendar__grid`): the days of the month in weeks, with the weekday names above.
5. **Selected day** (`.dk-calendar__day--selected`): the chosen date.
6. **Day of another month** (`.dk-calendar__day--outside`): days before and after the month, to fill the weeks.

## Usage

- Put a heading or a line of text near it saying what the day is for ("Pick a delivery day"): the grid is named by its month title only.
- Block days with `min`, `max` and `isDateDisabled` so people see them before they pick, rather than refusing a day afterwards.
- Set `autoFocus` only when the Calendar appears because people asked for it, such as in a panel they just opened.
- Leave `locale` and `weekStartsOn` unset in most products so names and the first day follow the visitor's browser.
- The weekday headers use the locale's short names, or its one-letter names where the short name is the full word or two words (Arabic, Persian, Hebrew, Vietnamese), so they fit their 32px columns. Screen readers always hear the full name.

## Behavior

- Always six weeks tall, so the layout doesn't jump between months. Days of the months before and after are muted and can be picked.
- Today is in primary and semibold. The selected day is filled in primary.
- With `monthYearPicker`, the header shows a Month and a Year menu in place of the title, so people can jump years at once (a date of birth, an expiry). Years run from `min` to `max`, or from 100 years back to 10 ahead when unset; months outside `min` and `max` are disabled. Off by default.
- Today follows the clock: a calendar left open past midnight moves today to the new day without needing a re-render.

## Accessibility

- A `role="grid"` table named by the month title, which is `aria-live` so screen readers hear the new month. The days have one Tab stop.
- Each day is named by its full date ("Monday, March 10, 2025"). The selected cell is `aria-selected`, today is `aria-current="date"`, and refused days are `aria-disabled` (faded and struck through).
- Weekday headers show the short name, and screen readers read the full one ("Monday", from visually hidden text, and in `abbr`), since "Mon" or "M" is read letter by letter or not at all by some.
- Text keeps 4.5:1 and the selected fill 3:1 in all six themes (`Calendar.test.tsx`).
- In forced colors (Windows high contrast) the selected day is drawn in Highlight with HighlightText, exactly as set, so the browser's text backplate can't hide its number. The same goes for DatePicker's and DateRangePicker's pop-ups.

### Keyboard

| Key | Moves to |
| --- | --- |
| ← → | The day before or after (mirrored right to left). |
| ↑ ↓ | The same day a week before or after. |
| Home, End | The start or end of the week. |
| PageUp, PageDown | The same day a month before or after. With Shift, a year. |
| Enter, Space | Picks the focused day. |

Moving past the shown month shows the next one. No key moves focus past `min` or `max`: a move that would, stops on that day.

A month arrow that reaches the month holding `min` or `max` turns disabled, so focus moves to the other arrow instead of falling back to the top of the page. DatePicker and DateRangePicker do the same.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div>`. |
| `value` / `defaultValue` | `Date \| string \| null` | | The selected day, controlled or not: a Date (its time is ignored) or a plain `"yyyy-mm-dd"` string for that local day. |
| `onValueChange` | `(date: Date, iso: string) => void` | | Called with the picked day (local midnight) and the same day as `"yyyy-mm-dd"`. |
| `month` / `defaultMonth` | `Date` | the selected day's month, or today's | The month shown: any day in it. |
| `onMonthChange` | `(month: Date) => void` | | Called with the first of the newly shown month. |
| `min`, `max` | `Date \| string` | | Days outside can't be picked, and the month buttons stop there. A Date or `"yyyy-mm-dd"`. |
| `monthYearPicker` | `boolean` | `false` | Shows native Month and Year menus in the header instead of the title. The title stays for screen readers and still names the grid. |
| `isDateDisabled` | `(date: Date) => boolean` | | Days to refuse, such as weekends or holidays. |
| `locale` | `string` | the nearest `SerupaProvider`'s, else the browser's (en-US until a server-rendered page hydrates) | Month and weekday names, and the first day of the week. When it differs from the provider's, the month title and the grid carry `lang`, so screen readers read the names in that language; the nav buttons keep the page's. |
| `weekStartsOn` | `0`–`6` | the locale's | 0 is Sunday. |
| `autoFocus` | `boolean` | `false` | Focus the selected day (or today) when it appears. |
| `previousLabel`, `nextLabel` | `string` | `"Previous month"`, `"Next month"` | The month buttons' names. |

`className`, `ref` and other props go to the outer `<div>`.

## Component tokens

Each is an optional override: set it on the page, a container or one calendar. The list lives in `src/components/Calendar/calendar.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from calendar.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--calendar-title-color` | `text` | The month and year. |
| `--calendar-menu-border` | `field-border` | The Month and Year menus' border (`monthYearPicker`). |
| `--calendar-menu-bg` | `field` | The Month and Year menus' fill (`monthYearPicker`). |
| `--calendar-weekday-color` | `text-muted` | The weekday names (4.5:1 on surface). |
| `--calendar-day-color` | `text` | Days of the shown month. |
| `--calendar-outside-color` | `text-muted` | Days of the months before and after. |
| `--calendar-day-bg-hover` | `surface-muted` | A day under the pointer. |
| `--calendar-day-bg-pressed` | `pressed` | A day while it's pressed, one step past hover. |
| `--calendar-today-color` | `primary` | Today's number (4.5:1 on surface). |
| `--calendar-selected-bg` | `primary` | The selected day. |
| `--calendar-selected-color` | `on-primary` | Its number. |
| `--calendar-range-bg` | `primary-subtle` | Days between the start and end of a range (DateRangePicker). |
| `--calendar-range-color` | `text` | Their numbers (4.5:1 on range-bg). |
| `--calendar-focus-ring` | `focus-ring` | A day's keyboard focus ring. |
| `--calendar-day-size` | `control-height-md` | Each day's square (32px). |
| `--calendar-day-radius` | `rounded-md` | A day's corners (6px). |
| `--calendar-gap` | `spacing-2` | Space between the header and the days (8px). |
| `--calendar-title-weight` | `font-semibold` | The month and year (600). |
| `--calendar-today-weight` | `font-semibold` | Today's number (600). |
<!-- token-table:end -->
