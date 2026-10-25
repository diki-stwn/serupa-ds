# Menu

A list of actions behind a button: a row's "More" menu, an "Actions" dropdown, a user menu. It follows the WAI-ARIA menu button pattern and opens next to its button in the browser's top layer.

```jsx
const { Menu, MenuItem, MenuGroup, MenuSeparator, Button, IconButton } = window.Serupa;

<Menu trigger={<Button variant="secondary" rightIcon="expand_more">Actions</Button>}>
  <MenuItem icon="edit" shortcut="⌘E" onSelect={edit}>Edit</MenuItem>
  <MenuItem icon="content_copy" onSelect={duplicate}>Duplicate</MenuItem>
  <MenuItem href="/share" icon="link">Share link</MenuItem>
  <MenuSeparator />
  <MenuGroup label="Danger zone">
    <MenuItem icon="delete" destructive onSelect={remove}>Delete</MenuItem>
  </MenuGroup>
</Menu>

<Menu trigger={<IconButton icon="more_vert" label="Row actions" />} placement="bottom-end">…</Menu>

<Menu trigger={<Button variant="secondary">File</Button>}>
  <MenuItem icon="add">New</MenuItem>
  <MenuSub icon="share" label="Share">
    <MenuItem icon="mail">Email</MenuItem>
    <MenuItem icon="link">Copy link</MenuItem>
  </MenuSub>
</Menu>
```

## When to use

- A set of actions on one item that would crowd the page as buttons, such as a table row's "More" menu.
- Grouping related actions behind one "Actions" button in a toolbar.
- A user or account menu with a few actions and links.

## When not to use

- Picking a value: use [Select](../Select/README.md) instead (or [Combobox](../Combobox/README.md) for a long list).
- Navigation links: use a plain list of links instead, or [Navbar](../Navbar/README.md) or [Sidebar](../Sidebar/README.md) for an app's pages.
- One or two actions: show them as [Button](../Button/README.md)s instead, so people don't have to open anything.
- Content with fields or text: use [Popover](../Popover/README.md) instead.

## Usage

- Start each label with a verb ("Edit", "Duplicate", "Delete") and keep it short.
- Put the most used actions first, and destructive ones last, after a `MenuSeparator` or in their own `MenuGroup`.
- Keep `disabled` items in place rather than hiding them, so people learn the action exists.
- Use a `MenuSub` for a set of related choices that would make the menu long ("Share", "Move to"). Keep it to one level where you can: each level is one more step for keyboard and screen reader users, and harder to reach with a pointer. Never put the only way to do something two levels down.
- `shortcut` only shows a hint: wire the shortcut yourself, and show only shortcuts that work. Write it the way the platform does ("⌘K" on a Mac, "Ctrl+K" elsewhere).

## Accessibility

- A `MenuSub` is a `menuitem` with `aria-haspopup="menu"` and `aria-expanded`; its submenu is a `menu` named by the item's label, next to the item at its end edge (on the right, or the left in rtl, flipping when there's no room).
- `role="menu"` with `menuitem`s, `group`s and `separator`s; only the highlighted item takes focus.
- A `shortcut` is given to assistive tech as `aria-keyshortcuts`, worked out from what's shown ("⌘⇧K" becomes `Meta+Shift+K`, "Ctrl+Shift+P" becomes `Control+Shift+P`), and the shown `<kbd>` is left out of the item's name, so it's read as "Edit" with its shortcut, not "Edit command E". Hyphens separate too ("Cmd-K" is `Meta+K`), a last `+` is the key ("Ctrl++" is `Control+Plus`), and "G then I" is two presses in a row (`G I`). Pass `aria-keyshortcuts` to set it yourself.
- Labels, shortcuts and group headings keep 4.5:1 (also on the highlighted item) and icons 3:1, in all six themes (`Menu.test.tsx`).

### Keyboard

| Key | On the button | In the menu |
| --- | --- | --- |
| Enter, Space | Opens it on the first item | Chooses the item |
| ↓ / ↑ | Opens it on the first / last item | The next / previous item, wrapping |
| Home, End | | The first or last item |
| Letters | | The next item starting with them. Letters typed within half a second make one word ("de" finds Delete past Duplicate), the same letter again steps through the items starting with it, and accents and case don't matter ("e" finds "Éditer") |
| Escape | | Closes it; focus goes back to the button |
| Tab | | Closes it and moves on |
| → (← in rtl), Enter, Space | | On a `MenuSub`: opens its submenu on the first item |
| ← (→ in rtl), Escape | | In a submenu: closes it, and focus goes back to the item that opened it |

