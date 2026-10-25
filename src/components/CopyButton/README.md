# CopyButton

A button that copies text to the clipboard: an API key, an invite link, a command. Once it has copied, it shows a check and "Copied" for two seconds and says "Copied" to screen readers.

```tsx
import { CopyButton } from "serupa-ds";

<CopyButton value={apiKey} />
<CopyButton value={inviteUrl} size="md">Copy link</CopyButton>
<CopyButton value="npm i serupa-ds" iconOnly variant="ghost">Copy the command</CopyButton>
<CopyButton value={() => editor.getText()} onCopy={(t) => track("copied", t.length)} />
```

## When to use

- Text people need somewhere else, exactly as it is: keys, links, codes, commands.
- Next to a read-only field or a code block that shows the same text.

## When not to use

- For sharing to another app: use the Web Share API (`navigator.share`) where it's offered.
- For text people will edit first: put it in an Input and let them select it.

## Usage

- Show the text next to the button too, so people can see what they copy and select it themselves if copying fails.
- Name what's copied when there are several on a page: "Copy link", "Copy the API key". With `iconOnly`, `children` is the button's name.
- `value` can be a function, called when the button is pressed, for text that's costly to build or changes.

## Behavior

- Copies with the Clipboard API, and falls back to the older `execCommand("copy")` on pages where that API isn't available (plain `http:` or an iframe without permission).
- Then shows a check (success color) and "Copied" for `timeout` ms (2000). Both labels take the same space, so the button doesn't change width.
- If the browser refuses, it says "Couldn't copy. Select the text and copy it yourself." (`labels.copyFailed`) and calls `onCopyError`.
- Your `onClick` runs first; call `event.preventDefault()` in it to stop the copy.

## Accessibility

- It's a real `<button>`. "Copied" is announced in the shared polite status region, and a failure in the assertive one.
- Only the current label is read out: the other is hidden from screen readers. An `iconOnly` button's name changes to "Copied" while it shows the check, and it has a tooltip (`title`).
- The check keeps 3:1 on the button in all six themes (`CopyButton.test.tsx`). In forced-colors mode it uses the button's text color.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To the button |
| Enter, Space | Copy; "Copied" is read out, or the failure, assertively |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<button>`. |
| `value` | `string \| () => string \| Promise<string>` | | What to copy. |
| `children` | `ReactNode` | `'Copy'` (`labels.copy`) | The label, or the name with `iconOnly`. |
| `copiedLabel` | `string` | `'Copied'` (`labels.copied`) | Shown and announced once it has copied. |
| `iconOnly` | `boolean` | `false` | Only the icon, with `children` as its name and tooltip. |
| `timeout` | `number` | `2000` | How long "Copied" stays, in ms. |
| `onCopy` | `(text) => void` | | Once the text is on the clipboard. |
| `onCopyError` | `(error) => void` | | When copying fails. |
| `variant`, `size` | as Button | `'outline'`, `'sm'` | |

Every other [Button](../Button/README.md) prop and `ref` go to the `<button>`, which has `data-component="button"`, the `dk-copy-btn` class, and `data-copied` while it shows "Copied".

## Component tokens

Each is an optional override: set it on the page, a container or one button. The list lives in `src/components/CopyButton/copy-button.tokens.json` (also in `design-tokens/components/`). Everything else is [Button](../Button/README.md)'s.

| Token | Default | Use |
| --- | --- | --- |
| `--copy-button-done-color` | `success-text` | The check icon once it has copied (3:1 on the button). |
