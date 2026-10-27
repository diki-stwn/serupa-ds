# ToggleGroup

A set of [ToggleButton](../ToggleButton/README.md)s that share one value: one on at a time, such as text alignment or a view mode, or any number, such as bold, italic and underline. It looks like a [ButtonGroup](../ButtonGroup/README.md) and reports the buttons that are on as one array.

```tsx
import { ToggleGroup, ToggleButton } from "serupa-ds";

// one at a time
<ToggleGroup aria-label="Text alignment" value={align} onValueChange={setAlign} required>
  <ToggleButton value="left" icon="format_align_left" aria-label="Align left" />
  <ToggleButton value="center" icon="format_align_center" aria-label="Align center" />
  <ToggleButton value="right" icon="format_align_right" aria-label="Align right" />
</ToggleGroup>

// any number
<ToggleGroup aria-label="Text style" type="multiple" defaultValue={["bold"]}>
  <ToggleButton value="bold" icon="format_bold" aria-label="Bold" />
  <ToggleButton value="italic" icon="format_italic" aria-label="Italic" />
</ToggleGroup>
```

## When to use

- Settings in a toolbar that apply right away, where one is on at a time (alignment, a list or grid view) or several can be (text styles), and you want them as one value.

## When not to use

- One choice in a form, or one that changes what the page shows (Day, Week, Month as tabs of a view): use a [SegmentedControl](../SegmentedControl/README.md) or a [RadioGroup](../Radio/README.md), which are radios and read as a choice.
- One on/off setting: a [ToggleButton](../ToggleButton/README.md) alone, or a [Switch](../Switch/README.md) in a form.
- Actions that don't stay on (Copy, Paste): a [ButtonGroup](../ButtonGroup/README.md) of Buttons.

## Usage

- Give each ToggleButton a `value`. Children without one, such as a Divider, render as they are.
- `type="single"` (the default) turns the others off when one turns on. Pressing the one that's on turns it off, unless `required`.
- `size`, `variant` and `disabled` on the group reach the buttons that don't set their own.
- `attached` and `orientation` work as on ButtonGroup: an attached row wider than its container wraps as separate toggles (with `data-wrapped` on the group) and joins again once there's room.
- Put it in a [Toolbar](../Toolbar/README.md) to give a row of groups one Tab stop with arrow keys.

## Accessibility

- **Role and name:** a `role="group"`. Name it with `aria-label` ("Text alignment"). Each button keeps `aria-pressed`, so screen readers say "Align left, toggle button, pressed".
- **Keyboard:** nothing of its own. Each button is a Tab stop, and Enter or Space presses it, as in a ButtonGroup. Inside a Toolbar, the arrow keys move between the buttons.
- **Contrast:** each button keeps ToggleButton's colors, which read 4.5:1 on and off in all six themes (see [ToggleButton](../ToggleButton/README.md)). The group adds none.
- **What's still yours:** a name for the group and one for each icon-only button.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div role="group">`. |
| `type` | `'single'` \| `'multiple'` | `'single'` | One on at a time, or any number. |
| `value` | `string[]` | | The values of the buttons that are on (controlled). |
| `defaultValue` | `string[]` | `[]` | The values on at first. |
| `onValueChange` | `(value: string[]) => void` | | Called when a button is pressed. |
| `required` | boolean | `false` | With `type="single"`, one stays on. |
| `disabled` | boolean | `false` | Turns every button off and out of use. |
| `size` | `'sm'` \| `'md'` \| `'lg'` | | For buttons that don't set their own. |
| `variant` | `'outline'` \| `'ghost'` | | For buttons that don't set their own. |
| `attached` | boolean | `true` | Joins them, as ButtonGroup does. |
| `orientation` | `'horizontal'` \| `'vertical'` | `'horizontal'` | A row or a column. |
| `aria-label` | string | none | What the buttons are for. |

`className`, `style`, `ref` and other props go to the `<div>`, which has `data-component="toggle-group"`, `data-type` and `data-orientation`.

## Component tokens

None of its own: its spacing and borders are ButtonGroup's tokens (`--button-group-gap`, `--button-group-overlap`), and the buttons' colors are ToggleButton's.
