# Toolbar

A set of controls, such as an editor's formatting buttons, that takes one Tab stop instead of one per control. Once focus is in it, the arrow keys move between the controls, so keyboard users get past a long row of buttons in one keystroke.

```tsx
import { Toolbar, ButtonGroup, ToggleButton, IconButton, Divider, Menu, MenuItem, Button } from "serupa-ds";

<Toolbar aria-label="Text formatting">
  <ButtonGroup aria-label="Style">
    <ToggleButton icon="format_bold" aria-label="Bold" />
    <ToggleButton icon="format_italic" aria-label="Italic" />
  </ButtonGroup>
  <Divider orientation="vertical" />
  <IconButton variant="ghost" icon="link" label="Insert link" />
  <Menu trigger={<Button variant="ghost" rightIcon="expand_more">More</Button>}>
    <MenuItem>Clear formatting</MenuItem>
  </Menu>
</Toolbar>

// a column of tools
<Toolbar aria-label="Drawing tools" orientation="vertical">
  <ToggleButton icon="edit" aria-label="Pen" />
  <ToggleButton icon="ink_eraser" aria-label="Eraser" />
</Toolbar>
```

## When to use

- Several controls that act on the same thing, such as text formatting above an editor, or the tools beside a canvas.
- A row of actions on a selection (Download, Move, Delete) that people use often enough that one Tab stop helps.

## When not to use

- Two or three buttons, such as Cancel and Save: a [ButtonGroup](../ButtonGroup/README.md) with `attached={false}` keeps each one in the Tab order, which is what people expect there.
- One choice out of a few: use [SegmentedControl](../SegmentedControl/README.md) or a [RadioGroup](../Radio/README.md).
- A site's main links: use [Navbar](../Navbar/README.md) or [Sidebar](../Sidebar/README.md). A toolbar is for controls, not navigation.

## Usage

- Put any controls inside, at any depth: Buttons, IconButtons, ToggleButtons, ButtonGroups, a Menu's trigger, a Select or an Input. Give them all the same `size`.
- Use a vertical [Divider](../Divider/README.md) between groups in a row, or a horizontal one in a column. It takes the row's height.
- Disabled controls are skipped by the arrow keys. To keep one reachable so people can find it, use `aria-disabled` instead of `disabled`.
- Controls added or removed later join the arrow-key order on their own.
- Inside a text field, the arrows, Home and End stay the field's. Tab leaves the field.
- A composite with its own arrow keys, such as a SegmentedControl, keeps them. Prefer ToggleButtons in a ButtonGroup, which the toolbar moves through one by one.

## Accessibility

- **Role and name:** a `role="toolbar"` with `aria-orientation`. Name it with `aria-label` or `aria-labelledby`, which you need when a page has more than one toolbar.
- **Keyboard:** the [WAI-ARIA toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/). It has one Tab stop, the control used last or else the first.

| Key | Moves focus to |
| --- | --- |
| Right / Left arrow | The next or previous control, in a row (mirrored right to left), wrapping at the ends |
| Down / Up arrow | The next or previous control, in a column |
| Home / End | The first or last control |
| Tab / Shift+Tab | Out of the toolbar |

Your `onKeyDown` runs before the toolbar's own keys, so `e.preventDefault()` in it keeps the toolbar from moving focus on that key. A Menu opened from the toolbar keeps its own keys, and closing it returns focus to its trigger.

- **Contrast:** it adds no colors to its controls. Text placed straight inside reads 4.5:1 on its background in all six themes (`Toolbar.test.tsx`).
- **What's still yours:** a name for each icon-only control, and a name for the toolbar.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div role="toolbar">`. |
| `orientation` | `'horizontal'` \| `'vertical'` | `'horizontal'` | A wrapping row, moved through with Left and Right, or a column, moved through with Up and Down. |
| `aria-label` | string | none | What the controls are for ("Text formatting"). |
| `children` | `ReactNode` | | The controls, at any depth. |

`className`, `style`, `ref` and other props go to the `<div>`, which has `data-component="toolbar"` and `data-orientation`.

## Component tokens

Each is an optional override: set it on the page, a container or one Toolbar. The list lives in `src/components/Toolbar/toolbar.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from toolbar.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--toolbar-bg` | `surface` | The background, behind the controls. |
| `--toolbar-text` | `text` | Text color inherited by plain text inside (4.5:1 on bg). |
| `--toolbar-radius` | `rounded-md` | The corners (6px). |
| `--toolbar-padding` | `spacing-1` | Space inside, on every side (4px). |
| `--toolbar-gap` | `spacing-1` | Space between the controls (4px). |
<!-- token-table:end -->
