# KeyboardShortcuts

Keyboard shortcuts for an app, in one place: `useShortcut` sets one up where it's used, and `<KeyboardShortcuts>` is the help dialog that lists them all, opened with <kbd>?</kbd>.

```tsx
import { KeyboardShortcuts, useShortcut } from "serupa-ds";

function Inbox() {
  useShortcut(["mod", "K"], openSearch, { description: "Search", group: "Navigation" });
  useShortcut(["C"], compose, { description: "New message", group: "Messages" });
  return …;
}

// Once, in the app's layout:
<KeyboardShortcuts />
```

## When to use

- An app people use every day, where shortcuts save time: a mail client, an editor, a dashboard.
- Listing shortcuts so people can find them, instead of a page in the docs.

## When not to use

- Keys inside one widget, such as arrows in a list or Escape in a popup: the component handles those, on its own element.
- Showing one shortcut in help text or a tooltip: use [Kbd](../Kbd/README.md).

## Anatomy

Drawn from the `LongText` story.

1. **Group** (`.dk-keyboard-shortcuts__group`): the shortcuts for one part of the app.
2. **Heading** (`.dk-keyboard-shortcuts__heading`): names the group.
3. **Shortcut** (`.dk-keyboard-shortcuts__row`): one shortcut: what it does and its keys.
4. **What it does** (`.dk-keyboard-shortcuts__description`): the action, in words.
5. **Keys** (`.dk-keyboard-shortcuts__keys`): the keys to press.

## Usage

- Call `useShortcut(keys, handler, { description, group })` in the component the shortcut belongs to. It works while that component is mounted, so a page's shortcuts come and go with the page.
- Write keys as [Kbd](../Kbd/README.md) takes them, pressed together: `["mod", "K"]`, `["shift", "up"]`, `["?"]`. `mod` is ⌘ on Apple devices and Ctrl elsewhere. One key plus its modifiers: two keys in a row such as `["G", "I"]` aren't supported, so that shortcut isn't set up, and a development warning says so.
- Give it a `description` to list it, and a `group` to put it under a heading. Without a description, it works but isn't listed.
- Put one `<KeyboardShortcuts />` in the app's layout. Also open it from a help menu or button (`open` and `onOpenChange`), since many people don't know <kbd>?</kbd>.
- List shortcuts you don't set up with `useShortcut`, such as an editor's, with `shortcuts`.
- Prefer shortcuts with `mod`. A single letter is quick, but [WCAG 2.1.4](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html) asks that people can turn such shortcuts off or change them, since speech input can trigger them by accident. Pass `enabled` from a setting for that.

## Behavior

- A shortcut runs when its keys are pressed anywhere on the page, and the browser's default for those keys is prevented.
- It doesn't run while someone types in a text field (an input, a textarea, a select or an editable area, also inside a web component's shadow root), unless it has `mod`, ctrl or cmd, or `inInputs`. So <kbd>C</kbd> and <kbd>/</kbd> still type.
- It doesn't run while a modal (a Dialog, a Drawer or this help) is open, since the page behind it is inert. It also doesn't run while an input method is composing, or when another handler already handled the key.
- When two set up the same keys, the newest wins. A panel that opens can take a key from the page, and the page gets it back when the panel closes.
- Symbols such as <kbd>?</kbd> match whatever the keyboard layout needs to type them, so Shift isn't checked. Letters and digits also match by their position, so <kbd>alt</kbd>+<kbd>K</kbd> works on a Mac, where Option changes the character. A letter matches by position only when the key types no Latin letter (Option on a Mac, a Cyrillic or Greek layout), so on AZERTY or Dvorak it goes by the letter typed.
- The dialog lists each group in the order its first shortcut was set up, with "Show keyboard shortcuts" under General. With one group, it has no heading. The same keys and description are listed once, however many components set them up.

## Accessibility

- **Keyboard:**

| Key | Does |
| --- | --- |
| <kbd>?</kbd> | Opens the list (`helpKeys`). |
| <kbd>Tab</kbd> | Moves through the dialog: its close button. |
| <kbd>Escape</kbd> | Closes it, and focus goes back to where it was. |

- The dialog is a [Dialog](../Dialog/README.md), titled "Keyboard shortcuts". Each group is a heading over a `<dl>`: what a shortcut does, then its keys in [Kbd](../Kbd/README.md), so screen readers hear "Search, Control K".
- **Contrast:** group headings read 4.5:1 on the dialog in all six themes (`KeyboardShortcuts.test.tsx`).
- **What's still yours:** don't take keys the browser or screen readers use (such as Ctrl+L, Ctrl+T, or a screen reader's single-letter keys in browse mode, which it handles before the page), and let people turn off single-key shortcuts (WCAG 2.1.4).

## useShortcut(keys, handler, options)

| Argument or option | Type | Default | Notes |
| --- | --- | --- | --- |
| `keys` | `string \| string[]` | | The keys, pressed together, as Kbd takes them. |
| `handler` | `(event: KeyboardEvent) => void` | | Runs when they're pressed. |
| `description` | string | | Lists it in the dialog. |
| `group` | string | `"General"` | The heading it's listed under. |
| `enabled` | boolean | `true` | `false` turns it off for now. |
| `inInputs` | boolean | `false` | Also runs while typing in a text field. |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the `<dialog>`. |
| `title` | ReactNode | `"Keyboard shortcuts"` | The dialog's title. |
| `shortcuts` | `{ keys, description, group? }[]` | | Shortcuts to list that aren't set up with `useShortcut`. |
| `helpKeys` | `string[] \| false` | `["?"]` | The keys that open it; `false` for none. |
| `open` | boolean | | Controlled: whether it's open. |
| `defaultOpen` | boolean | `false` | Uncontrolled: open at first. |
| `onOpenChange` | `(open, details) => void` | | Called when it opens or closes. |

`className`, `ref` and other `<dialog>` attributes go to the [Dialog](../Dialog/README.md).

## Component tokens

Each is an optional override: set it on the page, a container or one KeyboardShortcuts. The list lives in `src/components/KeyboardShortcuts/keyboard-shortcuts.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from keyboard-shortcuts.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--keyboard-shortcuts-heading` | `text-muted` | A group's heading (4.5:1 on the dialog). |
| `--keyboard-shortcuts-divider` | `border` | The line between rows. |
| `--keyboard-shortcuts-row-padding` | `spacing-2` | Space above and below each row (8px). |
| `--keyboard-shortcuts-group-gap` | `spacing-5` | Space between groups (20px). |
| `--keyboard-shortcuts-heading-weight` | `font-semibold` | A group's heading. |
<!-- token-table:end -->
