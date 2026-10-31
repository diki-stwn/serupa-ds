# Toast

A short message that confirms something happened ("Changes saved", "Moved to trash") without getting in the way. Call `toast()` from anywhere; messages show in the `<Toaster>`, which you render once near the root of the app, and go away on their own.

```jsx
const { Toaster, toast } = window.Serupa;

// once, near the root
<Toaster />

toast("Link copied");
toast({ title: "Changes saved", tone: "success" });
toast({ title: "Moved to trash", action: { label: "Undo", onClick: restore } });
toast({ title: "Upload failed", description: "The file is over 10 MB.", tone: "danger", autoDismiss: false, action: { label: "Retry", onClick: retry } }); // stays until closed

// replace a toast as work goes on
const id = toast({ title: "Saving…", autoDismiss: false });
await save();
toast({ id, title: "Saved", tone: "success" });

// or let toast.promise do the same from one call
toast.promise(save(), {
  loading: "Saving…",
  success: "Saved",
  error: (e) => ({ title: "Couldn't save", description: String(e) }),
});

toast.dismiss(id);   // or toast.dismiss() for all

// undo instead of "Are you sure?": hide it now, delete it for good only if Undo isn't chosen
hide(file);
toast.undo({ title: "Moved to trash", commit: () => deleteFile(file), onUndo: () => show(file) });
```

## When to use

- Confirming an action people just took, when the result isn't obvious on the page: "Link copied", "Invite sent".
- Offering a quick undo after an action, such as moving something to the trash.
- Reporting on work that finishes in the background, such as a save or an export.

## When not to use

- Something people must read or act on before going on: use a [Dialog](../Dialog/README.md) instead.
- A problem that stays until it's fixed, or a message about one part of the page: use an [Alert](../Alert/README.md) near that part instead.
- An error on one field: use the error in [Field](../Field/README.md) instead.

## Usage

- Keep the title short and say what happened, in a few words: "Changes saved", not "Your changes have been saved successfully."
- Use one `action` at most, for something quick such as Undo; the toast may go before people reach it.
- Every toast goes by itself after 5 seconds, one with an action too. Turn that off with `autoDismiss: false` only for a message someone has to act on, such as a failed upload with Retry; it then stays until it's closed. `<Toaster duration autoDismiss>` sets both for the whole app, and a toast's own options win.
- For work that takes a while, show a toast with `autoDismiss: false` and replace it by `id` when the work is done, as above, or hand the work to `toast.promise`.
- Render one `<Toaster>` for the whole app, and keep its `position` the same on every page. If two are mounted at once (one in a layout and one in a page), only the newer shows toasts, so none appears twice, and a development warning says so; when it unmounts, the older one takes over.
- A burst can't bury the page: at most `limit` toasts show (3), and the same message again (same words and tone, with no `id` or `action`) adds a count to the toast that's showing ("Network error ×12") and starts its time over, rather than stacking. The stack stays clear of a phone's notch and home indicator. On a short screen, such as a phone in landscape, only as many as fit show, and the rest wait under the "+2 more" line, so none runs off the top or bottom. On a phone, a toast's action goes under the text, lined up with it, so the text keeps its width.
- On a touch screen, swipe a toast sideways to dismiss it. It follows the finger and fades as it goes. Let go past a third of its width, or flick it (even gently), and it carries on at your finger's speed and closes. Otherwise it slides back. Its time stops while it's under your finger.

## Accessibility

- Each new toast is read out through the shared polite live region, so it doesn't interrupt. A repeat that only adds to a toast's count isn't read each time: once the burst stops (a second with no repeat), the message is read once more with the count ("Network error. 12 times.", `labels.toastRepeated`). The count reads as "12 times" with the title, not "×12".
- The time stops while a toast is hovered or anything in it has focus, and while the window is in the background (WCAG 2.2.1), so a toast with an `action` can go by itself like any other: hovering it, or reaching it with F8, holds it. Give one `autoDismiss: false` when people have to act on it. For anything they must act on before going on, an Alert or a Dialog is still better.
- F8 moves focus to the newest toast (a screen reader reads it, and Tab reaches its buttons), and F8 or Escape takes focus back to where it was. The first toast with an action adds "Press F8 to reach it." to what's announced (`labels.toastShortcut`), while a Toaster is in the page. When a toast closes with keyboard focus in it (its ×, its action, or `toast.dismiss()`), focus goes back where F8 came from, or else to the toast next to it. Closed with the mouse, focus isn't moved to the next toast, so that one's time keeps running.
- Each toast has a close button, so swiping is never the only way to close one (WCAG 2.5.1). The Toaster is a named region people can find.
- Titles and descriptions keep 4.5:1 and icons 3:1 in all six themes (`Toast.test.tsx`).
- Toasts fade and slide in from their edge over 200ms, and fade and slide back toward it over 150ms when they close; the toasts left glide to their new place over 200ms instead of jumping, each keeping its place in the stack. One pushed into the waiting line by a newer toast shrinks and fades toward the "+2 more" line instead, and that line fades in and out and glides with the toasts. With `prefers-reduced-motion` toasts only fade, and the others move at once. The motion is a transition, so a toast shown again while it fades out turns back. A closing toast is inert while it fades, and focus moves on at once. Toasts already there as the Toaster arrives (shown from its first render) don't slide in.

