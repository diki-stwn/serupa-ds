# Menu

A list of actions behind a button: a row's "More" menu, an "Actions" dropdown, a user menu. It follows the WAI-ARIA menu button pattern and opens next to its button in the browser's top layer.

```jsx
const { Menu, ContextMenu, MenuItem, MenuGroup, MenuSeparator, Button, IconButton, Card } = window.Serupa;

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

// a right-click (or Shift+F10) menu on an area
<ContextMenu aria-label="File actions" target={<Card tabIndex={0}>Report.pdf</Card>}>
  <MenuItem icon="open_in_new" onSelect={open}>Open</MenuItem>
  <MenuItem icon="edit" onSelect={rename}>Rename</MenuItem>
</ContextMenu>
```

`ContextMenu` is the same menu opened from an area instead of a button: at the pointer on a right-click (or a long press on touch), or at the focused element on Shift+F10 or the Menu key.

## When to use

- A set of actions on one item that would crowd the page as buttons, such as a table row's "More" menu.
- Grouping related actions behind one "Actions" button in a toolbar.
- A user or account menu with a few actions and links.
- `ContextMenu`: shortcuts to actions on a thing people right-click, such as a file, a row or a spot on a canvas.

## When not to use

- Picking a value: use [Select](../Select/README.md) instead (or [Combobox](../Combobox/README.md) for a long list).
- Navigation links: use a plain list of links instead, or [Navbar](../Navbar/README.md) or [Sidebar](../Sidebar/README.md) for an app's pages.
- One or two actions: show them as [Button](../Button/README.md)s instead, so people don't have to open anything.
- Content with fields or text: use [Popover](../Popover/README.md) instead.
- A `ContextMenu` as the only way to an action: people rarely look for right-click menus, and many can't right-click. Put each of its actions on a button or a `Menu` too.

## Anatomy

Drawn from the `BottomEnd` story, opened.

1. **Item** (`.dk-menu__item`): one action; Enter or a click runs it.
2. **Icon** (`.dk-menu__icon`): an optional picture of the action.
3. **Label** (`.dk-menu__label`): the action, in words.
4. **Shortcut** (`.dk-menu__shortcut`): the keys that do the same, when there are some.
5. **Group label** (`.dk-menu__group-label`): names a group of items.
6. **Separator** (`.dk-menu__separator`): a line between groups.
7. **Destructive item** (`.dk-menu__item--destructive`): an action that deletes or can't be undone, in the danger color and words that say so.

## Usage

- The trigger is one element that passes its ref and props on to a DOM element: a Button, IconButton or link, or your own component written with `React.forwardRef` (or the `ref` prop in React 19) that spreads what it gets. A text, several elements or a Fragment throws an error that names the component, and a trigger that drops its ref warns once in the console ("Serupa: Menu's trigger doesn't forward its ref to an element.").
- Start each label with a verb ("Edit", "Duplicate", "Delete") and keep it short.
- Put the most used actions first, and destructive ones last, after a `MenuSeparator` or in their own `MenuGroup`.
- Keep `disabled` items in place rather than hiding them, so people learn the action exists.
- Use a `MenuSub` for a set of related choices that would make the menu long ("Share", "Move to"). Keep it to one level where you can: each level is one more step for keyboard and screen reader users, and harder to reach with a pointer. Never put the only way to do something two levels down.
- Give a `ContextMenu` target `tabIndex={0}` (or use a focusable element), so keyboard users can reach it and press Shift+F10, and say in its hint or a Tooltip that it has one. Leave the browser's own menu where people expect it, such as on text they edit or links: `disabled` does that.
- For settings, use `MenuCheckboxItem` (on or off, such as "Show grid") or a `MenuRadioGroup` of `MenuRadioItem`s (one of a set, such as a sort order). Put them in their own `MenuGroup` or `MenuRadioGroup`, so the checks line up. The menu's items unmount once it has closed, so you hold the state: `checked` with `onCheckedChange`, and `value` with `onValueChange`.
- `shortcut` only shows a hint: wire the shortcut yourself, and show only shortcuts that work. Write it the way the platform does ("⌘K" on a Mac, "Ctrl+K" elsewhere).

## Accessibility

