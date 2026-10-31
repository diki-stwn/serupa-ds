# SegmentedControl

Picks one of a few options shown side by side, such as a view (List, Board) or a period (Day, Week, Month). It's a radio group drawn as segments, with the selection sliding between them.

```tsx
import { SegmentedControl } from "serupa-ds";

<SegmentedControl aria-label="Period" defaultValue="week"
  options={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }]} />

<SegmentedControl aria-label="View" value={view} onValueChange={setView}
  options={[{ value: "list", icon: "list", label: "List" }, { value: "board", icon: "view_kanban", label: "Board" }]} />

<SegmentedControl aria-label="Text alignment" size="sm" options={[
  { value: "left", icon: "format_align_left", "aria-label": "Left" },
  { value: "center", icon: "format_align_center", "aria-label": "Center" },
]} />
```

## When to use

- Switching how the same content is shown, such as List and Board.
- One choice from 2 to about 5 short options that applies right away, such as Day, Week, Month.

## When not to use

- Switching panels of content: use [Tabs](../Tabs/README.md).
- Independent on/off buttons: use [ButtonGroup](../ButtonGroup/README.md) with [ToggleButton](../ToggleButton/README.md).
- More than about five options: use [RadioGroup](../Radio/README.md) or [Select](../Select/README.md).

## Usage

- Keep labels to one or two words, so the segments stay short and even.
- When the segments don't all fit, they share the width by content: short labels stay whole and a long one ends in an ellipsis, with its full label as its title on hover. That title isn't there for touch or the keyboard, so keep labels short enough to fit the narrowest screen, or use a [Select](../Select/README.md).
- Give an icon-only segment an `aria-label`, and use icons alone only when they're widely understood.
- Icon-only segments are at least 24px wide, so even in `sm` their centers are 24px apart, which meets WCAG 2.2's target size (2.5.8).
- Use `fullWidth` in narrow spaces such as a panel or a phone layout, and match the `size` to the controls beside it.

## Accessibility

- Every option takes a press over at least 24px of height (WCAG 2.5.8), also at `size="sm"`, where options are drawn 18px tall, without taking more room. On a touch screen it's 44px high, as Apple and Material ask (the width stays, so segments never overlap).
- `role="radiogroup"` with `role="radio"` segments and `aria-checked`.
- In a [Field](../Field/README.md), the label names the radiogroup through `aria-labelledby`, and the hint and error describe it. Its own `aria-label` or `aria-labelledby` wins.
- The outline keeps 3:1 on the page, and labels 4.5:1, in all six themes (`SegmentedControl.test.tsx`). The selected segment changes three ways (a raised surface, an outline and a darker label), so it doesn't rely on one color. In forced colors (Windows high contrast) the selection is Highlight and its label HighlightText, exactly as set, so the browser's text backplate can't hide the label, and hovering the selected segment keeps it HighlightText.
- `invalid` sets `aria-invalid` on the group and turns its outline danger (3:1 on the page in all six themes); `required` sets `aria-required`. Put the reason in text next to it: inside a [Field](../Field/README.md), its `error` and `required` do all of this.
- `readOnly` sets `aria-readonly`. Segments stay focusable and the arrow keys move focus between them, so people can hear every option, but neither a click nor a key changes the selection. With `name`, the value is still sent with the form, which `disabled` doesn't do.
- The selection slides over 200ms, and jumps with `prefers-reduced-motion`.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To the selected segment: the control is one Tab stop |
| Right / Down | The next segment, selecting it (Left and Right swap in right-to-left pages), skipping disabled ones and wrapping |
| Left / Up | The previous segment, the same way |
| Home / End | The first or last segment |

Your `onKeyDown` runs before the control's own keys, so `e.preventDefault()` in it overrides one. `onFocus` and `onBlur` fire when focus enters or leaves the control, not as the arrow keys move between segments, so a form library's "touched on blur" waits until people leave it.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div role="radiogroup">`. A `<label htmlFor>` can't name it; inside a Field, the Field's label names it through this id. |
| `options` | `{ value, label?, icon?, 'aria-label'?, disabled? }[]` | | The segments, in order. An icon-only segment needs `aria-label`. |
| `value` | `V` | | Controlled. `V` is the segments' values, a `string` by default: it's inferred from `options`, or given as `SegmentedControl<'list' \| 'board'>`, so `onValueChange` gets that union; given, a value outside it is a type error. |
| `defaultValue` | `V` | the first enabled option | Uncontrolled. |
| `onValueChange` | `(value: V) => void` | | When a different segment is chosen. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 24, 32 or 44px tall, like the control heights, so it lines up with an Input, Select or Button of the same size. |
| `fullWidth` | `boolean` | `false` | Fills its container with equal segments. |
| `disabled` | `boolean` | `false` | |
| `invalid` | `boolean` | `false` | A danger outline and `aria-invalid`. Field's `error` sets it. |
| `required` | `boolean` | `false` | `aria-required` on the group. Field's `required` sets it. |
| `readOnly` | `boolean` | `false` | Focusable and read out, but the selection doesn't change; the value is still submitted. |
| `name` | `string` | | Sends the value with a form, in a hidden input. |
| `form` | `string` | | The id of a form it sits outside of: its hidden input submits, and resets, with that form. |

Name it with `aria-label` or `aria-labelledby`. `className`, `ref` and other props go to the root `<div>`. Its `focus()` and `autoFocus` move focus to the selected segment, or else the first one that isn't disabled, so a form library that focuses the first invalid field after a failed submit lands on it.

## Component tokens

Each is an optional override: set it on the page, a container or one control. The list lives in `src/components/SegmentedControl/segmented-control.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--segmented-control-bg` | `surface-muted` | The control's background. |
| `--segmented-control-border` | `field-border` | The control's outline (3:1 on the surface, so it can be seen). |
| `--segmented-control-indicator` | `surface` | The selected segment's background. |
| `--segmented-control-indicator-border` | `field-border` | The selected segment's outline. |
| `--segmented-control-text` | `text-muted` | The other segments' labels (4.5:1 on bg). |
| `--segmented-control-text-selected` | `text` | The selected segment's label. |
| `--segmented-control-text-hover` | `text` | A segment's label on hover. |
| `--segmented-control-focus-ring` | `focus-ring` | A segment's keyboard focus ring. |
| `--segmented-control-invalid` | `danger` | The outline when invalid (3:1 on the surface). |
| `--segmented-control-indicator-shadow` | `shadow-sm` | The selected segment's shadow. |
| `--segmented-control-radius` | `rounded-md` | The control's corners (6px). |
| `--segmented-control-indicator-radius` | `rounded-sm` | The selected segment's corners (4px). |
| `--segmented-control-height-sm` | `control-height-sm` | size="sm" (24px). |
| `--segmented-control-height-md` | `control-height-md` | size="md", the default (32px). |
| `--segmented-control-height-lg` | `control-height-lg` | size="lg" (44px). |
| `--segmented-control-padding` | `spacing-0_5` | Space between the outline and the segments (2px). |
| `--segmented-control-padding-x` | `spacing-3` | Space on each side of a segment's label (12px). |
| `--segmented-control-padding-x-lg` | `spacing-4` | Space on each side of a segment's label, size="lg" (16px). |
| `--segmented-control-gap` | `spacing-1_5` | Space between a segment's icon and label (6px). |
| `--segmented-control-weight` | `font-medium` | The labels' weight (500). |
| `--segmented-control-duration` | `motion-change-md` | How long the selection takes to slide to a new segment. |
| `--segmented-control-press-scale` | `scale-95` | Size of a segment's label while it's held down (95%). 1 turns it off. |