### Keyboard

| Key | Does |
| --- | --- |
| F8 | To the newest toast; pressed again in a toast, back to where focus was |
| Escape | In a toast reached with F8, back to where focus was |
| Tab | Within a toast, to its action and its close button |

## Props

### toast(options)

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `title` | node | required | The main line (a string alone is the title) |
| `description` | node | | A muted line under it |
| `tone` | `'neutral'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | `'neutral'` | An icon in the tone's color; neutral has none |
| `action` | `{ label, onClick }` | | One button, such as Undo. Choosing it also closes the toast |
| `duration` | number | the Toaster's, `5000` | Milliseconds before it goes; `0` keeps it until it's closed, as `autoDismiss: false` does |
| `autoDismiss` | boolean | the Toaster's, `true` | Whether it goes by itself after `duration`; `false` keeps it until it's closed, for a message someone has to act on |
| `announcement` | string | title and description | What screen readers hear, when the title isn't plain text |
| `id` | string | new | Reuse one to replace a toast that's showing |

It returns the toast's id. `toast.dismiss(id)` closes one, `toast.dismiss()` all of them.

### toast.promise(work, messages)

Shows `messages.loading` while `work` (a promise, or a function that returns one) runs, then replaces that same toast with `messages.success` or `messages.error`. Each message is a title string or `toast()` options; `success` and `error` can also be functions that get the result or the error. The loading toast stays until the work settles (`autoDismiss: false`); the result gets the success or danger tone unless the message sets one, and the usual duration. Since it's one toast replaced in place, screen readers hear the loading message and then the result. It returns `work`'s promise, so you can still await it or catch its error.

### toast.undo(options)

The undo pattern, in place of a confirmation: do the action in the page at once (the item leaves the list), and let `toast.undo` hold the real work until it's sure. It shows a toast with an Undo button, and takes `toast()` options except `action` and `autoDismiss`, plus:

| Option | Type | Notes |
| --- | --- | --- |
| `commit` | `() => void` | Required. Does the action for good. It runs once, when the toast closes without Undo: its time runs out, it's closed with ×, `toast.dismiss` closes it, or the page is left (`pagehide`). |
| `onUndo` | `() => void` | Runs instead of `commit` when Undo is chosen: put things back. |
| `undoLabel` | string | The button's text. Default: "Undo" (`labels.undo`). |

It returns the toast's id. Keep the usual duration or longer, so people have time to notice. The toast's time stops while it's hovered or focused, and F8 reaches its Undo button. With `duration: 0` it stays, and commits only when it's closed or the page is left.

### Toaster

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the Toaster's root `<section>`, the region toasts show in. |
| `position` | `'bottom-end'` \| `'bottom-start'` \| `'bottom-center'` \| `'top-start'` \| `'top-center'` \| `'top-end'` | `'bottom-end'` | Where toasts appear, 16px from the edges; start and end follow the text direction. The newest is nearest the edge |
| `label` | string | `'Notifications'` | The region's name |
| `dismissLabel` | string | `'Dismiss'` | The close buttons' name |
| `duration` | number | `5000` | How long each toast stays, in milliseconds, unless it sets its own |
| `autoDismiss` | boolean | `true` | Whether toasts go by themselves; `false` keeps every one until it's closed, unless a toast sets its own |
| `limit` | number | `3` | The most toasts shown at once. The newest show; older ones wait under a "+2 more" line and come back as others close. One never shown waits with its time not yet started; one already seen keeps its time running while it waits, so toasts still go in the order they came |

`className`, `style` and other props go to the `<section>`, which has `data-component="toaster"` and `data-position`.

## Component tokens

Each is an optional override: set it on the page or the Toaster. The list lives in `src/components/Toast/toast.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from toast.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--toast-bg` | `surface-overlay` | A toast's background. |
| `--toast-border` | `border-overlay` | A toast's border. |
| `--toast-title-color` | `text` | The title. |
| `--toast-description-color` | `text-muted` | The description (4.5:1 on surface). |
| `--toast-icon-info` | `info` | The icon of an info toast (3:1 on surface). |
| `--toast-icon-success` | `success` | The icon of a success toast. |
| `--toast-icon-warning` | `warning` | The icon of a warning toast. |
| `--toast-icon-danger` | `danger` | The icon of a danger toast. |
| `--toast-focus-ring` | `focus-ring` | The ring around a toast that F8 moved focus to. |
| `--toast-shadow` | `shadow-lg` | A toast's shadow. |
| `--toast-radius` | `rounded-lg` | A toast's corners (8px). |
| `--toast-border-width` | `border-width-1` | A toast's border. |
| `--toast-width` | `container-sm` | A toast's width (384px), at most the screen less the offset on each side. |
| `--toast-padding` | `spacing-4` | Padding inside a toast (16px). |
| `--toast-gap` | `spacing-3` | Space between a toast's icon, text and buttons (12px). |
| `--toast-stack-gap` | `spacing-2` | Space between toasts (8px). |
| `--toast-offset` | `spacing-4` | The distance from the edges of the screen (16px). |
| `--toast-title-weight` | `font-semibold` | The title's weight (600). |
| `--toast-z-index` | `z-toast` | The stacking level: above the page and the FAB. |
<!-- token-table:end -->
