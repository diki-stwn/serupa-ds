# Dialog

A modal window over a dimmed page, for a task or a decision that needs attention before people go on: inviting someone, confirming a delete, editing a few fields. It's built on the native `<dialog>`, so the browser keeps focus inside it, makes the page behind unreachable, and puts it above everything.

```jsx
const { Dialog, Button, Input, Field } = window.Serupa;

const [open, setOpen] = React.useState(false);

<Button onClick={() => setOpen(true)}>Invite people</Button>
<Dialog open={open} onOpenChange={setOpen} title="Invite people" description="They'll get an email with a link."
  footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={send}>Send invite</Button></>}>
  <Field label="Email"><Input type="email" /></Field>
</Dialog>

// a confirmation
<Dialog alert size="sm" open={confirm} onOpenChange={setConfirm} title="Delete Atlas?" description="This can't be undone."
  footer={<><Button variant="secondary" onClick={() => setConfirm(false)}>Keep</Button><Button destructive onClick={remove}>Delete</Button></>} />
```

## When to use

- A short task that needs people's full attention before they go back to the page: inviting someone, renaming an item, editing a few fields.
- Confirming an action that can't be undone, such as a delete (with `alert`).
- A decision the product can't go on without.

## When not to use

- A long form, filters, or details people check while looking at the page: use a [Drawer](../Drawer/README.md) instead.
- A few controls or details next to the button that opens them, where the page should stay usable: use a [Popover](../Popover/README.md) instead.
- A confirmation that something happened: use a [Toast](../Toast/README.md) instead.
- A message about the page that doesn't need an answer: use an [Alert](../Alert/README.md) instead.

## Anatomy

Drawn from the `FullScreen` story.

1. **Panel** (`.dk-dialog__panel`): the box over the dimmed page; focus stays inside while it's open.
2. **Title** (`.dk-dialog__title`): what the dialog is for; it names the dialog for screen readers.
3. **Description** (`.dk-dialog__description`): an optional line under the title.
4. **Close** (`.dk-dialog__close`): closes it, as Escape does.
5. **Body** (`.dk-dialog__body`): the content; it scrolls when it's taller than the screen.
6. **Footer** (`.dk-dialog__footer`): the actions, the main one last.

## Usage

- Use a `title` that says what the dialog is for; for a confirmation, ask the question: "Delete Atlas?".
- Name the buttons in `footer` after what they do ("Delete", "Keep"), not "OK" and "Cancel" alone, and put the main action last.
- Use `alert` only for decisions people must make. It hides the × and stops a backdrop click from closing it.
- Keep the body short. Pick `size="sm"` for a confirmation and `lg` only when the content needs the width.
- For a long form on a phone, use `fullScreen="mobile"`. Under 640px the panel fills the screen with square corners, and the footer sits at the bottom, clear of the home bar.

## Behavior

- Opening moves focus to the first thing in it that takes focus. To choose another, pass its ref as `initialFocus` (Cancel in a confirmation, so Enter doesn't delete), or put `data-autofocus` on it (React's `autoFocus` runs while the dialog is still hidden, so it can't). Closing moves focus back to where it was. When closing takes that away (a confirmation that deletes the row it was opened from), pass `finalFocus`, such as the next row or the list's heading, so focus doesn't fall to the top of the page.
- A body taller than the screen takes Tab focus (with a focus ring) when it scrolls, so the arrow keys and Page Down scroll it in every browser, even with nothing focusable inside. It's a region named by the title.
- On a screen under 480px tall, such as a laptop at 400% zoom, the whole panel scrolls instead of the body, so the header and footer can't squeeze the body away or push the buttons off screen. Focusing a button scrolls it into view (WCAG 1.4.10 and 2.4.11).
- Tab and Shift+Tab stay inside. The page behind can't be clicked or reached, and doesn't scroll. It doesn't shift either: with classic scrollbars (Windows, Linux) the page keeps the scrollbar's space while it's hidden (`tools/test/scroll-lock.mjs`).
- It enters as a sequence: the backdrop fades in, and 50ms later (`motion-sequence`) the panel fades and grows in over 200ms. It fades and shrinks out over 150ms with the backdrop, both in place at the centre; with `prefers-reduced-motion` it only fades. The motion is a transition, so closing it while it opens turns back from where it is. Focus goes back to what opened it at once, not after the fade, and presses reach the page while it fades. One open on arrival (`defaultOpen`, or `open` on the first render) is there from the first frame. Firefox and Safari can't keep a closing dialog in the top layer yet, so there it closes at once.
- On Android, the system back gesture asks to close it, the same as Escape. The browser sends it as the native `<dialog>`'s `cancel` event, so the page doesn't navigate away.
- Without `open`, it keeps its own state: `defaultOpen` shows it on arrival, and Escape, the × or the backdrop close it by themselves (`onOpenChange(false)` still comes).
- With `unsaved`, Escape, the ×, the backdrop or the browser closing it first ask "Discard changes?" in a small alert dialog on top, with Keep editing focused. Keep editing (or Escape) goes back to the form as it was; Discard closes both, and only then does `onOpenChange(false)` come, with the reason of the first request. Leaving or reloading the page while it's open asks too (the browser's own `beforeunload` question). Set it from your form's state (`unsaved={name !== saved.name}`), and back to `false` once saved. Your own Cancel button sets `open` itself, so it closes without asking.
- To keep it open for some other reason, leave `open` true when `onOpenChange(false)` comes. Chromium closes a modal dialog itself on a second Escape with no click in between; the component shows it again, so `open` stays the truth.
- Under `<React.StrictMode>`, a Dialog that is open on its first render stays the innermost modal, so toasts and announcements still move into it.

