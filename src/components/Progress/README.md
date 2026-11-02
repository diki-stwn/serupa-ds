# Progress

Shows how far along a task is when you can tell: an upload, a setup, a quota. Use a bar in forms, cards and lists, and the ring where space is tight. When you can't tell how far along it is, leave `value` out, or use the lighter Loader.

```tsx
import { Progress } from "serupa-ds";

<Progress value={45} label="Uploading report.pdf" showValue />
<Progress value={3} max={8} label="Setup" showValue formatValue={(v, m) => `${v} of ${m} steps`} />
<Progress tone="warning" value={92} label="Storage" showValue />
<Progress variant="circle" value={30} showValue aria-label="Storage used" />
<Progress label="Preparing your export" />   // indeterminate
```

## When to use

- A task that takes a while and whose progress you can measure: an upload, an import, an export.
- How much of something is used: storage, a plan's quota, seats.
- How far people are through a set of steps, shown as a single value.

## When not to use

- A short wait you can't measure, such as content loading: use [Loader](../Loader/README.md) instead.
- Steps people move through, each with its own title: use [Stepper](../Stepper/README.md) instead.
- A value people set themselves: use [Slider](../Slider/README.md) instead.

## Anatomy

Drawn from the `AnnounceComplete` story.

1. **Label** (`.dk-progress__label`): what is in progress.
2. **Value** (`.dk-progress__value`): how far along, as a percentage.
3. **Track** (`.dk-progress__track`): the whole task.
4. **Fill** (`.dk-progress__fill`): the part done.

## Usage

- Give every bar a `label` that says what's in progress ("Uploading report.pdf"), or an `aria-label` for the ring.
- Use `formatValue` when a percentage isn't the clearest words: "3 of 8 steps", "4.6 of 5 GB".
- The percentage follows the locale from `SerupaProvider` (or the browser): "45%" in English, "%45" in Turkish,
  "45 %" in French, "٤٥٪" in Egyptian Arabic, the same digits Calendar uses for its days. A `formatValue` of your
  own should do the same, for example with `Intl.NumberFormat(locale)`.
- Keep `tone="primary"` for ordinary progress; switch to `warning` or `danger` when a quota is nearly full, and say so in the label or nearby text too.
- When the task finishes, replace the bar with the result or a confirmation, such as a [Toast](../Toast/README.md).

## Behavior

- The fill moves to a new value over 300ms.
- Indeterminate: a segment slides across the bar (right to left in right-to-left text, following the nearest `dir`), or a quarter arc turns. Both stand still with `prefers-reduced-motion`.

## Accessibility

- `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-valuetext`; an indeterminate one has no value. The bar is named by its `label`.
- Every tone's fill keeps 3:1 on the page, and the label and value 4.5:1, in all six themes (`Progress.test.tsx`). In forced-colors mode the bar's track gets a border and the fill uses Highlight; the ring's track is GrayText under a Highlight arc, so the arc stands apart from it in every high-contrast theme (a CanvasText track can sit too close to Highlight, as black and dark navy do).
- Value changes aren't read out on their own, since reading every step is noisy. `announceComplete` says when it's done, politely ("Upload: complete", from `labels.progressComplete`, or your own words); for milestones in between, use `announce()` or your own live region.
- **Keyboard:** none: it isn't focusable.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div>`. |
| `value` | `number \| null` | | From 0 to `max`, clamped. Leave it out for an indeterminate bar or ring. |
| `max` | `number` | `100` | The value that means done. |
| `variant` | `'bar' \| 'circle'` | `'bar'` | A full-width bar or a ring. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | The bar is 4, 8 or 12px thick; the ring is 24, 40 or 64px. |
| `tone` | `'primary' \| 'success' \| 'warning' \| 'danger'` | `'primary'` | The fill color. Say what the color means in text too. |
| `label` | `ReactNode` | | Bar only: a visible name above the bar. Otherwise pass `aria-label`. |
| `showValue` | `boolean` | `false` | The value at the end of the label row, or inside the ring (md and lg). |
| `formatValue` | `(value, max) => string` | the percentage, as the locale writes it | The value's words, shown and read out. |
| `announceComplete` | `boolean \| string` | `false` | Says it's done when the value reaches `max`: `true` for "Name: complete", or your own words. |
| `onComplete` | `() => void` | | Called each time the value reaches `max` (not when it starts there). |

Every other prop, `className` and `ref` go to the outer `<div>`. It has `data-component="progress"`, `data-variant`, `data-size`, `data-tone` and `data-state` (`loading`, `complete` or `indeterminate`).

## Component tokens

Each is an optional override: set it on the page, a container or one progress indicator. The list lives in `src/components/Progress/progress.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from progress.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--progress-track` | `secondary` | The empty part of the bar or ring. |
| `--progress-fill` | `primary` | The done part, tone="primary" (the default; 3:1 on the track and the surface). |
| `--progress-fill-success` | `success` | The done part, tone="success". |
| `--progress-fill-warning` | `warning` | The done part, tone="warning". |
| `--progress-fill-danger` | `danger` | The done part, tone="danger". |
| `--progress-label-color` | `text` | The label above the bar. |
| `--progress-value-color` | `text-muted` | The value (45%) next to the label or inside the ring (4.5:1 on surface). |
| `--progress-height-sm` | `spacing-1` | The bar's thickness, size="sm" (4px). |
| `--progress-height-md` | `spacing-2` | The bar's thickness, size="md", the default (8px). |
| `--progress-height-lg` | `spacing-3` | The bar's thickness, size="lg" (12px). |
| `--progress-circle-sm` | `spacing-6` | The ring, size="sm" (24px). |
| `--progress-circle-md` | `spacing-10` | The ring, size="md" (40px). |
| `--progress-circle-lg` | `spacing-16` | The ring, size="lg" (64px). |
| `--progress-radius` | `rounded-full` | The bar's ends. |
| `--progress-stroke-width` | `stroke-width-3` | The ring's thickness, in 24ths of its size (3: 3px at 24px). |
| `--progress-gap` | `spacing-1.5` | Space between the label row and the bar (6px). |
| `--progress-label-weight` | `font-medium` | The label's weight (500). |
| `--progress-duration` | `motion-change-lg` | How long the fill takes to move to a new value. |
<!-- token-table:end -->
