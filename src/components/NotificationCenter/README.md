# NotificationCenter

A drawer of past notifications with read states: newest first, unread ones with a dot and a bolder title, and buttons to mark them read or clear the list. `useToastHistory` keeps the toasts already shown for it, so a message missed while it was up can be found again.

```tsx
import { Badge, Button, NotificationCenter, Toaster, useToastHistory } from "serupa-ds";

function Layout() {
  const [open, setOpen] = React.useState(false);
  const history = useToastHistory();
  return <>
    <Toaster />
    <Button variant="ghost" onClick={() => setOpen(true)}>
      Notifications {history.unread ? <Badge count={history.unread} /> : null}
    </Button>
    <NotificationCenter items={history.items} open={open} onOpenChange={setOpen}
      onMarkRead={history.markRead} onMarkAllRead={() => history.markRead()} onClear={history.clear} />
  </>;
}
```

## When to use

- An app that shows toasts people may miss: they go after a few seconds, and someone away from the screen, or using a magnifier, never sees them.
- An inbox of app notifications (mentions, finished exports, failed payments) that people check from a bell in the header.

## When not to use

- Something people must act on now: use an [Alert](../Alert/README.md) on the page or a [Dialog](../Dialog/README.md).
- A full activity feed with filters and paging: build a page with [List](../List/README.md) and [Pagination](../Pagination/README.md).

## Anatomy

Drawn from the `Open` story.

1. **List** (`.dk-notification-center__list`): the notifications, newest first.
2. **Notification** (`.dk-notification-center__item`): one notification.
3. **Icon** (`.dk-notification-center__icon`): its tone: info, success, warning or danger.
4. **Title** (`.dk-notification-center__title`): what happened.
5. **Description** (`.dk-notification-center__description`): more about it.
6. **Time** (`.dk-notification-center__time`): when it happened.
7. **Unread** (`.dk-notification-center__dot`): marks one not read yet, also in words for screen readers.

## Usage

- Call `useToastHistory()` once, in the layout that renders the `<Toaster>`, and pass its `items` to the NotificationCenter. It keeps up to `limit` (50) toasts shown while it's mounted.
- Or pass your own `items` (from a server, say): `{ id, title, description?, tone?, time?, read? }`, newest first. Keep `read` in your state and set it in `onMarkRead` and `onMarkAllRead`.
- Show the unread count on the button that opens it, with a [Badge](../Badge/README.md) `count`, and name the button so the count is heard too ("Notifications, 3 unread").
- Give `onMarkRead`, `onMarkAllRead` and `onClear` for the buttons you want; without a handler, its button isn't shown.

## Behavior

- It's a [Drawer](../Drawer/README.md) from the right: it opens and closes like one, and takes its `side`, `size` and `modal` props.
- Each notification shows its tone icon, title, description and time ("5 min. ago", in [RelativeTime](../RelativeTime/README.md)). Unread ones have a dot at the end and a semibold title.
- "Mark as read" goes away once chosen, and focus moves to its notification, so it isn't lost.
- When you take the focused notification out of `items` (an inbox that hides read ones), focus goes to the one now in its place, else the last, else the "No notifications yet" line, not to the page.
- `useToastHistory` records a toast when it's shown, unread. A toast replaced by its id (`toast.promise`'s "Saving…" then "Saved") stays one entry with the newer words. A repeat ("×3" in the Toaster) moves it back to the top, unread again.
- With no notifications, it says "No notifications yet" (`empty`).

## Accessibility

- **Keyboard:**

| Key | Does |
| --- | --- |
| <kbd>Tab</kbd> | Moves through the drawer: each "Mark as read", the footer buttons and the ×. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Chooses the focused button. |
| <kbd>Escape</kbd> | Closes it, and focus goes back to where it was. |

- The drawer is named by its title, "Notifications". The list is a `<ul>`, so screen readers hear how many there are.
- An unread one's title starts with "Unread:", for screen readers; the dot is hidden from them. Tone icons are hidden too, so put the meaning in the title.
- **Contrast:** descriptions and times read 4.5:1, and the unread dot 3:1, on the drawer in all six themes (`NotificationCenter.test.tsx`). In forced colors (Windows high contrast) the dot is drawn in CanvasText, so it doesn't vanish into the Canvas background.
- **What's still yours:** name the button that opens it with the unread count, and say what each notification is about in its title, not only its tone.

## useToastHistory(options)

| Option or field | Type | Default | Notes |
| --- | --- | --- | --- |
| `limit` | number | `50` | The most kept; older ones drop off. |
| `items` | `NotificationItem[]` | | Returned: the toasts shown since it mounted, newest first. |
| `unread` | number | | Returned: how many are unread. |
| `markRead` | `(id?) => void` | | Returned: marks one read, or every one with no id. |
| `clear` | `() => void` | | Returned: empties the list. |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the `<dialog>`. |
| `items` | `{ id, title, description?, tone?, time?, read? }[]` | | The notifications, newest first. |
| `title` | ReactNode | `"Notifications"` | The drawer's title. |
| `onMarkRead` | `(id) => void` | | Shows "Mark as read" on unread ones. |
| `onMarkAllRead` | `() => void` | | Shows "Mark all as read" in the footer. |
| `onClear` | `() => void` | | Shows "Clear all" in the footer. |
| `empty` | ReactNode | `"No notifications yet"` | What shows with none. |
| `description`, `footer`, `unsaved` | never | | Not taken: the list is the content, the footer holds its buttons, and there is nothing to edit. |
| `open` | boolean | | Controlled: whether it's open. |
| `defaultOpen` | boolean | `false` | Uncontrolled: open at first. |
| `onOpenChange` | `(open, details) => void` | | Called when people ask to close it. |

`side`, `size`, `modal`, `className`, `ref` and other `<dialog>` attributes go to the [Drawer](../Drawer/README.md).

## Component tokens

Each is an optional override: set it on the page, a container or one NotificationCenter. The list lives in `src/components/NotificationCenter/notification-center.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from notification-center.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--notification-center-unread` | `primary` | The unread dot (3:1 on the drawer). |
| `--notification-center-divider` | `border` | The line between notifications. |
| `--notification-center-description` | `text-muted` | A notification's description and time (4.5:1 on the drawer). |
| `--notification-center-icon-info` | `info` | The info tone's icon. |
| `--notification-center-icon-success` | `success` | The success tone's icon. |
| `--notification-center-icon-warning` | `warning` | The warning tone's icon. |
| `--notification-center-icon-danger` | `danger` | The danger tone's icon. |
| `--notification-center-focus-ring` | `focus-ring` | The ring around a notification (or the empty line) focused after "Mark as read". |
| `--notification-center-row-padding` | `spacing-3` | Space above and below each notification (12px). |
| `--notification-center-unread-weight` | `font-semibold` | An unread notification's title. |
<!-- token-table:end -->