## Accessibility

- `aria-modal`, named by the title (`aria-labelledby`) and described by the description. Without a title, give it an `aria-label`.
- Use `alert` only for decisions people must make; Escape still cancels.
- Stacked: a Dialog or Drawer opened from inside another takes focus, and Escape, its × and its backdrop close only it. The next Escape closes the one underneath.
- A press on the backdrop while a Menu, Popover or other popup is open inside only closes the popup. The next one closes the dialog.
- The title and description keep 4.5:1 on the panel in all six themes (`Dialog.test.tsx`). In forced-colors mode the panel gets a border.

### Keyboard

| Key | Does |
| --- | --- |
| Tab / Shift+Tab | Between the controls in the dialog; the page behind is inert, so focus stays inside |
| Escape | Asks to close it (`onOpenChange(false)`), in an `alert` dialog too; in stacked dialogs, only the top one. With `unsaved`, it asks "Discard changes?" first, and Escape there keeps editing |
| Enter / Space | On the ×, the same as Escape |

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<dialog>`. Point a Button's `commandfor` at it. |
| `open` | boolean | | Whether it's open (controlled) |
| `defaultOpen` | boolean | `false` | Open at first, then it closes itself (uncontrolled), for a dialog shown on arrival |
| `onOpenChange` | `(open, { reason }) => void` | | Called with `false` on Escape, the ×, or a click on the backdrop. Close it by setting `open`. `reason` says which: `'escape'`, `'close'` (the ×), `'outside'` (the backdrop) or `'api'` (the browser closed it, as `dialog.close()` or a `method="dialog"` form do) |
| `title` | node | | The heading (`text-lg`, `font-semibold`), which also names the dialog |
| `description` | node | | A muted line under the title, read when it opens |
| `footer` | node | | Buttons at the end, the main action last |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | 384, 512 or 672px wide; never more than the screen less 16px a side |
| `alert` | boolean | `false` | `role="alertdialog"` for a decision: no ×, and the backdrop doesn't close it |
| `closeButton` | boolean | `true` (`false` for alert) | The × in the corner |
| `closeLabel` | string | `'Close'` | The ×'s name |
| `closeOnBackdrop` | boolean | `true` (`false` for alert) | Whether a click on the dimmed page closes it |
| `fullScreen` | boolean \| `'mobile'` | `false` | Fills the screen: `true` always, or `'mobile'` under 640px wide. Square corners, no shadow, the body takes the free height, and the padding clears the notch and home bar |
| `initialFocus` | `RefObject<HTMLElement>` | | The element that takes focus when it opens, instead of the first that can. A ref to something outside the dialog is ignored |
| `finalFocus` | `RefObject<HTMLElement>` | | Where focus goes when it closes, instead of back to the opener. Used when it's on the page then; otherwise focus goes back to the opener |
| `unsaved` | boolean | `false` | There are changes that would be lost: closing asks "Discard changes?" first (Keep editing or Discard), and leaving the page asks too. `onOpenChange(false)` comes after Discard |

`children` is the body, which scrolls when it's taller than the screen. `className`, `style`, `ref` and everything else go to the `<dialog>`, which has `data-component="dialog"` and `data-size`.

## Component tokens

Each is an optional override: set it on the page, a container or one dialog. The list lives in `src/components/Dialog/dialog.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from dialog.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--dialog-bg` | `surface-overlay` | The panel's background. |
| `--dialog-text` | `text` | The panel's text: the body and the footer. |
| `--dialog-overlay` | `overlay` | The dimmed backdrop over the page. |
| `--dialog-title-color` | `text` | The title. |
| `--dialog-description-color` | `text-muted` | The description under the title (4.5:1 on surface). |
| `--dialog-focus-ring` | `focus-ring` | The keyboard focus ring of a body that scrolls. |
| `--dialog-shadow` | `shadow-xl` | The panel's shadow. |
| `--dialog-radius` | `rounded-xl` | The panel's corners (12px). |
| `--dialog-width-sm` | `container-sm` | size="sm" (384px). |
| `--dialog-width-md` | `container-lg` | size="md", the default (512px). |
| `--dialog-width-lg` | `container-2xl` | size="lg" (672px). |
| `--dialog-padding` | `spacing-6` | Padding inside the panel (24px). |
| `--dialog-gap` | `spacing-4` | Space between the header, body and footer (16px). |
| `--dialog-margin` | `spacing-4` | The least space between the panel and the edge of the screen (16px). |
| `--dialog-title-weight` | `font-semibold` | The title's weight (600). |
<!-- token-table:end -->