In a submenu, ↑ ↓ Home End and letters move among its own items only. Choosing an item in a submenu closes every level and focus goes back to the button.

Hovering an item highlights it, and a press outside closes the menu. Hovering a `MenuSub` opens its submenu after 150ms, and it closes 150ms after the pointer settles on another item, so the pointer can cut across an item on the way into the submenu.

## Props

### Menu

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `trigger` | one element | required | The button that opens it. It gets `aria-haspopup`, `aria-expanded`, `aria-controls` and the keys, and keeps its own handlers and ref. It can be wrapped in a [Tooltip](../Tooltip/README.md) |
| `children` | nodes | required | `MenuItem`, `MenuGroup` and `MenuSeparator` |
| `placement` | as Tooltip | `'bottom-start'` | Where it opens; it flips when there's no room and slides to stay on screen. With no room on either side it opens on the roomier one and scrolls inside, so every item can be reached |
| `open`, `onOpenChange` | boolean, function | | Control it yourself |
| `defaultOpen` | boolean | `false` | Open at first, without controlling it |
| `aria-label` | string | | The menu's name. Without it, the button's text names it |

### MenuItem

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `onSelect` | `(event) => void` | | Runs when it's chosen (click, Enter or Space). The menu then closes and focus goes back to the button, unless you call `event.preventDefault()` |
| `icon` | icon name \| element | | A muted 16px icon before the label |
| `shortcut` | string | | A hint at the end, such as `⌘K` (wire the shortcut yourself); also sets `aria-keyshortcuts` |
| `destructive` | boolean | `false` | Danger colors |
| `disabled` | boolean | `false` | Still reachable with the keys (so people learn it exists), but can't be chosen |
| `href` | string | | Makes it a link (the `configure({ link })` component) |
| `as` | component | | Makes it a link with this component instead, such as a router's Link (pass its props, like `to`, on the item) |
| `target`, `rel` | string | | For a link item. `target="_blank"` without `rel` gets `rel="noopener noreferrer"` |

### MenuSub

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `label` | node | required | The item's label, which also names the submenu |
| `children` | nodes | required | `MenuItem`, `MenuGroup`, `MenuSeparator`, or another `MenuSub` |
| `icon` | icon name \| element | | A muted 16px icon before the label |
| `disabled` | boolean | `false` | Still reachable with the keys, but doesn't open |

`MenuGroup` takes a `label` (a small heading that names the group); `MenuSeparator` is a line. Every part takes `className`, `style` and `ref`.

## Component tokens

Each is an optional override: set it on the page, a container or one menu. The list lives in `src/components/Menu/menu.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--menu-bg` | `surface-overlay` | The menu's background. |
| `--menu-border` | `border-overlay` | The menu's border. |
| `--menu-item-text` | `text` | An item's label. |
| `--menu-item-bg-active` | `highlight` | The highlighted item's background (hover and keyboard). |
| `--menu-item-indicator` | `primary` | From the keyboard: the 2px bar at the highlighted item's start. A destructive item uses its danger color. |
| `--menu-item-bg-pressed` | `pressed` | An item's background while it's pressed, one step past the highlight. A destructive item keeps its danger tint. |
| `--menu-muted` | `text-muted` | Icons, shortcuts and group labels (4.5:1 on surface; the highlighted item's shortcut turns to item-color). |
| `--menu-danger` | `danger-text` | A destructive item's label and icon. |
| `--menu-danger-bg-active` | `danger-subtle` | A highlighted destructive item's background. |
| `--menu-separator` | `border` | The line between groups. |
| `--menu-shadow` | `shadow-lg` | The menu's shadow. |
| `--menu-radius` | `rounded-lg` | The menu's corners (8px). |
| `--menu-item-radius` | `rounded-md` | An item's corners (6px). |
| `--menu-border-width` | `border-width-1` | The menu's border. |
| `--menu-min-width` | `spacing-48` | The narrowest a menu gets (192px). |
| `--menu-max-width` | `spacing-80` | The widest a menu gets (320px). Longer labels wrap. |
| `--menu-item-height` | `control-height-md` | An item's height (32px). |
| `--menu-padding` | `spacing-1` | Padding inside the menu (4px). |
| `--menu-item-padding-x` | `spacing-2` | Padding at an item's sides (8px). |
| `--menu-item-gap` | `spacing-2` | Space between an item's icon, label and shortcut (8px). |
| `--menu-offset` | `spacing-1` | The gap between the menu and its button (4px). |
| `--menu-sub-offset` | `spacing-0` | The gap between a submenu and the item that opens it (0: the submenu overlaps the menu's padding). |
| `--menu-z-index` | `z-50` | The stacking level where the browser has no top layer (popover). |
