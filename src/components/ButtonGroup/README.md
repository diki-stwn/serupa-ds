# ButtonGroup

Related buttons side by side, or stacked: joined into one control with shared borders (the default), or spaced apart. Use it for two or three actions on the same thing (Copy, Paste), or a split button.

```jsx
const { ButtonGroup, Button, IconButton, ToggleButton } = window.Serupa;

<ButtonGroup aria-label="Clipboard">
  <Button variant="outline" leftIcon="content_copy">Copy</Button>
  <Button variant="outline" leftIcon="content_paste">Paste</Button>
</ButtonGroup>

<ButtonGroup attached={false}>
  <Button variant="outline">Cancel</Button>
  <Button>Save</Button>
</ButtonGroup>

<ButtonGroup orientation="vertical" aria-label="Zoom">
  <IconButton variant="outline" icon="add" label="Zoom in" />
  <IconButton variant="outline" icon="remove" label="Zoom out" />
</ButtonGroup>
```

## When to use

- A few actions on the same thing, such as Copy and Paste, that read as one control.
- A pair of buttons that belong together but stay apart, such as Cancel and Save in a footer (`attached={false}`).

## When not to use

- One choice out of a few options: use [SegmentedControl](../SegmentedControl/README.md), which lets only one be on.
- A set of [ToggleButton](../ToggleButton/README.md)s or tools, such as text formatting: use [Toolbar](../Toolbar/README.md), which is one Tab stop with arrow keys between its buttons.
- Many actions, or ones people rarely use: put them in a [Menu](../Menu/README.md).

## Usage

Size and variant stay on each button: give them all the same ones. Two attached primary buttons get an edge between them in their text color (`--button-group-divider`), as a split button has.

An attached row that's wider than its container wraps as separate, spaced buttons (with `data-wrapped` on the group), so a narrow screen never scrolls sideways and no label is cut; it joins again once there's room. This holds in a CSS grid column or a flex row too. A vertical group doesn't wrap.

A button can be a Menu's trigger or sit in a Tooltip, as in a split button (`<Menu trigger={<IconButton … />}>` last): the outer corners go to the first and last buttons, whatever popup follows them.

## Accessibility

- It's a `role="group"`: name it with `aria-label` when the buttons share a purpose ("Text formatting"), so screen readers announce it on the way in.
- A hovered, focused or pressed button comes to the front, so its border and focus ring are never hidden by its neighbor.
- Each button keeps its own colors and contrast; the group adds none.
- **Keyboard:** nothing of its own. Tab moves through its buttons one by one, as it would without the group.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div>`. |
| `attached` | boolean | `true` | Joins them: shared borders, only the outer corners rounded |
| `orientation` | `'horizontal'` \| `'vertical'` | `'horizontal'` | A row or a column |
| `aria-label` | string | none | What the group is for |

`className`, `style`, `ref` and everything else go to the wrapper, which has `role="group"`, `data-component="button-group"` and `data-orientation`.

## Component tokens

Each is an optional override: set it on the page, a container or one group. The list lives in `src/components/ButtonGroup/button-group.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from button-group.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--button-group-gap` | `spacing-2` | Space between buttons when not attached (8px). |
| `--button-group-overlap` | `border-width-1` | How much attached buttons overlap, so their borders make one line (1px, the button border). |
| `--button-group-divider` | `opacity-40` | Strength of the edge between two attached primary buttons, in their text color (40%). Set `0%` for none. |
<!-- token-table:end -->
