# Toast

A short message that confirms something happened ("Changes saved", "Moved to trash") without getting in the way. Call `toast()` from anywhere; messages show in the `<Toaster>`, which you render once near the root of the app, and go away on their own.

```jsx
const { Toaster, toast } = window.Serupa;

// once, near the root
<Toaster />

toast("Link copied");
toast({ title: "Changes saved", tone: "success" });
toast({ title: "Moved to trash", action: { label: "Undo", onClick: restore } });
toast({ title: "Upload failed", description: "The file is over 10 MB.", tone: "danger", duration: 0 });

// replace a toast as work goes on
const id = toast({ title: "Saving…", duration: 0 });
await save();
toast({ id, title: "Saved", tone: "success" });

// or let toast.promise do the same from one call
toast.promise(save(), {
  loading: "Saving…",
  success: "Saved",
  error: (e) => ({ title: "Couldn't save", description: String(e) }),
});

toast.dismiss(id);   // or toast.dismiss() for all
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
- For work that takes a while, show a toast with `duration: 0` and replace it by `id` when the work is done, as above, or hand the work to `toast.promise`.
- Render one `<Toaster>` for the whole app, and keep its `position` the same on every page. If two are mounted at once (one in a layout and one in a page), only the newer shows toasts, so none appears twice, and a development warning says so; when it unmounts, the older one takes over.
- A burst can't bury the page: at most `limit` toasts show (3), and the same message again (same words and tone, with no `id` or `action`) adds a count to the toast that's showing ("Network error ×12") and starts its time over, rather than stacking. The stack stays clear of a phone's notch and home indicator.

## Accessibility

- Each new toast is read out through the shared polite live region, so it doesn't interrupt. A repeat that only adds to a toast's count isn't read each time: once the burst stops (a second with no repeat), the message is read once more with the count ("Network error. 12 times.", `labels.toastRepeated`). The count reads as "12 times" with the title, not "×12".
- The time stops while a toast is hovered or anything in it has focus, and while the window is in the background (WCAG 2.2.1). A toast with an `action` stays until it's closed, unless you give it a `duration`, so there's time to reach the button. For anything people must act on, an Alert or a Dialog is still better.
- F8 moves focus to the newest toast (a screen reader reads it, and Tab reaches its buttons), and F8 or Escape takes focus back to where it was. The first toast with an action adds "Press F8 to reach it." to what's announced (`labels.toastShortcut`), while a Toaster is in the page. When a toast closes with keyboard focus in it (its ×, its action, or `toast.dismiss()`), focus goes back where F8 came from, or else to the toast next to it. Closed with the mouse, focus isn't moved to the next toast, so that one's time keeps running.
- Each toast has a close button; the Toaster is a named region people can find.
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
| `duration` | number | `5000`, or `0` with an `action` | Milliseconds before it goes; `0` keeps it until it's closed |
| `announcement` | string | title and description | What screen readers hear, when the title isn't plain text |
| `id` | string | new | Reuse one to replace a toast that's showing |

It returns the toast's id. `toast.dismiss(id)` closes one, `toast.dismiss()` all of them.

### toast.promise(work, messages)

Shows `messages.loading` while `work` (a promise, or a function that returns one) runs, then replaces that same toast with `messages.success` or `messages.error`. Each message is a title string or `toast()` options; `success` and `error` can also be functions that get the result or the error. The loading toast stays until the work settles (`duration: 0`); the result gets the success or danger tone unless the message sets one, and the usual duration. Since it's one toast replaced in place, screen readers hear the loading message and then the result. It returns `work`'s promise, so you can still await it or catch its error.

### Toaster

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the Toaster's root `<section>`, the region toasts show in. |
| `position` | `'bottom-end'` \| `'bottom-start'` \| `'bottom-center'` \| `'top-start'` \| `'top-center'` \| `'top-end'` | `'bottom-end'` | Where toasts appear, 16px from the edges; start and end follow the text direction. The newest is nearest the edge |
| `label` | string | `'Notifications'` | The region's name |
| `dismissLabel` | string | `'Dismiss'` | The close buttons' name |
| `limit` | number | `3` | The most toasts shown at once. The newest show; older ones wait under a "+2 more" line and come back as others close. One never shown waits with its time not yet started; one already seen keeps its time running while it waits, so toasts still go in the order they came |

`className`, `style` and other props go to the `<section>`, which has `data-component="toaster"` and `data-position`.

## Component tokens

Each is an optional override: set it on the page or the Toaster. The list lives in `src/components/Toast/toast.tokens.json` (also in `design-tokens/components/`).

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
| `--toast-focus-ring` | `focus-ring` | The ring around a toast that F8 moved focus to. |
