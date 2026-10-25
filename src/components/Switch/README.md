# Switch

An on/off setting that takes effect at once. It's a native checkbox with `role="switch"`, so screen readers announce "on" and "off", drawn as a track (the input, `appearance: none`) and a thumb that slides along it. The track sits centered on the label's first line (each size's track is as tall as its line), and a click anywhere on the label flips it.

```jsx
const { Switch } = window.Serupa;

<Switch checked={wifi} onChange={(e) => setWifi(e.target.checked)}>Wi-Fi</Switch>

<Switch defaultChecked description="Pause notifications from 10 pm to 7 am.">Quiet hours</Switch>

// a settings list: the label first, the switch at the end of the row
<Switch labelPosition="start" className="w-full justify-between">Autoplay videos</Switch>

// no visible label
<Switch aria-label="Enable rule" />
```

## When to use

- A setting that applies right away, like turning on Wi-Fi.
- A list of settings, each turned on or off on its own row.

## When not to use

- If the change waits for a Save button, use a [Checkbox](../Checkbox/README.md).
- An on/off button in a toolbar, such as bold: use [ToggleButton](../ToggleButton/README.md).

## Usage

- Label the setting, not the state: "Wi-Fi", not "Turn Wi-Fi on". The switch shows on or off.
- Don't change the label with the state, and don't add "On" and "Off" text beside it.
- In a settings list, put the label first and the switch at the end of the row.

## States

| State | Look |
| --- | --- |
| Off | A `field-border` track, the thumb in `field` at the start |
| On | A `primary` track, the thumb in `on-primary` at the end |
| Hover | `field-border-hover` off, `primary-hover` on |
| Focus | From the keyboard: a 2px `focus-ring` outline 2px out (`focus-ring-width`, `focus-ring-offset`), like Button. The gap is transparent, so it reads on any background, and forced-colors mode draws it too |
| Invalid | A `danger` track while off, and a `danger` focus ring |
| Read-only | Looks as it is, with a default cursor and no hover change |
| Disabled | 50% opacity and a `not-allowed` cursor; also inside a disabled fieldset |

The thumb slides in 150ms (`duration-150`, `ease-in-out`) and jumps with `prefers-reduced-motion`. It follows the text direction: in right-to-left pages it starts on the right.

## Accessibility

- A press anywhere within 24px of the row counts (WCAG 2.5.8): when the row is shorter, its hit area reaches past what is drawn, so nothing moves.
- A native checkbox with `role="switch"`: Space flips it, forms submit it (as a checkbox), and screen readers say "on" or "off".
- The label names it; a description is read after it. The thumb is decorative.
- `readOnly` keeps it focusable and read out with `aria-readonly`, but a click or Space doesn't flip it, and `onChange` doesn't run (your `onClick` does). The browser's own `readonly` does nothing on a checkbox, so Switch cancels the click. An on read-only switch is still submitted, which `disabled` isn't.
- In forced-colors mode the track gets a border and the thumb and on track use system colors.
- The label and description keep 4.5:1; the tracks on the page, each thumb on its track (at rest and on hover) and the focus ring 3:1, in all six themes (`Switch.test.tsx`).

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To the switch |
| Space | Turn it on or off |

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `children` | node | | The label. Without one, give the switch an `aria-label` |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | A 28×16px track and 12px thumb with `text-xs`; 36×20 and 16 with `text-sm`; 44×24 and 20 with `text-base` |
| `description` | node | | A muted second line under the label, linked with `aria-describedby` (and kept out of the name) |
| `labelPosition` | `'end'` \| `'start'` | `'end'` | The label after the track, or before it as in a settings list |
| `invalid` | boolean | `false` | A 2px danger edge on the track (on or off), a danger focus ring, and `aria-invalid` |
| `readOnly` | boolean | `false` | Focusable and read out (`aria-readonly`), but clicks and Space don't flip it; an on switch is still submitted |

Everything else (`checked`, `defaultChecked`, `onChange`, `name`, `value`, `disabled`, `id`, `aria-*`) and `ref` go to the `<input type="checkbox" role="switch">` (`type` and `role` can't be changed). `className` and `style` go to the `<label>` around it, which has `data-component="switch"` and `data-size`.

## Component tokens

Each is an optional override: set it on the page, a container or one switch. The list lives in `src/components/Switch/switch.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--switch-track` | `field-border` | The track while off |
| `--switch-track-hover` | `field-border-hover` | The track while off, on hover |
| `--switch-track-checked` | `primary` | The track while on |
| `--switch-track-checked-hover` | `primary-hover` | The track while on, on hover |
| `--switch-thumb` | `field` | The thumb while off |
| `--switch-thumb-checked` | `on-primary` | The thumb while on |
| `--switch-label-color` | `text` | The label |
| `--switch-description-color` | `text-muted` | The description |
| `--switch-focus-ring` | `focus-ring` | The focus ring |
| `--switch-invalid` | `danger` | The track's edge and the focus ring, when invalid |
| `--switch-width-sm` / `-md` / `-lg` | `spacing-7` / `spacing-9` / `spacing-11` | Track widths (28, 36, 44px) |
| `--switch-height-sm` / `-md` / `-lg` | `spacing-4` / `spacing-5` / `spacing-6` | Track heights (16, 20, 24px) |
| `--switch-thumb-size-sm` / `-md` / `-lg` | `spacing-3` / `spacing-4` / `spacing-5` | Thumb sizes (12, 16, 20px) |
| `--switch-padding` | `spacing-0.5` | Thumb to the track's ends (2px) |
| `--switch-gap` | `spacing-2` | Track to label (8px) |
