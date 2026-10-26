# IconButton

A button that shows only an icon: a menu trigger, a close button, a toolbar action. It's a [Button](../Button/README.md) with `icon`, and a `label` you can't leave out, because an icon alone has no name for screen readers.

```jsx
const { IconButton } = window.Serupa;

<IconButton icon="more_vert" label="More actions" onClick={openMenu} />
<IconButton icon="edit" label="Edit" variant="secondary" shape="round" />
<IconButton icon="delete" label="Delete file" destructive />
<IconButton icon="open_in_new" label="Open in a new tab" href={url} target="_blank" />
```

## When to use

- An action whose icon people know at a glance: close, search, settings, more actions.
- Toolbars, table rows and card headers, where a labeled button would take too much room.
- A menu trigger, such as the "More actions" button that opens a [Menu](../Menu/README.md).

## When not to use

- An action whose icon isn't widely understood: use a [Button](../Button/README.md) with a label and a `leftIcon`.
- A setting that stays on or off, such as bold or mute: use [ToggleButton](../ToggleButton/README.md) with `icon` and `aria-label`.
- The one main action of a screen that must stay in reach while people scroll: use [Fab](../Fab/README.md).

## Usage

- Write the `label` as the action ("Delete file"); it's also the `title` tooltip people see on hover.
- With a [Tooltip](../Tooltip/README.md) on the button, the `title` is left out by itself (the button has `aria-describedby` or `aria-labelledby`), so the label doesn't show twice. If the Tooltip says the same as the label, give it `role="label"`: it then names the button instead of describing it, so the name isn't read twice ("Settings, button", not "Settings, button, Settings").
- Give icon buttons in one row the same `size` and `variant`, and match the size of the buttons and fields beside them.
- Use `shape="round"` only where round buttons are the pattern; square follows Button's corners.

## Accessibility

- The label is the button's name: say what it does ("Delete file"), not what it shows ("Trash can").
- Every size is at least 24×24px, the WCAG 2.2 target size.
- The rest is Button's: focus ring, contrast, forced colors and reduced motion (checked in Button's tests); IconButton's own checks are in `IconButton.test.tsx`.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To the button |
| Enter, Space | Press it |

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<button>`. |
| `icon` | icon name \| element | required | A custom or Material Symbols name, or any element |
| `label` | string | required | Its `aria-label`, and a `title` tooltip |
| `shape` | `'square'` \| `'round'` | `'square'` | The Button's corners, or a circle |
| `noTitle` | boolean | `false` | Leaves out the `title`, when visible text already shows the label (a wrapping Tooltip leaves it out by itself) |
| `variant` | as Button | `'ghost'` | Ghost by default, the usual look for an icon on its own |

Every other Button prop works the same: `size` (24, 32 or 44px square), `destructive`, `loading`, `disabled`, `href`, `onClick`, `ref`. A given `title` wins over the label.

## Component tokens

Each is an optional override: set it on the page, a container or one button. The list lives in `src/components/IconButton/icon-button.tokens.json` (also in `design-tokens/components/`). Every Button token applies too.

| Token | Default | Use |
| --- | --- | --- |
| `--icon-button-radius-round` | `rounded-full` | The corners of a round icon button (shape="round"). |
