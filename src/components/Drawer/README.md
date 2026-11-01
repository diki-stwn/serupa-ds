# Drawer

A modal panel that slides in from an edge of the screen: navigation on small screens, filters, or details and edits without leaving the page. For a short question or form, use Dialog; for something people keep open while they work, put it in the page.

```tsx
import { Drawer, Button } from "serupa-ds";

const [open, setOpen] = React.useState(false);
<Button onClick={() => setOpen(true)}>Filters</Button>
<Drawer open={open} onOpenChange={setOpen} title="Filters" description="Narrow the list."
  footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Reset</Button><Button onClick={() => setOpen(false)}>Apply</Button></>}>
  …
</Drawer>
```

## When to use

- Navigation on small screens, where a [Sidebar](../Sidebar/README.md) doesn't fit.
- Filters for a list or a table, which people set and then apply.
- Viewing or editing one item's details without leaving the page, such as a row in a table.

## When not to use

- A short question or form: use a [Dialog](../Dialog/README.md) instead.
- Something people keep open while they work: put it in the page instead, such as a [Sidebar](../Sidebar/README.md), or use `modal={false}` for a side panel that leaves the page usable.
- A few controls next to the button that opens them: use a [Popover](../Popover/README.md) instead.

## Anatomy

Drawn from the `Bottom` story.

1. **Panel** (`.dk-drawer__panel`): slides in from an edge over the dimmed page; focus stays inside while it's open.
2. **Title** (`.dk-drawer__title`): what the drawer is for; it names it for screen readers.
3. **Description** (`.dk-drawer__description`): an optional line under the title.
4. **Close** (`.dk-drawer__close`): closes it, as Escape does.
5. **Body** (`.dk-drawer__body`): the content; it scrolls on its own.
6. **Footer** (`.dk-drawer__footer`): the actions, kept in view.

## Usage

- Use `side="right"` (the default) for details and filters, and `side="left"` for navigation; use `bottom` for short sheets on small screens. `side` is physical: `right` is the right edge in a right-to-left page too.
- Give it a `title` that names what's inside ("Filters", "Order #1042").
- Put the actions in `footer` so they stay in view, with the main action last.
- Set `closeOnBackdrop={false}` when closing would lose work, such as unsaved edits.
- Set `modal={false}` for a panel people use alongside the page, such as an item's details next to a list they keep clicking through.

## Behavior

- It's a native `<dialog>` opened with `showModal()`, like Dialog. Focus moves inside and stays there, the page behind can't be reached and doesn't scroll (or shift sideways when a classic scrollbar goes away), and closing moves focus back to where it was. Focus goes to the first thing that takes it; pass another's ref as `initialFocus`, or put `data-autofocus` on it, to choose. When closing takes away what opened it (a panel that deletes its row), pass `finalFocus`, such as the next row, so focus doesn't fall to the top of the page. A backdrop press while a popup is open inside closes only the popup.
- On a touch screen, dragging it toward its edge closes it (`reason: 'swipe'`): past a third of its size, or where it's heading with the speed it's let go at (it carries on as a scroll would, so a slow drag still moving toward the edge counts), or with a flick (as little as 0.2px per ms over the last 100ms, so a gentle one counts); a shorter drag that has stopped springs back. Dragged the other way, away from its edge, it gives a little (24px at most) against growing resistance and springs back, with its background filling the edge behind it. Left and right drawers can be dragged anywhere outside a field, and top and bottom ones by the header or footer, so the body still scrolls. `swipeToClose={false}` turns it off.
- With `modal={false}` it's opened with `show()` instead: no backdrop, the page stays usable and scrolls, focus moves inside but can leave it, and it isn't on the modal stack. Escape with focus inside it and the × close it; closing, or taking it off the page, moves focus back only if focus was still inside.
- Left and right drawers are full height. Top and bottom drawers are full width, as tall as their content up to the screen less 64px, and rounded on the open side.
- The body scrolls on its own, so the header and footer stay in view. While it scrolls it takes Tab focus (with a focus ring), so the arrow keys and Page Down scroll it in every browser, even with nothing focusable inside. It's a region named by the title.
- On a screen under 480px tall, such as a laptop at 400% zoom, the whole panel scrolls instead of the body, so the header and footer can't squeeze the body away or push the buttons off screen. Focusing a button scrolls it into view (WCAG 1.4.10 and 2.4.11).
- It enters as a sequence: a modal drawer's backdrop starts fading in, and 50ms later (`motion-sequence`) the panel slides in over 300ms. It slides back out to its edge over 200ms, together with the backdrop, both in a straight line along that edge; focusing a control as it opens never scrolls it into view early. With `prefers-reduced-motion` it fades instead of sliding. The motion is a transition, so closing it while it slides in turns back from where it is. Focus goes back to what opened it at once, not after the slide, and presses reach the page while it leaves. A swipe moves the panel with the finger; let go short and it slides back, far enough and it slides out from where it is. One open on arrival (`defaultOpen`, or `open` on the first render) is there from the first frame. Firefox and Safari can't keep a closing modal drawer in the top layer yet, so there it closes at once; a non-modal one slides out everywhere.

- On a phone with a notch or a home bar, the panel's padding and the footer clear them. This needs `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`; without `viewport-fit=cover` the browser keeps the page out of those areas itself.
- Scrolling to the end of the body doesn't scroll the page behind it (`overscroll-behavior: contain`).

## Accessibility

