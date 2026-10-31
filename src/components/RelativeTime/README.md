# RelativeTime

Says how long ago, or how far ahead, a moment is, in the reader's language: "3 minutes ago", "yesterday", "in 2 hours". It keeps itself up to date, and the exact date is its tooltip.

```tsx
import { RelativeTime } from "serupa-ds";

<p>Edited <RelativeTime date={doc.updatedAt} /></p>
<RelativeTime date="2026-10-24T09:30:00Z" format="short" />           // "3 hr. ago"
<RelativeTime date={due} numeric="always" />                          // "in 1 day" rather than "tomorrow"
<RelativeTime date={sentAt} titleFormat={{ dateStyle: "full" }} />
```

## When to use

- Recent activity, where "how long ago" matters more than the exact time: edits, comments, messages, last sign-in.
- Something coming up soon: "in 15 minutes".

## When not to use

- Dates people compare or act on, such as a due date in a table or a receipt: show the date itself.
- Times more than a few months away, where "last year" is too vague: show the date. RelativeTime does this itself after a week (`absoluteAfter`).

## Usage

- Pass `date` as a `Date`, a timestamp in ms or an ISO string. Strings without a time zone (`"2026-10-24 09:30"`) are read in the browser's time zone, so prefer ISO strings with `Z` or an offset.
- A day on its own, `"2026-10-24"` (a date column, `<input type="date">`), is that day on the reader's calendar and is counted in days or more: "today", "yesterday", "in 3 days". Its tooltip is the date alone, and its `datetime` the day itself.
- The words follow the locale from `SerupaProvider` (or the `locale` prop, or the browser's): "3 menit yang lalu" in Indonesian, "٣ ساعات" digits in Egyptian Arabic. `relativeTime(date, now, locale)` gives the same words outside React, however far (it doesn't switch to a date).
- Use `numeric="always"` where elapsed time matters more than the calendar, such as in logs.
- More than 7 days away, ago or ahead, it shows the date instead of words: "Oct 24, 2026" rather than "340 days ago". Set `absoluteAfter` to another number of days, or `false` to keep the words however far, and `absoluteFormat` to write the date another way.
- An invalid `date` shows nothing; in development it warns once in the console.

## Behavior

- Under 45 seconds it says "now", then minutes (under 45), hours (under 22), days (under 26), months (under 11) and years, rounded.
- Every RelativeTime on the page updates on one shared clock every 15 seconds, and at once when the tab comes back into view. The clock stops when none is mounted.
- Rendered on the server, it shows the server's words at the time of the request (one moment for every RelativeTime rendered in the same second), hydrates without a mismatch, and switches to the browser's clock straight after.

## Accessibility

- It's a `<time>` with a machine-readable `datetime`, read out as its words.
- The exact date is in `title`, which shows on hover but isn't reliably read out or reachable by keyboard. Where the exact time matters, show it as text too or wrap it in a [Tooltip](../Tooltip/README.md) on a focusable element.
- It doesn't announce its updates: a live region that changes every minute would be noise.
- **Keyboard:** none: inline text, not focusable.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<time>`. |
| `date` | `Date \| number \| string` | | The moment. An invalid date renders an empty `<time>`. |
| `format` | `'long' \| 'short' \| 'narrow'` | `'long'` | "3 minutes ago", "3 min. ago", "3m ago". |
| `numeric` | `'auto' \| 'always'` | `'auto'` | "yesterday" or "1 day ago". With `'auto'`, days, months and years are counted on the reader's calendar: 01:00 seen at 23:00 the same day is "22 hours ago", and the 1st seen on the 27th is "26 days ago", not "last month". `'always'` counts elapsed time. |
| `titleFormat` | `Intl.DateTimeFormatOptions \| false` | `{ dateStyle: 'long', timeStyle: 'short' }` | The tooltip's date; `false` leaves it out. Your own `title` wins. |
| `absoluteAfter` | `number \| false` | `7` | After this many days, ago or ahead, it shows the date instead of words. `false`: words however far. |
| `absoluteFormat` | `Intl.DateTimeFormatOptions` | `{ dateStyle: 'medium' }` | How that date is written. |
| `locale` | `string` | the provider's, else the browser's | When it differs from the provider's, the element carries `lang`, so screen readers read the words in that language. |
Every other prop, `className` and `ref` go to the `<time>`, which has `data-component="relative-time"`.

## Component tokens

None: it uses the surrounding text's font and color, with tabular digits.