- A `MenuSub` is a `menuitem` with `aria-haspopup="menu"` and `aria-expanded`; its submenu is a `menu` named by the item's label, next to the item at its end edge (on the right, or the left in rtl, flipping when there's no room).
- `role="menu"` with `menuitem`s, `group`s and `separator`s; only the highlighted item takes focus.
- A `MenuCheckboxItem` is a `menuitemcheckbox` and a `MenuRadioItem` a `menuitemradio`, with `aria-checked`. The check before the label is hidden from assistive tech, which reads `aria-checked` instead.
- A `shortcut` is given to assistive tech as `aria-keyshortcuts`, worked out from what's shown ("⌘⇧K" becomes `Meta+Shift+K`, "Ctrl+Shift+P" becomes `Control+Shift+P`), and the shown `<kbd>` is left out of the item's name, so it's read as "Edit" with its shortcut, not "Edit command E". Hyphens separate too ("Cmd-K" is `Meta+K`), a last `+` is the key ("Ctrl++" is `Control+Plus`), and "G then I" is two presses in a row (`G I`). Pass `aria-keyshortcuts` to set it yourself.
- It fades and grows in out of its trigger over 150ms, and fades and shrinks back over 100ms when it closes. Its items arrive and leave with it, as one. With `prefers-reduced-motion` it only fades. The motion is a transition, so closing it while it opens turns back from where it is. Its items stay while it fades out, inert, and focus goes back at once; a submenu open when the menu closes closes and fades with it. A `ContextMenu` and a `MenuSub`'s submenu move the same way. One open on arrival (`defaultOpen`, or `open` on the first render) is there from the first frame. Firefox and Safari can't keep a closing menu in the top layer yet, so there it closes at once. From the keyboard there is no motion: opened by Enter, Space or an arrow (a submenu by ArrowRight) it is there at once, and Escape takes it away at once.
- Labels, shortcuts and group headings keep 4.5:1 (also on the highlighted item) and icons 3:1, in all six themes (`Menu.test.tsx`).

### Keyboard

| Key | On the button | In the menu |
| --- | --- | --- |
| Enter, Space | Opens it on the first item | Chooses the item |
| ↓ / ↑ | Opens it on the first / last item | The next / previous item, wrapping |
| Home, End | | The first or last item |
| Letters | | The next item starting with them. Letters typed within half a second make one word ("de" finds Delete past Duplicate), the same letter again steps through the items starting with it, and accents and case don't matter ("e" finds "Éditer"). A Space within half a second of a letter is part of the word ("save as" finds "Save as…"), so it doesn't choose |
| Escape | | Closes it; focus goes back to the button |
| Tab | | Closes it and moves on |
| → (← in rtl), Enter, Space | | On a `MenuSub`: opens its submenu on the first item |
| ← (→ in rtl), Escape | | In a submenu: closes it, and focus goes back to the item that opened it |

On a `ContextMenu`'s target, Shift+F10 or the Menu key opens it at the focused element, and a right-click opens it at the pointer. In it the keys are the same, and Escape or a choice puts focus back where it was.

In a submenu, ↑ ↓ Home End and letters move among its own items only. Choosing an item in a submenu closes every level and focus goes back to the button.

A mouse opens the menu as the button is pressed, so it can be dragged onto an item and let go there to choose it, as in a desktop app's menus; a quick click opens it and leaves it open. A touch or pen opens it on the tap, and so does a mouse when the trigger has its own `onClick` (which can call `preventDefault()` to stop it). Hovering an item highlights it, and a press outside closes the menu. Hovering a `MenuSub` opens its submenu after 150ms, and it closes 150ms after the pointer settles on another item, so the pointer can cut across an item on the way into the submenu.

## Props

### Menu

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `trigger` | one element | required | The button that opens it. It gets `aria-haspopup`, `aria-expanded`, `aria-controls` and the keys, and keeps its own handlers and ref. It can be wrapped in a [Tooltip](../Tooltip/README.md) |
| `children` | nodes | required | `MenuItem`, `MenuGroup` and `MenuSeparator` |
| `placement` | as Tooltip | `'bottom-start'` | Where it opens; it flips when there's no room and slides to stay on screen. With no room on either side it opens on the roomier one and scrolls inside, so every item can be reached |
| `open`, `onOpenChange` | boolean, function | | Control it yourself. onOpenChange(open, { reason }) says why: `'trigger'`, `'select'` (an item chosen), `'escape'`, `'blur'` (Tab) or `'outside'` |
| `defaultOpen` | boolean | `false` | Open at first, without controlling it |
| `aria-label` | string | | The menu's name. Without it, the button's text names it |
| `className`, `style`, other HTML attributes and a ref | | | Go on the menu panel: `data-testid`, an `id`, other `aria-*` and a ref reach it, as on Radix's and React Aria's menu content. Its `onKeyDown` runs before the menu's keys and can call `preventDefault()` to stop them |

The menu panel's id is made for you unless you pass one, and the trigger's `aria-controls` points at it while it's open. An id on the trigger stays on the trigger.

