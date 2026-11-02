# Slider

Picks a number, or a range with two thumbs, by dragging along a track or with the keyboard. Use it when the exact number matters less than its place in a range (volume, a price filter); for exact numbers, use NumberInput, or pair the two.

```tsx
import { Slider } from "serupa-ds";

<Slider aria-label="Volume" defaultValue={50} />

const [price, setPrice] = React.useState<[number, number]>([20, 80]);
<Slider aria-label="Price" value={price} onValueChange={setPrice} max={200} step={5} formatValue={(v) => `$${v}`} />
```

## When to use

- A value where its place in a range matters more than the exact number: volume, brightness, a zoom level.
- A range with two ends, such as a price filter (pass a pair as the value).

## When not to use

- An exact number people type, such as a quantity: use [NumberInput](../NumberInput/README.md), or pair the two.
- A few named options, such as Small, Medium, Large: use [SegmentedControl](../SegmentedControl/README.md) or [radios](../Radio/README.md).

## Anatomy

Drawn from the `Marks` story.

1. **Track** (`.dk-slider__track`): the whole range.
2. **Fill** (`.dk-slider__fill`): the part up to the value.
3. **Thumb** (`.dk-slider__thumb`): drag it, or focus it and use the arrow keys, to set the value.
4. **Mark** (`.dk-slider__mark-label`): a named value along the track.
5. **Value** (`.dk-slider__value`): the value, in words or numbers.

## Usage

- Show a visible label next to it and point `aria-labelledby` at it, or use `aria-label`.
- Use `formatValue` whenever the number has a unit or a currency, so screen readers hear "$40", not "40".
- Update what's on screen in `onValueChange`, and save or fetch in `onValueCommit`, which runs once per change.
- Set `step` to the precision people need, so values snap to sensible numbers.
- Use `marks` when a few values matter, such as `[{ value: 0, label: "Off" }, { value: 100, label: "Max" }]`, or `marks` alone for a tick per step on a short scale. Keep the labels short; they sit on one line under the track.
- Use `showValue` when people need to see the number while they drag, and there is no label nearby that shows it.

## Behavior

