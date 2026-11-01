# Meter

Shows a measurement within a known range: storage used, a plan's seats, a password's strength, a battery level. Give it `low`, `high` and `optimum` and it colors itself by zone, as HTML's `<meter>` does: success in the best zone, warning in the next, danger in the worst. It isn't [Progress](../Progress/README.md), which shows how far along a task is.

```tsx
import { Meter } from "serupa-ds";

<Meter value={72} label="Storage" showValue />
// low values are good: up to 80% is fine, then warning, over 95% danger
<Meter value={92} low={80} high={95} optimum={0} label="Storage" showValue formatValue={(v) => `${v}%, almost full`} />
// high values are good: a battery
<Meter value={18} low={20} high={60} optimum={100} label="Battery" showValue />
<Meter value={7.2} max={10} label="Storage" showValue formatValue={(v, _, m) => `${v} of ${m} GB`} />
```

## When to use

- A level or amount within fixed limits: storage, a quota, seats, a score, a strength or a temperature.
- When the value is better or worse depending on where it falls, with `low`, `high` and `optimum`.

## When not to use

- How far along a task is (an upload, an import): use [Progress](../Progress/README.md) instead.
- A value people set themselves: use [Slider](../Slider/README.md) instead.
- A count with no maximum, such as unread messages: use a [Badge](../Badge/README.md) or text.

## Anatomy

Drawn from the `CustomValue` story.

1. **Label** (`.dk-meter__label`): what is measured.
2. **Value** (`.dk-meter__value`): the amount, in words or numbers.
3. **Track** (`.dk-meter__track`): the whole range.
4. **Fill** (`.dk-meter__fill`): how much of it is used, in the color of its zone (low, medium, high).

## Usage

- Give every meter a `label` that says what it measures ("Storage"), or an `aria-label`.
- Use `formatValue` when a percentage isn't the clearest words: "7.2 of 10 GB", "Strong".
- Color isn't enough on its own: when a zone matters, say it in the value or nearby text too ("92%, almost full").
- Pick `optimum` by what's good. Under `low`: low values are good (storage used, errors). Over `high`: high values are good (battery, a score). In between, or left out: the middle zone is good and both ends are less good (a temperature, a word count).
- The percentage follows the locale from `SerupaProvider` (or the browser), as Progress does: "72%", "%72" in Turkish, "72 %" in French.

## Zones

With `low` and `high` set, the zone (also in `data-state`) is worked out the way browsers do it for `<meter>`:

| `optimum` | Under `low` | `low` to `high` | Over `high` |
| --- | --- | --- | --- |
| under `low` | optimum (success) | suboptimal (warning) | poor (danger) |
| over `high` | poor (danger) | suboptimal (warning) | optimum (success) |
| in between, or left out | suboptimal (warning) | optimum (success) | suboptimal (warning) |

Without `low` and `high` the bar is primary and `data-state` is `none`. `meterState(value, min, max, low, high, optimum)` returns the same zone, for text that goes with it.

## Behavior

- The value is clamped between `min` and `max`, and the fill moves to a new value over 300ms (at once with `prefers-reduced-motion`).

## Accessibility

- `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-valuetext` (the shown value). It's named by its `label`.
- Outside the best zone, the value also says where it falls, shown with `showValue` and read out, so the warning the color gives is seen and heard in words too (WCAG 1.4.1): "92%, high", "12%, low" or "45%, medium". The words come from the `meterZone` label in `SerupaProvider`. With `formatValue`, your words are read as they are, so say the zone in them.
- Every zone's fill keeps 3:1 on the page, and the label and value 4.5:1, in all six themes (`Meter.test.tsx`). In forced-colors mode the track gets a border and the fill uses Highlight.
- **Keyboard:** none: it shows a value and isn't focusable. Use a Slider for a value people set.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div>`. |
| `value` | `number` | | Between `min` and `max`, clamped. |
| `min` | `number` | `0` | The lowest possible value. |
| `max` | `number` | `100` | The highest possible value. |
| `low` | `number` | | Values under it are low. |
| `high` | `number` | | Values over it are high. |
| `optimum` | `number` | the middle | The best value; it decides which zone is good (see Zones). |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | The bar is 4, 8 or 12px thick. |
| `label` | `ReactNode` | | A visible name above the bar. Otherwise pass `aria-label`. |
| `showValue` | `boolean` | `false` | The value at the end of the label row, in the read-out's words. |
| `formatValue` | `(value, min, max) => string` | the share, as the locale writes a percentage | The value's words, shown and read out. Without it, the value adds the zone outside the best one. |

Every other prop, `className` and `ref` go to the outer `<div>`. It has `data-component="meter"`, `data-size` and `data-state` (`optimum`, `suboptimal`, `poor` or `none`).

## Component tokens

Each is an optional override: set it on the page, a container or one meter. The list lives in `src/components/Meter/meter.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from meter.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--meter-track` | `secondary` | The empty part of the bar. |
| `--meter-fill` | `primary` | The filled part, without low and high zones (3:1 on the track and the surface). |
| `--meter-fill-optimum` | `success` | The filled part in the best zone. |
| `--meter-fill-suboptimal` | `warning` | The filled part in the next zone. |
| `--meter-fill-poor` | `danger` | The filled part in the worst zone. |
| `--meter-label-color` | `text` | The label. |
| `--meter-value-color` | `text-muted` | The value at the end of the label row (4.5:1). |
| `--meter-height-sm` | `spacing-1` | The bar's thickness, size sm (4px). |
| `--meter-height-md` | `spacing-2` | The bar's thickness, size md (8px, the default). |
| `--meter-height-lg` | `spacing-3` | The bar's thickness, size lg (12px). |
| `--meter-radius` | `rounded-full` | The bar's ends. |
| `--meter-gap` | `spacing-1.5` | Space between the label row and the bar (6px). |
| `--meter-label-weight` | `font-medium` | The label's weight. |
| `--meter-duration` | `motion-change-lg` | How long the fill takes to move to a new value. |
<!-- token-table:end -->