- `aria-modal` (left out with `modal={false}`), named by the title (`aria-labelledby`) and described by the description.
- The title, description and body text keep 4.5:1 on the panel in all six themes (`Drawer.test.tsx`). In forced-colors mode the panel gets a border.
- A Dialog opened from inside it closes on its own: Escape closes the Dialog first, and the next Escape the Drawer.
- On Android, the system back gesture asks to close it, like Escape. Under `<React.StrictMode>`, a Drawer that is open on its first render stays the innermost modal, so toasts and announcements still move into it.
- With `unsaved`, Escape, the ×, the backdrop, a swipe or the browser closing it first ask "Discard changes?" in a small alert dialog on top, with Keep editing focused, as Dialog does. Keep editing (or Escape) goes back to the form as it was; Discard closes both, and only then does `onOpenChange(false)` come, with the reason of the first request. Leaving or reloading the page while it's open asks too (the browser's own `beforeunload` question). Your own Cancel button sets `open` itself, so it closes without asking.
- To keep it open for another reason, leave `open` true when `onOpenChange(false)` comes. Chromium closes a modal dialog itself on a second Escape with no click in between; the component shows it again, so `open` stays the truth.

### Keyboard

| Key | Does |
| --- | --- |
| Tab / Shift+Tab | Between the controls in the drawer; the page behind is inert, so focus stays inside |
| Escape | Asks to close it (`onOpenChange(false)`); with a Dialog open from it, the Dialog first. With `unsaved`, it asks "Discard changes?" first, and Escape there keeps editing |
| Enter / Space | On the ×, the same as Escape |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<dialog>`. Point a Button's `commandfor` at it. |
| `open` | `boolean` | | Controlled: close it yourself in `onOpenChange`. |
| `defaultOpen` | `boolean` | `false` | Open at first, then it closes itself (uncontrolled). Escape, the × or the backdrop close it, and `onOpenChange(false)` still comes. |
| `onOpenChange` | `(open, { reason }) => void` | | Called with `false` on Escape, the ×, or a click on the backdrop. `reason` says which: `'escape'`, `'close'` (the ×), `'outside'` (the backdrop) or `'api'` (the browser closed it, as `dialog.close()` or a `method="dialog"` form do) |
| `side` | `'right' \| 'left' \| 'top' \| 'bottom'` | `'right'` | The edge it slides in from. These are physical edges, so they stay put in right-to-left pages. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | The width of a left or right drawer: 320, 384 or 512px, never wider than the screen. |
| `title` | `ReactNode` | | The heading; it also names the drawer. Without one, give it an `aria-label`. |
| `description` | `ReactNode` | | A muted line under the title. |
| `footer` | `ReactNode` | | Buttons pinned to the bottom under a line, with the main action last. |
| `closeButton` | `boolean` | `true` | The × in the corner. |
| `closeLabel` | `string` | `'Close'` | The ×'s name. |
| `closeOnBackdrop` | `boolean` | `true` | Whether a click on the backdrop closes it. Turn it off when closing would lose work. |
| `swipeToClose` | `boolean` | `true` | A touch drag toward its edge closes it, with `reason: 'swipe'`. |
| `initialFocus` | `RefObject<HTMLElement>` | | The element that takes focus when it opens, instead of the first that can. A ref to something outside the drawer is ignored. |
| `finalFocus` | `RefObject<HTMLElement>` | | Where focus goes when it closes, instead of back to the opener. Used when it's on the page then; otherwise focus goes back to the opener. |
| `modal` | `boolean` | `true` | `false`: a side panel beside a usable page, with no backdrop, opened with `show()`. |
| `unsaved` | `boolean` | `false` | There are changes that would be lost: closing asks "Discard changes?" first (Keep editing or Discard), and leaving the page asks too. `onOpenChange(false)` comes after Discard. |

Every other prop, `className` and `ref` go to the native `<dialog>`.

## Component tokens

Each is an optional override: set it on the page, a container or one drawer. The list lives in `src/components/Drawer/drawer.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from drawer.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--drawer-bg` | `surface-overlay` | The panel's background. |
| `--drawer-text` | `text` | The panel's text: the body and the footer. |
| `--drawer-overlay` | `overlay` | The dimmed backdrop over the page. |
| `--drawer-title-color` | `text` | The title. |
| `--drawer-description-color` | `text-muted` | The description under the title (4.5:1 on surface). |
| `--drawer-border` | `border` | The line above the footer. |
| `--drawer-focus-ring` | `focus-ring` | The keyboard focus ring of a body that scrolls. |
| `--drawer-shadow` | `shadow-xl` | The panel's shadow. |
| `--drawer-width-sm` | `container-xs` | size="sm" (320px). |
| `--drawer-width-md` | `container-sm` | size="md", the default (384px). |
| `--drawer-width-lg` | `container-lg` | size="lg" (512px). |
| `--drawer-padding` | `spacing-6` | Padding inside the panel (24px). |
| `--drawer-gap` | `spacing-4` | Space between the header and the body (16px). |
| `--drawer-border-width` | `border-width-1` | The line above the footer (1px). |
| `--drawer-radius` | `rounded-xl` | The corners on the open side of a top or bottom drawer (12px). |
| `--drawer-title-weight` | `font-semibold` | The title's weight (600). |
| `--drawer-duration` | `motion-enter-lg` | Sliding in (300ms). Sliding out takes `motion-exit-lg` (200ms). |
<!-- token-table:end -->