- A press anywhere on the track moves the nearest thumb there, and dragging follows the pointer even off the slider.
- Range thumbs can't cross.
- The thumb grows a little while pressed; it doesn't with `prefers-reduced-motion`.
- `marks` draws a tick for each mark between the ends, and its label centered under it. With labels, the slider is taller by one line of small text, so nothing overlaps what follows. `true` draws a mark per step, or one per `largeStep` steps past 100 marks. Marks off the track are left out. A press on a label moves the nearest thumb there.
- `showValue` shows the value, as `formatValue` writes it (without one, the number in the locale's digits: "٤٠" in `ar-EG`), in a small chip over a thumb while it's focused, hovered or dragged. The chip floats and takes no room, so leave space above the slider. Near an end, the chip and the end mark labels move inward, so they stay inside the slider's box.

## Accessibility

- The slider takes a press over at least 24px of height (WCAG 2.5.8), past the 20px thumb, without taking more room, and 44px on a touch screen, as Apple and Material ask.
- Each thumb is `role="slider"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-orientation`. A range's thumbs limit each other, and the pair is a named `group`.
- The track, the fill and the thumb's ring keep 3:1 on the page in all six themes, so the control can be seen (`Slider.test.tsx`). In forced-colors mode it uses system colors.
- In a [Field](../Field/README.md), the label names the thumb (a range's group) through `aria-labelledby`, and the hint and error describe it. Its own `aria-label` or `aria-labelledby` wins.
- `invalid` sets `aria-invalid` on each thumb and turns the fill and the thumb's ring danger (3:1 on the page in all six themes). Color alone doesn't say what's wrong, so put the reason in text next to it: inside a [Field](../Field/README.md), its `error` does both.
- `readOnly` keeps the thumbs in the Tab order with `aria-readonly`, so people can still hear the value, but keys and presses don't change it. With `name`, the value is still sent with the form, which `disabled` doesn't do.
- A slider always has a value, so `required` has nothing to check. It's accepted, so Field's `required` doesn't reach the DOM, and has no effect.
- Marks and the value chip are `aria-hidden`. The thumb's `aria-valuetext` already says the value, and mark labels would be read as stray text. Mark labels keep 4.5:1 on the page, and the chip's text 4.5:1 on the chip, in all six themes (`Slider.test.tsx`).
- `disabled`, or a disabled `<fieldset>` around it, takes the thumbs out of the Tab order, sets `aria-disabled` and ignores keys and presses, as native inputs do.

### Keyboard

| Key | Does |
| --- | --- |
| ArrowRight, ArrowUp | + `step` (ArrowLeft raises it in right-to-left pages) |
| ArrowLeft, ArrowDown | − `step` |
| Shift+Arrow, PageUp, PageDown | ± `largeStep` steps |
| Home, End | The ends; a range thumb stops at the other thumb |

Your `onKeyDown` runs before the slider's own keys, so `e.preventDefault()` in it overrides one. `onFocus` and `onBlur` fire when focus enters or leaves the slider, not as it moves between a range's two thumbs, so a form library's "touched on blur" waits until people leave the whole control.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div>`. A `<label htmlFor>` can't name it; inside a Field, the Field's label names it through this id. |
| `value` | `number \| [number, number]` | | Controlled. A pair makes a range with two thumbs. |
| `defaultValue` | `number \| [number, number]` | `min` | Uncontrolled. |
| `onValueChange` | `(value) => void` | | As it moves. |
| `onValueCommit` | `(value) => void` | | Once when a drag ends or a key press changes it: for saving or fetching. |
| `min`, `max` | `number` | `0`, `100` | |
| `step` | `number` | `1` | Values snap to it. |
| `largeStep` | `number` | `10` | Steps moved by PageUp, PageDown and Shift with an arrow. |
| `size` | `'sm' \| 'md'` | `'md'` | 4px track and 16px thumb, or 6px and 20px. |
| `disabled` | `boolean` | `false` | |
| `invalid` | `boolean` | `false` | A danger fill and ring, and `aria-invalid` on the thumbs. Field's `error` sets it. |
| `readOnly` | `boolean` | `false` | Focusable and read out, but it doesn't move; the value is still submitted. |
| `formatValue` | `(value: number) => string` | | The words read out for a value (`aria-valuetext`), such as "$40". |
| `thumbLabels` | `[string, string]` | `['Minimum', 'Maximum']` | A range's thumb names. By default the `sliderMinimum` and `sliderMaximum` labels ("Minimum", "Maksimum" in `idLabels`). |
| `marks` | `boolean \| { value: number; label?: ReactNode }[]` | | Ticks on the track: `true` for every step, or the listed values with text under them. Visual only. |
| `showValue` | `boolean` | `false` | The value over the thumb while it's focused, hovered or dragged. Visual only. |
| `name` | `string` | | Adds hidden inputs (two for a range) so the value is sent with a form. |
| `form` | `string` | | The id of a form it sits outside of: its hidden inputs submit, and reset, with that form. |
| `required` | `boolean` | | Accepted so Field's `required` doesn't reach the page. A slider always has a value, so it has no effect. |

Name a single slider with `aria-label` or `aria-labelledby`; on a range they name the group. `className`, `ref` and other props go to the root `<div>`. Its `focus()` and `autoFocus` move focus to the first thumb (none when disabled), so a form library that focuses the first invalid field after a failed submit lands on the slider.

## Component tokens

Each is an optional override: set it on the page, a container or one slider. The list lives in `src/components/Slider/slider.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from slider.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--slider-track` | `field-border` | The track (3:1 on the surface, so the control can be seen). |
| `--slider-fill` | `primary` | The selected part of the track. |
| `--slider-thumb-bg` | `field` | The thumb's inside. |
| `--slider-thumb-border` | `primary` | The thumb's ring (3:1 on the surface). |
| `--slider-focus-ring` | `focus-ring` | The thumb's keyboard focus ring. |
| `--slider-invalid` | `danger` | The fill and the thumb's ring when invalid. |
| `--slider-mark` | `field` | The marks' ticks, cut into the track. |
| `--slider-mark-label` | `text-muted` | The marks' text under the track (4.5:1 on the surface). |
| `--slider-value-bg` | `surface-inverse` | showValue's chip over the thumb. |
| `--slider-value-text` | `text-inverse` | showValue's text (4.5:1 on value-bg). |
| `--slider-track-height-sm` | `spacing-1` | The track's thickness, size="sm" (4px). |
| `--slider-track-height-md` | `spacing-1.5` | The track's thickness, size="md", the default (6px). |
| `--slider-thumb-size-sm` | `spacing-4` | The thumb, size="sm" (16px). |
| `--slider-thumb-size-md` | `spacing-5` | The thumb, size="md" (20px). |
| `--slider-thumb-border-width` | `border-width-2` | The thumb's ring (2px). |
| `--slider-radius` | `rounded-full` | The track's ends and the thumb. |
| `--slider-thumb-shadow` | `shadow-sm` | The thumb's shadow. |
<!-- token-table:end -->