### ContextMenu

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `target` | one element | required | The area it belongs to. A right-click, a long press, Shift+F10 or the Menu key in it opens the menu. It keeps its own handlers and ref, and its `onContextMenu` can call `preventDefault()` to stop it |
| `children` | nodes | required | `MenuItem`, `MenuGroup`, `MenuSub` and `MenuSeparator` |
| `aria-label` | string | required | The menu's name ("File actions"), since there's no button to take it from |
| `open`, `onOpenChange` | boolean, function | | Control it yourself. Opened this way, it shows at the target's corner. onOpenChange(open, { reason }) says why: `'trigger'`, `'select'` (an item chosen), `'escape'`, `'blur'` (Tab) or `'outside'` |
| `disabled` | boolean | `false` | Leaves the browser's own menu in place |
| `className`, `style`, other HTML attributes and a ref | | | Go on the menu panel: `data-testid`, an `id`, other `aria-*` and a ref reach it. Its `onKeyDown` runs before the menu's keys and can call `preventDefault()` to stop them |

An id on the target stays on the target.

### MenuItem

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `onSelect` | `(event) => void` | | Runs when it's chosen (click, Enter or Space). The menu then closes and focus goes back to the button, unless you call `event.preventDefault()`. If it moves focus itself (to the next row, after deleting this one), focus stays there |
| `icon` | icon name \| element | | A muted 16px icon before the label |
| `shortcut` | string | | A hint at the end, such as `⌘K` (wire the shortcut yourself); also sets `aria-keyshortcuts` |
| `destructive` | boolean | `false` | Danger colors |
| `disabled` | boolean | `false` | Still reachable with the keys (so people learn it exists), but can't be chosen |
| `as` | component | | Makes it a link with this component instead of the `configure({ link })` one, such as a router's Link. Typed: its props are those of the element `as` names, so `as={RouterLink} to="/settings"` checks `to`, and without `as` they're an `<a>`'s (`href`, `target`, `rel`) |

`href` makes it a link (the `configure({ link })` component). `target` and `rel` go to a link item, and `target="_blank"` without `rel` gets `rel="noopener noreferrer"`. `className`, `ref` and the rest go to the item: the link, or a `<div>` for an action.

### MenuCheckboxItem

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `checked` | boolean | required | Whether it's on |
| `onCheckedChange` | `(checked) => void` | | Called with the other state when it's chosen. The menu then closes, unless `onSelect` calls `event.preventDefault()` |

It also takes MenuItem's `onSelect`, `icon`, `shortcut` and `disabled`.

### MenuRadioGroup and MenuRadioItem

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `value` (group) | string | required | The chosen item's value |
| `onValueChange` (group) | `(value) => void` | | Called with an item's value when it's chosen, unless it was chosen already |
| `label` (group) | node | | A small heading that names the group, as on `MenuGroup` |
| `value` (item) | string | required | The value the group chooses with this item |

A `MenuRadioItem` also takes MenuItem's `onSelect`, `icon`, `shortcut` and `disabled`.

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

<!-- token-table:start (made from menu.tokens.json by npm run tokens: edit the descriptions there) -->
**Colors**

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

**Shadow**

| Token | Default | Use |
| --- | --- | --- |
| `--menu-shadow` | `shadow-lg` | The menu's shadow. |

**Border**

| Token | Default | Use |
| --- | --- | --- |
| `--menu-radius` | `rounded-lg` | The menu's corners (8px). |
| `--menu-item-radius` | `rounded-md` | An item's corners (6px). |
| `--menu-border-width` | `border-width-1` | The menu's border. |

**Sizing**

| Token | Default | Use |
| --- | --- | --- |
| `--menu-min-width` | `spacing-48` | The narrowest a menu gets (192px). |
| `--menu-max-width` | `spacing-80` | The widest a menu gets (320px). Longer labels wrap. |
| `--menu-item-height` | `control-height-md` | An item's height (32px). |

**Spacing**

| Token | Default | Use |
| --- | --- | --- |
| `--menu-padding` | `spacing-1` | Padding inside the menu (4px). |
| `--menu-item-padding-x` | `spacing-2` | Padding at an item's sides (8px). |
| `--menu-item-gap` | `spacing-2` | Space between an item's icon, label and shortcut (8px). |
| `--menu-offset` | `spacing-1` | The gap between the menu and its button (4px). |
| `--menu-sub-offset` | `spacing-0` | The gap between a submenu and the item that opens it (0: the submenu overlaps the menu's padding). |

**Layout**

| Token | Default | Use |
| --- | --- | --- |
| `--menu-z-index` | `z-popover` | The stacking level where the browser has no top layer (popover). |
<!-- token-table:end -->
