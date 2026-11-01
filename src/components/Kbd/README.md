# Kbd

Shows a keyboard key or shortcut as keycaps, in help text, tooltips, menus and empty states.

```tsx
import { Kbd } from "serupa-ds";

<p>Press <Kbd>/</Kbd> to search.</p>
<Kbd keys={["mod", "K"]} />        // ⌘ K on a Mac, Ctrl + K elsewhere
<Kbd keys={["shift", "enter"]} size="sm" />
```

## When to use

- Telling people about a keyboard shortcut: in help text, a tooltip or an empty state.
- Instructions that name a key, such as "Press Enter to send".

## When not to use

- Code, or a command people type: use the native `<code>` element instead.
- A shortcut hint at the end of a menu item: use [Menu](../Menu/README.md)'s `shortcut` prop instead.
- A short label such as a status or a count: use [Badge](../Badge/README.md) instead.

## Anatomy

Drawn from the `InText` story.

1. **Key** (`.dk-kbd__key`): one key, as it's printed on the keyboard.
2. **Plus** (`.dk-kbd__plus`): between keys pressed together.

## Usage

- Pass a combination as `keys`, one key each, and a single key as children.
- Use `mod` for shortcuts that follow the platform, so Mac users see ⌘ and others see Ctrl.
- Kbd only shows the keys: wire the shortcut yourself.

### Named keys

These names (in any case, and with any spaces, `_` or `-`: `page_up` and `Page Up` are `pageup`) show as symbols on Apple devices and as words elsewhere, and screen readers hear the key's name:

| Name | Apple | Elsewhere |
| --- | --- | --- |
| `mod` | ⌘ | Ctrl |
| `cmd`, `meta` | ⌘ | ⊞ |
| `ctrl` | ⌃ | Ctrl |
| `alt`, `option` | ⌥ | Alt |
| `shift` | ⇧ | Shift |
| `enter`, `return` | ↵ | Enter |
| `backspace`, `delete` | ⌫, ⌦ | Backspace, Del |
| `tab`, `esc`, `space` (or `" "`) | ⇥, Esc, Space | Tab, Esc, Space |
| `up`, `down`, `left`, `right` (or `ArrowUp`…`ArrowRight`, as `KeyboardEvent.key` names them) | ↑ ↓ ← → | ↑ ↓ ← → |
| `home`, `end` | ↖ ↘ | Home, End |
| `pageup` (`pgup`), `pagedown` (`pgdn`) | ⇞ ⇟ | PgUp, PgDn |
| `capslock`, `insert` (`ins`), `fn` | ⇪, Ins, fn | Caps Lock, Ins, Fn |

Use `mod` for shortcuts that follow the platform. Any other text shows as it is, and single letters show in capitals.

## Behavior

- Inside a `SerupaProvider` with `platform` set (`"apple"` or `"other"`, worked out on the server from the User-Agent or `Sec-CH-UA-Platform`), the right keys show from the first render, the server's too. Without it, the platform is read in the browser after the page loads, so server-rendered pages show the words first.
- It sits with the text, so it can go inline in a sentence.

## Accessibility

- A combination is one `<kbd>` holding a `<kbd>` per key, as HTML recommends. Symbols are hidden from screen readers and replaced with the key's name, through the `keyName` label (so "Panah atas" and "Spasi" in `idLabels`); the + between keys is hidden.
- Labels and the + keep 4.5:1 in all six themes (`Kbd.test.tsx`).
- **Keyboard:** none: it shows keys, it doesn't take them.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<kbd>`. |
| `keys` | `string[]` | | A combination, one key each. Or pass a single key as children. |
| `size` | `'sm' \| 'md'` | `'md'` | 20 or 24px keycaps. |

`className`, `ref` and other props go to the outer `<kbd>`.

## Component tokens

Each is an optional override: set it on the page, a container or one key. The list lives in `src/components/Kbd/kbd.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from kbd.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--kbd-bg` | `surface-muted` | A key's background. |
| `--kbd-border` | `field-border` | A key's outline, thicker at the bottom like a keycap. |
| `--kbd-text` | `text` | The key's label (4.5:1 on bg). |
| `--kbd-separator` | `text-muted` | The + between keys in a combination. |
| `--kbd-radius` | `rounded-sm` | A key's corners (4px). |
| `--kbd-height-sm` | `spacing-5` | size="sm" (20px). |
| `--kbd-height-md` | `spacing-6` | size="md", the default (24px). |
| `--kbd-padding-x` | `spacing-1.5` | Space on each side of a key's label (6px). |
| `--kbd-gap` | `spacing-1` | Space between keys and the + in a combination (4px). |
<!-- token-table:end -->
