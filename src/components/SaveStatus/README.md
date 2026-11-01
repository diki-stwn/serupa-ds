# SaveStatus

A small line that says whether autosaved changes are safe: "Saving…", "Saved 2 minutes ago", or "Couldn't save" with a Try again button. People can trust autosave without a Save button, and screen reader users hear when a save lands or fails.

```tsx
import { SaveStatus } from "serupa-ds";

<SaveStatus status={status} savedAt={savedAt} onRetry={save} />
```

## When to use

- A form, editor or settings page that saves on its own as people type or change things. Put it near the title or the top of the form, where people look for it.

## When not to use

- A form with a Save button: the button's own loading and `successText` ([Button](../Button/README.md)) say it.
- A one-off action's result ("Copied", "Sent"): use a [Toast](../Toast/README.md).

## Anatomy

Drawn from the `Failed` story.

1. **Icon** (`.dk-save-status__icon`): shows saving, saved or failed beside the words.
2. **Status** (`.dk-save-status__text`): the state in words, announced as it changes.
3. **Try again** (`.dk-save-status__retry`): after a failure, saves again.

## Usage

- Set `status` from your save: `'saving'` when a save starts, `'saved'` with `savedAt` when it finishes, `'error'` when it fails. Use `'idle'` before anything has changed.
- Pass `onRetry` so people can try a failed save again, and keep their changes until it works.
- Say why in `errorText` when you know ("Couldn't save: you're offline").
- Debounce saves while people type, so it doesn't flicker between Saving and Saved on every key.

## Behavior

- Saving shows a small ring and "Saving…". Saved shows a check and "Saved", and with `savedAt`, how long ago ("Saved 2 minutes ago"), kept current by [RelativeTime](../RelativeTime/README.md). An error shows an error icon and the text in the danger color, then Try again.
- Idle renders an empty line of the same height, so the page doesn't move when it starts.
- A new status cross-fades with the one before it, in the same place: the old one fades out (inert, hidden from screen readers) while the new one fades in, with a short scale and blur when motion is allowed. The first status just shows.

## Accessibility

- **Announcements:** "Saved" and the error are said once, politely, when the status changes to them. "Saving…" isn't, since it comes and goes with every save, and neither is the time ticking ("2 minutes ago"). A SaveStatus that first renders with "saved" says nothing, but one that first renders with "error" (shown only once a save fails) says the error.
- **Keyboard:** Try again is a Tab stop when it shows. Nothing else is. Once Try again is pressed it goes with the error, and focus stays on the status line (not a Tab stop) instead of falling to the page, so Tab goes on from there.
- **Contrast:** its text reads 4.5:1 on the page, the error too, in all six themes (`SaveStatus.test.tsx`).
- **What's still yours:** keep changes when a save fails, and don't move focus to SaveStatus.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div>`. |
| `status` | `'idle' \| 'saving' \| 'saved' \| 'error'` | | Required. Where saving is. |
| `savedAt` | `Date \| number` | | When the last save finished, for "Saved 2 minutes ago". |
| `onRetry` | `() => void` | | Shows Try again after an error. |
| `errorText` | `ReactNode` | `"Couldn't save"` | What went wrong. |

`className`, `ref` and other props go to the `<div>`.

## Component tokens

Each is an optional override: set it on the page, a container or one SaveStatus. The list lives in `src/components/SaveStatus/save-status.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from save-status.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--save-status-text` | `text-muted` | The text and the ring (4.5:1 on the page). |
| `--save-status-saved` | `success` | The check once saved. |
| `--save-status-error` | `danger-text` | The error's icon, text and Try again (4.5:1 on the page). |
| `--save-status-icon-size` | `spacing-4` | The icon's size (16px). |
| `--save-status-gap` | `spacing-1.5` | Space between the icon, the text and Try again (6px). |
<!-- token-table:end -->
